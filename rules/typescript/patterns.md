# Patterns — TypeScript / Node.js

Common architectural patterns for TypeScript / Node.js services.

## Clean Architecture (NestJS or Express)

```
src/
  domain/         ← entities, value objects, domain events, repository interfaces
  application/    ← use cases, DTOs, application services
  infrastructure/ ← repository implementations, external API clients, DB adapters
  presentation/   ← HTTP controllers, WebSocket gateways, CLI commands
```

Dependencies point inward: `presentation → application → domain`. `infrastructure` implements `domain` interfaces.

## Repository Pattern

```typescript
// domain/repositories/user.repository.ts
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

// infrastructure/repositories/postgres-user.repository.ts
export class PostgresUserRepository implements UserRepository {
  constructor(private readonly db: DatabaseService) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
    return row ? UserMapper.toDomain(row) : null;
  }

  async save(user: User): Promise<void> {
    await this.db.query(
      'INSERT INTO users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET email = $2',
      [user.id, user.email]
    );
  }
}
```

## Service / Use Case Pattern

```typescript
// application/use-cases/register-user.use-case.ts
export class RegisterUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly mailer: MailerService,
    private readonly clock: Clock,
  ) {}

  async execute(request: RegisterUserRequest): Promise<User> {
    const existing = await this.users.findByEmail(request.email);
    if (existing) {
      throw new UserAlreadyExistsError(request.email);
    }
    const user = User.create({ ...request, createdAt: this.clock.now() });
    await this.users.save(user);
    await this.mailer.sendWelcome(user);
    return user;
  }
}
```

## Result Type (Error Handling without Exceptions)

```typescript
type Result<T, E extends Error = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

function err<E extends Error>(error: E): Result<never, E> {
  return { ok: false, error };
}

// Usage
async function findUser(id: string): Promise<Result<User, UserNotFoundError>> {
  const user = await repo.findById(id);
  if (!user) return err(new UserNotFoundError(id));
  return ok(user);
}
```

## Dependency Injection (NestJS)

```typescript
@Module({
  providers: [
    RegisterUserUseCase,
    { provide: UserRepository, useClass: PostgresUserRepository },
    { provide: Clock, useClass: SystemClock },
  ],
  exports: [RegisterUserUseCase],
})
export class UserModule {}
```

## DTO Validation (class-validator)

```typescript
export class RegisterUserRequest {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
```

## HTTP Handler Pattern (Express)

```typescript
export function createUserRouter(registerUser: RegisterUserUseCase): Router {
  const router = Router();

  router.post('/users', async (req, res, next) => {
    try {
      const user = await registerUser.execute(req.body);
      res.status(201).json({ id: user.id });
    } catch (error) {
      next(error); // delegate to error middleware
    }
  });

  return router;
}
```

## Testing Pattern

```typescript
describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let users: InMemoryUserRepository;
  let mailer: FakeMailer;

  beforeEach(() => {
    users = new InMemoryUserRepository();
    mailer = new FakeMailer();
    useCase = new RegisterUserUseCase(users, mailer, new FakeClock());
  });

  it('saves the user and sends a welcome email', async () => {
    await useCase.execute({ email: 'user@example.com', password: 'secret123' });

    expect(users.findByEmail('user@example.com')).resolves.not.toBeNull();
    expect(mailer.sentEmails).toHaveLength(1);
    expect(mailer.sentEmails[0].to).toBe('user@example.com');
  });

  it('throws UserAlreadyExistsError when email is taken', async () => {
    await users.save(User.create({ email: 'user@example.com', ... }));

    await expect(
      useCase.execute({ email: 'user@example.com', password: 'secret123' })
    ).rejects.toBeInstanceOf(UserAlreadyExistsError);
  });
});
```

## Environment Configuration

```typescript
import { z } from 'zod';

const configSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
});

export const config = configSchema.parse(process.env);
```

Validate at startup — fail fast if required config is missing.
