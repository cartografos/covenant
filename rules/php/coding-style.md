# Coding Style — PHP

Extends `rules/common/coding-style.md`. PHP-specific rules take precedence.

## Version and Standards

- Target PHP 8.2+. Use modern features: named arguments, fibers, readonly properties, enums, first-class callable syntax
- Follow PSR-12 coding style
- Run `./vendor/bin/pint` (Laravel) or `php-cs-fixer` before committing

## Formatting

- Line length: 120 characters
- Indentation: 4 spaces — no tabs
- Opening braces for classes and methods: same line in PSR-12
- Trailing commas in multi-line arrays, function calls, and parameter lists

## Naming

- Classes, interfaces, enums, traits: `PascalCase` — `UserRepository`, `PaymentService`
- Methods, functions, variables: `camelCase` — `findUserById`, `isRateLimited`
- Constants and enum cases: `SCREAMING_SNAKE_CASE` for constants, `PascalCase` for enum cases
- Files: match the class name exactly — `UserRepository.php`
- Database columns and config keys: `snake_case`

## Type Declarations

Always use strict types and declare all parameter/return types:

```php
<?php

declare(strict_types=1);

namespace App\Domain\User;

class UserService
{
    public function findById(string $id): ?User
    {
        // ...
    }

    public function register(string $email, string $password): User
    {
        // ...
    }
}
```

Never omit `declare(strict_types=1)` — it prevents silent type coercion.

## Readonly Properties and Constructor Promotion

```php
// ✓ Constructor promotion + readonly
class User
{
    public function __construct(
        public readonly string $id,
        public readonly string $email,
        public readonly \DateTimeImmutable $createdAt,
    ) {}
}
```

## Enums (PHP 8.1+)

Prefer backed enums for domain states:

```php
enum PaymentStatus: string
{
    case Pending = 'pending';
    case Completed = 'completed';
    case Failed = 'failed';
}

// Usage — match is exhaustive for enums
$label = match ($status) {
    PaymentStatus::Pending   => 'Processing',
    PaymentStatus::Completed => 'Paid',
    PaymentStatus::Failed    => 'Declined',
};
```

## Error Handling

- Throw exceptions for error conditions — PHP does not have `Result<T, E>` natively
- Define domain exception classes that extend a base `DomainException`
- Never use `@` to suppress errors
- Always handle or rethrow caught exceptions — never catch and discard

```php
class UserNotFoundException extends \DomainException
{
    public function __construct(string $id)
    {
        parent::__construct("User not found: {$id}");
    }
}

// Usage
$user = $this->users->findById($id)
    ?? throw new UserNotFoundException($id);
```

## Null Handling

- Use nullable types (`?string`) only when null is a meaningful domain value
- Use null coalescing (`??`) and nullsafe operator (`?->`) to avoid null checks
- Prefer throwing an exception or returning a default over returning null from domain methods

```php
// ✓ Nullsafe chaining
$city = $user?->getAddress()?->getCity();

// ✓ Null coalescing with default
$timeout = $config['timeout'] ?? 30;
```

## Immutability

- Use `readonly` properties (PHP 8.1+) for value objects and DTOs
- Return new instances from "wither" methods instead of mutating state

```php
class Money
{
    public function __construct(
        public readonly int $amount,
        public readonly string $currency,
    ) {}

    public function add(Money $other): self
    {
        assert($this->currency === $other->currency, 'Currency mismatch');
        return new self($this->amount + $other->amount, $this->currency);
    }
}
```
