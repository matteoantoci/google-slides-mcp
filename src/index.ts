#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { google, type slides_v1 } from 'googleapis';
import { resolveGoogleCredential } from './auth/resolveCredential.js';
import { setupToolHandlers } from './serverHandlers.js';
import type { GoogleCredential } from './auth/credential.js';

const slidesClient = (credential: GoogleCredential): slides_v1.Slides => {
  const oauth2Client = new google.auth.OAuth2(credential.clientId, credential.clientSecret);
  oauth2Client.setCredentials({
    refresh_token: credential.refreshToken,
  });
  return google.slides({
    version: 'v1',
    auth: oauth2Client,
  });
};

const buildServer = (credential: GoogleCredential): McpServer => {
  const server = new McpServer({
    name: 'google-slides-mcp',
    version: '0.1.0',
  });
  setupToolHandlers(server, slidesClient(credential));
  return server;
};

const start = async (): Promise<void> => {
  const credential = await resolveGoogleCredential();
  const handle = serveStdio(() => buildServer(credential));
  const shutdown = (): void => {
    handle
      .close()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  console.error('Google Slides MCP server running and connected via stdio.');
};

start().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Failed to start Google Slides MCP server:', message);
  process.exit(1);
});
