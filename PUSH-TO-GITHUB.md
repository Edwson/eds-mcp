# Push eds-mcp to github.com/Edwson/eds-mcp

Run these on **your Mac** (they use your own GitHub auth — `gh auth` or your credential helper).
`node_modules/` is already git-ignored, so it won't be uploaded.

## First, sanity-check it's green
```bash
cd ~/Desktop/Ed_Portfolio_BAK/eds-mcp
npm install
npm run validate            # build:manifest + lint + test + test:mcp  → should PASS
```

## Option A — this folder is not yet a clone (fresh history)
Use this if you want this folder to BECOME the repo. If the GitHub repo already has commits,
this replaces them (force), so only do it if that's what you want.
```bash
cd ~/Desktop/Ed_Portfolio_BAK/eds-mcp
git init
git branch -M main
git remote add origin https://github.com/Edwson/eds-mcp.git   # or git@github.com:Edwson/eds-mcp.git
git add .
git commit -m "feat: v1.14.0 — pure core engine + scaffold/lint/discovery tools, MCP prompts, CI, types, e2e test"
git push -u origin main            # add --force ONLY if you intend to overwrite existing history
```

## Option B — you already have a clone elsewhere (preserve history)
Copy the updated files into your existing clone, then commit + push normally.
```bash
# from your existing clone of eds-mcp:
rsync -a --delete --exclude node_modules --exclude .git \
  ~/Desktop/Ed_Portfolio_BAK/eds-mcp/ ./
git add -A
git commit -m "feat: v1.14.0 — core engine + scaffold/lint/discovery, MCP prompts, CI, types, e2e test"
git push
```

## Option C — GitHub CLI, brand new repo
```bash
cd ~/Desktop/Ed_Portfolio_BAK/eds-mcp
gh repo create Edwson/eds-mcp --public --source=. --remote=origin --push
```

After pushing, the GitHub **Actions** tab should show CI green on Node 18 / 20 / 22.
