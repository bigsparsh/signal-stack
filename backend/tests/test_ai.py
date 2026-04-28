import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from app.ai.vector_store import add_logs_to_vector_store
from app.ai.chat import query_logs
from langchain_core.messages import AIMessage

@pytest.mark.asyncio
@patch("app.ai.vector_store.get_vector_store")
async def test_add_logs_to_vector_store(mock_get_vector_store):
    mock_vs = MagicMock()
    mock_get_vector_store.return_value = mock_vs
    
    logs = [
        {"level": "info", "message": "Test message", "source": "test", "timestamp": "2023-01-01", "metadata": "{}"}
    ]
    await add_logs_to_vector_store(logs, "test-project")
    
    assert mock_vs.add_documents.called
    args, _ = mock_vs.add_documents.call_args
    docs = args[0]
    assert len(docs) == 1
    assert docs[0].metadata["project_id"] == "test-project"
    assert "Test message" in docs[0].page_content

@pytest.mark.asyncio
@patch("app.ai.chat.get_llm")
@patch("app.ai.chat.get_vector_store")
async def test_query_logs(mock_get_vs, mock_get_llm):
    # Mock LLM
    mock_llm = MagicMock()
    # It needs to behave like a Runnable
    mock_llm.ainvoke = AsyncMock(return_value=AIMessage(content="AI Response"))
    # Mock __or__ to return itself or a mock chain
    mock_llm.__or__ = MagicMock(side_effect=lambda x: mock_llm)
    
    mock_get_llm.return_value = mock_llm
    
    # Mock Vector Store / Retriever
    mock_vs = MagicMock()
    mock_retriever = MagicMock()
    mock_retriever.ainvoke = AsyncMock(return_value=[])
    # Mock __or__ for retriever too
    mock_retriever.__or__ = MagicMock(side_effect=lambda x: mock_retriever)
    
    mock_vs.as_retriever.return_value = mock_retriever
    mock_get_vs.return_value = mock_vs
    
    # This is still a bit fragile because of how LangChain's | operator works.
    # Let's try a different approach: mock the whole chain creation.
    
    with patch("langchain_core.runnables.RunnableSequence.ainvoke", new_callable=AsyncMock) as mock_chain_invoke:
        mock_chain_invoke.return_value = "AI Response"
        response = await query_logs("What happened?", "p1")
        assert response == "AI Response"
