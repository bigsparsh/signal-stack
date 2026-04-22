"""SQLAlchemy ORM models — aligned with Prisma schema column names."""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.db.database import Base


class Project(Base):
    """A client project that sends logs to Signalstack."""

    __tablename__ = "Project"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    apiKey = Column(String, unique=True, nullable=False, index=True)
    userId = Column(String, nullable=False)
    createdAt = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updatedAt = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    logs = relationship("Log", back_populates="project", cascade="all, delete-orphan")


class Log(Base):
    """An individual log entry ingested from a client backend."""

    __tablename__ = "Log"

    id = Column(String, primary_key=True)
    level = Column(String, nullable=False)  # info | warn | error | debug | fatal
    message = Column(Text, nullable=False)
    log_metadata = Column("metadata", Text, nullable=True)  # JSON string
    source = Column(String, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    projectId = Column(String, ForeignKey("Project.id"), nullable=False)

    project = relationship("Project", back_populates="logs")

    __table_args__ = (
        Index("ix_logs_project_id", "projectId"),
        Index("ix_logs_level", "level"),
        Index("ix_logs_timestamp", "timestamp"),
    )
