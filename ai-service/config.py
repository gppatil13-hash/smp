"""
Configuration management for the AI microservice
"""

import os
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""

    # Service
    SERVICE_NAME: str = "School ERP AI"
    VERSION: str = "1.0.0"
    ENV: str = os.getenv("ENV", "development")
    DEBUG: bool = ENV == "development"
    PORT: int = int(os.getenv("PORT", 8001))

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8000",
    ]

    # Backend API
    BACKEND_API_URL: str = os.getenv("BACKEND_API_URL", "http://localhost:3000/api")
    BACKEND_API_KEY: str = os.getenv("BACKEND_API_KEY", "")

    # ML Models
    MODELS_PATH: str = os.getenv("MODELS_PATH", "./models")
    USE_PRETRAINED_MODELS: bool = os.getenv("USE_PRETRAINED_MODELS", "true").lower() == "true"

    # Model parameters
    ADMISSION_SCORE_THRESHOLD: float = 0.5
    FEE_DEFAULT_THRESHOLD: float = 0.6
    MIN_DATA_POINTS_FOR_PREDICTION: int = 10

    # Feature scaling
    FEATURE_SCALING_METHOD: str = "standard"  # "standard" or "minmax"

    # OpenAI (for message generation)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    USE_OPENAI_FOR_MESSAGES: bool = os.getenv("USE_OPENAI_FOR_MESSAGES", "false").lower() == "true"

    class Config:
        """Pydantic config"""
        env_file = ".env"
        case_sensitive = True


settings = Settings()
