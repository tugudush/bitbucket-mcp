/**
 * Common types for tool handlers
 */

/**
 * Standard response format for all tool handlers
 * Compatible with MCP SDK CallToolResult type
 *
 * The optional `_data` field carries structured API data for output format
 * conversion (JSON, TOON) and JMESPath filtering. It is stripped before
 * the response is sent to the MCP client.
 */
export interface ToolResponse {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
  _data?: unknown;
}

/**
 * Handler function type for tool implementations
 */
export type ToolHandler = (args: unknown) => Promise<ToolResponse>;

/**
 * Create a successful tool response (text only, no structured data)
 */
export function createResponse(text: string): ToolResponse {
  return {
    content: [{ type: 'text', text }],
  };
}

/**
 * Create a successful tool response with structured data for format conversion.
 * The `_data` field enables JSON/TOON output and JMESPath filtering.
 */
export function createDataResponse(text: string, data: unknown): ToolResponse {
  return {
    content: [{ type: 'text', text }],
    _data: data,
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
