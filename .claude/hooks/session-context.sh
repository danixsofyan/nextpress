#!/bin/sh
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0

source="$(jq -r '.source // "startup"' 2>/dev/null)"

handoff="(missing: create .agents/HANDOFF.md with the sections Current goal, Done (verified), In progress, Next steps, Decisions and constraints, Gotchas, How to verify)"
[ -f .agents/HANDOFF.md ] && handoff="$(cat .agents/HANDOFF.md)"

recent="$(git log --oneline -5 2>/dev/null)"
status="$(git status --short 2>/dev/null | head -20)"

context="SESSION ${source}: you may be a new agent or have lost context. Before doing anything else:
1. Read AGENTS.md and docs/engineering-standard.md completely.
2. Read your persistent memory index and every memory file relevant to this project.
3. Read the handoff below and continue from \"Next steps\". Do not redo finished work and do not re-ask decisions recorded there.
4. Keep .agents/HANDOFF.md current: update it after each milestone and before any long operation, so the next agent can continue.

--- .agents/HANDOFF.md ---
${handoff}

--- git log -5 ---
${recent}

--- git status ---
${status:-clean}"

jq -n --arg ctx "$context" '{hookSpecificOutput: {hookEventName: "SessionStart", additionalContext: $ctx}}'
