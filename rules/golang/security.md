# Security — Go

Extends `rules/common/security.md`. Go-specific rules take precedence.

## SQL Injection

Always use parameterized queries:

```go
// ✓ Safe
row := db.QueryRowContext(ctx, "SELECT * FROM users WHERE id = $1", id)

// ✗ Never — SQL injection
query := "SELECT * FROM users WHERE id = " + id
```

Use a query builder (sqlc, sqlx, squirrel) rather than string concatenation for complex queries.

## Command Injection

```go
// ✓ Safe — arguments are passed as separate strings, never shell-interpolated
cmd := exec.CommandContext(ctx, "git", "clone", "--", repoURL, destDir)

// ✗ Never — shell=true interpolates arguments
cmd := exec.Command("sh", "-c", "git clone "+userInput)
```

Never use `exec.Command("sh", "-c", ...)` with user-controlled input.

## Path Traversal

```go
// ✓ Safe — resolve and validate the path stays under the allowed root
absPath := filepath.Clean(filepath.Join(root, userInput))
if !strings.HasPrefix(absPath, root+string(filepath.Separator)) {
    return nil, ErrPathTraversal
}

// ✗ Never — user input directly in file path
f, _ := os.Open(baseDir + "/" + userInput)
```

## Secrets in Environment Variables

```go
// ✓ Load secrets at startup, validate they are present
apiKey := os.Getenv("PAYMENT_API_KEY")
if apiKey == "" {
    return fmt.Errorf("PAYMENT_API_KEY is required")
}

// Store in struct, never log
cfg := Config{PaymentAPIKey: apiKey}
```

## TLS

```go
// ✓ Always verify TLS certificates
client := &http.Client{
    Transport: &http.Transport{
        TLSClientConfig: &tls.Config{
            MinVersion: tls.VersionTLS12,
        },
    },
}

// ✗ Never skip verification in production
tlsConfig := &tls.Config{InsecureSkipVerify: true} // FORBIDDEN
```

## Password Hashing

```go
import "golang.org/x/crypto/bcrypt"

// Hash
hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

// Verify
err = bcrypt.CompareHashAndPassword(hash, []byte(password))
```

Never use MD5, SHA-1, or SHA-256 for password storage.

## Cryptographically Secure Random

```go
import "crypto/rand"
import "math/big"

// ✓ Cryptographically secure
n, err := rand.Int(rand.Reader, big.NewInt(max))

// ✗ Not secure for security-sensitive use
n := mathrand.Intn(max) // math/rand is predictable
```

## Dependency Scanning

Run `govulncheck` in CI:

```bash
go install golang.org/x/vuln/cmd/govulncheck@latest
govulncheck ./...
```

Address all HIGH and CRITICAL vulnerabilities before merging.

## HTTP Server Timeouts

Always set timeouts on HTTP servers to prevent resource exhaustion:

```go
srv := &http.Server{
    ReadTimeout:       5 * time.Second,
    WriteTimeout:      10 * time.Second,
    IdleTimeout:       120 * time.Second,
    ReadHeaderTimeout: 2 * time.Second,
}
```
