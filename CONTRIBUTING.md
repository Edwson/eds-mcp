# Contributing to eds-mcp

Thanks for helping. The contract is the product, so the bar is: **a change is not done until the test is green
and the manifest is in sync.**

## Setup
```bash
git clone https://github.com/Edwson/eds-mcp && cd eds-mcp
npm install
npm run validate     # build:manifest + lint + test + test:mcp
```

## The rules that CI enforces
1. **Edit the contract, not the literals.** Tokens live in `tokens.json`; component contracts in
   `components.json`. Never hardcode a value a token already names.
2. **Bump + rebuild on any contract change.** Update `tokens.json` `version` (SemVer), then
   `npm run build:manifest`. The committed `manifest.json` must match — CI fails on drift.
3. **Keep the engine in `core.js`.** `server.js` is a thin MCP adapter; new capability = a pure function in
   `core.js` + a thin tool wrapper + a test. This keeps the MCP tools and the library API identical.
4. **Every component is a full contract:** `purpose, whenToUse, whenNot, props (object), a11y, regulatory[],
   tokens[] (must resolve), dataContract.states (⊆ loading/empty/error/stale), domain`.
5. **Tests must pass:** `npm test` (no SDK) and `npm run test:mcp` (boots the real server).

## Commit style
Conventional-ish: `feat: …`, `fix: …`, `docs: …`, `chore: …`. One logical change per PR.
