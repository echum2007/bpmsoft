"""
Batch flush: extract context from selected JSONL transcripts,
call Claude to summarize each session, write to dated daily logs.

Usage: uv run python scripts/batch_flush.py
"""

import asyncio
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# Recursion guard
os.environ["CLAUDE_INVOKED_BY"] = "memory_flush"

ROOT = Path(__file__).resolve().parent.parent
DAILY_DIR = ROOT / "daily"
SCRIPTS_DIR = ROOT / "scripts"
PROJ_DIR = Path("C:/Users/echum/.claude/projects/c--Users-echum-Documents-BPMsoft")

MAX_TURNS = 30
MAX_CONTEXT_CHARS = 15_000

SELECTED = [
    ("5af71ac1", "2026-04-06"),
    ("0e909dcb", "2026-04-06"),
    ("b88d6a57", "2026-04-06"),
    ("5a49eebb", "2026-04-07"),
    ("6eb750f1", "2026-04-07"),
    ("cc83a798", "2026-04-08"),
    ("9f051b14", "2026-04-08"),
    ("5a6164c7", "2026-04-08"),
    ("3ce7a7c9", "2026-04-09"),
    ("dcc3429f", "2026-04-10"),
    ("1123f49c", "2026-04-11"),
    ("ded5dcd6", "2026-04-11"),
    ("11545c37", "2026-04-11"),
    ("a6bc19ca", "2026-04-11"),
    ("3553f68d", "2026-04-11"),
    ("48e6d055", "2026-04-12"),
    ("f1fa9f17", "2026-04-12"),
    ("d8411c8e", "2026-04-12"),
    ("ffa57050", "2026-04-13"),
    ("f8b29840", "2026-04-13"),
    ("21e5095d", "2026-04-14"),
    ("6861cbb1", "2026-04-15"),
]

FLUSH_PROMPT = """Review the conversation context below and respond with a concise summary
of important items that should be preserved in the daily log.
Do NOT use any tools — just return plain text.

Format your response as a structured daily log entry with these sections:

**Context:** [One line about what the user was working on]

**Key Exchanges:**
- [Important Q&A or discussions]

**Decisions Made:**
- [Any decisions with rationale]

**Lessons Learned:**
- [Gotchas, patterns, or insights discovered]

**Action Items:**
- [ ] Follow-ups or TODOs mentioned

Skip anything that is:
- Routine tool calls or file reads
- Content that's trivial or obvious
- Trivial back-and-forth or clarification exchanges

Only include sections that have actual content. If nothing is worth saving,
respond with exactly: FLUSH_OK

## Conversation Context

{context}"""


def extract_context(jsonl_path: Path) -> str:
    turns = []
    for line in jsonl_path.read_text(encoding="utf-8", errors="replace").splitlines():
        try:
            e = json.loads(line)
            msg = e.get("message", e)
            if not isinstance(msg, dict):
                continue
            role = msg.get("role", "")
            content = msg.get("content", "")
            if role not in ("user", "assistant"):
                continue
            if isinstance(content, list):
                parts = []
                for b in content:
                    if isinstance(b, dict) and b.get("type") == "text":
                        parts.append(b.get("text", ""))
                content = "\n".join(parts)
            if isinstance(content, str) and content.strip():
                label = "User" if role == "user" else "Assistant"
                turns.append(f"**{label}:** {content.strip()}\n")
        except Exception:
            pass

    recent = turns[-MAX_TURNS:]
    context = "\n".join(recent)
    if len(context) > MAX_CONTEXT_CHARS:
        context = context[-MAX_CONTEXT_CHARS:]
        boundary = context.find("\n**")
        if boundary > 0:
            context = context[boundary + 1:]
    return context


def append_to_daily_log(date: str, content: str, session_id: str) -> None:
    DAILY_DIR.mkdir(parents=True, exist_ok=True)
    log_path = DAILY_DIR / f"{date}.md"

    if not log_path.exists():
        log_path.write_text(
            f"# Daily Log: {date}\n\n## Sessions\n\n",
            encoding="utf-8",
        )

    entry = f"### Session [{session_id[:8]}]\n\n{content}\n\n"
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(entry)


async def call_claude(context: str) -> str:
    from claude_agent_sdk import (
        AssistantMessage, ClaudeAgentOptions, ResultMessage, TextBlock, query,
    )

    prompt = FLUSH_PROMPT.format(context=context)
    response = ""

    async for message in query(
        prompt=prompt,
        options=ClaudeAgentOptions(
            cwd=str(ROOT),
            allowed_tools=[],
            max_turns=2,
        ),
    ):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    response += block.text
        elif isinstance(message, ResultMessage):
            pass

    return response


async def main():
    total = len(SELECTED)
    print(f"Batch flush: {total} sessions\n")

    for i, (sid, date) in enumerate(SELECTED, 1):
        jsonl = PROJ_DIR / f"{sid}.jsonl"
        if not jsonl.exists():
            matches = list(PROJ_DIR.glob(f"{sid}*.jsonl"))
            jsonl = matches[0] if matches else None
        if not jsonl:
            print(f"[{i}/{total}] SKIP {sid} — file not found")
            continue

        print(f"[{i}/{total}] {date} {sid[:8]} ... ", end="", flush=True)
        context = extract_context(jsonl)
        if not context.strip():
            print("SKIP (empty)")
            continue

        try:
            response = await call_claude(context)
        except Exception as e:
            print(f"ERROR: {e}")
            append_to_daily_log(date, f"FLUSH_ERROR: {e}", sid)
            continue

        if "FLUSH_OK" in response:
            print("FLUSH_OK (nothing worth saving)")
            append_to_daily_log(date, "FLUSH_OK — Nothing worth saving", sid)
        else:
            append_to_daily_log(date, response, sid)
            lines = len(response.splitlines())
            print(f"saved ({lines} lines)")

        # Pause between API calls to avoid rate limits
        if i < total:
            await asyncio.sleep(2)

    print(f"\nDone. Daily logs written to: {DAILY_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
