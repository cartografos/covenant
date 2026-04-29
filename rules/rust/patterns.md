# Patterns — Rust

Common architectural patterns for Rust services (Axum / Actix-web).

## Clean Architecture (Axum)

```
src/
  domain/
    mod.rs         ← re-exports
    user.rs        ← User entity, value objects
    repository.rs  ← UserRepository trait
    error.rs       ← domain error types
  application/
    use_cases/
      register_user.rs
      find_user.rs
  infrastructure/
    postgres/
      user_repository.rs   ← implements domain::repository::UserRepository
    http_client/
  presentation/
    handlers/
      user_handler.rs
    router.rs
  main.rs
```

## Repository Pattern

```rust
// domain/repository.rs
#[async_trait::async_trait]
pub trait UserRepository: Send + Sync {
    async fn find_by_id(&self, id: &str) -> Result<Option<User>, RepositoryError>;
    async fn find_by_email(&self, email: &str) -> Result<Option<User>, RepositoryError>;
    async fn save(&self, user: &User) -> Result<(), RepositoryError>;
}

// infrastructure/postgres/user_repository.rs
pub struct PostgresUserRepository {
    pool: sqlx::PgPool,
}

#[async_trait::async_trait]
impl UserRepository for PostgresUserRepository {
    async fn find_by_id(&self, id: &str) -> Result<Option<User>, RepositoryError> {
        let row = sqlx::query_as::<_, UserRow>(
            "SELECT id, email, created_at FROM users WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(UserRow::into_domain))
    }
}
```

## Use Case Pattern

```rust
pub struct RegisterUserUseCase<R: UserRepository, M: MailerService> {
    users: Arc<R>,
    mailer: Arc<M>,
    clock: Arc<dyn Clock>,
}

impl<R: UserRepository, M: MailerService> RegisterUserUseCase<R, M> {
    pub async fn execute(&self, req: RegisterUserRequest) -> Result<User, RegisterUserError> {
        if self.users.find_by_email(&req.email).await?.is_some() {
            return Err(RegisterUserError::EmailAlreadyExists(req.email));
        }
        let user = User::create(req.email, hash_password(&req.password), self.clock.now());
        self.users.save(&user).await?;
        self.mailer.send_welcome(&user).await?;
        Ok(user)
    }
}
```

## Axum Handler Pattern

```rust
pub async fn register_user(
    State(use_case): State<Arc<RegisterUserUseCase<impl UserRepository, impl MailerService>>>,
    Json(request): Json<RegisterUserRequest>,
) -> Result<(StatusCode, Json<UserResponse>), AppError> {
    let user = use_case.execute(request).await?;
    Ok((StatusCode::CREATED, Json(UserResponse::from(user))))
}

// AppError implements IntoResponse for automatic error mapping
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::UserAlreadyExists(email) => (StatusCode::CONFLICT, format!("Email {} already registered", email)),
            AppError::NotFound(id) => (StatusCode::NOT_FOUND, format!("User {} not found", id)),
            AppError::Internal(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Internal error".into()),
        };
        (status, Json(json!({ "error": message }))).into_response()
    }
}
```

## State and Dependency Injection (Axum)

```rust
#[derive(Clone)]
pub struct AppState {
    pub users: Arc<dyn UserRepository>,
    pub mailer: Arc<dyn MailerService>,
}

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/users", post(register_user))
        .route("/users/:id", get(get_user))
        .with_state(state)
}
```

## Builder Pattern

```rust
#[derive(Debug)]
pub struct RateLimiter {
    limit: u32,
    window: Duration,
    store: Arc<dyn Store>,
}

pub struct RateLimiterBuilder {
    limit: u32,
    window: Duration,
    store: Option<Arc<dyn Store>>,
}

impl Default for RateLimiterBuilder {
    fn default() -> Self {
        Self { limit: 100, window: Duration::from_secs(60), store: None }
    }
}

impl RateLimiterBuilder {
    pub fn limit(mut self, n: u32) -> Self { self.limit = n; self }
    pub fn window(mut self, d: Duration) -> Self { self.window = d; self }
    pub fn store(mut self, s: Arc<dyn Store>) -> Self { self.store = Some(s); self }

    pub fn build(self) -> Result<RateLimiter, &'static str> {
        Ok(RateLimiter {
            limit: self.limit,
            window: self.window,
            store: self.store.ok_or("store is required")?,
        })
    }
}
```

## Testing

```rust
#[cfg(test)]
mod tests {
    use super::*;

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

    #[tokio::test]
    async fn should_save_user_on_register() {
        let repo = Arc::new(InMemoryUserRepository::default());
        let use_case = RegisterUserUseCase::new(repo.clone(), Arc::new(FakeMailer), Arc::new(FakeClock));

        let user = use_case.execute(RegisterUserRequest {
            email: "a@b.com".into(),
            password: "pass1234".into(),
        }).await.unwrap();

        assert!(repo.find_by_id(&user.id).await.unwrap().is_some());
    }
}
```
