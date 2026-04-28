import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.db.database import Base, get_db
from main import app
import os

# Use a separate SQLite database file for testing
TEST_DATABASE_URL = "sqlite:///./test_signalstack.db"

@pytest.fixture(scope="session")
def engine():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    yield engine
    # Cleanup after session
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_signalstack.db"):
        os.remove("./test_signalstack.db")

@pytest.fixture(scope="function")
def db_session(engine):
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()
        # Clean up data between tests
        for table in reversed(Base.metadata.sorted_tables):
            session.execute(table.delete())
        session.commit()

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def test_project(db_session):
    from app.db.models import Project
    project = Project(
        id="test-project-id",
        name="Test Project",
        apiKey="test-api-key",
        userId="test-user-id"
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)
    return project
