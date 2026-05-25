# CLI integration with backend API and local Ollama chatbot
# Provides commands to run backend actions and an interactive chat mode.

import os
import sys
import click
import requests
from typing import List

# LangChain Ollama integration
from langchain_ollama import OllamaLLM

API_URL = os.getenv("API_URL", "http://localhost:8000")

# Initialize Ollama LLM (default model can be overridden via env)
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
llm = OllamaLLM(model=OLLAMA_MODEL)

@click.group()
def cli():
    """CognitionVCS CLI - interact with backend via HTTP and chat locally."""
    pass

@cli.command()
@click.argument('command')
@click.argument('args', nargs=-1)
def run(command: str, args: List[str]):
    """Execute a command on the backend.
    Example: cvc run "commit" "-m" "Initial commit"
    """
    payload = {"command": command, "args": list(args)}
    try:
        resp = requests.post(f"{API_URL}/cli/execute", json=payload)
        resp.raise_for_status()
        data = resp.json()
        click.echo(data.get('output', 'No output'))
    except Exception as e:
        click.echo(f"Error executing command: {e}", err=True)

@cli.command()
def history():
    """Fetch recent command history from backend"""
    try:
        resp = requests.get(f"{API_URL}/cli/history")
        resp.raise_for_status()
        history = resp.json()
        for item in history:
            ts = item.get('timestamp')
            cmd = item.get('command')
            args = item.get('args') or []
            out = item.get('output')
            click.echo(f"[{ts}] {cmd} {' '.join(args)}\n  → {out}\n")
    except Exception as e:
        click.echo(f"Error fetching history: {e}", err=True)

@cli.command()
def chat():
    """Start an interactive chat with the local Ollama LLM.
    You can also issue special commands prefixed with '/' to interact with the backend.
    Supported slash commands:
      /run <cmd> [args...]   → execute a backend command
      /history                → show command history
      /exit                   → quit chat
    Any other input is sent to the LLM for a natural‑language response.
    """
    click.echo("Starting CognitionVCS chat (type /help for commands)...")
    while True:
        try:
            user_input = click.prompt('You')
        except (KeyboardInterrupt, EOFError):
            click.echo('\nExiting chat.')
            break
        if not user_input:
            continue
        if user_input.startswith('/'):
            parts = user_input[1:].split()
            if not parts:
                continue
            cmd = parts[0]
            if cmd == 'help':
                click.echo('Available slash commands: /run, /history, /exit')
                continue
            if cmd == 'exit':
                click.echo('Goodbye!')
                break
            if cmd == 'run':
                if len(parts) < 2:
                    click.echo('Usage: /run <command> [args...]')
                    continue
                backend_cmd = parts[1]
                backend_args = parts[2:]
                # reuse the run logic
                payload = {"command": backend_cmd, "args": backend_args}
                try:
                    resp = requests.post(f"{API_URL}/cli/execute", json=payload)
                    resp.raise_for_status()
                    data = resp.json()
                    click.echo(data.get('output', 'No output'))
                except Exception as e:
                    click.echo(f"Error executing backend command: {e}", err=True)
                continue
            if cmd == 'history':
                # reuse history logic
                try:
                    resp = requests.get(f"{API_URL}/cli/history")
                    resp.raise_for_status()
                    history = resp.json()
                    for item in history:
                        ts = item.get('timestamp')
                        c = item.get('command')
                        args = item.get('args') or []
                        out = item.get('output')
                        click.echo(f"[{ts}] {c} {' '.join(args)}\n  → {out}\n")
                except Exception as e:
                    click.echo(f"Error fetching history: {e}", err=True)
                continue
            click.echo(f"Unknown slash command: {cmd}")
            continue
        # Normal message -> send to Ollama LLM
        try:
            response = llm.invoke(user_input)
            click.echo(f"Bot: {response}")
        except Exception as e:
            click.echo(f"Error communicating with Ollama: {e}", err=True)

if __name__ == "__main__":
    # If no arguments, show help
    if len(sys.argv) == 1:
        cli(['--help'])
    else:
        cli()