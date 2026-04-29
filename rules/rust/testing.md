# Testing — Rust

Extends `rules/common/testing.md`. Rust-specific rules take precedence.

## Test Organization

- Unit tests: `#[cfg(test)]` module inside the same file as the code
- Integration tests: `tests/` directory at the crate root — one file per feature area
- Benchmarks: `benches/` directory using `criterion`

```
src/
  domain/user.rs      ← #[cfg(test)] mod tests { ... } at the bottom
tests/
  user_api.rs         ← integration tests hitting the full stack
benches/
  rate_limiter.rs     ← criterion benchmarks
```

## Unit Test Structure

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn should_allow_when_under_limit() {
        let limiter = RateLimiter::builder().limit(10).build().unwrap();
        assert!(limiter.allow("user-1"));
    }

    #[test]
    fn should_deny_when_limit_exceeded() {
        let limiter = RateLimiter::builder().limit(1).build().unwrap();
        limiter.allow("user-1");
        assert!(!limiter.allow("user-1"));
    }
}
```

## Async Tests

Use `#[tokio::test]` for async test functions:

```rust
#[tokio::test]
async fn should_find_user_by_id() {
    let repo = InMemoryUserRepository::default();
    let user = User::new("123", "a@b.com");
    repo.save(&user).await.unwrap();

    let found = repo.find_by_id("123").await.unwrap();
    assert_eq!(found.unwrap().email, "a@b.com");
}
```

## Error Testing

```rust
#[tokio::test]
async fn should_return_error_when_email_taken() {
    let repo = Arc::new(InMemoryUserRepository::default());
    repo.save(&User::new("1", "a@b.com")).await.unwrap();

    let use_case = RegisterUserUseCase::new(repo, FakeMailer, FakeClock);
    let result = use_case.execute(RegisterUserRequest {
        email: "a@b.com".into(),
        password: "pass1234".into(),
    }).await;

    assert!(matches!(result, Err(RegisterUserError::EmailAlreadyExists(_))));
}
```

## Fakes

Write in-memory implementations of traits — do not use mock libraries for internal traits:

```rust
#[derive(Default)]
struct InMemoryUserRepository {
    store: Mutex<HashMap<String, User>>,
}

#[async_trait::async_trait]
impl UserRepository for InMemoryUserRepository {
    async fn find_by_id(&self, id: &str) -> Result<Option<User>, RepositoryError> {
        Ok(self.store.lock().unwrap().get(id).cloned())
    }
    async fn save(&self, user: &User) -> Result<(), RepositoryError> {
        self.store.lock().unwrap().insert(user.id.clone(), user.clone());
        Ok(())
    }
}
```

Use `mockall` only for external dependencies (HTTP clients, email services) where writing a fake is impractical.

## Integration Tests with Axum

```rust
// tests/user_api.rs
use axum::http::StatusCode;
use axum_test::TestServer;

#[tokio::test]
async fn post_users_returns_201() {
    let app = create_test_app().await;
    let server = TestServer::new(app).unwrap();

    let response = server.post("/users")
        .json(&serde_json::json!({ "email": "a@b.com", "password": "pass1234" }))
        .await;

    assert_eq!(response.status_code(), StatusCode::CREATED);
    assert!(!response.json::<serde_json::Value>()["id"].as_str().unwrap().is_empty());
}
```

## Database Integration Tests (sqlx)

```rust
#[sqlx::test]
async fn should_save_and_retrieve_user(pool: PgPool) {
    let repo = PostgresUserRepository::new(pool);
    let user = User::new("test@example.com");

    repo.save(&user).await.unwrap();
    let found = repo.find_by_email("test@example.com").await.unwrap();

    assert!(found.is_some());
}
```

`#[sqlx::test]` creates a fresh database per test and runs migrations automatically.

## Running Tests

```bash
cargo test                          # all tests
cargo test user                     # tests with "user" in name
cargo test -- --nocapture           # show println! output
cargo test --test user_api          # integration tests only
cargo nextest run                   # faster parallel test runner (recommended)
```

## Coverage

```bash
cargo install cargo-tarpaulin
cargo tarpaulin --out Html          # generates tarpaulin-report.html
cargo tarpaulin --fail-under 90     # fail if coverage < 90%
```

## Do Not

- Do not use `unwrap()` in tests when the error message matters — use `expect("descriptive message")` or `?` with `#[tokio::test]` that returns `Result`
- Do not use `std::thread::sleep` — use tokio's time control for async time-dependent tests
- Do not share mutable state between tests without proper synchronization — each test must be independent
