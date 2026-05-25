import os
import json
import structlog
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = structlog.get_logger()

class WatchdogOutput(BaseModel):
    verdict: str = Field(description="PASS or FAIL")
    reasoning: str = Field(description="Reasoning for the verdict")

# Issue 3: Retry mechanism for resilience against external API failures (e.g. 429 Too Many Requests)
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    retry=retry_if_exception_type(Exception),
    before_sleep=lambda retry_state: logger.warning("retrying_llm_call", attempt=retry_state.attempt_number)
)
def _invoke_llm(payload: dict) -> WatchdogOutput:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return WatchdogOutput(verdict="PASS", reasoning="Mock evaluation: No API key provided.")

    llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", temperature=0)
    structured_llm = llm.with_structured_output(WatchdogOutput)
    
    prompt = PromptTemplate(
        template="You are a Watchdog AI. Evaluate the following state for hallucinations or bad logic.\n\nState:\n{payload}\n\nRespond with a verdict of PASS or FAIL, and provide reasoning.",
        input_variables=["payload"]
    )
    
    chain = prompt | structured_llm
    return chain.invoke({"payload": json.dumps(payload)})

def evaluate_commit(payload: dict) -> tuple[str, str]:
    """
    Evaluates a commit payload for hallucinations using Gemini.
    Returns (verdict, reasoning).
    """
    try:
        result = _invoke_llm(payload)
        return result.verdict, result.reasoning
    except Exception as e:
        logger.error("watchdog_llm_failure", error=str(e))
        # Ensure we don't conflate a system failure with a watchdog FAIL
        raise Exception(f"System failure during LLM evaluation: {str(e)}")
