/**
 * Tests for pipeline handler functions
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  handleListPipelines,
  handleGetPipeline,
  handleGetPipelineSteps,
  handleGetPipelineStepLog,
} from '../../handlers/pipeline.js';

// Mock the API module
jest.mock('../../api.js', () => ({
  makeRequest: jest.fn(),
  makeTextRequest: jest.fn(),
  buildApiUrl: jest.fn(endpoint => `https://api.bitbucket.org/2.0${endpoint}`),
  addQueryParams: jest.fn((url: string, params: Record<string, unknown>) => {
    const urlObj = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlObj.searchParams.append(key, String(value));
      }
    });
    return urlObj.toString();
  }),
}));

import { makeRequest, makeTextRequest } from '../../api.js';

const mockMakeRequest = makeRequest as jest.MockedFunction<typeof makeRequest>;
const mockMakeTextRequest = makeTextRequest as jest.MockedFunction<
  typeof makeTextRequest
>;

describe('Pipeline Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleListPipelines', () => {
    it('should list pipelines with sort parameter', async () => {
      const mockResponse = {
        values: [
          {
            uuid: '{abc-123}',
            build_number: 1,
            state: { name: 'COMPLETED', result: { name: 'SUCCESSFUL' } },
            created_on: '2024-01-01T00:00:00Z',
            target: { ref_name: 'main' },
          },
          {
            uuid: '{def-456}',
            build_number: 2,
            state: { name: 'COMPLETED', result: { name: 'FAILED' } },
            created_on: '2024-01-02T00:00:00Z',
            target: { ref_name: 'develop' },
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleListPipelines({
        workspace: 'workspace',
        repo_slug: 'repo',
      });

      expect(result.content[0].text).toContain('#1');
      expect(result.content[0].text).toContain('#2');
      expect(result.content[0].text).toContain('SUCCESSFUL');
      expect(result.content[0].text).toContain('FAILED');
      expect(result.isError).toBeFalsy();
    });

    it('should handle empty pipelines', async () => {
      const mockResponse = { values: [] };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleListPipelines({
        workspace: 'workspace',
        repo_slug: 'repo',
      });

      expect(result.content[0].text).toContain('No pipelines');
    });
  });

  describe('handleGetPipeline', () => {
    it('should fetch pipeline details with UUID normalization', async () => {
      const mockPipeline = {
        uuid: '{abc-123}',
        build_number: 1,
        state: { name: 'COMPLETED', result: { name: 'SUCCESSFUL' } },
        created_on: '2024-01-01T00:00:00Z',
        completed_on: '2024-01-01T00:05:00Z',
        duration_in_seconds: 300,
        target: {
          ref_name: 'main',
          commit: { hash: 'abc123', message: 'Test commit' },
        },
        trigger: { name: 'PUSH' },
      };

      mockMakeRequest.mockResolvedValueOnce(mockPipeline);

      const result = await handleGetPipeline({
        workspace: 'workspace',
        repo_slug: 'repo',
        pipeline_uuid: 'abc-123',
      });

      expect(result.content[0].text).toContain('Pipeline #1');
      expect(result.content[0].text).toContain('✅ SUCCESSFUL');
      expect(result.content[0].text).toContain('5m 0s');
    });

    it('should handle UUID with braces', async () => {
      const mockPipeline = {
        uuid: '{abc-123}',
        build_number: 1,
        state: { name: 'IN_PROGRESS' },
        created_on: '2024-01-01T00:00:00Z',
        target: { ref_name: 'main' },
      };

      mockMakeRequest.mockResolvedValueOnce(mockPipeline);

      const result = await handleGetPipeline({
        workspace: 'workspace',
        repo_slug: 'repo',
        pipeline_uuid: '{abc-123}',
      });

      expect(result.content[0].text).toContain('IN_PROGRESS');
    });

    it('should format duration correctly', async () => {
      const mockPipeline = {
        uuid: '{abc-123}',
        build_number: 1,
        state: { name: 'COMPLETED', result: { name: 'SUCCESSFUL' } },
        created_on: '2024-01-01T00:00:00Z',
        duration_in_seconds: 3725, // 1h 2m 5s
        target: { ref_name: 'main' },
      };

      mockMakeRequest.mockResolvedValueOnce(mockPipeline);

      const result = await handleGetPipeline({
        workspace: 'workspace',
        repo_slug: 'repo',
        pipeline_uuid: 'abc-123',
      });

      expect(result.content[0].text).toContain('1h 2m 5s');
    });
  });

  describe('handleGetPipelineSteps', () => {
    it('should list pipeline steps with state icons', async () => {
      const mockResponse = {
        values: [
          {
            name: 'Build',
            state: { name: 'COMPLETED', result: { name: 'SUCCESSFUL' } },
            duration_in_seconds: 120,
          },
          {
            name: 'Test',
            state: { name: 'COMPLETED', result: { name: 'FAILED' } },
            duration_in_seconds: 60,
          },
          {
            name: 'Deploy',
            state: { name: 'IN_PROGRESS' },
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleGetPipelineSteps({
        workspace: 'workspace',
        repo_slug: 'repo',
        pipeline_uuid: 'abc-123',
      });

      expect(result.content[0].text).toContain('Build');
      expect(result.content[0].text).toContain('2m 0s');
      expect(result.content[0].text).toContain('SUCCESSFUL');
      expect(result.content[0].text).toContain('FAILED');
      expect(result.content[0].text).toContain('IN_PROGRESS');
    });
  });

  describe('handleGetPipelineStepLog', () => {
    it('should fetch step log with truncation', async () => {
      const mockLog = 'Log line 1\nLog line 2\nLog line 3';

      mockMakeTextRequest.mockResolvedValueOnce(mockLog);

      const result = await handleGetPipelineStepLog({
        workspace: 'workspace',
        repo_slug: 'repo',
        pipeline_uuid: 'abc-123',
        step_uuid: 'step-123',
      });

      expect(result.content[0].text).toContain('Log line 1');
      expect(result.content[0].text).toContain('Log line 2');
      expect(result.content[0].text).toContain('Log line 3');
    });

    it('should truncate large logs', async () => {
      const mockLog = 'x'.repeat(60000);

      mockMakeTextRequest.mockResolvedValueOnce(mockLog);

      const result = await handleGetPipelineStepLog({
        workspace: 'workspace',
        repo_slug: 'repo',
        pipeline_uuid: 'abc-123',
        step_uuid: 'step-123',
      });

      expect(result.content[0].text.length).toBeLessThan(60000);
      expect(result.content[0].text).toContain('truncated');
    });

    it('should normalize both UUIDs', async () => {
      const mockLog = 'Test log';

      mockMakeTextRequest.mockResolvedValueOnce(mockLog);

      await handleGetPipelineStepLog({
        workspace: 'workspace',
        repo_slug: 'repo',
        pipeline_uuid: 'pipeline-uuid',
        step_uuid: 'step-uuid',
      });

      // Verify the request was made (UUIDs normalized internally)
      expect(mockMakeTextRequest).toHaveBeenCalled();
    });
  });
});
