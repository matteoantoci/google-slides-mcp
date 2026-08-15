# Google Slides MCP

An MCP server that exposes Google Slides operations as tools.

## Language

**Tool**:
An MCP operation this server exposes to a client.
_Avoid_: command, endpoint, action

**Tool descriptor**:
The ListTools metadata for one tool: name, description, and input schema.
_Avoid_: tool definition, tool spec, tool schema

**Tool handler**:
The function that performs the Google Slides call for one tool.
_Avoid_: toolFn, executor, implementation

**Batch update request**:
A Google Slides API mutation object. This server does not model its shape.
_Avoid_: request body, patch

**Transport**:
The channel between this process and the host. This server uses stdio only.
_Avoid_: connection, socket, stream

**Protocol era**:
The MCP wire revision this process speaks. This server speaks `2025-11-25`.
_Avoid_: MCP version, v2, spec version

**Package line**:
The TypeScript SDK major line this repo depends on. This server uses the v2 packages and still speaks the `2025-11-25` protocol era.
_Avoid_: SDK version, MCP version

**Google credential**:
The Google Slides refresh token this process loads from the environment at start.
_Avoid_: OAuth, MCP authorization, login

**MCP authorization**:
Host sign-in to a remote MCP server over HTTP. This server does not use it.
_Avoid_: Google credential, Google OAuth, /mcp
