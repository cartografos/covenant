# Security — PHP / Laravel

Extends `rules/common/security.md`. PHP-specific rules take precedence.

## SQL Injection

Never use string interpolation in queries. Always use parameterized queries or the ORM:

```php
// ✓ Eloquent ORM — parameterized automatically
$user = User::where('email', $email)->first();

// ✓ Query builder — parameterized
$user = DB::table('users')->where('id', '=', $id)->first();

// ✓ Raw with bindings
$users = DB::select('SELECT * FROM users WHERE id = ?', [$id]);

// ✗ Never — string interpolation
$users = DB::select("SELECT * FROM users WHERE id = '{$id}'");

// ✗ Never — raw without binding
User::whereRaw("email = '{$email}'")->first();
```

## Input Validation (Laravel FormRequest)

Validate all input at the HTTP boundary:

```php
final class RegisterUserHttpRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'email'    => ['required', 'email:rfc,dns', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'max:72'],
            'name'     => ['required', 'string', 'max:100', 'regex:/^[\pL\s\-]+$/u'],
        ];
    }
}
```

Never pass `$request->all()` directly to Eloquent — use `$request->validated()` only.

## Password Hashing

```php
// ✓ Laravel's bcrypt helper (uses bcrypt with cost 12)
$hash = bcrypt($password);

// ✓ Or Hash facade
$hash = Hash::make($password, ['rounds' => 12]);

// ✓ Verification
$valid = Hash::check($plaintext, $hash);

// ✗ Never use MD5, SHA1, or raw SHA256 for passwords
$hash = md5($password);
$hash = sha1($password);
```

## XSS (Cross-Site Scripting)

```php
// ✓ Blade templates escape by default
{{ $user->name }}              // automatically escaped

// ✗ Only use {!! !!} when you have explicitly sanitized the value
{!! $trustedHtml !!}

// ✓ Sanitize before storing user-generated HTML
use Illuminate\Support\HtmlString;
$clean = strip_tags($userInput, ['p', 'b', 'i', 'a']);
```

## CSRF Protection

Laravel enables CSRF protection by default for all web routes. Never disable it:

```php
// ✓ Always include @csrf in forms
<form method="POST">
    @csrf
    ...
</form>

// ✓ API routes use token-based auth instead of CSRF
// routes/api.php routes are excluded from CSRF by default — use sanctum or passport
```

## Secrets and Environment

```php
// .env — never commit this file
APP_KEY=base64:...
DB_PASSWORD=secret
STRIPE_SECRET=sk_live_...

// ✓ Access via config() — never env() directly in application code
// config/services.php
'stripe' => [
    'secret' => env('STRIPE_SECRET'),
],

// In application code
$secret = config('services.stripe.secret');
```

## Mass Assignment Protection

```php
// ✓ Use $fillable — explicit allow-list
class User extends Model
{
    protected $fillable = ['name', 'email'];  // only these can be mass-assigned
}

// ✓ Or use $guarded = [] with validated() only
$user = User::create($request->validated());

// ✗ Never — allows any field to be set via request
protected $guarded = [];
User::create($request->all());  // attacker can set any column
```

## File Uploads

```php
// ✓ Validate file type and size
$request->validate([
    'avatar' => ['required', 'file', 'image', 'max:2048', 'mimes:jpg,jpeg,png,webp'],
]);

// ✓ Store in non-public directory, generate random filename
$path = $request->file('avatar')->store('avatars', 'private');

// ✗ Never use client-provided filename directly
$filename = $request->file('avatar')->getClientOriginalName(); // path traversal risk
```

## Dependency Scanning

```bash
composer audit             # built-in since Composer 2.4
```

Run in CI. Address all HIGH and CRITICAL advisories before merging.

## Command Injection

```php
// ✓ Use escapeshellarg() when shell execution is unavoidable
$escaped = escapeshellarg($userInput);
exec("convert {$escaped} output.pdf");

// ✓ Better — use library APIs instead of shell commands
// Use Imagick, Intervention Image, or Spatie packages instead of exec/shell_exec

// ✗ Never — raw user input in shell command
exec("convert {$filename} output.pdf");
```

## Session Security

```php
// config/session.php — production settings
'secure'    => true,           // HTTPS only
'same_site' => 'lax',         // CSRF protection
'http_only' => true,           // no JS access
'lifetime'  => 120,            // 2-hour session
```
