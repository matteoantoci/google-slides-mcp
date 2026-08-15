# Tool modules export name, descriptor, and handler

Each file under `src/tools/` exports the tool name, the ListTools descriptor, and the handler. `executeTool` takes one options object. `serverHandlers` only registers the list. We do this so the 50-line function cap and the 3-parameter cap both pass without local rule overrides.
