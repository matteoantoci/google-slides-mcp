# v2 packages, keep the 2025-11-25 era

This server moves to `@modelcontextprotocol/server` and keeps the `2025-11-25` wire on stdio. A `2026-07-28`-only process would drop every host that still sends `initialize`, including default Codex and current Claude products. The package line and the protocol era are separate. MCP authorization stays out of this cutover.
