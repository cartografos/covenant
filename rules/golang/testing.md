# Testing — Go

Extends `rules/common/testing.md`. Go-specific rules take precedence.

## Test Files

- Test files live alongside production code: `ratelimit.go` → `ratelimit_test.go`
- Package: use `package foo_test` for black-box tests (recommended default); use `package foo` only when testing unexported internals
- Test function signature: `func TestXxx(t *testing.T)`, `func BenchmarkXxx(b *testing.B)`

## Running Tests

```bash
go test ./...                    # all tests
go test -race ./...              # with race detector (always in CI)
go test -cover ./...             # with coverage
go test -run TestRateLimiter ./pkg/ratelimit/  # specific test
```

Always run with `-race` in CI. The race detector catches data races that pass without it.

## Assertions

Use the standard `testing.T` methods — no test assertion library required:

```go
if got != want {
    t.Errorf("Allow(%q) = %v, want %v", key, got, want)
}
if err != nil {
    t.Fatalf("unexpected error: %v", err) // Fatalf stops the test
}
```

`t.Errorf` continues the test. `t.Fatalf` stops it immediately. Use `Fatalf` when subsequent assertions would panic or produce misleading output after a failure.

## Test Helpers

```go
func newTestRateLimiter(t *testing.T, opts ...Option) *RateLimiter {
    t.Helper() // makes failure lines point to the caller, not this function
    r, err := NewRateLimiter(opts...)
    if err != nil {
        t.Fatalf("newTestRateLimiter: %v", err)
    }
    return r
}
```

## Subtests

Use `t.Run` for grouping related scenarios:

```go
func TestRateLimiter_Allow(t *testing.T) {
    t.Run("allows first request", func(t *testing.T) { ... })
    t.Run("denies after limit", func(t *testing.T) { ... })
    t.Run("resets after window", func(t *testing.T) { ... })
}
```

## Temporary Resources

```go
// t.TempDir creates a temp dir that is deleted when the test ends
dir := t.TempDir()

// t.Cleanup runs after the test (even on failure)
t.Cleanup(func() { server.Close() })
```

## Testing with External Dependencies

- Use `testcontainers-go` for integration tests that require a real database or queue
- Use `httptest.NewServer` for testing HTTP clients
- Use `httptest.NewRecorder` for testing HTTP handlers

```go
func TestHandler(t *testing.T) {
    srv := httptest.NewServer(myHandler)
    defer srv.Close()

    resp, err := http.Get(srv.URL + "/health")
    // ...
}
```

## Benchmarks

```go
func BenchmarkAllow(b *testing.B) {
    r := NewRateLimiter()
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        r.Allow("key")
    }
}
```

Run with: `go test -bench=. -benchmem ./pkg/ratelimit/`

## Coverage

```bash
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out    # view in browser
go tool cover -func=coverage.out    # view in terminal
```

Target: 90% for all new code. `go tool cover -func` shows per-function coverage.

## Do Not

- Do not use `t.Parallel()` without ensuring all shared state is properly isolated
- Do not use `time.Sleep` in tests — use channels, `sync.WaitGroup`, or `testify/mock` call channels for synchronization
- Do not import `testify` unless it is already a project dependency — the standard library is sufficient
