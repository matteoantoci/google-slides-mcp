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
