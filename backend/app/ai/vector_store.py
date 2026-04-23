import os
from typing import List
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from app.ai.config import settings

def get_embeddings():
    return GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=settings.GOOGLE_API_KEY
    )

def get_vector_store():
    embeddings = get_embeddings()
    return Chroma(
        persist_directory=settings.CHROMA_PATH,
        embedding_function=embeddings,
        collection_name="logs"
    )

async def add_logs_to_vector_store(logs: List[dict], project_id: str):
    """
    Add log entries to the vector store.
    logs is a list of dicts with keys: level, message, metadata, source, timestamp
    """
    vector_store = get_vector_store()
    
    documents = []
    for log in logs:
        # Create a descriptive text for embedding
        text = f"[{log['level'].upper()}] {log['timestamp']} - {log['source'] or 'unknown'}: {log['message']}"
        if log.get('metadata'):
            text += f" | Metadata: {log['metadata']}"
        
        doc = Document(
            page_content=text,
            metadata={
                "project_id": project_id,
                "level": log['level'],
                "source": log['source'] or "unknown",
                "timestamp": str(log['timestamp'])
            }
        )
        documents.append(doc)
    
    if documents:
        vector_store.add_documents(documents)
