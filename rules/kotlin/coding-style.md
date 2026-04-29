# Coding Style — Kotlin

Extends `rules/common/coding-style.md`. Kotlin-specific rules take precedence.

## Formatting

- Run `ktlint` or the IDE Kotlin formatter before committing
- Line length: 120 characters max
- Use official [Kotlin coding conventions](https://kotlinlang.org/docs/coding-conventions.html) as baseline

## Naming

- Classes, objects, interfaces: `PascalCase` — `UserRepository`, `RateLimiter`
- Functions and properties: `camelCase` — `getUserById`, `isRateLimited`
- Constants (`val` in companion object or top-level): `SCREAMING_SNAKE_CASE`
- Package names: `lowercase.dotted` — `com.example.payments.domain`
- Test functions: use backtick names — `` `should return 404 when user not found`() ``

## Null Safety

- Never use `!!` unless you can prove at that callsite that null is impossible — if you use `!!`, add a comment explaining why
- Prefer `?.let`, `?: return`, `?: throw` over explicit null checks
- Use `requireNotNull()` and `checkNotNull()` at system boundaries where null is a programming error
- Design APIs that don't accept or return nullable types unless absence is a meaningful domain concept

```kotlin
// ✓ Safe chaining
user?.email?.lowercase() ?: throw UserEmailMissingError(user.id)

// ✗ Crash waiting to happen
user!!.email!!.lowercase()
```

## Data Classes

- Use `data class` for value objects and DTOs — they get `equals`, `hashCode`, `copy`, and `toString` for free
- Data classes should be immutable (`val` properties only)
- Do not add business logic to data classes — keep them pure data containers

```kotlin
data class Money(val amount: BigDecimal, val currency: Currency)
```

## Sealed Classes and When

- Use `sealed class` or `sealed interface` to model exhaustive domain states
- `when` on a sealed type must be exhaustive — do not add an `else` branch that silently handles unknown cases

```kotlin
sealed interface PaymentResult {
    data class Success(val transactionId: String) : PaymentResult
    data class Declined(val reason: String) : PaymentResult
    data object Pending : PaymentResult
}

fun handle(result: PaymentResult) = when (result) {
    is PaymentResult.Success -> confirm(result.transactionId)
    is PaymentResult.Declined -> notify(result.reason)
    is PaymentResult.Pending -> schedule()
    // no else — compiler enforces exhaustiveness
}
```

## Coroutines

- Mark suspend functions clearly — `suspend` is part of the public contract
- Use `Dispatchers.IO` for I/O, `Dispatchers.Default` for CPU-bound work — never block on `Dispatchers.Main`
- Always use structured concurrency — launch coroutines in a scope that has a defined lifecycle
- Use `supervisorScope` when child failures should not cancel siblings
- Cancel coroutines explicitly when work is no longer needed

```kotlin
// ✓ Structured — tied to viewModelScope lifecycle
viewModelScope.launch {
    val user = withContext(Dispatchers.IO) { userRepository.findById(id) }
    _state.value = UiState.Success(user)
}

// ✗ Global scope — lives forever, cannot be cancelled
GlobalScope.launch { userRepository.findById(id) }
```

## Extension Functions

- Use extension functions to add behavior to types you do not own
- Keep extension functions focused — one extension, one responsibility
- Place extension functions in files named after the type they extend: `StringExtensions.kt`
- Do not use extension functions to work around encapsulation

## Companion Objects

- Use companion objects for factory methods and constants, not as a dumping ground
- Prefer top-level functions over companion object functions when the function is not tightly coupled to the class

## Error Handling

- Use `Result<T>` or a domain-specific sealed type for recoverable errors — not exceptions for control flow
- Reserve exceptions for unrecoverable failures and programming errors
- Use `runCatching` at the boundary with external code that throws

```kotlin
suspend fun findUser(id: String): Result<User> = runCatching {
    repository.findById(id) ?: throw UserNotFoundError(id)
}
```
