#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { google } from 'googleapis';
import { setupToolHandlers } from './serverHandlers.js';
import { checkEnvironmentVariables } from './utils/envCheck.js';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

checkEnvironmentVariables();

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2Client.setCredentials({
  refresh_token: REFRESH_TOKEN,
});
const slides = google.slides({
  version: 'v1',
  auth: oauth2Client,
});

const buildServer = (): McpServer => {
  const server = new McpServer({
    name: 'google-slides-mcp',
    version: '0.1.0',
  });
  setupToolHandlers(server, slides);
  return server;
};

const handle = serveStdio(buildServer);

const shutdown = (): void => {
  handle
    .close()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
console.error('Google Slides MCP server running and connected via stdio.');
