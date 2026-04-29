# Testing — Python

Extends `rules/common/testing.md`. Python-specific rules take precedence.

## Test Runner

Use `pytest` — the standard for modern Python projects.

```bash
pip install pytest pytest-asyncio pytest-cov
```

Check `pyproject.toml` or `setup.cfg` for existing configuration.

## File Placement

- `src/users/service.py` → `tests/users/test_service.py` (separate `tests/` tree)
- OR `src/users/test_service.py` (co-located — match project convention)
- Test files are named `test_*.py` or `*_test.py`
- Test functions are named `test_*`

## Configuration (`pyproject.toml`)

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
addopts = "--cov=src --cov-report=term-missing --cov-fail-under=90"

[tool.coverage.run]
branch = true
source = ["src"]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
    "raise NotImplementedError",
]
```

## Running Tests

```bash
pytest                          # all tests
pytest tests/users/             # specific directory
pytest -k "test_register"       # by name pattern
pytest --cov --cov-report=html  # with HTML coverage report
pytest -x                       # stop at first failure
pytest -v                       # verbose output
```

## Fixtures

Use fixtures for setup and teardown — not `setUp`/`tearDown` classes:

```python
import pytest
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

@pytest.fixture
def user_repo() -> InMemoryUserRepository:
    return InMemoryUserRepository()

@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSession(engine) as session:
        yield session
    await engine.dispose()

@pytest.fixture
def use_case(user_repo: InMemoryUserRepository) -> RegisterUserUseCase:
    return RegisterUserUseCase(user_repo, FakeMailer(), FakeClock())
```

## Parametrize

```python
@pytest.mark.parametrize("password,valid", [
    ("short", False),
    ("exactly8!", True),
    ("a" * 73, False),   # over max length
    ("valid_pass123", True),
])
def test_password_validation(password: str, valid: bool) -> None:
    result = validate_password(password)
    assert result.is_valid == valid
```

## Async Tests

```python
import pytest

# With asyncio_mode = "auto" in pyproject.toml — no decorator needed
async def test_register_user(use_case: RegisterUserUseCase) -> None:
    user = await use_case.execute(RegisterUserRequest(email="a@b.com", password="pass1234"))
    assert user.id is not None

# Without auto mode
@pytest.mark.asyncio
async def test_register_user(use_case: RegisterUserUseCase) -> None:
    ...
```

## Mocking

Use `unittest.mock` or `pytest-mock`. Mock only external I/O:

```python
from unittest.mock import AsyncMock, MagicMock

def test_sends_welcome_email(monkeypatch: pytest.MonkeyPatch) -> None:
    mailer = AsyncMock()
    use_case = RegisterUserUseCase(InMemoryUserRepository(), mailer, FakeClock())

    await use_case.execute(RegisterUserRequest(email="a@b.com", password="pass1234"))

    mailer.send_welcome.assert_called_once()
    call_args = mailer.send_welcome.call_args[0][0]
    assert call_args.email == "a@b.com"
```

Prefer `InMemory*` fakes over `MagicMock` for repository dependencies.

## Exception Testing

```python
import pytest

async def test_raises_when_email_taken(use_case: RegisterUserUseCase) -> None:
    await use_case.execute(RegisterUserRequest(email="a@b.com", password="pass1234"))

    with pytest.raises(UserAlreadyExistsError) as exc_info:
        await use_case.execute(RegisterUserRequest(email="a@b.com", password="pass1234"))

    assert exc_info.value.email == "a@b.com"
```

## Do Not

- Do not use `unittest.TestCase` classes in new tests — use plain functions with fixtures
- Do not use `time.sleep` — use `freezegun` or `FakeClock` for time-dependent tests
- Do not mock internal functions in the same module — test through the public interface
- Do not use `MagicMock` for domain repositories — write an `InMemory*` implementation instead
