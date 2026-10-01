import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
   DATABASE_URL: str = os.getenv("DATABASE_URL") 
    APP_NAME: str = "Rake Formation Decision Support System"
    APP_VERSION: str = "1.0.0"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
