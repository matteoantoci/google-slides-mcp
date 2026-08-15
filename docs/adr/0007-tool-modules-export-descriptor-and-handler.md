# Tool modules export name, descriptor, and handler

Each file under `src/tools/` exports the tool name, the ListTools descriptor, the Zod schema, and a handler. The handler returns the payload. `serverHandlers` wraps JSON text and Google API errors at register time. We do this so tool files stay on the Google call.
