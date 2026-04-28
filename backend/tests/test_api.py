import pytest
from unittest.mock import AsyncMock, patch

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "signalstack-backend"}

def test_ingest_logs_unauthorized(client):
    payload = {
        "logs": [
            {"level": "info", "message": "Test log", "source": "test"}
        ]
    }
    response = client.post("/api/ingest", json=payload)
    assert response.status_code == 422 # Missing header

    response = client.post("/api/ingest", json=payload, headers={"X-API-Key": "invalid-key"})
    assert response.status_code == 401

@patch("app.api.routes.add_logs_to_vector_store", new_callable=AsyncMock)
def test_ingest_logs_success(mock_add_to_vector_store, client, test_project):
    payload = {
        "logs": [
            {"level": "info", "message": "Test log 1", "source": "test"},
            {"level": "error", "message": "Test log 2", "source": "test", "timestamp": "2023-01-01T00:00:00Z"}
        ]
    }
    response = client.post("/api/ingest", json=payload, headers={"X-API-Key": test_project.apiKey})
    
    assert response.status_code == 200
    assert response.json() == {"ingested": 2, "status": "ok"}
    assert mock_add_to_vector_store.called

def test_get_logs(client, test_project):
    # First ingest some logs
    payload = {
        "logs": [
            {"level": "info", "message": "Log 1", "source": "test"},
            {"level": "error", "message": "Log 2", "source": "test"}
        ]
    }
    with patch("app.api.routes.add_logs_to_vector_store", new_callable=AsyncMock):
        client.post("/api/ingest", json=payload, headers={"X-API-Key": test_project.apiKey})

    response = client.get("/api/logs", headers={"X-API-Key": test_project.apiKey})
    assert response.status_code == 200
    logs = response.json()
    assert len(logs) == 2
    assert logs[0]["level"] in ["info", "error"]

def test_get_stats(client, test_project):
    # Ingest logs with different levels
    payload = {
        "logs": [
            {"level": "info", "message": "Info 1"},
            {"level": "error", "message": "Error 1"},
            {"level": "error", "message": "Error 2"},
            {"level": "warn", "message": "Warn 1"}
        ]
    }
    with patch("app.api.routes.add_logs_to_vector_store", new_callable=AsyncMock):
        client.post("/api/ingest", json=payload, headers={"X-API-Key": test_project.apiKey})

    response = client.get("/api/stats", headers={"X-API-Key": test_project.apiKey})
    assert response.status_code == 200
    stats = response.json()
    assert stats["totalLogs"] == 4
    assert stats["errorCount"] == 2
    assert stats["warnCount"] == 1
    assert stats["errorRate"] == 50.0

@patch("app.api.routes.query_logs", new_callable=AsyncMock)
def test_ai_chat(mock_query_logs, client, test_project):
    mock_query_logs.return_value = "Mocked AI response"
    
    payload = {"message": "Show me error logs"}
    response = client.post("/api/chat", json=payload, headers={"X-API-Key": test_project.apiKey})
    
    assert response.status_code == 200
    assert response.json() == {"response": "Mocked AI response"}
    mock_query_logs.assert_called_with("Show me error logs", test_project.id)
