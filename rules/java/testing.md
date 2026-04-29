# Testing — Java

Extends `rules/common/testing.md`. Java-specific rules take precedence.

## Stack

- **JUnit 5** (`@Test`, `@BeforeEach`, `@ExtendWith`, `@ParameterizedTest`)
- **Mockito** for mocking external dependencies
- **AssertJ** for fluent assertions — more readable than JUnit's built-ins
- **Spring Boot Test** for integration tests

## Test Naming

Use descriptive method names with `should` prefix:

```java
@Test
void shouldThrowWhenEmailIsAlreadyTaken() { }

@Test
void shouldReturnEmptyWhenUserNotFound() { }
```

## Structure

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository users;
    UserService service;

    @BeforeEach
    void setUp() {
        service = new UserService(users);
    }

    @Test
    void shouldFindUserById() {
        // Arrange
        var user = new User("123", "a@b.com");
        when(users.findById("123")).thenReturn(Optional.of(user));

        // Act
        var result = service.findById("123");

        // Assert
        assertThat(result).isPresent();
        assertThat(result.get().email()).isEqualTo("a@b.com");
    }
}
```

## AssertJ

Prefer AssertJ over JUnit assertions — more readable on failure:

```java
// ✓ AssertJ
assertThat(user.email()).isEqualTo("a@b.com");
assertThat(users).hasSize(3).extracting(User::email).contains("a@b.com");
assertThatThrownBy(() -> service.findById("unknown"))
    .isInstanceOf(UserNotFoundException.class)
    .hasMessageContaining("unknown");

// ✗ JUnit — less readable failure messages
assertEquals("a@b.com", user.email());
```

## Parametrized Tests

```java
@ParameterizedTest
@CsvSource({
    "short,       false",
    "exactly8!,   true",
    "validpass123, true",
})
void shouldValidatePasswordCorrectly(String password, boolean valid) {
    assertThat(PasswordValidator.validate(password).isValid()).isEqualTo(valid);
}
```

## Fakes Over Mocks

Write in-memory fakes for repositories:

```java
class InMemoryUserRepository implements UserRepository {
    private final Map<String, User> store = new HashMap<>();

    @Override
    public Optional<User> findById(String id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public User save(User user) {
        store.put(user.id(), user);
        return user;
    }
}
```

## Spring Boot Integration Tests

```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class UserControllerIntegrationTest {

    @Autowired TestRestTemplate client;

    @Test
    void postUserReturns201WithId() {
        var request = new RegisterUserRequest("a@b.com", "pass1234");
        var response = client.postForEntity("/users", request, UserResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().id()).isNotBlank();
    }
}
```

## Running Tests

```bash
./mvnw test                              # Maven — all tests
./mvnw test -Dtest=UserServiceTest       # specific class
./gradlew test                           # Gradle
./gradlew test --tests "*.UserServiceTest"

# Coverage (JaCoCo)
./mvnw verify                            # generates target/site/jacoco/index.html
./gradlew jacocoTestReport
```

## Coverage Configuration (Maven / JaCoCo)

```xml
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <configuration>
    <rules>
      <rule>
        <limits>
          <limit>
            <counter>LINE</counter>
            <minimum>0.90</minimum>
          </limit>
        </limits>
      </rule>
    </rules>
  </configuration>
</plugin>
```

## Do Not

- Do not use `@SpringBootTest` for unit tests — it starts the full application context and is slow
- Do not use `Mockito.mock()` for in-project types that can be implemented as fakes
- Do not use `Thread.sleep()` in tests — use `Awaitility` for async conditions
