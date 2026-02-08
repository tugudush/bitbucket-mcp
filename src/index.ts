#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { initializeConfig } from './config.js';
import { getToolDefinitions, handleToolCall } from './tools.js';
import { VERSION } from './version.js';

/**
 * Bitbucket MCP Server
 * A read-only Model Context Protocol server for Bitbucket API access
 */

// Initialize configuration
initializeConfig();

// Create server instance
// Using low-level Server (not McpServer) for advanced handler registry pattern with 38+ tools
const server = new Server(
  {
    name: 'bitbucket-mcp-server',
    version: VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool definitions handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: getToolDefinitions(),
  };
});

// Register tool execution handler
server.setRequestHandler(CallToolRequestSchema, async request => {
  return await handleToolCall(request);
});

// Start the server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Bitbucket MCP Server running on stdio');
  console.error(
    'Note: Set BITBUCKET_API_TOKEN+BITBUCKET_EMAIL for authenticated requests'
  );
}

runServer().catch(error => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});
