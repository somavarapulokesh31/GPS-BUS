from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    DELAY_THRESHOLD_MINUTES: int = 5
    APPROACHING_THRESHOLD_METERS: int = 500

    class Config:
        env_file = ".env"


settings = Settings()
