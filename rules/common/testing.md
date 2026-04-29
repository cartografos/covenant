# Testing — Common

Rules that apply to all languages. Language-specific rules extend and override these.

## Philosophy

- Tests exist to prove behavior, not to achieve a coverage number
- A test that passes when the behavior is broken is worse than no test
- Test the contract (what the function promises), not the implementation (how it does it)
- Tests are production code — apply the same quality standards

## Minimum Coverage

- 90% code coverage for new code introduced in any PR
- Coverage is measured through real code execution — not through trivial assertions or mocked logic

## Test Naming

Tests must read as specifications:
- `TestRateLimiter_Allow_ReturnsFalseWhenLimitExceeded`
- `test_rate_limiter_returns_false_when_limit_exceeded`
- `it should return false when the rate limit is exceeded`

Format: `<Subject>_<Action>_<ExpectedOutcome>` or the language idiomatic equivalent.

## Structure

Every test follows Arrange → Act → Assert:
1. **Arrange**: set up inputs and dependencies
2. **Act**: invoke the code under test (one call per test)
3. **Assert**: verify outcomes — be specific, not just "no error"

## Mocking

- Mock only the external world: HTTP APIs, file system, databases, message queues, system clocks, randomness
- Never mock internal types, structs, or functions within the same package
- Replace mocks with real implementations when the dependency can be constructed cheaply in a test
- If you need to mock something internal, it is a signal the code is too tightly coupled — refactor first

## Edge Cases to Always Test

For any function that accepts input:
- [ ] Empty input (empty string, empty slice, zero value)
- [ ] Maximum size or boundary value
- [ ] Invalid type or format
- [ ] Nil / null / zero where a value is expected
- Concurrent access (if the function is used from multiple goroutines/threads)

## Test Independence

- Tests must not depend on execution order
- Tests must not share mutable global state
- Each test sets up its own fixtures and tears them down afterward
- A test that passes in isolation but fails in a suite is a broken test

## Assertions

- Assert specific values, not just "result is not nil" or "no error occurred"
- On failure, the error message must explain what was expected and what was received
- One logical assertion per test where possible — multiple assertions obscure which one failed

## Do Not

- Delete failing tests — fix them or report them
- Skip tests without a comment explaining what blocks them and a linked issue
- Write tests that assert implementation details (private function names, internal state, call counts of mocked internals)
- Use sleep or arbitrary delays in tests — use deterministic synchronization
