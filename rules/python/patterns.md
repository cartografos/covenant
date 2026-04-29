# Patterns — Python

Common architectural patterns for Python services (FastAPI / Django).

## Clean Architecture (FastAPI)

```
src/
  domain/         ← entities, value objects, domain errors, repository protocols
  application/    ← use cases, DTOs, application services
  infrastructure/ ← SQLAlchemy repos, HTTP clients, Redis, S3 adapters
  presentation/   ← FastAPI routers, request/response schemas, middleware
  main.py         ← app factory and dependency wiring
```

## Repository Pattern

```python
# domain/repositories.py
from typing import Protocol
from domain.entities import User

class UserRepository(Protocol):
    async def find_by_id(self, user_id: str) -> User | None: ...
    async def save(self, user: User) -> None: ...

# infrastructure/repositories/postgres_user_repository.py
class PostgresUserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find_by_id(self, user_id: str) -> User | None:
        result = await self._session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        row = result.scalar_one_or_none()
        return UserMapper.to_domain(row) if row else None

    async def save(self, user: User) -> None:
        model = UserMapper.to_model(user)
        await self._session.merge(model)
```

## Use Case Pattern

```python
# application/use_cases/register_user.py
from dataclasses import dataclass

@dataclass
class RegisterUserRequest:
    email: str
    password: str

class RegisterUserUseCase:
    def __init__(
        self,
        users: UserRepository,
        mailer: MailerService,
        clock: Clock,
    ) -> None:
        self._users = users
        self._mailer = mailer
        self._clock = clock

    async def execute(self, request: RegisterUserRequest) -> User:
        existing = await self._users.find_by_email(request.email)
        if existing:
            raise UserAlreadyExistsError(request.email)

        user = User.create(
            email=request.email,
            password_hash=hash_password(request.password),
            created_at=self._clock.now(),
        )
        await self._users.save(user)
        await self._mailer.send_welcome(user)
        return user
```

## FastAPI Router Pattern

```python
# presentation/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=UserResponse)
async def register(
    request: RegisterUserRequest,
    use_case: RegisterUserUseCase = Depends(get_register_user_use_case),
) -> UserResponse:
    try:
        user = await use_case.execute(request)
        return UserResponse.from_domain(user)
    except UserAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Email already registered")
```

## Dependency Injection (FastAPI)

```python
# main.py
from fastapi import FastAPI
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    app.state.db = await create_db_pool()
    yield
    # shutdown
    await app.state.db.close()

def get_user_repository(request: Request) -> UserRepository:
    return PostgresUserRepository(request.app.state.db)

def get_register_user_use_case(
    repo: UserRepository = Depends(get_user_repository),
) -> RegisterUserUseCase:
    return RegisterUserUseCase(repo, SystemMailer(), SystemClock())
```

## Domain Entity

```python
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class User:
    id: str
    email: str
    password_hash: str
    created_at: datetime
    _events: list = field(default_factory=list, repr=False, compare=False)

    @classmethod
    def create(cls, email: str, password_hash: str, created_at: datetime) -> "User":
        import uuid
        user = cls(
            id=str(uuid.uuid4()),
            email=email,
            password_hash=password_hash,
            created_at=created_at,
        )
        user._events.append(UserRegisteredEvent(user_id=user.id))
        return user
```

## Pydantic Request/Response Schemas

```python
from pydantic import BaseModel, EmailStr, Field

class RegisterUserRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)

class UserResponse(BaseModel):
    id: str
    email: str
    created_at: datetime

    @classmethod
    def from_domain(cls, user: User) -> "UserResponse":
        return cls(id=user.id, email=user.email, created_at=user.created_at)
```

## Testing Pattern

```python
import pytest
from unittest.mock import AsyncMock

class InMemoryUserRepository:
    def __init__(self) -> None:
        self._store: dict[str, User] = {}

    async def find_by_id(self, user_id: str) -> User | None:
        return self._store.get(user_id)

    async def save(self, user: User) -> None:
        self._store[user.id] = user

@pytest.fixture
def user_repo() -> InMemoryUserRepository:
    return InMemoryUserRepository()

@pytest.fixture
def use_case(user_repo: InMemoryUserRepository) -> RegisterUserUseCase:
    return RegisterUserUseCase(user_repo, FakeMailer(), FakeClock())

@pytest.mark.asyncio
async def test_register_saves_user_and_sends_email(
    use_case: RegisterUserUseCase,
    user_repo: InMemoryUserRepository,
) -> None:
    user = await use_case.execute(RegisterUserRequest(email="a@b.com", password="pass1234"))

    saved = await user_repo.find_by_id(user.id)
    assert saved is not None
    assert saved.email == "a@b.com"
```
