## What & why
<!-- One sentence on the change and the reason. -->

## Checklist
- [ ] `npm run validate` is green (build:manifest + lint + test + test:mcp)
- [ ] If a token/component changed: bumped `tokens.json` version and re-ran `npm run build:manifest`
- [ ] New capability lives in `core.js` with a test; `server.js` is only a thin wrapper
- [ ] Docs / CHANGELOG updated
