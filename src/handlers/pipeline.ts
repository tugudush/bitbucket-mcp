/**
 * Pipeline-related tool handlers
 *
 * Implements:
 * - bb_list_pipelines — List CI/CD pipeline runs
 * - bb_get_pipeline — Get details of a specific pipeline run
 * - bb_get_pipeline_steps — List steps/stages of a pipeline
 * - bb_get_pipeline_step_log — Get build log for a pipeline step
 */

import {
  ListPipelinesSchema,
  GetPipelineSchema,
  GetPipelineStepsSchema,
  GetPipelineStepLogSchema,
} from '../schemas.js';
import {
  makeRequest,
  makeTextRequest,
  buildApiUrl,
  addQueryParams,
} from '../api.js';
import type {
  BitbucketApiResponse,
  BitbucketPipeline,
  BitbucketPipelineStep,
} from '../types.js';
import { createResponse, ToolResponse } from './types.js';

/**
 * Normalize a UUID — ensure it has curly braces for the API
 */
function normalizeUuid(uuid: string): string {
  if (uuid.startsWith('{') && uuid.endsWith('}')) return uuid;
  return `{${uuid}}`;
}

/**
 * Format pipeline state into a readable string with icon
 */
function formatPipelineState(state: BitbucketPipeline['state']): string {
  const resultName = state.result?.name || state.stage?.name || state.name;
  switch (resultName?.toUpperCase()) {
    case 'SUCCESSFUL':
      return '✅ SUCCESSFUL';
    case 'FAILED':
      return '❌ FAILED';
    case 'ERROR':
      return '❌ ERROR';
    case 'RUNNING':
      return '🔄 RUNNING';
    case 'PENDING':
      return '⏳ PENDING';
    case 'STOPPED':
      return '⏹️ STOPPED';
    case 'PAUSED':
      return '⏸️ PAUSED';
    default:
      return `${resultName || state.name}`;
  }
}

/**
 * Format duration in seconds to human-readable string
 */
function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null) return 'N/A';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hours}h ${remainMins}m ${secs}s`;
}

/**
 * List CI/CD pipeline runs for a repository
 */
export async function handleListPipelines(
  args: unknown
): Promise<ToolResponse> {
  const parsed = ListPipelinesSchema.parse(args);
  const params = {
    page: parsed.page,
    pagelen: parsed.pagelen,
    sort: '-created_on', // Most recent first
  };
  const url = addQueryParams(
    buildApiUrl(
      `/repositories/${parsed.workspace}/${parsed.repo_slug}/pipelines`
    ),
    params
  );
  const data = await makeRequest<BitbucketApiResponse<BitbucketPipeline>>(url);

  if (!data.values || data.values.length === 0) {
    return createResponse(
      `No pipelines found for ${parsed.workspace}/${parsed.repo_slug}.`
    );
  }

  const pipelineList = data.values
    .map((p: BitbucketPipeline) => {
      const ref = p.target.ref_name || 'N/A';
      const trigger = p.trigger?.name || 'Unknown';
      return (
        `- #${p.build_number} ${formatPipelineState(p.state)}\n` +
        `  Branch: ${ref}\n` +
        `  Trigger: ${trigger}\n` +
        `  Duration: ${formatDuration(p.duration_in_seconds)}\n` +
        `  Created: ${p.created_on}\n` +
        `  UUID: ${p.uuid}`
      );
    })
    .join('\n\n');

  return createResponse(
    `Pipelines for ${parsed.workspace}/${parsed.repo_slug} (${data.size} total):\n\n${pipelineList}`
  );
}

/**
 * Get detailed information about a specific pipeline run
 */
export async function handleGetPipeline(args: unknown): Promise<ToolResponse> {
  const parsed = GetPipelineSchema.parse(args);
  const uuid = normalizeUuid(parsed.pipeline_uuid);
  const url = buildApiUrl(
    `/repositories/${parsed.workspace}/${parsed.repo_slug}/pipelines/${uuid}`
  );
  const data = await makeRequest<BitbucketPipeline>(url);

  const ref = data.target.ref_name || 'N/A';
  const commitHash = data.target.commit?.hash?.substring(0, 8) || 'N/A';
  const commitMsg = data.target.commit?.message?.split('\n')[0] || '';
  const trigger = data.trigger?.name || 'Unknown';
  const creator = data.creator?.display_name || 'Unknown';

  return createResponse(
    `Pipeline #${data.build_number}\n` +
      `Status: ${formatPipelineState(data.state)}\n` +
      `Branch: ${ref}\n` +
      `Commit: ${commitHash}${commitMsg ? ` — ${commitMsg}` : ''}\n` +
      `Trigger: ${trigger}\n` +
      `Creator: ${creator}\n` +
      `Duration: ${formatDuration(data.duration_in_seconds)}\n` +
      `Created: ${data.created_on}\n` +
      (data.completed_on ? `Completed: ${data.completed_on}\n` : '') +
      `UUID: ${data.uuid}`
  );
}

/**
 * List the steps/stages of a pipeline run
 */
export async function handleGetPipelineSteps(
  args: unknown
): Promise<ToolResponse> {
  const parsed = GetPipelineStepsSchema.parse(args);
  const uuid = normalizeUuid(parsed.pipeline_uuid);
  const params = {
    page: parsed.page,
    pagelen: parsed.pagelen,
  };
  const url = addQueryParams(
    buildApiUrl(
      `/repositories/${parsed.workspace}/${parsed.repo_slug}/pipelines/${uuid}/steps`
    ),
    params
  );
  const data =
    await makeRequest<BitbucketApiResponse<BitbucketPipelineStep>>(url);

  if (!data.values || data.values.length === 0) {
    return createResponse(
      `No steps found for pipeline ${parsed.pipeline_uuid}.`
    );
  }

  const stepList = data.values
    .map((step: BitbucketPipelineStep, index: number) => {
      const name = step.name || `Step ${index + 1}`;
      const state = step.state.result?.name || step.state.name;
      const image = step.image?.name || 'default';
      return (
        `- ${name}: ${state}\n` +
        `  Image: ${image}\n` +
        `  Duration: ${formatDuration(step.duration_in_seconds)}\n` +
        (step.started_on ? `  Started: ${step.started_on}\n` : '') +
        (step.completed_on ? `  Completed: ${step.completed_on}\n` : '') +
        `  UUID: ${step.uuid}`
      );
    })
    .join('\n\n');

  return createResponse(
    `Pipeline steps (${data.values.length} total):\n\n${stepList}`
  );
}

/**
 * Get the build log output for a specific pipeline step
 */
export async function handleGetPipelineStepLog(
  args: unknown
): Promise<ToolResponse> {
  const parsed = GetPipelineStepLogSchema.parse(args);
  const pipelineUuid = normalizeUuid(parsed.pipeline_uuid);
  const stepUuid = normalizeUuid(parsed.step_uuid);
  const url = buildApiUrl(
    `/repositories/${parsed.workspace}/${parsed.repo_slug}/pipelines/${pipelineUuid}/steps/${stepUuid}/log`
  );

  const log = await makeTextRequest(url);

  if (!log || log.trim().length === 0) {
    return createResponse(`No log output found for step ${parsed.step_uuid}.`);
  }

  // Truncate very long logs to avoid overwhelming context
  const MAX_LOG_LENGTH = 50000;
  const truncated = log.length > MAX_LOG_LENGTH;
  const logContent = truncated
    ? log.substring(log.length - MAX_LOG_LENGTH)
    : log;

  return createResponse(
    `Pipeline step log${truncated ? ' (truncated to last 50K chars)' : ''}:\n\n${logContent}`
  );
}
