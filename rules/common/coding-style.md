# Coding Style — Common

Rules that apply regardless of language. Language-specific rules extend and override these.

## Naming

- Names must be honest: they must describe what the thing IS or DOES, not how it is implemented
- Avoid abbreviations unless universally understood in the domain (e.g., HTTP, URL, ID)
- Boolean names should read as a predicate: `isReady`, `hasPermission`, `canRetry` — not `ready`, `permission`, `retry`
- Function names use verbs: `Get`, `Create`, `Validate`, `Parse` — not `User`, `Config`, `Result`
- Avoid noise words: `Manager`, `Handler`, `Helper`, `Util`, `Data` — name what it actually does

## Functions

- Single responsibility: one function does one thing
- Prefer pure functions where possible — same input always produces same output, no side effects
- Keep functions under 40 lines; if longer, extract into named helpers that reveal intent
- Parameters: if a function takes more than 3 parameters, consider grouping into a config or options struct
- Avoid boolean parameters that change function behavior — prefer two separate functions or an options type

## Constants and Magic Values

- No magic numbers or strings — every literal that encodes domain knowledge belongs in a named constant
- Group related constants together
- Constants names describe meaning, not value: `MaxRetries` not `Three`, `DefaultTimeout` not `Thirty`

## Error Handling

- Never silently swallow errors
- Error messages are lowercase, no trailing punctuation, no "error:" prefix (the type already conveys that)
- Wrap errors with context at every boundary crossing — callers need to understand where errors originated
- Distinguish between errors that represent programming bugs (panic or hard fail) and operational errors (return to caller)

## Comments

- Write no comments by default
- Write a comment only when the WHY is non-obvious: a hidden constraint, a subtle invariant, a workaround for a known bug, behavior that would surprise a careful reader
- Never comment what the code does — well-named identifiers already do that
- Never write comments that reference the current task, ticket, or PR — those belong in the commit message

## Formatting

- Use the project's configured formatter — do not fight it
- Consistent indentation throughout a file — never mix tabs and spaces
- One blank line between logical sections within a function
- Two blank lines between top-level declarations

## No Dead Code

- Delete unused variables, functions, types, imports, and parameters
- Do not comment out code — delete it (version control preserves history)
- Do not leave TODO comments without a corresponding ticket or issue reference
