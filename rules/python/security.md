# Security — Python

Extends `rules/common/security.md`. Python-specific rules take precedence.

## SQL Injection

Never use string formatting to build queries:

```python
# ✓ Safe — parameterized (SQLAlchemy ORM)
user = await session.get(UserModel, user_id)

# ✓ Safe — parameterized (raw SQL with SQLAlchemy)
result = await session.execute(
    text("SELECT * FROM users WHERE id = :id"),
    {"id": user_id}
)

# ✗ Never — string interpolation
result = await session.execute(f"SELECT * FROM users WHERE id = '{user_id}'")
```

## Input Validation

Use Pydantic for all external input boundaries:

```python
from pydantic import BaseModel, EmailStr, Field, field_validator

class CreateOrderRequest(BaseModel):
    user_id: str = Field(min_length=1, max_length=36)
    amount: float = Field(gt=0, le=100_000)
    currency: str = Field(pattern=r'^[A-Z]{3}$')

    @field_validator('amount')
    @classmethod
    def amount_must_have_two_decimals(cls, v: float) -> float:
        if round(v, 2) != v:
            raise ValueError('amount must have at most 2 decimal places')
        return v
```

## Command Injection

```python
import subprocess

# ✓ Safe — list of arguments, shell=False (default)
result = subprocess.run(["git", "clone", "--", repo_url, dest], capture_output=True)

# ✗ Never — shell=True with user input
result = subprocess.run(f"git clone {user_input}", shell=True)

# ✓ Even better — use library APIs instead of shell
import pygit2
pygit2.clone_repository(repo_url, dest)
```

## Path Traversal

```python
from pathlib import Path

def safe_open(base_dir: str, user_filename: str):
    base = Path(base_dir).resolve()
    target = (base / user_filename).resolve()
    if not str(target).startswith(str(base) + "/"):
        raise ValueError("path traversal detected")
    return target.open()
```

## Secrets and Environment

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str           # required — fails fast if missing
    jwt_secret: str             # required
    redis_url: str = "redis://localhost:6379"  # has default

settings = Settings()  # raises at import time if required vars are missing

# ✗ Never hardcode
JWT_SECRET = "my-secret-key"
```

## Password Hashing

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
```

Never use `hashlib.md5`, `hashlib.sha1`, or unsalted `hashlib.sha256` for passwords.

## Cryptographically Secure Random

```python
import secrets

# ✓ Cryptographically secure
token = secrets.token_urlsafe(32)
otp = secrets.randbelow(1_000_000)

# ✗ Not secure for security-sensitive use
import random
token = str(random.randint(0, 1_000_000))
```

## Dependency Scanning

```bash
pip install pip-audit
pip-audit
```

Also use `safety check` or Dependabot. Address all HIGH and CRITICAL vulnerabilities before merging.

## Deserialization

```python
# ✓ Safe — Pydantic validates and types the input
user = UserRequest.model_validate(json.loads(body))

# ✗ Never — pickle deserializes arbitrary code
user = pickle.loads(untrusted_bytes)

# ✗ Dangerous — yaml.load executes arbitrary Python
data = yaml.load(user_input)          # use yaml.safe_load instead
data = yaml.safe_load(user_input)     # ✓
```

## CORS (FastAPI)

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.example.com"],  # ✓ explicit allow-list
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# ✗ Never in production
allow_origins=["*"]
```
