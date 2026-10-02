# Resend MCP connection

The development environment has an authenticated connection to `https://mcp.resend.com/mcp`, configured under `[mcp_servers.resend]` in the user Codex configuration. Codex manages OAuth credentials; no credentials were copied into the repository.

Authenticated MCP calls verified the Sanbay Fusion domain and managed its templates. When this IDE session does not expose newly configured MCP tools, the local helper at `C:\Users\EliteHp\.codex\tmp\resend-mcp-client.mjs` uses Codex app-server RPC (`mcpServerStatus/list` and `mcpServer/tool/call`) directly. It does not run model turns or delegated agents.

See [the transactional email report](transactional-email.md) for the current sender configuration, all template/event mappings, durable delivery architecture, deployment and test results. The earlier seven-template setup was extended to 25 templates on 2 October 2026. The old generic account sender and missing staff mailbox were corrected; Receiving remains disabled and iCloud MX records remain unchanged.
