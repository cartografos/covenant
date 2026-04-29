# Patterns — Kotlin / Spring Boot

Common architectural patterns for Kotlin services.

## Clean Architecture

```
src/main/kotlin/com/example/
  domain/
    model/          ← entities, value objects, domain errors
    repository/     ← repository interfaces (no Spring annotations here)
    service/        ← domain services
  application/
    usecase/        ← use cases, orchestration
    dto/            ← request/response DTOs
  infrastructure/
    persistence/    ← Spring Data / Exposed implementations
    http/           ← external HTTP clients
    messaging/      ← Kafka, SQS consumers and producers
  presentation/
    rest/           ← Spring MVC controllers
    grpc/           ← gRPC service implementations
```

## Repository Pattern

```kotlin
// domain/repository/UserRepository.kt — no Spring dependency
interface UserRepository {
    suspend fun findById(id: String): User?
    suspend fun save(user: User): User
}

// infrastructure/persistence/PostgresUserRepository.kt
@Repository
class PostgresUserRepository(
    private val jpaRepository: UserJpaRepository,
) : UserRepository {

    override suspend fun findById(id: String): User? =
        withContext(Dispatchers.IO) {
            jpaRepository.findById(id).orElse(null)?.toDomain()
        }

    override suspend fun save(user: User): User =
        withContext(Dispatchers.IO) {
            jpaRepository.save(user.toEntity()).toDomain()
        }
}
```

## Use Case Pattern

```kotlin
@Component
class RegisterUserUseCase(
    private val users: UserRepository,
    private val mailer: MailerService,
    private val clock: Clock,
) {
    suspend fun execute(request: RegisterUserRequest): User {
        users.findByEmail(request.email)
            ?.let { throw UserAlreadyExistsException(request.email) }

        val user = User.create(
            email = request.email,
            passwordHash = hashPassword(request.password),
            createdAt = clock.instant(),
        )
        val saved = users.save(user)
        mailer.sendWelcome(saved)
        return saved
    }
}
```

## Spring MVC Controller

```kotlin
@RestController
@RequestMapping("/users")
class UserController(private val registerUser: RegisterUserUseCase) {

    @PostMapping
    suspend fun register(@Valid @RequestBody request: RegisterUserRequest): ResponseEntity<UserResponse> {
        val user = registerUser.execute(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(user))
    }
}
```

## Coroutine Flow for Streaming

```kotlin
// Repository
interface EventRepository {
    fun streamSince(checkpoint: Instant): Flow<DomainEvent>
}

// Use case
class EventProcessor(private val events: EventRepository) {
    suspend fun process(since: Instant) {
        events.streamSince(since)
            .filter { it.type == EventType.ORDER_CREATED }
            .map { it.payload.toOrder() }
            .collect { order -> handle(order) }
    }
}
```

## Value Objects

```kotlin
@JvmInline
value class UserId(val value: String) {
    init { require(value.isNotBlank()) { "UserId must not be blank" } }
}

@JvmInline
value class Email(val value: String) {
    init { require(value.contains('@')) { "Invalid email: $value" } }
}

data class User(val id: UserId, val email: Email, val createdAt: Instant)
```

## Error Hierarchy

```kotlin
sealed class DomainException(message: String) : RuntimeException(message)

class UserAlreadyExistsException(email: String) :
    DomainException("User with email $email already exists")

class UserNotFoundException(id: String) :
    DomainException("User $id not found")

// Global exception handler
@RestControllerAdvice
class GlobalExceptionHandler {
    @ExceptionHandler(UserAlreadyExistsException::class)
    fun handleUserAlreadyExists(ex: UserAlreadyExistsException) =
        ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ErrorResponse(ex.message ?: "Conflict"))

    @ExceptionHandler(UserNotFoundException::class)
    fun handleUserNotFound(ex: UserNotFoundException) =
        ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ErrorResponse(ex.message ?: "Not found"))
}
```

## Testing with MockK

```kotlin
@ExtendWith(MockKExtension::class)
class RegisterUserUseCaseTest {

    @MockK lateinit var users: UserRepository
    @MockK lateinit var mailer: MailerService
    private val clock = Clock.fixed(Instant.parse("2024-01-01T00:00:00Z"), ZoneOffset.UTC)

    private lateinit var useCase: RegisterUserUseCase

    @BeforeEach
    fun setUp() {
        useCase = RegisterUserUseCase(users, mailer, clock)
    }

    @Test
    fun `should save user and send welcome email`() = runTest {
        coEvery { users.findByEmail(any()) } returns null
        coEvery { users.save(any()) } answers { firstArg() }
        coJustRun { mailer.sendWelcome(any()) }

        useCase.execute(RegisterUserRequest(email = "a@b.com", password = "pass1234"))

        coVerify(exactly = 1) { mailer.sendWelcome(any()) }
    }

    @Test
    fun `should throw when email already taken`() = runTest {
        coEvery { users.findByEmail("a@b.com") } returns mockk()

        assertThrows<UserAlreadyExistsException> {
            useCase.execute(RegisterUserRequest(email = "a@b.com", password = "pass1234"))
        }
    }
}
```
