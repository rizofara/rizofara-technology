import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.security_middleware import rate_limiter
from app.db.base import Base
from app.db.session import get_db
from app.seed import seed_initial_admins, seed_initial_pricing

# Satu engine SQLite in-memory bersama untuk seluruh file test
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def reset_test_db():
    """
    Fixture global (conftest.py) yang berjalan otomatis sebelum setiap fungsi test:
    mereset rate limiter, membuat ulang semua tabel di RAM, mengisi seed admin & pricing,
    lalu menghapusnya setelah test selesai.
    """
    rate_limiter.reset()
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_initial_admins(db)
    seed_initial_pricing(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)

