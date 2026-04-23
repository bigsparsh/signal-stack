"""API route definitions."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Project, Log
from app.api.schemas import IngestRequest, IngestResponse, LogResponse, ProjectStatsResponse, ChatRequest, ChatResponse
from app.ai.vector_store import add_logs_to_vector_store
from app.ai.chat import query_logs

router = APIRouter()


def _get_project_by_api_key(api_key: str, db: Session) -> Project:
    """Validate the API key and return the associated project."""
    project = db.query(Project).filter(Project.apiKey == api_key).first()
    if not project:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return project


# ─── Ingest Endpoint ─────────────────────────────────────────────────────────


@router.post("/ingest", response_model=IngestResponse, tags=["Ingestion"])
async def ingest_logs(
    body: IngestRequest,
    x_api_key: str = Header(..., alias="X-API-Key", description="Project API key"),
    db: Session = Depends(get_db),
):
    """
    Ingest a batch of log entries.

    Requires a valid project API key in the `X-API-Key` header.
    """
    project = _get_project_by_api_key(x_api_key, db)

    log_records = []
    for entry in body.logs:
        log_records.append(
            Log(
                id=str(uuid.uuid4()),
                level=entry.level,
                message=entry.message,
                log_metadata=entry.metadata,
                source=entry.source,
                timestamp=entry.timestamp or datetime.now(timezone.utc),
                projectId=project.id,
            )
        )

    db.add_all(log_records)
    db.commit()

    # Add to vector store for AI features
    logs_for_ai = [
        {
            "level": log.level,
            "message": log.message,
            "metadata": log.log_metadata,
            "source": log.source,
            "timestamp": log.timestamp
        }
        for log in log_records
    ]
    await add_logs_to_vector_store(logs_for_ai, project.id)

    return IngestResponse(ingested=len(log_records))


# ─── Query Endpoints ─────────────────────────────────────────────────────────


@router.post("/chat", response_model=ChatResponse, tags=["AI"])
async def ai_chat(
    body: ChatRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
    db: Session = Depends(get_db),
):
    """
    Query logs using natural language.
    """
    project = _get_project_by_api_key(x_api_key, db)
    
    try:
        response = await query_logs(body.message, project.id)
        return ChatResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/logs", response_model=list[LogResponse], tags=["Logs"])
async def get_logs(
    x_api_key: str = Header(..., alias="X-API-Key"),
    level: str | None = Query(None, description="Filter by log level"),
    limit: int = Query(50, ge=1, le=500, description="Number of logs to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db),
):
    """Retrieve logs for a project, with optional filtering."""
    project = _get_project_by_api_key(x_api_key, db)

    query = db.query(Log).filter(Log.projectId == project.id)

    if level:
        query = query.filter(Log.level == level)

    logs = query.order_by(Log.timestamp.desc()).offset(offset).limit(limit).all()
    return logs


# ─── Stats Endpoint ──────────────────────────────────────────────────────────


@router.get("/stats", response_model=ProjectStatsResponse, tags=["Stats"])
async def get_project_stats(
    x_api_key: str = Header(..., alias="X-API-Key"),
    db: Session = Depends(get_db),
):
    """Get aggregated statistics for a project."""
    project = _get_project_by_api_key(x_api_key, db)

    total = db.query(func.count(Log.id)).filter(Log.projectId == project.id).scalar() or 0
    errors = db.query(func.count(Log.id)).filter(
        Log.projectId == project.id,
        Log.level.in_(["error", "fatal"]),
    ).scalar() or 0
    warnings = db.query(func.count(Log.id)).filter(
        Log.projectId == project.id,
        Log.level == "warn",
    ).scalar() or 0

    level_counts = (
        db.query(Log.level, func.count(Log.id))
        .filter(Log.projectId == project.id)
        .group_by(Log.level)
        .all()
    )

    return ProjectStatsResponse(
        totalLogs=total,
        errorCount=errors,
        warnCount=warnings,
        errorRate=round((errors / total * 100), 2) if total > 0 else 0.0,
        levelBreakdown={level: count for level, count in level_counts},
    )
