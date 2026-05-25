from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

def run_agent_step(task: str, context: dict) -> dict:
    """
    Simulates a primary agent reasoning step.
    Outputs Thought/Action traces.
    """
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.7)
    
    prompt = PromptTemplate(
        template="You are an AI assistant. Given this task: {task} and context: {context}\nProvide your next thought and action in JSON format with keys 'thought' and 'action'.",
        input_variables=["task", "context"]
    )
    
    chain = prompt | llm
    try:
        response = chain.invoke({"task": task, "context": context})
        # Assuming the LLM returns JSON text directly or we extract it
        # For simplicity in this demo, just storing raw text
        return {"thought": "Processing...", "action": response.content}
    except Exception as e:
        return {"error": str(e)}
