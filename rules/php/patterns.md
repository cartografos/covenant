# Patterns — PHP / Laravel

Common architectural patterns for PHP services.

## Clean Architecture (Laravel)

```
app/
  Domain/
    User/
      User.php                  ← entity
      UserRepository.php        ← interface
      UserService.php           ← domain service
      UserNotFoundException.php
  Application/
    UseCases/
      RegisterUserUseCase.php
    DTOs/
      RegisterUserRequest.php
  Infrastructure/
    Persistence/
      EloquentUserRepository.php  ← implements UserRepository
    Http/
      ExternalApiClient.php
  Presentation/
    Http/
      Controllers/
        UserController.php
      Requests/
        RegisterUserRequest.php   ← Laravel FormRequest
```

## Repository Pattern

```php
// Domain/User/UserRepository.php
interface UserRepository
{
    public function findById(string $id): ?User;
    public function findByEmail(string $email): ?User;
    public function save(User $user): User;
}

// Infrastructure/Persistence/EloquentUserRepository.php
final class EloquentUserRepository implements UserRepository
{
    public function findById(string $id): ?User
    {
        $model = UserModel::find($id);
        return $model ? UserMapper::toDomain($model) : null;
    }

    public function save(User $user): User
    {
        $model = UserMapper::toModel($user);
        $model->save();
        return UserMapper::toDomain($model);
    }
}
```

## Use Case Pattern

```php
final class RegisterUserUseCase
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly MailerService $mailer,
        private readonly Clock $clock,
    ) {}

    public function execute(RegisterUserRequest $request): User
    {
        if ($this->users->findByEmail($request->email) !== null) {
            throw new UserAlreadyExistsException($request->email);
        }

        $user = User::create(
            email: $request->email,
            passwordHash: bcrypt($request->password),
            createdAt: $this->clock->now(),
        );

        $saved = $this->users->save($user);
        $this->mailer->sendWelcome($saved);

        return $saved;
    }
}
```

## Laravel Controller

```php
final class UserController extends Controller
{
    public function __construct(
        private readonly RegisterUserUseCase $registerUser,
    ) {}

    public function store(RegisterUserHttpRequest $request): JsonResponse
    {
        $user = $this->registerUser->execute(
            new RegisterUserRequest(
                email: $request->validated('email'),
                password: $request->validated('password'),
            )
        );

        return response()->json(UserResource::make($user), 201);
    }
}
```

## Laravel FormRequest (Validation)

```php
final class RegisterUserHttpRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'email'    => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'max:72'],
        ];
    }
}
```

## Dependency Injection (Laravel Service Provider)

```php
final class UserServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(UserRepository::class, EloquentUserRepository::class);
        $this->app->bind(MailerService::class, LaravelMailerService::class);
        $this->app->bind(Clock::class, SystemClock::class);
    }
}
```

## Value Objects

```php
final class Money
{
    public function __construct(
        public readonly int $amountCents,
        public readonly string $currency,
    ) {
        if ($amountCents < 0) {
            throw new \InvalidArgumentException('Amount must not be negative');
        }
    }

    public function add(Money $other): self
    {
        if ($this->currency !== $other->currency) {
            throw new \InvalidArgumentException('Currency mismatch');
        }
        return new self($this->amountCents + $other->amountCents, $this->currency);
    }
}
```

## Exception Hierarchy

```php
// Base domain exception
abstract class DomainException extends \RuntimeException {}

final class UserNotFoundException extends DomainException
{
    public function __construct(string $id)
    {
        parent::__construct("User not found: {$id}");
    }
}

// Handler (app/Exceptions/Handler.php)
public function register(): void
{
    $this->renderable(function (UserNotFoundException $e) {
        return response()->json(['error' => $e->getMessage()], 404);
    });

    $this->renderable(function (UserAlreadyExistsException $e) {
        return response()->json(['error' => $e->getMessage()], 409);
    });
}
```

## Testing

```php
// Feature test (full HTTP stack)
class RegisterUserTest extends TestCase
{
    use RefreshDatabase;

    public function test_registers_user_successfully(): void
    {
        $response = $this->postJson('/api/users', [
            'email'    => 'a@b.com',
            'password' => 'pass1234',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['id', 'email']);

        $this->assertDatabaseHas('users', ['email' => 'a@b.com']);
    }

    public function test_returns_409_when_email_already_taken(): void
    {
        User::factory()->create(['email' => 'a@b.com']);

        $this->postJson('/api/users', ['email' => 'a@b.com', 'password' => 'pass1234'])
            ->assertStatus(409);
    }
}
```
