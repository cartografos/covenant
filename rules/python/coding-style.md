# Coding Style — Python

Extends `rules/common/coding-style.md`. Python-specific rules take precedence.

## Formatting

- Run `ruff format` or `black` before committing (check `pyproject.toml` or `setup.cfg`)
- Lint with `ruff check` or `flake8`
- Line length: 88 characters (Black default) or as configured in the project
- Type check with `mypy` — `strict = true` in `mypy.ini` or `pyproject.toml`

## Type Annotations

- Annotate all function signatures — parameters and return types
- Use `from __future__ import annotations` for forward references in Python < 3.10
- Prefer built-in generics over `typing` where available (Python 3.9+): `list[str]` not `List[str]`
- Use `Optional[X]` → prefer `X | None` (Python 3.10+)
- Use `TypeVar` and `Generic` for reusable generic containers

```python
def get_user(user_id: str) -> User | None:
    ...

def process_items(items: list[Item]) -> dict[str, int]:
    ...
```

## Naming

- Modules and packages: `snake_case` — `rate_limiter.py`, `user_repository.py`
- Classes: `PascalCase` — `UserRepository`, `RateLimiter`
- Functions and variables: `snake_case` — `get_user_by_id`, `is_rate_limited`
- Constants: `SCREAMING_SNAKE_CASE` — `MAX_RETRIES`, `DEFAULT_TIMEOUT`
- Private names: prefix with single underscore `_private_method` — not double unless name mangling is intentional
- Type aliases: `PascalCase` — `UserId = str`, `UserMap = dict[str, User]`

## Classes

- Use `@dataclass` or Pydantic `BaseModel` for data containers — avoid `__init__` boilerplate
- Use `@property` for computed attributes that derive from internal state
- Prefer composition over inheritance — use protocols for structural typing
- Define `__repr__` for all domain objects so they print meaningfully in logs and tests

```python
from dataclasses import dataclass, field

@dataclass
class RateLimitConfig:
    limit: int = 100
    window_seconds: int = 60
    burst: int = field(default=0)
```

## Error Handling

- Define custom exception classes that inherit from `Exception` (or a domain base class)
- Exception names end in `Error` — `UserNotFoundError`, `RateLimitExceededError`
- Never catch bare `Exception` unless you are at a top-level boundary (e.g., request handler)
- Use `raise ... from err` to chain exceptions and preserve context

```python
class UserNotFoundError(Exception):
    def __init__(self, user_id: str) -> None:
        super().__init__(f"user not found: {user_id}")
        self.user_id = user_id

try:
    user = db.get_user(user_id)
except DatabaseError as err:
    raise UserNotFoundError(user_id) from err
```

## Imports

- Absolute imports only — never use relative imports in application code
- Group: stdlib, third-party, internal (separated by blank lines)
- No wildcard imports: `from module import *`
- Import what you use — no unused imports

## Async

- Use `async def` / `await` consistently — do not mix sync and async code in the same layer
- Use `asyncio.gather` for concurrent coroutines, not sequential `await` loops
- Use `asynccontextmanager` for async context managers
- Never call `asyncio.run()` inside a running event loop

## Configuration

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    port: int = 8080
    database_url: str
    jwt_secret: str

    class Config:
        env_file = ".env"

settings = Settings()  # fails fast if required env vars are missing
```
