from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    GOOGLE_API_KEY: Optional[str] = None
    GROQ_API_KEY: str
    CHROMA_PATH: str = "chroma_db"
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
