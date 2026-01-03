from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "library_search"
    postgres_user: str = "library_user"
    postgres_password: str = "library_password"

    opensearch_host: str = "localhost"
    opensearch_port: int = 9200
    opensearch_index: str = "library_documents"

    api_host: str = "0.0.0.0"
    api_port: int = 8000

    app_env: str = "development"
    log_level: str = "INFO"

    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    cors_allow_credentials: bool = True
    cors_allow_methods: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    cors_allow_headers: List[str] = ["*"]

    @property
    def cors_origins_list(self) -> List[str]:
        if self.app_env == "development":
            return ["*"]
        return self.cors_origins
    
    @property
    def database_url(self) -> str:
        return f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"

    @property
    def async_database_url(self) -> str:
        return f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
    
    @property
    def opensearch_url(self) -> str:
        return f"http://{self.opensearch_host}:{self.opensearch_port}"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
    )


settings = Settings()
