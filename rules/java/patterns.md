# Patterns — Java / Spring Boot

Common architectural patterns for Java services.

## Clean Architecture

```
src/main/java/com/example/
  domain/
    model/          ← entities, value objects (records), domain exceptions
    repository/     ← repository interfaces (no Spring annotations)
    service/        ← domain services
  application/
    usecase/        ← use cases
    dto/            ← request/response records
  infrastructure/
    persistence/    ← Spring Data JPA implementations
    http/           ← RestTemplate / WebClient wrappers
    messaging/      ← Kafka listeners and producers
  presentation/
    rest/           ← Spring MVC @RestController classes
```

## Repository Pattern

```java
// domain/repository/UserRepository.java
public interface UserRepository {
    Optional<User> findById(String id);
    User save(User user);
}

// infrastructure/persistence/JpaUserRepository.java
@Repository
public class JpaUserRepository implements UserRepository {

    private final SpringDataUserRepository spring;

    public JpaUserRepository(SpringDataUserRepository spring) {
        this.spring = spring;
    }

    @Override
    public Optional<User> findById(String id) {
        return spring.findById(id).map(UserEntity::toDomain);
    }

    @Override
    public User save(User user) {
        return spring.save(UserEntity.fromDomain(user)).toDomain();
    }
}
```

## Use Case Pattern

```java
@Component
public class RegisterUserUseCase {

    private final UserRepository users;
    private final MailerService mailer;
    private final Clock clock;

    public RegisterUserUseCase(UserRepository users, MailerService mailer, Clock clock) {
        this.users = users;
        this.mailer = mailer;
        this.clock = clock;
    }

    public User execute(RegisterUserRequest request) {
        users.findByEmail(request.email()).ifPresent(existing -> {
            throw new UserAlreadyExistsException(request.email());
        });

        var user = User.create(request.email(), hashPassword(request.password()), clock.instant());
        var saved = users.save(user);
        mailer.sendWelcome(saved);
        return saved;
    }
}
```

## Spring MVC Controller

```java
@RestController
@RequestMapping("/users")
public class UserController {

    private final RegisterUserUseCase registerUser;

    public UserController(RegisterUserUseCase registerUser) {
        this.registerUser = registerUser;
    }

    @PostMapping
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterUserRequest request) {
        var user = registerUser.execute(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(user));
    }
}
```

## Global Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleUserAlreadyExists(UserAlreadyExistsException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        var errors = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .toList();
        return ResponseEntity.badRequest().body(new ErrorResponse(String.join(", ", errors)));
    }
}
```

## Domain Events

```java
public class User {
    private final List<DomainEvent> events = new ArrayList<>();

    public static User create(String email, String passwordHash, Instant now) {
        var user = new User(UUID.randomUUID().toString(), email, passwordHash, now);
        user.events.add(new UserRegisteredEvent(user.id()));
        return user;
    }

    public List<DomainEvent> pullEvents() {
        var pending = List.copyOf(events);
        events.clear();
        return pending;
    }
}
```

## Testing with Mockito

```java
@ExtendWith(MockitoExtension.class)
class RegisterUserUseCaseTest {

    @Mock UserRepository users;
    @Mock MailerService mailer;
    Clock clock = Clock.fixed(Instant.parse("2024-01-01T00:00:00Z"), ZoneOffset.UTC);

    RegisterUserUseCase useCase;

    @BeforeEach
    void setUp() {
        useCase = new RegisterUserUseCase(users, mailer, clock);
    }

    @Test
    void shouldSaveUserAndSendWelcomeEmail() {
        when(users.findByEmail("a@b.com")).thenReturn(Optional.empty());
        when(users.save(any())).thenAnswer(inv -> inv.getArgument(0));

        useCase.execute(new RegisterUserRequest("a@b.com", "pass1234"));

        verify(mailer, times(1)).sendWelcome(argThat(u -> u.email().equals("a@b.com")));
    }

    @Test
    void shouldThrowWhenEmailAlreadyTaken() {
        when(users.findByEmail("a@b.com")).thenReturn(Optional.of(existingUser()));

        assertThrows(UserAlreadyExistsException.class, () ->
            useCase.execute(new RegisterUserRequest("a@b.com", "pass1234")));
    }
}
```
