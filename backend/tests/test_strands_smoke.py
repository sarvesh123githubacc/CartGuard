import os
import pytest
from strands import Agent, tool
from strands.models.ollama import OllamaModel


@tool
def calculate_shipping(zip_code: str, weight_lbs: float) -> str:
    """Calculate estimated shipping cost for a package.

    Args:
        zip_code: Delivery postal code
        weight_lbs: Weight of the package in pounds
    """
    return f"Calculated shipping for zip {zip_code} ({weight_lbs} lbs): $5.99"


def test_strands_ollama_agent_smoke():
    """Build a minimal Strands Agent on Ollama with one dummy tool and verify tool invocation."""
    model_name = os.getenv("CARTGUARD_MODEL", "llama3.1:8b")
    ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")

    print(f"\n[Strands Smoke Test] Connecting to Ollama at {ollama_host} with model '{model_name}'...")
    model = OllamaModel(
        host=ollama_host,
        model_id=model_name,
    )

    agent = Agent(
        model=model,
        tools=[calculate_shipping],
        system_prompt=(
            "You are a helpful shopping assistant. "
            "You MUST call the calculate_shipping tool when the user asks for shipping calculation. "
            "Do not answer without invoking the tool."
        ),
    )

    prompt = "Please calculate shipping for zip_code '94105' and weight_lbs 2.5."
    print(f"[Strands Smoke Test] Invoking agent with prompt: '{prompt}'...")
    result = agent(prompt)

    # Search conversation history for recorded tool calls
    tool_calls = []
    for msg in agent.messages:
        content = msg.get("content", []) if isinstance(msg, dict) else getattr(msg, "content", [])
        for block in content:
            if isinstance(block, dict) and "toolUse" in block:
                tool_calls.append(block["toolUse"])
            elif hasattr(block, "tool_use"):
                tool_calls.append(getattr(block, "tool_use"))

    print("\n================ TOOL CALL DETECTED ================")
    for idx, tc in enumerate(tool_calls, start=1):
        print(f"[{idx}] Tool: {tc.get('name') if isinstance(tc, dict) else getattr(tc, 'name', None)}")
        print(f"    Arguments: {tc.get('input') if isinstance(tc, dict) else getattr(tc, 'input', None)}")
        print(f"    ToolUseId: {tc.get('toolUseId') if isinstance(tc, dict) else getattr(tc, 'tool_use_id', None)}")
    print("====================================================\n")

    assert len(tool_calls) > 0, "No tool calls detected in agent conversation history"
    first_tc_name = tool_calls[0].get("name") if isinstance(tool_calls[0], dict) else getattr(tool_calls[0], "name", None)
    assert first_tc_name == "calculate_shipping", f"Expected tool calculate_shipping, got {first_tc_name}"
    print(f"[Strands Smoke Test] SUCCESS: Agent executed tool '{first_tc_name}' successfully.")


if __name__ == "__main__":
    test_strands_ollama_agent_smoke()
