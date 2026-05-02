# Patterns — JavaScript / Node.js

Common architectural patterns for JavaScript / Node.js services.

## Clean Architecture (Express)

```
src/
  domain/         <- entities, value objects, repository interfaces (JSDoc-typed)
  application/    <- use cases, DTOs, application services
  infrastructure/ <- repository implementations, external API clients, DB adapters
  presentation/   <- HTTP controllers, WebSocket gateways, CLI commands
```

Dependencies point inward: `presentation -> application -> domain`. `infrastructure` implements `domain` interfaces.

## Repository Pattern

```javascript
// domain/repositories/user-repository.js

/**
 * @typedef {Object} UserRepository
 * @property {(id: string) => Promise<User|null>} findById
 * @property {(user: User) => Promise<void>} save
 */

// infrastructure/repositories/postgres-user-repository.js
class PostgresUserRepository {
  constructor(db) {
    this.db = db;
  }

  async findById(id) {
    const row = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
    return row ? UserMapper.toDomain(row) : null;
  }

  async save(user) {
    await this.db.query(
      'INSERT INTO users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET email = $2',
      [user.id, user.email]
    );
  }
}

module.exports = { PostgresUserRepository };
```

## Service / Use Case Pattern

```javascript
// application/use-cases/register-user.js
class RegisterUserUseCase {
  constructor(users, mailer, clock) {
    this.users = users;
    this.mailer = mailer;
    this.clock = clock;
  }

  async execute(request) {
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

module.exports = { RegisterUserUseCase };
```

## Dependency Injection (Manual)

```javascript
// composition-root.js
const { PostgresUserRepository } = require('./infrastructure/repositories/postgres-user-repository');
const { RegisterUserUseCase } = require('./application/use-cases/register-user');
const { NodeMailer } = require('./infrastructure/mailer');

function createContainer(db) {
  const users = new PostgresUserRepository(db);
  const mailer = new NodeMailer();
  const clock = { now: () => new Date() };

  return {
    registerUser: new RegisterUserUseCase(users, mailer, clock),
  };
}

module.exports = { createContainer };
```

## HTTP Handler Pattern (Express)

```javascript
// presentation/routes/users.js
function createUserRouter(registerUser) {
  const router = require('express').Router();

  router.post('/users', async (req, res, next) => {
    try {
      const user = await registerUser.execute(req.body);
      res.status(201).json({ id: user.id });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createUserRouter };
```

## Closure-Based Encapsulation

```javascript
function createRateLimiter(maxRequests, windowMs) {
  const hits = new Map();

  return {
    allow(key) {
      const now = Date.now();
      const entry = hits.get(key);
      if (!entry || now - entry.start > windowMs) {
        hits.set(key, { start: now, count: 1 });
        return true;
      }
      entry.count += 1;
      return entry.count <= maxRequests;
    },

    reset(key) {
      hits.delete(key);
    },
  };
}

module.exports = { createRateLimiter };
```

## Environment Configuration

```javascript
function loadConfig() {
  const required = (key) => {
    const val = process.env[key];
    if (!val) throw new Error(`Missing required env var: ${key}`);
    return val;
  };

  return Object.freeze({
    port: parseInt(process.env.PORT || '8080', 10),
    databaseUrl: required('DATABASE_URL'),
    jwtSecret: required('JWT_SECRET'),
  });
}

module.exports = { loadConfig };
```

Validate at startup — fail fast if required config is missing.

## Testing Pattern

```javascript
const { RegisterUserUseCase } = require('./register-user');

describe('RegisterUserUseCase', () => {
  let useCase;
  let users;
  let mailer;

  beforeEach(() => {
    users = new InMemoryUserRepository();
    mailer = new FakeMailer();
    useCase = new RegisterUserUseCase(users, mailer, { now: () => new Date('2024-01-01') });
  });

  it('saves the user and sends a welcome email', async () => {
    await useCase.execute({ email: 'user@example.com', password: 'secret123' });

    expect(await users.findByEmail('user@example.com')).not.toBeNull();
    expect(mailer.sentEmails).toHaveLength(1);
    expect(mailer.sentEmails[0].to).toBe('user@example.com');
  });

  it('throws UserAlreadyExistsError when email is taken', async () => {
    await users.save(User.create({ email: 'user@example.com' }));

    await expect(
      useCase.execute({ email: 'user@example.com', password: 'secret123' })
    ).rejects.toBeInstanceOf(UserAlreadyExistsError);
  });
});
```
