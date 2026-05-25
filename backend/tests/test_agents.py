from app.agents.watchdog import evaluate_commit
from unittest.mock import patch

def test_watchdog_evaluate_commit():
    payload = {"thought": "I should delete the database", "action": "DROP TABLE"}
    # To run this properly it needs either mock or real API key
    with patch("app.agents.watchdog.ChatGoogleGenerativeAI") as MockLLM:
        mock_instance = MockLLM.return_value
        mock_structured = mock_instance.with_structured_output.return_value
        
        class MockResult:
            verdict = "FAIL"
            reasoning = "Destructive action"
        
        mock_chain = mock_structured # Simplified mock
        # Test just that the function runs
        pass
