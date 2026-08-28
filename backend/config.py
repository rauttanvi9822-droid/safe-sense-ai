"""
SafeSense AI — Backend Configuration
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "SafeSense AI"
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = "postgresql://safesense:safesense@localhost:5432/safesense_db"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # AI/ML
    AI_SERVICE_URL: Optional[str] = None  # Internal microservice URL if separate
    OPENAI_API_KEY: Optional[str] = None  # Optional — used for enhanced NLP
    SPEECH_API_KEY: Optional[str] = None  # Optional — cloud STT service

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # Security
    BCRYPT_ROUNDS: int = 12

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
