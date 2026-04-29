# Coding Style — Java

Extends `rules/common/coding-style.md`. Java-specific rules take precedence.

## Version

Target Java 17+. Use modern language features — records, sealed classes, pattern matching, text blocks. Do not write Java 8 style in a Java 17 codebase.

## Formatting

- Run Google Java Format or Checkstyle before committing (check `pom.xml` or `build.gradle`)
- Line length: 100 characters
- Braces: always on the same line (K&R style)
- Import order: static imports first, then java.*, then javax.*, then third-party, then project

## Naming

- Classes and interfaces: `PascalCase` — `UserRepository`, `PaymentService`
- Methods and variables: `camelCase` — `getUserById`, `isRateLimited`
- Constants (`static final`): `SCREAMING_SNAKE_CASE` — `MAX_RETRY_COUNT`
- Packages: `lowercase.dotted` — `com.example.payments.domain`
- Test classes: `{SubjectClass}Test` — `UserServiceTest`

## Modern Java Features

### Records (value objects and DTOs)
```java
public record Money(BigDecimal amount, Currency currency) {
    public Money {
        Objects.requireNonNull(amount, "amount must not be null");
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("amount must not be negative");
        }
    }
}
```

### Sealed Classes (exhaustive domain states)
```java
public sealed interface PaymentResult
    permits PaymentResult.Success, PaymentResult.Declined, PaymentResult.Pending {

    record Success(String transactionId) implements PaymentResult {}
    record Declined(String reason) implements PaymentResult {}
    record Pending() implements PaymentResult {}
}

// Pattern matching switch — compiler enforces exhaustiveness
String message = switch (result) {
    case PaymentResult.Success s -> "Confirmed: " + s.transactionId();
    case PaymentResult.Declined d -> "Declined: " + d.reason();
    case PaymentResult.Pending p -> "Processing";
};
```

### Text Blocks (SQL, JSON, HTML)
```java
String query = """
    SELECT u.id, u.email, u.created_at
    FROM users u
    WHERE u.id = :id
      AND u.deleted_at IS NULL
    """;
```

## Immutability

- Prefer `final` fields — set once in constructor, never again
- Return defensive copies of mutable collections: `List.copyOf(internalList)`
- Use `List.of()`, `Map.of()`, `Set.of()` for constant collections
- Never expose mutable internal state through getters

## Optional

- Use `Optional<T>` only as a return type when absence is a meaningful outcome
- Never use `Optional` as a parameter or field type
- Never call `.get()` without `.isPresent()` — use `.orElseThrow()`, `.orElse()`, or `.ifPresent()`

```java
// ✓
Optional<User> findById(String id);
User user = repo.findById(id).orElseThrow(() -> new UserNotFoundException(id));

// ✗ — use null or throw instead
void process(Optional<String> value) { }
```

## Error Handling

- Checked exceptions for recoverable, caller-must-handle conditions
- Unchecked (`RuntimeException`) for programming errors and unrecoverable failures
- Never catch `Exception` or `Throwable` without rethrowing or logging with full context
- Wrap third-party exceptions at the boundary — callers should see domain exceptions

## Collections

- Declare with interface type: `List<User>` not `ArrayList<User>`
- Use streams for transformations — prefer readability over micro-optimizations
- Avoid modifying collections while iterating — use collectors instead
