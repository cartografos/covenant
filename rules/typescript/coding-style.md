# Coding Style — TypeScript

Extends `rules/common/coding-style.md`. TypeScript-specific rules take precedence.

## Formatting

- Run the project formatter before committing: Prettier, Biome, or ESLint --fix (check `package.json`)
- Semi-colons: follow project convention — do not mix
- Quotes: single quotes preferred unless project uses double
- Trailing commas: always in multi-line structures (helps cleaner diffs)

## TypeScript Configuration

- `strict: true` is required — no exceptions
- `noUncheckedIndexedAccess: true` — array access returns `T | undefined`
- `noImplicitReturns: true` — every code path must return a value
- Never use `// @ts-ignore` or `// @ts-expect-error` without a comment explaining the exact reason

## Types

- Prefer `type` over `interface` for object shapes — use `interface` only when you need declaration merging
- Never use `any` — use `unknown` and narrow with type guards, or define the correct type
- Avoid type assertions (`as Foo`) except at system boundaries where you have verified the shape
- Use `readonly` for properties that must not be mutated after construction
- Prefer union types over enums for string sets: `type Status = 'pending' | 'active' | 'closed'`
- Use `satisfies` operator to check a value against a type while preserving its literal type

## Naming

- Types and interfaces: `PascalCase` — `UserRepository`, `RateLimitConfig`
- Variables, functions, methods: `camelCase` — `getUserById`, `isRateLimited`
- Constants: `SCREAMING_SNAKE_CASE` for module-level constants, `camelCase` for local constants
- Files: `kebab-case` — `rate-limiter.ts`, `user-repository.ts`
- Test files: `{name}.test.ts` or `{name}.spec.ts` — match existing project convention

## Functions

- Prefer named functions over anonymous arrow functions for top-level exports
- Keep arrow functions short — if the body exceeds one line, extract a named function
- Avoid deeply nested callbacks — use `async/await`
- Type all parameters and return types explicitly in exported functions
- Infer types in implementation — only annotate where inference fails or the type is non-obvious

## Null Safety

- Enable `strictNullChecks` (included in `strict`)
- Use optional chaining `?.` and nullish coalescing `??` instead of boolean short-circuits
- Avoid `null` — prefer `undefined` for absent values
- Distinguish between "not provided" (`undefined`) and "explicitly absent" (`null`) only when the domain requires it

## Imports

- Named imports over namespace imports: `import { foo } from './foo'` not `import * as Foo from './foo'`
- No barrel files (`index.ts` re-exporting everything) in large packages — they slow down type checking
- Import type separately when only types are needed: `import type { Foo } from './foo'`

## Error Handling

- Use `Result<T, E>` pattern (or a library like `neverthrow`) for recoverable errors in domain code
- Reserve `throw` for programming errors and unrecoverable failures
- Async functions: always `await` promises — never fire-and-forget unless explicitly documented
- `try/catch` at the boundary only — do not scatter them throughout business logic
