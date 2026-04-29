# Security — TypeScript / Node.js

Extends `rules/common/security.md`. TypeScript-specific rules take precedence.

## Input Validation

Validate all inputs at the HTTP boundary before they reach business logic:

```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
});

router.post('/users', (req, res, next) => {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() });
  }
  // result.data is now typed and validated
});
```

## SQL Injection (Parameterized Queries)

```typescript
// ✓ Safe — parameterized
const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

// ✗ Never — string interpolation
const user = await db.query(`SELECT * FROM users WHERE id = ${userId}`);
```

## XSS (Cross-Site Scripting)

```typescript
// ✓ Use a library to sanitize HTML
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);

// In React: JSX escapes by default — do NOT use dangerouslySetInnerHTML with user input
// ✗ XSS
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

## JWT Handling

```typescript
import jwt from 'jsonwebtoken';

// ✓ Always verify signature and expiry
const payload = jwt.verify(token, process.env.JWT_SECRET!, {
  algorithms: ['HS256'],
});

// ✗ Never decode without verifying
const payload = jwt.decode(token); // does NOT verify signature
```

## Password Hashing

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

// Hash
const hash = await bcrypt.hash(plaintext, SALT_ROUNDS);

// Verify
const isValid = await bcrypt.compare(plaintext, hash);
```

Never use MD5, SHA-1, or unsalted SHA-256 for password storage.

## Sensitive Data in Logs

```typescript
// ✓ Log sanitized representation
logger.info({ userId: user.id, email: user.email }, 'User registered');

// ✗ Never log passwords, tokens, or full PII
logger.info({ user }, 'User registered'); // may expose password field
```

Use a logger with redaction support (Pino `redact` option) to automatically strip sensitive fields.

## Dependency Scanning

```bash
# npm
npm audit --audit-level=high

# pnpm
pnpm audit --audit-level high

# yarn
yarn npm audit
```

Run in CI. Address all HIGH and CRITICAL vulnerabilities before merging.

## CORS

```typescript
import cors from 'cors';

// ✓ Explicit allow-list
app.use(cors({
  origin: ['https://app.example.com', 'https://admin.example.com'],
  credentials: true,
}));

// ✗ Never allow all origins in production
app.use(cors({ origin: '*' }));
```

## Rate Limiting

Apply rate limiting to all public-facing endpoints:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);
```

## HTTPS / TLS

- Always redirect HTTP to HTTPS in production
- Set `Strict-Transport-Security` header with at least 1-year max-age
- Use `helmet` middleware for secure HTTP headers by default
