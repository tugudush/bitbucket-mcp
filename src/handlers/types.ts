/**
 * Common types for tool handlers
 */

/**
 * Standard response format for all tool handlers
 * Compatible with MCP SDK CallToolResult type
 */
export interface ToolResponse {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * Handler function type for tool implementations
 */
export type ToolHandler = (args: unknown) => Promise<ToolResponse>;

/**
 * Create a successful tool response
 */
export function createResponse(text: string): ToolResponse {
  return {
    content: [{ type: 'text', text }],
  };
}

/**
 * Create an error tool response
 */
export function createErrorResponse(message: string): ToolResponse {
  return {
    content: [{ type: 'text', text: `Error: ${message}` }],
    isError: true,
  };
}
