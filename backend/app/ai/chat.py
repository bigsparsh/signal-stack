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
