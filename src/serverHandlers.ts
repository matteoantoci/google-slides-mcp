import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { batchUpdatePresentation } from './tools/batchUpdatePresentation.js';
import { createPresentation } from './tools/createPresentation.js';
import { getPage } from './tools/getPage.js';
import { getPresentation } from './tools/getPresentation.js';
import { summarizePresentation } from './tools/summarizePresentation.js';
import { executeTool, type ToolDescriptor, type ToolModule, type ToolResult } from './utils/toolExecutor.js';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { slides_v1 } from 'googleapis';

type RegisteredTool = {
  name: string;
  descriptor: ToolDescriptor;
  run: (slides: slides_v1.Slides, args: unknown) => Promise<ToolResult>;
};

const register = <T>(tool: ToolModule<T>): RegisteredTool => ({
  name: tool.name,
  descriptor: tool.descriptor,
  run: (slides, args) =>
    executeTool({
      slides,
      name: tool.name,
      args,
      schema: tool.schema,
      handler: tool.handler,
    }),
});

const tools: RegisteredTool[] = [
  register(createPresentation),
  register(getPresentation),
  register(batchUpdatePresentation),
  register(getPage),
  register(summarizePresentation),
];

const unknownTool = (name: string): ToolResult => ({
  content: [{ type: 'text', text: `Unknown tool requested: ${name}` }],
  isError: true,
  errorCode: ErrorCode.MethodNotFound,
});

export const setupToolHandlers = (server: Server, slides: slides_v1.Slides): void => {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((tool) => tool.descriptor),
  }));
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = tools.find((item) => item.name === name);
    if (!tool) {
      return unknownTool(name);
    }
    return tool.run(slides, args);
  });
};
