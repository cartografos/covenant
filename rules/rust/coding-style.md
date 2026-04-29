# Coding Style — Rust

Extends `rules/common/coding-style.md`. Rust-specific rules take precedence.

## Formatting

- Run `cargo fmt` before every commit — non-negotiable
- Run `cargo clippy -- -D warnings` and fix all warnings before committing
- Line length: 100 characters (rustfmt default)

## Naming

- Types, traits, enums: `PascalCase` — `UserRepository`, `PaymentError`
- Functions, methods, variables, modules: `snake_case` — `find_user_by_id`, `is_rate_limited`
- Constants and statics: `SCREAMING_SNAKE_CASE` — `MAX_RETRIES`, `DEFAULT_TIMEOUT`
- Lifetimes: short lowercase — `'a`, `'conn`, `'req`
- Type parameters: single uppercase or short descriptive — `T`, `E`, `Item`

## Error Handling

Rust errors are values — use `Result<T, E>` everywhere. Never use `unwrap()` or `expect()` in production code.

```rust
// ✓ Propagate with ? operator
async fn find_user(id: &str) -> Result<User, AppError> {
    let row = db.query_one("SELECT * FROM users WHERE id = $1", &[&id]).await?;
    Ok(User::from_row(&row)?)
}

// ✗ Panics in production
let user = db.query_one(...).await.unwrap();
```

### Error Types

Define a domain error enum for each module:

```rust
#[derive(Debug, thiserror::Error)]
pub enum UserError {
    #[error("user not found: {id}")]
    NotFound { id: String },

    #[error("email already registered: {email}")]
    AlreadyExists { email: String },

    #[error(transparent)]
    Database(#[from] sqlx::Error),
}
```

Use `thiserror` for library/domain errors, `anyhow` for application-level error propagation where the caller does not need to match on error variants.

## Ownership and Borrowing

- Prefer borrowing (`&T`, `&mut T`) over cloning when the data does not need to be owned
- Clone only when ownership is genuinely needed — add a comment if it is non-obvious
- Use `Cow<'_, str>` when a function may need to return either borrowed or owned string data
- Avoid interior mutability (`RefCell`, `Cell`) unless the design genuinely requires it — prefer `Mutex` for shared state across threads

## Structs and Enums

- Use the builder pattern for structs with many optional fields
- Use `#[non_exhaustive]` on public enums to allow adding variants without breaking downstream consumers
- Mark structs `pub` only at the fields that callers need — keep internals private

```rust
pub struct RateLimiter {
    limit: u32,       // private
    window: Duration, // private
    store: Arc<dyn Store>,
}

impl RateLimiter {
    pub fn builder() -> RateLimiterBuilder { RateLimiterBuilder::default() }
    pub fn allow(&self, key: &str) -> bool { /* ... */ }
}
```

## Traits

- Define traits for behavior that has multiple implementations (testability, extensibility)
- Keep traits focused — one trait, one capability
- Use `async_trait` or `impl Trait` in return position for async trait methods

```rust
#[async_trait::async_trait]
pub trait UserRepository: Send + Sync {
    async fn find_by_id(&self, id: &str) -> Result<Option<User>, RepositoryError>;
    async fn save(&self, user: &User) -> Result<(), RepositoryError>;
}
```

## Unsafe

- Never write `unsafe` without a `// SAFETY:` comment explaining exactly why it is correct
- Prefer safe abstractions — if you find yourself writing `unsafe`, look for a safe API first
- Keep `unsafe` blocks as small as possible — do not put safe code inside unsafe blocks

## Async

- Use `tokio` as the runtime (check `Cargo.toml`)
- Do not block the async executor — use `tokio::task::spawn_blocking` for CPU-bound or blocking I/O
- Cancel-safe: ensure `async fn` implementations are cancel-safe when used with `select!`
- Use `Arc<T>` to share state across tasks, not `Rc<T>`
