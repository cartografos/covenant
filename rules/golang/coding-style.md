# Coding Style — Go

Extends `rules/common/coding-style.md`. Go-specific rules take precedence.

## Formatting

- Run `gofmt` or `goimports` before committing — no exceptions
- Line length: 100 characters soft limit; 120 hard limit
- `goimports` manages import grouping automatically — do not reorder imports manually
- Import groups: stdlib, external, internal (separated by blank lines)

## Naming

- Packages: short, lowercase, single word — `ratelimit` not `rate_limit` or `rateLimiter`
- Interfaces: use `-er` suffix when the interface represents a single behavior — `Reader`, `Storer`, `Validator`
- Avoid stuttering: `http.Client` not `http.HTTPClient`; `user.Service` not `user.UserService`
- Unexported names start lowercase; exported names start uppercase — Go enforces this
- Acronyms are all-caps: `URL`, `HTTP`, `ID`, `API` — e.g., `GetUserID`, `ParseHTTPResponse`
- Error variables: `var ErrNotFound = errors.New("not found")` — prefix with `Err`
- Error types: suffix with `Error` — `type ValidationError struct`

## Error Handling

- Always check returned errors — never use `_` to discard an error without a comment explaining why
- Wrap errors with context using `fmt.Errorf("doing X: %w", err)` — the `%w` verb enables `errors.Is` and `errors.As`
- Sentinel errors for known, catchable conditions: `var ErrTimeout = errors.New("timeout")`
- Custom error types for errors that carry additional context
- Panic is for programming errors only — never panic on bad input from callers

## Interfaces

- Define interfaces in the package that uses them, not the package that implements them
- Keep interfaces small — prefer composing small interfaces over one large interface
- Accept interfaces, return concrete types in constructors and factory functions

## Structs

- Use constructor functions (`NewX`) to enforce invariants — never export a struct that can be created in an invalid state
- Unexported fields are the default — export only what callers need
- Use pointer receivers consistently across a type's methods; do not mix value and pointer receivers

## Goroutines and Concurrency

- Never start a goroutine without a way to stop it — always pass a `context.Context` or use a done channel
- Document which methods are safe for concurrent use and which are not
- Prefer `sync.Mutex` over channels when protecting shared state; prefer channels when coordinating work
- Use `sync.WaitGroup` to wait for goroutines to complete before returning

## Context

- `context.Context` is the first parameter of any function that performs I/O, calls external services, or may block
- Never store a context in a struct — pass it as a parameter
- Use `context.WithTimeout` or `context.WithDeadline` for all external calls

## Packages

- One concept per package — packages should be cohesive and have a clear, single purpose
- Avoid `utils`, `helpers`, `common` package names — put the code where it belongs
- Circular imports are a compile error — design package boundaries to prevent them

## Zero Values

- Design types so their zero value is useful and valid where possible
- Document whether a zero value is valid or whether the type requires construction via `NewX`
