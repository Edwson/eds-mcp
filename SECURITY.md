# Security Policy

## Supported versions
The latest minor release on `main` is supported.

## Reporting a vulnerability
Email **ed@edwson.com** with details and a reproduction. Please do not open a public issue for a
vulnerability. Expect an acknowledgement within 3 business days.

## Threat model notes
- The server is **read + generate only**: it serves design-system contracts and produces code skeletons.
  It does not execute consumer code, write to the consumer's filesystem, or make network calls.
- It speaks MCP over **stdio**; it opens no ports.
- Inputs are validated by zod schemas at the tool boundary; failures return `isError: true`, never a crash.
