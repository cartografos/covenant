# Testing — TypeScript

Extends `rules/common/testing.md`. TypeScript-specific rules take precedence.

## Test Runner

Check `package.json` to determine the test runner in use:
- `jest` — most common; config in `jest.config.ts` or `jest.config.js`
- `vitest` — preferred for Vite projects; config in `vitest.config.ts`
- `mocha` — older projects

Match the existing runner — do not introduce a second one.

## File Placement

- `src/users/user.service.ts` → `src/users/user.service.test.ts` (co-located)
- OR `test/users/user.service.test.ts` (separate test directory — match project convention)

## Structure

```typescript
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

```typescript
// ✓ In-memory fake — tests real logic
class InMemoryUserRepository implements UserRepository {
  private store = new Map<string, User>();

  async findById(id: string) { return this.store.get(id) ?? null; }
  async save(user: User) { this.store.set(user.id, user); }
}

// ✗ Mock — tests only that the method was called
const repo = { findById: jest.fn(), save: jest.fn() };
```

Use `jest.fn()` only for external dependencies: HTTP clients, email senders, payment gateways.

## Async Tests

```typescript
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

## Type Safety in Tests

```typescript
// Use satisfies or type assertions only at the boundary
const input = {
  email: 'test@example.com',
  password: 'secret123',
} satisfies RegisterRequest;

// Avoid casting away types in tests
const result = await service.register(input);
// result is properly typed — do not cast it
```

## Running Tests

```bash
# All tests
npx jest / npx vitest run

# Watch mode (development)
npx jest --watch / npx vitest

# Coverage
npx jest --coverage / npx vitest --coverage

# Specific file
npx jest src/users/user.service.test.ts
```

## Coverage Configuration

```typescript
// jest.config.ts
export default {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/main.ts'],
};
```

## Do Not

- Do not use `setTimeout` with delays in tests — use fake timers (`jest.useFakeTimers()`) when time-dependent logic must be tested
- Do not use `jest.spyOn` on internal module functions — test through the public interface
- Do not share mutable state between `it` blocks — reset in `beforeEach`
- Do not use snapshots for business logic — snapshots are appropriate only for UI component output
