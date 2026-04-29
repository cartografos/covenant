# Patterns — Go

Common architectural and idiomatic patterns for Go services.

## Clean Architecture

Organize packages by layer, with dependencies pointing inward:

```
cmd/             ← entry points (main packages)
internal/
  domain/        ← entities, value objects, domain errors (no external deps)
  usecase/       ← business logic (depends only on domain)
  repository/    ← data access interfaces (defined here, implemented in infra)
  infra/         ← implementations: DB, HTTP clients, message queues
  transport/     ← HTTP handlers, gRPC servers, CLI commands
```

The `domain` package has zero external dependencies. `usecase` imports `domain` and `repository` interfaces. `infra` implements those interfaces. `transport` calls `usecase`.

## Repository Pattern

```go
// Defined in internal/repository — the usecase layer imports this
type UserRepository interface {
    GetByID(ctx context.Context, id string) (*domain.User, error)
    Save(ctx context.Context, user *domain.User) error
}

// Implemented in internal/infra/postgres
type postgresUserRepository struct {
    db *sql.DB
}

func NewPostgresUserRepository(db *sql.DB) repository.UserRepository {
    return &postgresUserRepository{db: db}
}
```

## Service / Use Case Pattern

```go
type UserService struct {
    users  repository.UserRepository
    mailer Mailer
    clock  Clock
}

func NewUserService(users repository.UserRepository, mailer Mailer, clock Clock) *UserService {
    return &UserService{users: users, mailer: mailer, clock: clock}
}

func (s *UserService) Register(ctx context.Context, req RegisterRequest) (*domain.User, error) {
    if err := req.Validate(); err != nil {
        return nil, fmt.Errorf("validating request: %w", err)
    }
    // ...
}
```

## Options Pattern (for complex constructors)

```go
type RateLimiter struct {
    limit  int
    window time.Duration
    store  Store
}

type Option func(*RateLimiter)

func WithLimit(n int) Option {
    return func(r *RateLimiter) { r.limit = n }
}

func WithWindow(d time.Duration) Option {
    return func(r *RateLimiter) { r.window = d }
}

func NewRateLimiter(opts ...Option) *RateLimiter {
    r := &RateLimiter{limit: 100, window: time.Minute} // defaults
    for _, opt := range opts {
        opt(r)
    }
    return r
}
```

## Table-Driven Tests

```go
func TestAllow(t *testing.T) {
    tests := []struct {
        name    string
        setup   func(*RateLimiter)
        key     string
        want    bool
    }{
        {
            name:  "allows when under limit",
            setup: func(r *RateLimiter) {},
            key:   "user-1",
            want:  true,
        },
        {
            name: "denies when limit exceeded",
            setup: func(r *RateLimiter) {
                for i := 0; i < 100; i++ {
                    r.Allow("user-1")
                }
            },
            key:  "user-1",
            want: false,
        },
    }

    for _, tc := range tests {
        t.Run(tc.name, func(t *testing.T) {
            r := NewRateLimiter()
            tc.setup(r)
            got := r.Allow(tc.key)
            if got != tc.want {
                t.Errorf("Allow(%q) = %v, want %v", tc.key, got, tc.want)
            }
        })
    }
}
```

## Middleware / Interceptor Pattern (HTTP)

```go
type Middleware func(http.Handler) http.Handler

func Chain(h http.Handler, middlewares ...Middleware) http.Handler {
    for i := len(middlewares) - 1; i >= 0; i-- {
        h = middlewares[i](h)
    }
    return h
}

func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // validate token
        next.ServeHTTP(w, r)
    })
}
```

## Graceful Shutdown

```go
func run(ctx context.Context) error {
    srv := &http.Server{Addr: ":8080", Handler: router}

    go func() {
        <-ctx.Done()
        shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
        defer cancel()
        srv.Shutdown(shutdownCtx)
    }()

    if err := srv.ListenAndServe(); err != http.ErrServerClosed {
        return err
    }
    return nil
}
```

## Configuration

```go
type Config struct {
    Port     int           `env:"PORT"      envDefault:"8080"`
    DB       DBConfig
    Timeout  time.Duration `env:"TIMEOUT"   envDefault:"30s"`
}

func ConfigFromEnv() (Config, error) {
    var cfg Config
    if err := env.Parse(&cfg); err != nil {
        return Config{}, fmt.Errorf("parsing config: %w", err)
    }
    return cfg, nil
}
```
