# Testing — PHP

Extends `rules/common/testing.md`. PHP-specific rules take precedence.

## Stack

- **PHPUnit 11+** — standard test runner
- **Pest** — expressive test syntax on top of PHPUnit (check `composer.json` for which is in use)
- **Mockery** — mocking library (or PHPUnit built-in mocks)
- **Laravel** — `RefreshDatabase`, `TestCase`, HTTP test helpers

## File Placement

```
tests/
  Unit/             ← pure unit tests, no framework, no DB
    Domain/
      UserTest.php
    Application/
      RegisterUserUseCaseTest.php
  Feature/          ← HTTP integration tests with DB
    UserControllerTest.php
```

## PHPUnit Structure

```php
<?php

declare(strict_types=1);

namespace Tests\Unit\Application;

use PHPUnit\Framework\TestCase;

final class RegisterUserUseCaseTest extends TestCase
{
    private InMemoryUserRepository $users;
    private FakeMailer $mailer;
    private RegisterUserUseCase $useCase;

    protected function setUp(): void
    {
        $this->users   = new InMemoryUserRepository();
        $this->mailer  = new FakeMailer();
        $this->useCase = new RegisterUserUseCase($this->users, $this->mailer, new FakeClock());
    }

    public function test_saves_user_and_sends_welcome_email(): void
    {
        $this->useCase->execute(new RegisterUserRequest('a@b.com', 'pass1234'));

        self::assertCount(1, $this->users->all());
        self::assertCount(1, $this->mailer->sentEmails());
        self::assertSame('a@b.com', $this->mailer->sentEmails()[0]->to);
    }

    public function test_throws_when_email_already_taken(): void
    {
        $this->users->save(User::create('a@b.com', 'hash', new \DateTimeImmutable()));

        $this->expectException(UserAlreadyExistsException::class);
        $this->useCase->execute(new RegisterUserRequest('a@b.com', 'pass1234'));
    }
}
```

## Pest Structure

```php
<?php

declare(strict_types=1);

beforeEach(function () {
    $this->users  = new InMemoryUserRepository();
    $this->mailer = new FakeMailer();
    $this->useCase = new RegisterUserUseCase($this->users, $this->mailer, new FakeClock());
});

it('saves user and sends welcome email', function () {
    $this->useCase->execute(new RegisterUserRequest('a@b.com', 'pass1234'));

    expect($this->users->all())->toHaveCount(1);
    expect($this->mailer->sentEmails())->toHaveCount(1);
});

it('throws when email is already taken', function () {
    $this->users->save(User::create('a@b.com', 'hash', new \DateTimeImmutable()));

    expect(fn () => $this->useCase->execute(new RegisterUserRequest('a@b.com', 'pass1234')))
        ->toThrow(UserAlreadyExistsException::class);
});
```

## Fakes Over Mocks

Write in-memory fakes for repositories:

```php
final class InMemoryUserRepository implements UserRepository
{
    /** @var array<string, User> */
    private array $store = [];

    public function findById(string $id): ?User
    {
        return $this->store[$id] ?? null;
    }

    public function findByEmail(string $email): ?User
    {
        foreach ($this->store as $user) {
            if ($user->email === $email) return $user;
        }
        return null;
    }

    public function save(User $user): User
    {
        $this->store[$user->id] = $user;
        return $user;
    }

    /** @return User[] */
    public function all(): array
    {
        return array_values($this->store);
    }
}
```

## Laravel Feature Tests

```php
final class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_post_users_returns_201(): void
    {
        $response = $this->postJson('/api/users', [
            'email'    => 'a@b.com',
            'password' => 'pass1234',
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['id', 'email', 'created_at']);
    }

    public function test_returns_422_for_invalid_email(): void
    {
        $this->postJson('/api/users', ['email' => 'not-an-email', 'password' => 'pass1234'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }
}
```

## Data Providers (PHPUnit)

```php
#[\PHPUnit\Framework\Attributes\DataProvider('passwordProvider')]
public function test_validates_password(string $password, bool $valid): void
{
    self::assertSame($valid, PasswordValidator::validate($password)->isValid());
}

public static function passwordProvider(): array
{
    return [
        'too short'     => ['short',          false],
        'exactly 8'     => ['exactly8!',      true],
        'too long'      => [str_repeat('a', 73), false],
        'valid'         => ['validpass123',   true],
    ];
}
```

## Running Tests

```bash
./vendor/bin/phpunit                            # all tests
./vendor/bin/phpunit tests/Unit/               # unit tests only
./vendor/bin/phpunit --filter RegisterUser     # by name pattern
./vendor/bin/phpunit --coverage-html coverage/ # HTML coverage report

# Pest
./vendor/bin/pest
./vendor/bin/pest --coverage
```

## Coverage (phpunit.xml)

```xml
<coverage>
  <report>
    <html outputDirectory="coverage"/>
  </report>
</coverage>
<source>
  <include>
    <directory suffix=".php">./app</directory>
  </include>
</source>
```

Target 90% line coverage for new code.
