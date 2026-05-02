# Security — JavaScript / Node.js

Extends `rules/common/security.md`. JavaScript-specific rules take precedence.

## Input Validation

Validate all inputs at the HTTP boundary before they reach business logic:

```javascript
const Joi = require('joi');

const createUserSchema = Joi.object({
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(8).max(72).required(),
});

router.post('/users', (req, res, next) => {
  const { error, value } = createUserSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ errors: error.details });
  }
  // value is now validated
  next();
});
```

Alternatives: `zod`, `ajv`, `express-validator`. Match what the project already uses.

## SQL Injection (Parameterized Queries)

```javascript
// Safe — parameterized
const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

// Never — string interpolation
const user = await db.query(`SELECT * FROM users WHERE id = ${userId}`);
```

## XSS (Cross-Site Scripting)

```javascript
// Use a library to sanitize HTML
const DOMPurify = require('dompurify');
const clean = DOMPurify.sanitize(userInput);

// In server-rendered templates: always escape output
// Most template engines (EJS, Handlebars, Pug) escape by default — do NOT use unescaped output with user input
// EJS: use <%= %> (escaped), never <%- %> (unescaped) for user data
```

## Prototype Pollution

```javascript
// Never merge user input into objects without validation
// Dangerous — pollutes prototype chain
Object.assign(config, req.body);

// Safe — create from null prototype
const safeObj = Object.create(null);
Object.assign(safeObj, req.body);

// Safe — validate keys before merging
const ALLOWED_KEYS = new Set(['name', 'email']);
for (const [key, val] of Object.entries(req.body)) {
  if (ALLOWED_KEYS.has(key)) safeObj[key] = val;
}

// Block __proto__ and constructor.prototype
function isSafeKey(key) {
  return key !== '__proto__' && key !== 'constructor' && key !== 'prototype';
}
```

## JWT Handling

```javascript
const jwt = require('jsonwebtoken');

// Always verify signature and expiry
const payload = jwt.verify(token, process.env.JWT_SECRET, {
  algorithms: ['HS256'],
});

// Never decode without verifying
const payload = jwt.decode(token); // does NOT verify signature
```

## Password Hashing

```javascript
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

// Hash
const hash = await bcrypt.hash(plaintext, SALT_ROUNDS);

// Verify
const isValid = await bcrypt.compare(plaintext, hash);
```

Never use MD5, SHA-1, or unsalted SHA-256 for password storage.

## Sensitive Data in Logs

```javascript
// Log sanitized representation
logger.info({ userId: user.id, email: user.email }, 'User registered');

// Never log passwords, tokens, or full PII
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

```javascript
const cors = require('cors');

// Explicit allow-list
app.use(cors({
  origin: ['https://app.example.com', 'https://admin.example.com'],
  credentials: true,
}));

// Never allow all origins in production
app.use(cors({ origin: '*' }));
```

## Rate Limiting

Apply rate limiting to all public-facing endpoints:

```javascript
const rateLimit = require('express-rate-limit');

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
