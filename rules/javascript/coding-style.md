# Coding Style — JavaScript

Extends `rules/common/coding-style.md`. JavaScript-specific rules take precedence.

## Formatting

- Run the project formatter before committing: Prettier, Biome, or ESLint --fix (check `package.json`)
- Semi-colons: follow project convention — do not mix
- Quotes: single quotes preferred unless project uses double
- Trailing commas: always in multi-line structures (helps cleaner diffs)

## Module System

- Check `"type"` in `package.json`: `"module"` → ESM (`import`/`export`), absent or `"commonjs"` → CJS (`require`/`module.exports`)
- Do not mix `require` and `import` in the same file
- Use `.mjs` for ESM and `.cjs` for CJS only when overriding the project default
- Add `'use strict';` at the top of CommonJS modules

## Naming

- Variables, functions, methods: `camelCase` — `getUserById`, `isRateLimited`
- Classes and constructors: `PascalCase` — `UserRepository`, `RateLimitConfig`
- Constants: `SCREAMING_SNAKE_CASE` for module-level constants, `camelCase` for local constants
- Files: `kebab-case` — `rate-limiter.js`, `user-repository.js`
- Test files: `{name}.test.js` or `{name}.spec.js` — match existing project convention

## Functions

- Prefer named functions over anonymous arrow functions for top-level exports
- Keep arrow functions short — if the body exceeds one line, extract a named function
- Avoid deeply nested callbacks — use `async/await`
- Use JSDoc `@param` and `@returns` annotations on exported functions for documentation

## Null Safety

- Use optional chaining `?.` and nullish coalescing `??` instead of boolean short-circuits
- Distinguish between `undefined` (not provided) and `null` (explicitly absent) only when the domain requires it
- Use `typeof` checks for variables that may not be declared

## Imports

- ESM: named imports over namespace imports — `import { foo } from './foo.js'` not `import * as Foo from './foo.js'`
- ESM: include file extensions in relative imports (`.js`)
- CJS: destructure from `require` — `const { foo } = require('./foo')`

## Error Handling

- Reserve `throw` for programming errors and unrecoverable failures
- Async functions: always `await` promises — never fire-and-forget unless explicitly documented
- `try/catch` at the boundary only — do not scatter them throughout business logic
- Use `instanceof` to distinguish error types in catch blocks

## Type Checking (optional)

- Use JSDoc type annotations (`@type`, `@param`, `@returns`, `@typedef`) for editor support without a build step
- Consider `// @ts-check` at the top of critical files for TypeScript-powered checking without compilation
