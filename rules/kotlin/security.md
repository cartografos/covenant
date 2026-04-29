# Security — Kotlin / Spring Boot

Extends `rules/common/security.md`. Kotlin-specific rules take precedence.

## SQL Injection

Use Spring Data or parameterized queries — never string interpolation in queries:

```kotlin
// ✓ Spring Data — parameterized automatically
interface UserJpaRepository : JpaRepository<UserEntity, String> {
    fun findByEmail(email: String): UserEntity?
}

// ✓ JPQL with named parameters
@Query("SELECT u FROM User u WHERE u.email = :email")
fun findByEmail(@Param("email") email: String): UserEntity?

// ✗ Never — string interpolation in queries
@Query("SELECT u FROM User u WHERE u.email = '${email}'")
fun findByEmail(email: String): UserEntity?
```

## Input Validation

Use Bean Validation on all request DTOs:

```kotlin
data class RegisterUserRequest(
    @field:Email
    @field:NotBlank
    @field:Size(max = 255)
    val email: String,

    @field:NotBlank
    @field:Size(min = 8, max = 72)
    val password: String,
)

// Controller — @Valid triggers validation, MethodArgumentNotValidException on failure
@PostMapping
suspend fun register(@Valid @RequestBody request: RegisterUserRequest): ResponseEntity<UserResponse>
```

## Password Hashing

```kotlin
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder

private val encoder = BCryptPasswordEncoder(12)

fun hashPassword(plain: String): String = encoder.encode(plain)
fun verifyPassword(plain: String, hash: String): Boolean = encoder.matches(plain, hash)
```

Never use `MessageDigest.getInstance("MD5")` or `SHA-1` for passwords.

## JWT

```kotlin
// ✓ Always verify signature — never decode without verification
val claims = Jwts.parserBuilder()
    .setSigningKey(signingKey)
    .build()
    .parseClaimsJws(token)
    .body

// ✗ Never — parses without verification
val claims = Jwts.parser().parseClaimsJwt(token)
```

## Secrets

```kotlin
// ✓ Load from environment at startup — fail fast if missing
@ConfigurationProperties(prefix = "app")
data class AppConfig(
    val jwtSecret: String,          // required — no default
    val databaseUrl: String,        // required — no default
    val redisUrl: String = "redis://localhost:6379",  // has safe default
)

// In application.yml — reference env vars, never hardcode values
app:
  jwt-secret: ${JWT_SECRET}
  database-url: ${DATABASE_URL}
```

## Deep Links and WebView (Android/KMP)

```kotlin
// ✓ Validate deep link host against allow-list
val allowedHosts = setOf("app.example.com", "auth.example.com")
val uri = intent.data ?: return
if (uri.host !in allowedHosts) {
    finish()
    return
}

// ✓ Disable JavaScript in WebView unless explicitly required
webView.settings.javaScriptEnabled = false
webView.settings.allowFileAccess = false
webView.settings.allowContentAccess = false
```

## Coroutine Security — Avoid Credential Leaks

```kotlin
// ✗ Credentials captured in coroutine closure — may be held in memory longer than expected
val password = request.password
launch {
    delay(5000)
    process(password)  // password still in scope
}

// ✓ Process immediately, do not capture credentials in long-lived coroutines
val hash = hashPassword(request.password)
launch { process(hash) }
```

## Dependency Scanning

```bash
./gradlew dependencyCheckAnalyze   # OWASP Dependency-Check
```

Configure in `build.gradle.kts`:

```kotlin
dependencyCheck {
    failBuildOnCVSS = 7.0f   // fail on HIGH and CRITICAL
    suppressionFile = "owasp-suppressions.xml"
}
```

## Spring Security — Fail Closed

```kotlin
@Configuration
@EnableWebSecurity
class SecurityConfig {
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            authorizeHttpRequests {
                authorize("/actuator/health", permitAll)
                authorize("/api/auth/**", permitAll)
                authorize(anyRequest, authenticated)   // deny by default
            }
            csrf { disable() }   // only if using stateless JWT
            sessionManagement { sessionCreationPolicy = SessionCreationPolicy.STATELESS }
        }
        return http.build()
    }
}
```
