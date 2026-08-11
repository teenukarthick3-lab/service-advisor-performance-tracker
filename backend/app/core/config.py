"""
Centralized application configuration.

All environment-dependent values (DB connection, CORS, upload limits) are
read here and nowhere else, so there is exactly one place to change when
moving from local dev -> staging -> production (e.g. swapping SQLite for
Postgres just means changing DATABASE_URL, no code changes elsewhere).
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "Service Advisor Performance Tracker API"
    environment: str = "development"

    # SQLite for local/dev. Swappable to Postgres via env var only —
    # SQLAlchemy's engine creation abstracts the rest (see database.py).
    database_url: str = "sqlite:///./sa_tracker.db"

    # Frontend origins allowed to call this API.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    max_upload_mb: int = 20

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached so Settings() isn't re-parsed from the environment on every call."""
    return Settings()
