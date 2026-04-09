from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Spotify Clone API"
    database_url: str = "sqlite:///./spotify_clone.db"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 120
    jwt_algorithm: str = "HS256"

    @property
    def postgres_url(self) -> str:
        if self.database_url.startswith("postgres://"):
            return self.database_url.replace("postgres://", "postgresql://", 1)
        return self.database_url

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
