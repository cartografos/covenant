'use strict';

const fs   = require('fs');
const path = require('path');

const root     = process.cwd();
const exists   = f => fs.existsSync(path.join(root, f));
const read     = f => { try { return fs.readFileSync(path.join(root, f), 'utf8'); } catch { return ''; } };
const readJson = f => { try { return JSON.parse(read(f)); } catch { return {}; } };

// --- Dependency readers ---

const deps = {
  npm() {
    const pkg = readJson('package.json');
    return Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  },
  goMod() {
    const content = read('go.mod');
    const out = [];
    // Block form: require ( ... )
    const block = content.match(/require\s*\(([\s\S]*?)\)/)?.[1] ?? '';
    block.split('\n').forEach(l => { const p = l.trim().split(/\s+/)[0]; if (p) out.push(p); });
    // Single-line form: require module/path version
    [...content.matchAll(/^require\s+(\S+)/gm)].forEach(m => out.push(m[1]));
    return out;
  },
  cargo() {
    return [...read('Cargo.toml').matchAll(/^([a-zA-Z0-9_-]+)\s*=/gm)].map(m => m[1]);
  },
  python() {
    const out = [];
    read('requirements.txt').split('\n').forEach(l => {
      const n = l.trim().split(/[>=<!\s[;]/)[0];
      if (n && !n.startsWith('#')) out.push(n.toLowerCase());
    });
    const block = read('pyproject.toml').match(/dependencies\s*=\s*\[([\s\S]*?)\]/)?.[1] ?? '';
    [...block.matchAll(/"([^"]+)"/g)].forEach(m => out.push(m[1].split(/[>=<!\s[;]/)[0].toLowerCase()));
    return out;
  },
  composer() {
    const pkg = readJson('composer.json');
    return Object.keys({ ...pkg.require, ...pkg['require-dev'] });
  },
  gemfile() {
    return [...read('Gemfile').matchAll(/gem\s+['"]([^'"]+)['"]/g)].map(m => m[1]);
  },
  clojure() {
    const out = [];
    // project.clj: [group/artifact "version"]
    [...read('project.clj').matchAll(/\[([a-zA-Z0-9._\/-]+)\s+"/g)].forEach(m => out.push(m[1]));
    // deps.edn: group/artifact {:mvn/version ...}
    [...read('deps.edn').matchAll(/([a-zA-Z0-9._\/-]+)\s+\{:mvn/g)].forEach(m => out.push(m[1]));
    return out;
  },
};

// --- Extension scanner ---

function hasExt(...exts) {
  try {
    return fs.readdirSync(root, { withFileTypes: true })
      .some(e => e.isFile() && exts.includes(path.extname(e.name)));
  } catch { return false; }
}

// --- Language rules ---

const LANGUAGES = [
  { lang: 'golang',     markers: ['go.mod'],                                            exts: ['.go'],                    getDeps: deps.goMod    },
  { lang: 'rust',       markers: ['Cargo.toml'],                                        exts: ['.rs'],                    getDeps: deps.cargo    },
  { lang: 'python',     markers: ['pyproject.toml','requirements.txt','setup.py'],      exts: ['.py'],                    getDeps: deps.python   },
  { lang: 'typescript', markers: ['tsconfig.json'],                                     exts: ['.ts','.tsx'],             getDeps: deps.npm      },
  { lang: 'javascript', markers: ['package.json'],                                      exts: ['.js','.jsx','.mjs'],      getDeps: deps.npm      },
  { lang: 'kotlin',     markers: ['build.gradle.kts'],                                  exts: ['.kt','.kts'],             getDeps: () => []      },
  { lang: 'java',       markers: ['pom.xml','build.gradle'],                            exts: ['.java'],                  getDeps: () => []      },
  { lang: 'php',        markers: ['composer.json'],                                     exts: ['.php'],                   getDeps: deps.composer },
  { lang: 'ruby',       markers: ['Gemfile','Rakefile'],                                exts: ['.rb'],                    getDeps: deps.gemfile  },
  { lang: 'clojure',    markers: ['project.clj','deps.edn'],                            exts: ['.clj','.cljs','.cljc'],   getDeps: deps.clojure  },
  { lang: 'cobol',      markers: [],                                                    exts: ['.cob','.cbl','.cobol'],   getDeps: () => []      },
];

// --- Framework rules ---

const FRAMEWORKS = [
  // Go
  { framework: 'gin',       lang: 'golang',      match: d => d.some(x => x.includes('gin-gonic/gin'))     },
  { framework: 'echo',      lang: 'golang',      match: d => d.some(x => x.includes('labstack/echo'))     },
  { framework: 'fiber',     lang: 'golang',      match: d => d.some(x => x.includes('gofiber/fiber'))     },
  // Rust
  { framework: 'axum',      lang: 'rust',        match: d => d.includes('axum')                           },
  { framework: 'actix',     lang: 'rust',        match: d => d.includes('actix-web')                      },
  // Python
  { framework: 'fastapi',   lang: 'python',      match: d => d.includes('fastapi')                        },
  { framework: 'django',    lang: 'python',      match: d => d.includes('django')                         },
  { framework: 'flask',     lang: 'python',      match: d => d.includes('flask')                          },
  // TypeScript / JavaScript — backend
  { framework: 'nextjs',    lang: 'typescript',  match: d => d.includes('next')                           },
  { framework: 'nestjs',    lang: 'typescript',  match: d => d.some(x => x.startsWith('@nestjs'))         },
  { framework: 'express',   lang: 'javascript',  match: d => d.includes('express')                        },
  // TypeScript — frontend
  { framework: 'react',     lang: 'typescript',  match: d => d.includes('react')                          },
  { framework: 'vue',       lang: 'typescript',  match: d => d.includes('vue')                            },
  { framework: 'angular',   lang: 'typescript',  match: d => d.some(x => x.startsWith('@angular'))        },
  { framework: 'svelte',    lang: 'typescript',  match: d => d.includes('svelte')                         },
  { framework: 'remix',     lang: 'typescript',  match: d => d.some(x => x.startsWith('@remix-run'))      },
  { framework: 'astro',     lang: 'typescript',  match: d => d.includes('astro')                          },
  { framework: 'nuxt',      lang: 'typescript',  match: d => d.includes('nuxt')                           },
  { framework: 'electron',  lang: 'typescript',  match: d => d.includes('electron')                       },
  // PHP
  { framework: 'laravel',   lang: 'php',         match: d => d.includes('laravel/framework')               },
  { framework: 'symfony',   lang: 'php',         match: d => d.some(x => x.startsWith('symfony/'))        },
  // Ruby
  { framework: 'rails',     lang: 'ruby',        match: d => d.includes('rails')                          },
  { framework: 'sinatra',   lang: 'ruby',        match: d => d.includes('sinatra')                        },
  // Clojure
  { framework: 'compojure', lang: 'clojure',     match: d => d.some(x => x.includes('compojure'))         },
  { framework: 'pedestal',  lang: 'clojure',     match: d => d.some(x => x.includes('pedestal'))          },
  { framework: 'luminus',   lang: 'clojure',     match: d => d.some(x => x.includes('luminus'))           },
];

const FRONTEND = new Set(['react','vue','angular','svelte','remix','astro','nuxt','electron','nextjs']);
const BACKEND  = new Set(['nestjs','express','fastapi','django','flask','gin','echo','fiber','axum','actix','laravel','symfony','rails','sinatra','compojure','pedestal']);

// --- Core detection ---

function detect() {
  const found = [];

  for (const rule of LANGUAGES) {
    if (!rule.markers.some(exists) && !hasExt(...rule.exts)) continue;
    const langDeps  = rule.getDeps();
    const framework = FRAMEWORKS.filter(f => f.lang === rule.lang).find(f => f.match(langDeps))?.framework ?? null;
    found.push({ lang: rule.lang, framework });
  }

  // Prefer typescript over javascript when both detected
  return found.some(d => d.lang === 'typescript')
    ? found.filter(d => d.lang !== 'javascript')
    : found;
}

// --- Rule path resolution ---

const COMMON_RULES  = ['coding-style.md', 'testing.md', 'security.md'];
const LANG_RULES    = ['coding-style.md', 'patterns.md', 'testing.md', 'security.md'];

function resolveRulePaths(langs) {
  const pluginRoot = path.resolve(__dirname, '..');
  const rulesRoot  = path.join(pluginRoot, 'rules');
  const paths      = [];

  for (const f of COMMON_RULES) {
    const p = path.join(rulesRoot, 'common', f);
    if (fs.existsSync(p)) paths.push(p);
  }

  for (const lang of langs) {
    for (const f of LANG_RULES) {
      const p = path.join(rulesRoot, lang, f);
      if (fs.existsSync(p)) paths.push(p);
    }
  }

  return paths;
}

// --- Main ---

const detected = detect();
if (!detected.length) process.exit(0);

const allFrameworks = detected.map(d => d.framework).filter(Boolean);
const isFullstack   = allFrameworks.some(f => FRONTEND.has(f)) && allFrameworks.some(f => BACKEND.has(f));
const labels        = detected.map(d => [d.lang, d.framework].filter(Boolean).join('/'));
const langs         = [...new Set(detected.map(d => d.lang))];
const rulePaths     = resolveRulePaths(langs);

const summary = [
  `[Covenant] ${labels.join(' + ')}${isFullstack ? ' (fullstack)' : ''}`,
  `Languages: ${langs.join(', ')}`,
  rulePaths.length ? `Rule files:\n${rulePaths.map(p => `  - ${p}`).join('\n')}` : '',
].filter(Boolean).join('\n');

const payload = JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: summary,
  },
});

process.stdout.write(payload);
