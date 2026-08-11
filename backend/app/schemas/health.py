from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    environment: str
    database_connected: bool
