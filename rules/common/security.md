# Security — Common

Rules that apply to all languages. Language-specific rules extend and override these.

## Input Validation

- Validate all input at system boundaries: HTTP handlers, CLI argument parsers, message consumers, file readers
- Reject input that does not conform to the expected schema before passing it to business logic
- Validate length, format, character set, and range for every user-controlled field
- Never trust data from outside the process — including environment variables when they carry user-controlled content

## Authentication and Authorization

- Every route or operation that accesses sensitive data MUST verify identity before acting
- Authorization checks belong in the handler or service layer — never rely solely on middleware for access control
- Fail closed: if an authorization decision cannot be made, deny access
- Never expose which resource does not exist vs. which the caller cannot access (information leakage)

## Secrets and Credentials

- No hardcoded secrets, API keys, passwords, certificates, or tokens in source code
- No secrets in log output, error messages, or response bodies
- Load secrets from environment variables or a secrets manager at startup
- Rotate secrets periodically — design systems to make rotation possible without downtime

## Injection

- Never construct SQL, shell commands, file paths, or external API calls by concatenating user input
- Use parameterized queries for all database interactions
- Use allow-lists, not deny-lists, when validating user-controlled values that influence behavior

## Cryptography

- Do not implement cryptographic algorithms — use well-audited library implementations
- No MD5 or SHA-1 for security purposes — use SHA-256 or stronger
- No ECB mode for symmetric encryption
- Generate random values using a cryptographically secure random source
- Hashed passwords MUST use a slow algorithm: bcrypt, argon2, or scrypt

## Data Handling

- Log what is necessary for debugging — never log passwords, tokens, full credit card numbers, or other sensitive PII
- Apply data minimization: collect and store only what is needed
- Sensitive fields in structs or responses should be clearly identified (e.g., redaction tags)

## Dependencies

- Add dependencies deliberately — every new dependency is an attack surface
- Pin dependency versions in lockfiles — do not use open version ranges in production
- Run dependency vulnerability scans in CI (govulncheck, npm audit, pip-audit, etc.)

## Error Handling

- Never return internal error details, stack traces, or system paths to external callers
- Map internal errors to generic messages at the API boundary
- Log the full error internally with correlation ID; return only the correlation ID to the caller
