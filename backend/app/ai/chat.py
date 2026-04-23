from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from app.ai.vector_store import get_vector_store
from app.ai.config import settings

def get_llm():
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        groq_api_key=settings.GROQ_API_KEY,
        temperature=0
    )

async def query_logs(query: str, project_id: str):
    vector_store = get_vector_store()
    
    # Create a retriever filtered by project_id
    retriever = vector_store.as_retriever(
        search_kwargs={"filter": {"project_id": project_id}}
    )
    
    template = """
    You are an AI log analyst for Signalstack. 
    Use the following pieces of retrieved logs to answer the user's question.
    If you don't know the answer, just say that you don't know, don't try to make up an answer.
    
    CRITICAL: 
    1. If the user asks for a graph, chart, or visualization, you MUST provide the data in a structured JSON format inside a code block with the language "json" and a special field "type": "chart".
    
    2. If the user asks for details about SPECIFIC log entries or requests, you MUST provide the data in a structured JSON format inside a code block with the language "json". 
       - If there is only one log, return a single object with "type": "log".
       - If there are MULTIPLE logs, return a JSON ARRAY of objects, each with "type": "log".
    
    Format for "chart":
    ```json
    {{
      "type": "chart",
      "chartType": "bar" | "line" | "pie",
      "title": "Chart Title",
      "data": [
        {{ "name": "label1", "value": 10 }}
      ],
      "description": "A brief description"
    }}
    ```
    
    Format for "log" (single):
    ```json
    {{
      "type": "log",
      "level": "error" | "warn" | "info" | "debug" | "fatal",
      "message": "The log message",
      "timestamp": "ISO timestamp",
      "source": "service name",
      "metadata": {{ "key": "value" }}
    }}
    ```

    Format for "log" (multiple):
    ```json
    [
      {{ "type": "log", ... }},
      {{ "type": "log", ... }}
    ]
    ```
    
    If you are NOT providing a chart or specific log cards, just provide a regular text answer.
    
    Context:
    {context}
    
    Question: {question}
    
    Answer:
    """
    prompt = ChatPromptTemplate.from_template(template)
    llm = get_llm()
    
    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)
    
    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    
    return await rag_chain.ainvoke(query)
