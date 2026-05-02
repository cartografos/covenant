# Testing — JavaScript

Extends `rules/common/testing.md`. JavaScript-specific rules take precedence.

## Test Runner

Check `package.json` to determine the test runner in use:
- `jest` — most common; config in `jest.config.js`
- `vitest` — preferred for Vite projects; config in `vitest.config.js`
- `mocha` — older projects; often paired with `chai` for assertions
- `node:test` — Node.js built-in test runner (v18+); uses `node --test`

Match the existing runner — do not introduce a second one.

## File Placement

- `src/users/user-service.js` -> `src/users/user-service.test.js` (co-located)
- OR `test/users/user-service.test.js` (separate test directory — match project convention)

## Structure

```javascript
describe('UserService', () => {
  describe('register', () => {
    it('saves the user when email is unique', async () => {
      // Arrange
      const repo = new InMemoryUserRepository();
      const service = new UserService(repo);

      // Act
      const user = await service.register({ email: 'a@b.com', password: 'pass123' });

      // Assert
      expect(user.id).toBeDefined();
      const saved = await repo.findById(user.id);
      expect(saved).not.toBeNull();
    });
  });
});
```

## Fakes over Mocks

Prefer in-memory implementations over `jest.fn()` mocks:

```javascript
// Fake — tests real logic
class InMemoryUserRepository {
  constructor() {
    this.store = new Map();
  }

  async findById(id) { return this.store.get(id) ?? null; }
  async save(user) { this.store.set(user.id, user); }
}

// Mock — tests only that the method was called
const repo = { findById: jest.fn(), save: jest.fn() };
```

Use `jest.fn()` only for external dependencies: HTTP clients, email senders, payment gateways.

## Async Tests

```javascript
// Always await — never use .then() chains in tests
it('should find user', async () => {
  const user = await repo.findById('123');
  expect(user).not.toBeNull();
});

// Use expect(...).rejects for expected errors
it('should throw when not found', async () => {
  await expect(service.getUser('unknown')).rejects.toBeInstanceOf(UserNotFoundError);
});
```

## Node.js Built-in Test Runner

```javascript
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('UserService', () => {
  it('saves the user when email is unique', async () => {
    const repo = new InMemoryUserRepository();
    const service = new UserService(repo);

    const user = await service.register({ email: 'a@b.com', password: 'pass123' });

    assert.ok(user.id);
    const saved = await repo.findById(user.id);
    assert.notEqual(saved, null);
  });
});
```

## Running Tests

```bash
# All tests
npx jest / npx vitest run / npx mocha / node --test

# Watch mode (development)
npx jest --watch / npx vitest

# Coverage
npx jest --coverage / npx vitest --coverage / npx c8 node --test

# Specific file
npx jest src/users/user-service.test.js
```

## Coverage Configuration

```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  collectCoverageFrom: ['src/**/*.js', '!src/main.js'],
};
```

## Do Not

- Do not use `setTimeout` with delays in tests — use fake timers (`jest.useFakeTimers()`) when time-dependent logic must be tested
- Do not use `jest.spyOn` on internal module functions — test through the public interface
- Do not share mutable state between `it` blocks — reset in `beforeEach`
- Do not use snapshots for business logic — snapshots are appropriate only for UI component output
- Do not test private functions by exporting them — test through the public API
