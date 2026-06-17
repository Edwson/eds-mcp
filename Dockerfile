# eds-mcp HTTP API — a zero-dependency image.
# The HTTP API (http.js) uses only Node built-ins + the bundled JSON, so there is
# nothing to npm-install: the image is tiny and has no third-party attack surface.
# Build:  docker build -t eds-mcp .
# Run:    docker run -p 8787:8787 eds-mcp     # then: curl localhost:8787/health
FROM node:20-alpine
WORKDIR /app
COPY core.js loadCore.js http.js tokens.json components.json manifest.json ./
ENV PORT=8787
EXPOSE 8787
USER node
CMD ["node", "http.js"]
