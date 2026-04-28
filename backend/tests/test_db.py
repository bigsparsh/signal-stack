import pytest
from app.db.models import Project, Log
from datetime import datetime, timezone

def test_create_project(db_session):
    project = Project(
        id="p1",
        name="Project 1",
        apiKey="key1",
        userId="u1"
    )
    db_session.add(project)
    db_session.commit()
    
    saved_project = db_session.query(Project).filter(Project.id == "p1").first()
    assert saved_project is not None
    assert saved_project.name == "Project 1"
    assert saved_project.apiKey == "key1"

def test_create_log(db_session, test_project):
    log = Log(
        id="l1",
        level="info",
        message="Hello",
        projectId=test_project.id
    )
    db_session.add(log)
    db_session.commit()
    
    saved_log = db_session.query(Log).filter(Log.id == "l1").first()
    assert saved_log is not None
    assert saved_log.message == "Hello"
    assert saved_log.projectId == test_project.id
    assert saved_log.project.name == "Test Project"

def test_project_logs_relationship(db_session, test_project):
    log1 = Log(id="l1", level="info", message="M1", projectId=test_project.id)
    log2 = Log(id="l2", level="error", message="M2", projectId=test_project.id)
    db_session.add_all([log1, log2])
    db_session.commit()
    
    assert len(test_project.logs) == 2
    assert any(l.message == "M1" for l in test_project.logs)
    assert any(l.message == "M2" for l in test_project.logs)

def test_delete_project_cascades_to_logs(db_session, test_project):
    log = Log(id="l1", level="info", message="M1", projectId=test_project.id)
    db_session.add(log)
    db_session.commit()
    
    db_session.delete(test_project)
    db_session.commit()
    
    assert db_session.query(Log).filter(Log.id == "l1").first() is None
