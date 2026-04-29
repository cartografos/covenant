# Security — Rust

Extends `rules/common/security.md`. Rust-specific rules take precedence.

## Unsafe Code

```rust
// Every unsafe block MUST have a SAFETY comment
// SAFETY: `ptr` is guaranteed non-null by the caller contract on line 42,
//         and the memory it points to is valid for the lifetime 'a.
let value = unsafe { &*ptr };

// ✗ Never — unsafe without justification
unsafe { *ptr = 0; }
```

Minimize unsafe scope. If a safe abstraction exists, use it. Wrap unavoidable unsafe in a safe public API with documented invariants.

## SQL Injection (sqlx)

```rust
// ✓ Always use parameterized queries
let user = sqlx::query_as::<_, UserRow>(
    "SELECT id, email FROM users WHERE id = $1"
)
.bind(id)
.fetch_optional(&pool)
.await?;

// ✗ Never — format! in query string
let user = sqlx::query(&format!("SELECT * FROM users WHERE id = '{}'", id))
    .fetch_optional(&pool)
    .await?;
```

## Integer Overflow

Rust panics on integer overflow in debug mode and wraps silently in release mode.

```rust
// ✓ Use checked arithmetic for security-sensitive calculations
let total = quantity
    .checked_mul(price)
    .ok_or(PaymentError::Overflow)?;

// ✓ Use saturating/wrapping only when the behavior is explicitly intended
let counter = counter.saturating_add(1);

// ✗ Can silently overflow in --release
let total = quantity * price;
```

## Cryptographically Secure Random

```rust
// ✓ Use rand::rngs::OsRng or getrandom directly
use rand::{rngs::OsRng, RngCore};

let mut token = [0u8; 32];
OsRng.fill_bytes(&mut token);
let token_hex = hex::encode(token);

// ✗ Not cryptographically secure
use rand::Rng;
let n = rand::thread_rng().gen::<u64>(); // thread_rng is not secure for tokens
```

## Secrets in Environment

```rust
// ✓ Load from environment, fail fast if missing
let jwt_secret = std::env::var("JWT_SECRET")
    .expect("JWT_SECRET environment variable must be set");

// ✓ Or use a config library (config, envy)
#[derive(Deserialize)]
struct Config {
    jwt_secret: String,       // required — fails to deserialize if missing
    database_url: String,
    redis_url: String,
}

let config: Config = envy::from_env().expect("Failed to load config");
```

## TLS Client Configuration

```rust
// ✓ Default reqwest client uses rustls with certificate verification
let client = reqwest::Client::new();

// ✗ Never disable certificate verification
let client = reqwest::Client::builder()
    .danger_accept_invalid_certs(true)  // FORBIDDEN in production
    .build()?;
```

## Path Traversal

```rust
use std::path::{Path, PathBuf};

fn safe_file_path(base: &Path, user_input: &str) -> Result<PathBuf, AppError> {
    let target = base.join(user_input).canonicalize()
        .map_err(|_| AppError::InvalidPath)?;

    if !target.starts_with(base) {
        return Err(AppError::PathTraversal);
    }
    Ok(target)
}
```

## Deserialization Limits

Protect against denial-of-service via oversized payloads:

```rust
// Axum — set request body size limit
let app = Router::new()
    .route("/upload", post(upload_handler))
    .layer(DefaultBodyLimit::max(10 * 1024 * 1024)); // 10 MB

// serde_json — use a size-limited reader for untrusted input
let reader = input.take(MAX_PAYLOAD_BYTES);
let value: serde_json::Value = serde_json::from_reader(reader)?;
```

## Sensitive Data in Logs / Debug Output

```rust
// ✓ Implement Debug manually to redact sensitive fields
#[derive(Clone)]
pub struct Credentials {
    pub username: String,
    password: String,  // private
}

impl fmt::Debug for Credentials {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Credentials")
            .field("username", &self.username)
            .field("password", &"[REDACTED]")
            .finish()
    }
}

// ✓ Or use the secrecy crate
use secrecy::{Secret, ExposeSecret};
let password: Secret<String> = Secret::new(raw_password);
// password is redacted in Debug output automatically
password.expose_secret() // must be explicit to use the value
```

## Dependency Auditing

```bash
cargo install cargo-audit
cargo audit                  # check for known vulnerabilities in dependencies
cargo audit --deny warnings  # fail on any advisory (use in CI)
```

Run `cargo audit` in CI on every push.
