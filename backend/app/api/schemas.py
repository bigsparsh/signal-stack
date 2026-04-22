"""Pydantic schemas for request/response validation."""

from datetime import datetime
from pydantic import BaseModel, Field


class LogEntry(BaseModel):
    """Schema for a single log entry in an ingest request."""

    level: str = Field(
        ..., description="Log level", pattern="^(info|warn|error|debug|fatal)$"
    )
    message: str = Field(..., min_length=1, description="Log message")
    metadata: str | None = Field(None, description="Optional JSON metadata string")
    source: str | None = Field(None, description="Originating service or module")
    timestamp: datetime | None = Field(None, description="Event timestamp (ISO 8601)")


class IngestRequest(BaseModel):
    """Request body for the /ingest endpoint."""

    logs: list[LogEntry] = Field(..., min_length=1, description="Batch of log entries")


class IngestResponse(BaseModel):
    """Response for a successful ingest."""

    status: str = "ok"
    ingested: int = Field(..., description="Number of logs ingested")


class LogResponse(BaseModel):
    """Response schema for a single log."""

    id: str
    level: str
    message: str
    metadata: str | None = Field(None, alias="log_metadata")
    source: str | None
    timestamp: datetime
    projectId: str

    model_config = {"from_attributes": True, "populate_by_name": True}


class ProjectStatsResponse(BaseModel):
    """Aggregated stats for a project."""

    totalLogs: int
    errorCount: int
    warnCount: int
    errorRate: float
    levelBreakdown: dict[str, int]
