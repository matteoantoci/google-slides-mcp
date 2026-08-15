# Unknown at the MCP boundary

`batch_update_presentation` accepts arbitrary Google Slides request objects. We type `requests` and `writeControl` as `z.unknown()`. We do not write a Zod model of `batchUpdate`, and we do not wrap `googleapis` schema types in `z.custom`.
