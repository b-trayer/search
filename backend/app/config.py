from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "library_search"
    postgres_user: str = "library_user"
    postgres_password: str = "library_password"
    
    opensearch_host: str = "localhost"
    opensearch_port: int = 9200
    opensearch_index: str = "library_documents"
    
    redis_host: str = "localhost"
    redis_port: int = 6379
    
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    app_env: str = "development"
    log_level: str = "INFO"
    
    @property
    def database_url(self) -> str:
        return f"postgresql://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
    
    @property
    def opensearch_url(self) -> str:
        return f"http://{self.opensearch_host}:{self.opensearch_port}"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
