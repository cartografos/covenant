# Security — Java / Spring Boot

Extends `rules/common/security.md`. Java-specific rules take precedence.

## SQL Injection

```java
// ✓ Spring Data — parameterized automatically
Optional<User> findByEmail(String email);

// ✓ JPQL with named parameters
@Query("SELECT u FROM User u WHERE u.email = :email")
Optional<User> findByEmail(@Param("email") String email);

// ✓ JdbcTemplate — always use ? placeholders
jdbcTemplate.queryForObject(
    "SELECT * FROM users WHERE id = ?",
    userRowMapper, id
);

// ✗ Never — string concatenation in queries
String sql = "SELECT * FROM users WHERE email = '" + email + "'";
jdbcTemplate.queryForObject(sql, userRowMapper);
```

## Input Validation (Bean Validation)

```java
public record RegisterUserRequest(
    @Email @NotBlank @Size(max = 255) String email,
    @NotBlank @Size(min = 8, max = 72) String password
) {}

// Controller — @Valid triggers validation automatically
@PostMapping
public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterUserRequest request) { }
```

## Password Hashing

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
}

// Usage
String hash = passwordEncoder.encode(plaintext);
boolean valid = passwordEncoder.matches(plaintext, hash);
```

Never use `MessageDigest.getInstance("MD5")` or `"SHA-1"` for passwords.

## JWT Verification

```java
// ✓ Always verify signature
Claims claims = Jwts.parserBuilder()
    .setSigningKey(signingKey)
    .build()
    .parseClaimsJws(token)
    .getBody();

// ✗ Never parse without verification
Jwts.parser().parseClaimsJwt(token);  // no signature check
```

## Secrets from Environment

```java
// application.yml — reference env vars, never hardcode
app:
  jwt-secret: ${JWT_SECRET}
  database-url: ${DATABASE_URL}

// ✓ Inject via @Value
@Value("${app.jwt-secret}")
private String jwtSecret;

// ✓ Or via @ConfigurationProperties
@ConfigurationProperties(prefix = "app")
public record AppConfig(String jwtSecret, String databaseUrl) {}
```

## Spring Security — Deny by Default

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/health").permitAll()
            .requestMatchers("/api/auth/**").permitAll()
            .anyRequest().authenticated()            // deny by default
        )
        .csrf(AbstractHttpConfigurer::disable)       // only if stateless JWT
        .sessionManagement(session -> session
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .build();
}
```

## Cryptographically Secure Random

```java
// ✓ Secure — java.security.SecureRandom
SecureRandom random = new SecureRandom();
byte[] token = new byte[32];
random.nextBytes(token);
String tokenHex = HexFormat.of().formatHex(token);

// ✗ Not secure for security-sensitive use
Random random = new Random();  // predictable
```

## Serialization

```java
// ✗ Never deserialize untrusted Java serialization streams
ObjectInputStream ois = new ObjectInputStream(untrustedInput);  // arbitrary code execution

// ✓ Use JSON (Jackson) with schema validation
ObjectMapper mapper = new ObjectMapper();
UserRequest request = mapper.readValue(json, UserRequest.class);
// validate with Bean Validation after deserialization
```

## Dependency Scanning

```bash
# Maven
./mvnw org.owasp:dependency-check-maven:check

# Gradle
./gradlew dependencyCheckAnalyze
```

Configure to fail on CVSS ≥ 7.0 (HIGH and CRITICAL).

## Sensitive Data in Logs

```java
// ✗ Never log raw request bodies or user objects that contain passwords
log.info("Registering user: {}", request);  // may log password field

// ✓ Log only safe identifiers
log.info("Registering user email={}", request.email());
```

Use `@JsonIgnore` or `@ToString.Exclude` (Lombok) on sensitive fields to prevent accidental logging.
