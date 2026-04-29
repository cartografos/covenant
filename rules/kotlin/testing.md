# Testing — Kotlin

Extends `rules/common/testing.md`. Kotlin-specific rules take precedence.

## Test Framework Stack

- **JUnit 5** — test runner (`@Test`, `@BeforeEach`, `@ExtendWith`)
- **MockK** — mocking library (`mockk()`, `coEvery`, `coVerify`) — prefer over Mockito for Kotlin
- **kotlin.test** — assertions (`assertEquals`, `assertFailsWith`, `assertNotNull`)
- **kotlinx-coroutines-test** — `runTest` for coroutine tests

```kotlin
// build.gradle.kts
testImplementation("io.mockk:mockk:1.13.+")
testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test")
testImplementation(kotlin("test"))
```

## Test Naming

Use backtick syntax for readable test names:

```kotlin
@Test
fun `should throw UserAlreadyExistsException when email is taken`() { }

@Test
fun `should return null when user is not found`() { }
```

## Coroutine Tests

Always use `runTest` for `suspend` functions — never `runBlocking` in tests:

```kotlin
@Test
fun `should save user`() = runTest {
    val user = useCase.execute(request)
    assertNotNull(user.id)
}
```

`runTest` automatically advances virtual time and fails on uncaught exceptions from coroutines.

## MockK Patterns

```kotlin
// Mock setup
coEvery { repository.findById("123") } returns user
coEvery { repository.save(any()) } answers { firstArg() }
coJustRun { mailer.sendWelcome(any()) }
every { clock.instant() } returns fixedInstant

// Verification
coVerify(exactly = 1) { mailer.sendWelcome(match { it.email == "a@b.com" }) }
coVerify(atLeast = 1) { repository.save(any()) }
confirmVerified(repository, mailer)
```

## Fakes Over Mocks

Prefer in-memory implementations for repositories:

```kotlin
class InMemoryUserRepository : UserRepository {
    private val store = mutableMapOf<String, User>()

    override suspend fun findById(id: String) = store[id]
    override suspend fun findByEmail(email: String) = store.values.find { it.email.value == email }
    override suspend fun save(user: User) = user.also { store[user.id.value] = it }
}
```

Use MockK only for external services (email, payment gateway, HTTP clients).

## Parametrized Tests

```kotlin
@ParameterizedTest
@CsvSource(
    "short, false",
    "exactly8!, true",
    "validpassword123, true",
)
fun `should validate password correctly`(password: String, valid: Boolean) {
    assertEquals(valid, validatePassword(password).isValid)
}
```

## Exception Testing

```kotlin
@Test
fun `should throw when user not found`() = runTest {
    coEvery { users.findById(any()) } returns null

    assertFailsWith<UserNotFoundException> {
        useCase.execute(GetUserRequest(id = "unknown"))
    }
}
```

## Spring Boot Integration Tests

```kotlin
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class UserControllerIntegrationTest(@Autowired val client: WebTestClient) {

    @Test
    fun `POST users returns 201 with user id`() {
        client.post().uri("/users")
            .bodyValue(RegisterUserRequest(email = "a@b.com", password = "pass1234"))
            .exchange()
            .expectStatus().isCreated
            .expectBody()
            .jsonPath("$.id").isNotEmpty
    }
}
```

## Running Tests

```bash
./gradlew test                    # all tests
./gradlew test --tests "*.UserUseCaseTest"   # specific class
./gradlew test --info             # verbose output
./gradlew jacocoTestReport        # coverage report
```

## Coverage

Configure JaCoCo in `build.gradle.kts`:

```kotlin
tasks.jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                minimum = "0.90".toBigDecimal()
            }
        }
    }
}
```
