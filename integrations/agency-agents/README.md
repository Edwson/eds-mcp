# eds-mcp × The Agency (agency-agents)

This folder makes **eds-mcp** a drop-in specialist for
**[The Agency](https://github.com/msitarzewski/agency-agents)** — Matt Sitarzewski's
open-source (MIT) collection of AI specialist-agent personas for Claude Code, Codex,
Antigravity, Cursor, Gemini CLI, and friends.

The Agency gives an agent a **personality and a workflow**. eds-mcp gives it a
**design-system backend** — tokens, regulated-finance component contracts, scaffolding,
linting, accessibility auditing, jurisdiction coverage, and conformance tests, all over
MCP (or a zero-dependency HTTP API). Put them together and you get an Agency specialist
that builds compliant, token-correct, accessible UI **and can prove it** — because every
move is a real tool call, not a vibe.

> This is **interoperability, not appropriation.** The agent persona here is authored for
> eds-mcp and references The Agency's open format. The Agency's own agent files, scripts,
> and installer remain Matt Sitarzewski's work under the MIT License — see *Credit* below.
> Nothing from that repository is copied or redistributed here.

## What's in here

| File | What it is |
| --- | --- |
| `engineering/regulated-finance-design-engineer.md` | An Agency-format specialist persona wired to eds-mcp's tools. Drop it where your tool keeps its agents (e.g. `~/.claude/agents/`), exactly like any Agency agent. |
| `mcp.example.json` | Example MCP client config that registers eds-mcp as the agent's toolset (works with no `npm publish` via `npx github:Edwson/eds-mcp`). |

## Install (mirrors The Agency's own flow)

1. **Give your agent the tools.** Register eds-mcp as an MCP server in your client (see
   `mcp.example.json`), or run the zero-dependency HTTP API (`npx --package=github:Edwson/eds-mcp eds-mcp-http`).
2. **Give your agent the persona.** Copy the specialist into your agents directory — the
   same place The Agency installs to:
   ```bash
   cp engineering/regulated-finance-design-engineer.md ~/.claude/agents/
   ```
   Or, if you already use The Agency's installer, drop this file into your local agents
   collection and let `./scripts/install.sh` pick it up alongside the others.
3. **Activate it.** "Activate the Regulated-Finance Design-System Engineer and build me a
   KYC step for Enhanced Due Diligence." The persona will call `compliance_check`,
   `compose_flow`, `scaffold_component`, `lint_usage`, and `audit_accessibility` for you.

## Why pair them

- **The Agency** is great at *who is doing the work and how they think*.
- **eds-mcp** is great at *what is correct and how to prove it* (the regulatory anchor, the
  token, the accessibility contract, the conformance test).
- Together: a specialist with a point of view **and** a verifiable backend.

## Credit

[The Agency / `agency-agents`](https://github.com/msitarzewski/agency-agents) is created and
maintained by **Matt Sitarzewski** and is licensed under the **MIT License**. eds-mcp is an
independent project by **Ed Chen**, also MIT-licensed. This integration is an interoperability
adapter authored for eds-mcp; it does not include or modify any code from the agency-agents
repository. If you use The Agency, please star and support the upstream project.
