"""
SQLAlchemy engine and session management.

Kept deliberately thin: everything here is driven by DATABASE_URL from
config.py, so switching from SQLite to Postgres later requires no changes
in this file — only the connection string and (for SQLite-only) the
check_same_thread connect_arg go away naturally since that arg is ignored
by other dialects... actually it must be conditional, handled below.
"""
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

connect_args = {}
if settings.database_url.startswith("sqlite"):
    # SQLite default disallows using a connection across threads; FastAPI's
    # dependency injection can hand a session to different threads across
    # requests in dev, so this is required for SQLite specifically.
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.database_url, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: yields a DB session and guarantees it's closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
