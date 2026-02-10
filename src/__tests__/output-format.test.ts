/**
 * Tests for output format conversion (text / JSON / TOON) and JMESPath filtering
 *
 * These tests validate the post-processing logic in handleToolCall() that
 * converts handler responses into the requested output format.
 */

import { jest } from '@jest/globals';
import type { ToolResponse } from '../handlers/types.js';

// Mock the handlers module — must be before import
jest.mock('../handlers/index.js', () => ({
  toolHandlers: {
    bb_test_tool: jest.fn(),
  },
}));

// Mock @toon-format/toon (ESM package — needs transformation override)
jest.mock('@toon-format/toon', () => ({
  encode: (data: unknown) => {
    // Simplified TOON: for arrays produce header + rows, for objects key:value
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      const keys = Object.keys(data[0] as Record<string, unknown>);
      const header = `[${data.length}]{${keys.join(',')}}:`;
      const rows = data
        .map(item => {
          const row = item as Record<string, unknown>;
          return '  ' + keys.map(k => String(row[k])).join(',');
        })
        .join('\n');
      return header + '\n' + rows;
    }
    if (data && typeof data === 'object') {
      return Object.entries(data as Record<string, unknown>)
        .map(([k, v]) => `${k}: ${String(v)}`)
        .join('\n');
    }
    return String(data);
  },
}));

// Import after mock setup
import { handleToolCall } from '../tools.js';
import { toolHandlers } from '../handlers/index.js';

const mockHandler = toolHandlers.bb_test_tool as jest.MockedFunction<
  (args: unknown) => Promise<ToolResponse>
>;

/**
 * Helper to build a CallToolRequest
 */
function makeRequest(
  name: string,
  args: Record<string, unknown>
): {
  method: string;
  params: { name: string; arguments: Record<string, unknown> };
} {
  return {
    method: 'tools/call',
    params: { name, arguments: args },
  };
}

describe('Output Format — handleToolCall post-processing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Default text format', () => {
    it('should return text when no output_format is specified', async () => {
      mockHandler.mockResolvedValue({
        content: [{ type: 'text', text: 'Hello world' }],
        _data: { message: 'Hello world' },
      });

      const result = await handleToolCall(
        makeRequest('bb_test_tool', { workspace: 'ws' }) as never
      );

      expect(result.content[0].text).toBe('Hello world');
      expect(result._data).toBeUndefined();
    });

    it('should strip _data from text responses', async () => {
      mockHandler.mockResolvedValue({
        content: [{ type: 'text', text: 'data here' }],
        _data: { some: 'structured data' },
      });

      const result = await handleToolCall(
        makeRequest('bb_test_tool', { workspace: 'ws' }) as never
      );

      expect(result._data).toBeUndefined();
      expect(result.content[0].text).toBe('data here');
    });

    it('should pass text format explicitly', async () => {
      mockHandler.mockResolvedValue({
        content: [{ type: 'text', text: 'text output' }],
        _data: { key: 'value' },
      });

      const result = await handleToolCall(
        makeRequest('bb_test_tool', {
          workspace: 'ws',
          output_format: 'text',
        }) as never
      );

      expect(result.content[0].text).toBe('text output');
      expect(result._data).toBeUndefined();
    });
  });

  describe('JSON format', () => {
    it('should return JSON when output_format is json', async () => {
      const data = { full_name: 'ws/repo', language: 'TypeScript' };
      mockHandler.mockResolvedValue({
        content: [{ type: 'text', text: 'Repository: ws/repo' }],
        _data: data,
      });

      const result = await handleToolCall(
        makeRequest('bb_test_tool', {
          workspace: 'ws',
          output_format: 'json',
        }) as never
      );

      expect(JSON.parse(result.content[0].text)).toEqual(data);
    });

    it('should pretty-print JSON with 2-space indentation', async () => {
      mockHandler.mockResolvedValue({
        content: [{ type: 'text', text: 'text' }],
        _data: { a: 1 },
      });

      const result = await handleToolCall(
        makeRequest('bb_test_tool', {
          workspace: 'ws',
          output_format: 'json',
        }) as never
      );

      expect(result.content[0].text).toBe('{\n  "a": 1\n}');
    });
  });

  describe('TOON format', () => {
    it('should return TOON when output_format is toon', async () => {
      const data = [
        { name: 'repo-a', language: 'Python' },
        { name: 'repo-b', language: 'TypeScript' },
      ];
      mockHandler.mockResolvedValue({
        content: [{ type: 'text', text: 'Repositories...' }],
        _data: data,
      });

      const result = await handleToolCall(
        makeRequest('bb_test_tool', {
          workspace: 'ws',
          output_format: 'toon',
        }) as never
      );

      const text = result.content[0].text;
      expect(text).toContain('repo-a');
      expect(text).toContain('repo-b');
      expect(text).toContain('Python');
      expect(text).toContain('TypeScript');
    });

    it('should handle single object in TOON format', async () => {
      const data = { name: 'my-repo', private: true };
      mockHandler.mockResolvedValue({
        content: [{ type: 'text', text: 'Repo info' }],
        _data: data,
      });

      const result = await handleToolCall(
        makeRequest('bb_test_tool', {
          workspace: 'ws',
          output_format: 'toon',
        }) as never
      );

      const text = result.content[0].text;
      expect(text).toContain('my-repo');
    });

    it('should produce output for simple data in TOON format', async () => {
      mockHandler.mockResolvedValue({
        content: [{ type: 'text', text: 'text' }],
        _data: { a: 1 },
      });

      const result = await handleToolCall(
        makeRequest('bb_test_tool', {
          workspace: 'ws',
          output_format: 'toon',
        }) as never
      );

      expect(result.content[0].text).toBeTruthy();
    });
  });

  describe('JMESPath filtering', () => {
    it('should filter with JMESPath expression', async () => {
      const data = {
        values: [
          { full_name: 'ws/repo-a', language: 'Python' },
          { full_name: 'ws/repo-b', language: 'TypeScript' },
        ],
        size: 2,
      };
      mockHandler.mockResolvedValue({
        content: [{ type: 'text', text: 'Repos list' }],
        _data: data,
      });

      const result = await handleToolCall(
        makeRequest('bb_test_tool', {
          workspace: 'ws',
          output_format: 'json',
          filter: 'values[].full_name',
        }) as never
      );

      expect(JSON.parse(result.content[0].text)).toEqual([
        'ws/repo-a',
        'ws/repo-b',
      ]);
    });

    it('should filter with object projection', async () => {
      const data = {
        values: [
          { full_name: 'ws/repo-a', language: 'Python', is_private: false },
          {
            full_name: 'ws/repo-b',
            language: 'TypeScript',
            is_private: true,
          },
        ],
      };
      mockHandler.mockResolvedValue({
        content: [{ type: 'text', text: 'text' }],
        _data: data,
      });

      const result = await handleToolCall(
        makeRequest('bb_test_tool', {
          workspace: 'ws',
          output_format: 'json',
          filter: 'values[].{name: full_name, lang: language}',
        }) as never
      );

      expect(JSON.parse(result.content[0].text)).toEqual([
        { name: 'ws/repo-a', lang: 'Python' },
        { name: 'ws/repo-b', lang: 'TypeScript' },
      ]);
    });

    it('should apply JMESPath filter then convert to TOON', async () => {
      const data = {
        values: [
          { full_name: 'ws/repo-a', language: 'Python' },
          { full_name: 'ws/repo-b', language: 'TypeScript' },
        ],
      };
      mockHandler.mockResolvedValue({
        content: [{ type: 'text', text: 'text' }],
        _data: data,
      });

      const result = await handleToolCall(
        makeRequest('bb_test_tool', {
          workspace: 'ws',
          output_format: 'toon',
          filter: 'values[].{name: full_name, lang: language}',
        }) as never
      );

      const text = result.content[0].text;
      expect(text).toContain('repo-a');
      expect(text).toContain('repo-b');
    });

    it('should return error for invalid JMESPath expression', async () => {
      mockHandler.mockResolvedValue({
        content: [{ type: 'text', text: 'text' }],
        _data: { values: [] },
      });

      const result = await handleToolCall(
        makeRequest('bb_test_tool', {
          workspace: 'ws',
          output_format: 'json',
          filter: 'invalid[[[expression',
        }) as never
      );

      expect(result.content[0].text).toContain('Error: Invalid JMESPath');
    });
  });

  describe('Edge cases', () => {
    it('should not pass output_format to handler', async () => {
      mockHandler.mockResolvedValue({
        content: [{ type: 'text', text: 'ok' }],
      });

      await handleToolCall(
        makeRequest('bb_test_tool', {
          workspace: 'ws',
          output_format: 'json',
          filter: 'values',
        }) as never
      );

      // Handler should receive args without output_format and filter
      expect(mockHandler).toHaveBeenCalledWith({ workspace: 'ws' });
    });

    it('should warn when structured data unavailable but format requested', async () => {
      mockHandler.mockResolvedValue({
        content: [{ type: 'text', text: 'plain text result' }],
        // No _data field
      });

      const result = await handleToolCall(
        makeRequest('bb_test_tool', {
          workspace: 'ws',
          output_format: 'json',
        }) as never
      );

      expect(result.content[0].text).toContain('no structured data');
      expect(result.content[0].text).toContain('plain text result');
    });

    it('should return error responses as-is regardless of output_format', async () => {
      mockHandler.mockResolvedValue({
        content: [{ type: 'text', text: 'Error: Not found' }],
        isError: true,
      });

      const result = await handleToolCall(
        makeRequest('bb_test_tool', {
          workspace: 'ws',
          output_format: 'json',
        }) as never
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('Error: Not found');
    });

    it('should handle null _data gracefully', async () => {
      mockHandler.mockResolvedValue({
        content: [{ type: 'text', text: 'some text' }],
        _data: null,
      });

      const result = await handleToolCall(
        makeRequest('bb_test_tool', {
          workspace: 'ws',
          output_format: 'json',
        }) as never
      );

      // null _data should trigger the warning path
      expect(result.content[0].text).toContain('no structured data');
    });

    it('should handle handler throwing an error', async () => {
      mockHandler.mockRejectedValue(new Error('API failure'));

      const result = await handleToolCall(
        makeRequest('bb_test_tool', {
          workspace: 'ws',
          output_format: 'json',
        }) as never
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('API failure');
    });

    it('should handle unknown tool', async () => {
      const result = await handleToolCall(
        makeRequest('bb_unknown_tool', { workspace: 'ws' }) as never
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unknown tool');
    });

    it('should apply JMESPath filter with text format and return formatted string', async () => {
      const data = {
        values: [{ name: 'a' }, { name: 'b' }],
      };
      mockHandler.mockResolvedValue({
        content: [{ type: 'text', text: 'text output' }],
        _data: data,
      });

      // text format + filter should still apply filter and return formatted result
      const result = await handleToolCall(
        makeRequest('bb_test_tool', {
          workspace: 'ws',
          output_format: 'text',
          filter: 'values[].name',
        }) as never
      );

      // When filter is used with text format, it still formats the filtered data
      const text = result.content[0].text;
      expect(text).toContain('a');
      expect(text).toContain('b');
    });
  });

  describe('BITBUCKET_DEFAULT_FORMAT env var', () => {
    const originalEnv = process.env.BITBUCKET_DEFAULT_FORMAT;

    afterEach(() => {
      if (originalEnv === undefined) {
        delete process.env.BITBUCKET_DEFAULT_FORMAT;
      } else {
        process.env.BITBUCKET_DEFAULT_FORMAT = originalEnv;
      }
    });

    it('should use env var default when output_format not specified', async () => {
      process.env.BITBUCKET_DEFAULT_FORMAT = 'json';

      const data = { id: 1, name: 'test' };
      mockHandler.mockResolvedValue({
        content: [{ type: 'text', text: 'text output' }],
        _data: data,
      });

      const result = await handleToolCall(
        makeRequest('bb_test_tool', { workspace: 'ws' }) as never
      );

      // Should use JSON since env var is set to json
      expect(result.content[0].text).toContain('"id": 1');
      expect(result.content[0].text).toContain('"name": "test"');
    });

    it('should prefer per-call output_format over env var', async () => {
      process.env.BITBUCKET_DEFAULT_FORMAT = 'json';

      mockHandler.mockResolvedValue({
        content: [{ type: 'text', text: 'plain text output' }],
      });

      const result = await handleToolCall(
        makeRequest('bb_test_tool', {
          workspace: 'ws',
          output_format: 'text',
        }) as never
      );

      // Should use text (per-call) not json (env var)
      expect(result.content[0].text).toBe('plain text output');
    });

    it('should fall back to text when env var is not set', async () => {
      delete process.env.BITBUCKET_DEFAULT_FORMAT;

      mockHandler.mockResolvedValue({
        content: [{ type: 'text', text: 'plain text output' }],
      });

      const result = await handleToolCall(
        makeRequest('bb_test_tool', { workspace: 'ws' }) as never
      );

      expect(result.content[0].text).toBe('plain text output');
    });
  });
});
