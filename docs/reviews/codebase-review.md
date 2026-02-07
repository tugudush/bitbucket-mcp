# Bitbucket MCP Server - Codebase Review

**Review Date**: February 8, 2026
**Reviewer**: GitHub Copilot (Claude Opus 4.6)
**Version Reviewed**: 2.0.1 (package.json) / 1.5.1 (source VERSION constant)
**Previous Review**: December 20, 2025 (v1.4.13)
**Status**: Review Updated

---

## Executive Summary

The Bitbucket MCP Server is a well-architected, read-only Model Context Protocol server for Bitbucket API v2.0 access. Since the last review (v1.4.13), the codebase has undergone a **major version bump to 2.0.1** and expanded from 20 to **39 tools** with comprehensive coverage across repositories, pull requests, diffs, commits, pipelines, issues, workspaces, and search. The modular handler registry pattern is fully realized, and code quality remains high.

**Overall Score: 9.0/10** (maintained from prior review improvements)

### Key Changes Since Last Review (December 2025 → February 2026)

| Area | Change | Impact |
|------|--------|--------|
| Version | 1.4.13 → 2.0.1 (package.json) | Major version bump |
| Tool count | 20 → 39 tools | Nearly doubled capability |
| New domains | Pipeline, Diff, Commit, User PRs | Full Bitbucket API coverage |
| Handler modules | 5 → 8 domain handlers | Better organization |
| Total LOC (src/) | ~1,800 → ~3,807 | Proportional growth |
| Test count | N/A → 43 unit tests, 3 suites | All passing |
| Dependencies | Updated to latest | Jest 30, ESLint 9 |

### New Issues Found

| Issue | Severity | Description |
|-------|----------|-------------|
| Version mismatch | ⚠️ Medium | `package.json` = `2.0.1`, source `VERSION` constant = `1.5.1` |
| Duplicate `VERSION` constant | ⚠️ Low | Defined in both `index.ts` and `api.ts` |
| Duplicate `statusIcon` function | ⚠️ Low | Identical function in `pullrequest.ts` and `commit.ts` |
| `handleGetFileContent` bypasses retry | ⚠️ Medium | Uses raw `fetch()` instead of `makeRequest()`/`makeTextRequest()` |
| Test coverage tooling broken | ⚠️ Medium | Jest coverage collection fails with Node 24 compatibility issue |
| Missing `makeRequest` tests | ⚠️ Low | TODO placeholder still present in `api.test.ts` |
| CHANGELOG not updated | ⚠️ Low | Last entry is v1.4.13, missing 1.5.x and 2.0.x entries |

### Previous Issues (December 2025) Status

| Issue | Status | Description |
|-------|--------|-------------|
| Hardcoded versions | ✅ Fixed | Version constant synced across `index.ts` and `api.ts` (but now out of sync with package.json) |
| Missing timeout | ✅ Fixed | `AbortController` timeout using `BITBUCKET_REQUEST_TIMEOUT` |
| Duplicate auth logic | ✅ Fixed | `buildAuthHeaders()` and `buildRequestHeaders()` utilities |
| Unused retry logic | ✅ Fixed | Exponential backoff retry for transient failures (5xx, 429) |
| Large switch statement | ✅ Fixed | Refactored to handler registry pattern in `src/handlers/` |
| Missing API tests | ✅ Fixed | Added comprehensive tests in `api.test.ts` |

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Strengths](#strengths)
3. [Areas for Improvement](#areas-for-improvement)
4. [Code Quality Analysis](#code-quality-analysis)
5. [Security Assessment](#security-assessment)
6. [Testing Coverage](#testing-coverage)
7. [Documentation Quality](#documentation-quality)
8. [Performance Considerations](#performance-considerations)
9. [Recommendations](#recommendations)
10. [File-by-File Review](#file-by-file-review)

---

## Architecture Overview

### Module Structure

```
src/
├── index.ts           # Entry point — MCP server setup (61 lines)
├── api.ts             # HTTP request handling, auth, retry (325 lines)
├── config.ts          # Configuration management with Zod (91 lines)
├── errors.ts          # Custom error class hierarchy (142 lines)
├── schemas.ts         # Zod input validation schemas (469 lines)
├── tools.ts           # Tool definitions & handler routing (343 lines)
├── types.ts           # TypeScript interfaces for API responses (373 lines)
├── handlers/          # Modular tool handlers by domain
│   ├── index.ts       # Handler registry & exports (182 lines)
│   ├── types.ts       # Common handler types & helpers (36 lines)
│   ├── repository.ts  # Repository, branch, tag, file tools (465 lines)
│   ├── pullrequest.ts # PR tools: list, detail, comments, activity (399 lines)
│   ├── diff.ts        # Diff & diffstat tools (175 lines)
│   ├── commit.ts      # Commit, statuses, merge-base, file history (181 lines)
│   ├── issue.ts       # Issue tools (66 lines)
│   ├── pipeline.ts    # Pipeline CI/CD tools (231 lines)
│   ├── workspace.ts   # Workspace, user, user PRs tools (154 lines)
│   └── search.ts      # Code & repository search (115 lines)
└── __tests__/         # Unit tests (520 lines)
    ├── api.test.ts    # API layer tests (205 lines)
    ├── config.test.ts # Config tests (165 lines)
    └── errors.test.ts # Error class tests (150 lines)
```

**Total source**: 3,807 lines (excluding tests)  
**Total tests**: 520 lines  
**Test-to-source ratio**: ~14%

### Design Patterns Used

| Pattern | Implementation | Quality |
|---------|---------------|---------|
| **Handler Registry** | `toolHandlers` map in `handlers/index.ts` | ✅ Excellent |
| **Factory Pattern** | `createApiError()` for error instantiation | ✅ Good |
| **Schema Validation** | Zod schemas with `zodToJsonSchema()` conversion | ✅ Excellent |
| **Single Responsibility** | Each handler module covers one domain | ✅ Excellent |
| **Defensive Programming** | Runtime blocking of non-GET requests | ✅ Excellent |
| **Retry with Backoff** | Exponential backoff in `makeRequest()` | ✅ Good |
| **Lazy Configuration** | `getConfig()` loads config dynamically | ✅ Good |

### Tool Coverage (39 Tools)

| Domain | Tools | Handler File |
|--------|-------|-------------|
| Repository | `bb_get_repository`, `bb_list_repositories`, `bb_browse_repository`, `bb_get_file_content` | `repository.ts` |
| Branches/Tags | `bb_get_branches`, `bb_get_branch`, `bb_get_tags`, `bb_get_tag` | `repository.ts` |
| Pull Requests | `bb_get_pull_requests`, `bb_get_pull_request`, `bb_get_pull_request_comments`, `bb_get_pull_request_comment`, `bb_get_comment_thread`, `bb_get_pull_request_activity`, `bb_get_pr_commits`, `bb_get_pr_statuses` | `pullrequest.ts` |
| Diffs | `bb_get_pull_request_diff`, `bb_get_pull_request_diffstat`, `bb_get_diff`, `bb_get_diffstat` | `diff.ts` |
| Commits | `bb_get_commits`, `bb_get_commit`, `bb_get_commit_statuses`, `bb_get_merge_base`, `bb_get_file_history` | `commit.ts` + `repository.ts` |
| Issues | `bb_get_issues`, `bb_get_issue` | `issue.ts` |
| Pipelines | `bb_list_pipelines`, `bb_get_pipeline`, `bb_get_pipeline_steps`, `bb_get_pipeline_step_log` | `pipeline.ts` |
| Workspace/User | `bb_list_workspaces`, `bb_get_workspace`, `bb_get_user`, `bb_get_current_user`, `bb_list_user_pull_requests` | `workspace.ts` |
| Search | `bb_search_repositories`, `bb_search_code` | `search.ts` |

---

## Strengths

### 1. **Security-First Design** ⭐

Read-only enforcement is implemented at multiple levels with no regression:

```typescript
// api.ts — Runtime protection at the HTTP layer
const requestedMethod = (options.method || 'GET').toString().toUpperCase();
if (requestedMethod !== 'GET') {
  throw new Error(`Only GET requests are allowed. Attempted: ${requestedMethod} ${url}`);
}
method: 'GET', // Force GET to prevent accidental method overrides
```

Both `makeRequest()` and `makeTextRequest()` enforce this, creating defense-in-depth.

### 2. **Modular Handler Architecture** ⭐

The handler registry pattern is clean and scales well:

```typescript
// handlers/index.ts — 39 tools mapped to handlers
export const toolHandlers: Record<string, ToolHandler> = {
  bb_get_repository: handleGetRepository,
  bb_list_pipelines: handleListPipelines,
  // ... 37 more entries organized by domain
};
```

Each handler file focuses on one domain, the largest being `repository.ts` at 465 lines — still manageable.

### 3. **Type Safety**

- Full TypeScript strict mode with `isolatedModules`
- Zero type errors (clean `tsc --noEmit`)
- Zero lint warnings (clean ESLint)
- Comprehensive interfaces for all 20+ Bitbucket API response types
- Generic `makeRequest<T>()` for type-safe API calls
- Zod validation for all 39 tool input schemas

### 4. **Robust API Layer**

- **Request timeout** via `AbortController`
- **Exponential backoff retry** (3 attempts: 1s → 2s → 4s)
- **Retryable error detection** (5xx, 429)
- **Dual response types**: `makeRequest<T>()` for JSON, `makeTextRequest()` for text/plain
- **Shared auth utilities**: `buildAuthHeaders()`, `buildRequestHeaders()`

### 5. **Error Handling**

Excellent error hierarchy with context-aware messages, actionable suggestions, and URL-based resource detection:

```typescript
export class AuthenticationError extends BitbucketApiError {
  constructor(details?: string) {
    super(401, 'Unauthorized', details,
      'Check your authentication credentials (BITBUCKET_API_TOKEN + BITBUCKET_EMAIL)');
  }
}
```

### 6. **Developer Experience**

- Quality pipeline scripts (`ltf`, `ltfb`)
- Modern tooling: ESLint 9 flat config, Jest 30, TypeScript 5
- Clean tool naming convention (`bb_` prefix avoids MCP namespace conflicts)
- Comprehensive `.github/copilot-instructions.md`

---

## Areas for Improvement

### 1. **Version Mismatch** ⚠️ Medium

`package.json` is at version `2.0.1` but the `VERSION` constant in both `src/index.ts` and `src/api.ts` is `'1.5.1'`:

```typescript
// src/index.ts:18 and src/api.ts:10
export const VERSION = '1.5.1';  // Should be '2.0.1'
```

**Impact**: User-Agent header reports wrong version: `bitbucket-mcp-server/1.5.1`. MCP server also registers as version `1.5.1`.

**Recommendation**: Either read version from `package.json` at runtime, or add a build step to sync it. At minimum, manually sync the constant to `2.0.1`.

### 2. **Duplicate `VERSION` Constant** ⚠️ Low

`VERSION` is declared in both `src/index.ts` (line 18) and `src/api.ts` (line 10). Only `api.ts` exports are used by the broader codebase; `index.ts` uses its own local copy for the MCP server registration.

**Recommendation**: Define `VERSION` in a single place (e.g., `api.ts` or a new `version.ts`) and import it in `index.ts`.

### 3. **Duplicate `statusIcon` Function** ⚠️ Low

Identical `statusIcon()` helper functions exist in:
- `src/handlers/pullrequest.ts` (line 369)
- `src/handlers/commit.ts` (line 77)

**Recommendation**: Extract to `handlers/types.ts` or a shared `handlers/utils.ts`.

### 4. **`handleGetFileContent` Bypasses API Retry Logic** ⚠️ Medium

In `src/handlers/repository.ts` (lines 330–347), `handleGetFileContent` uses raw `fetch()` with `buildRequestHeaders()` instead of `makeTextRequest()`:

```typescript
// Current — no timeout, no retry, no error enrichment
const headers = buildRequestHeaders('text/plain');
const response = await fetch(url, { headers });
if (!response.ok) {
  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}
```

This bypasses timeout, retry logic, and the rich error handling provided by `makeTextRequest()`. The raw `fetch()` call also lacks an `AbortController` timeout.

**Recommendation**: Refactor to use `makeTextRequest()` and split the response into lines afterward.

### 5. **Test Coverage Tooling Broken** ⚠️ Medium

Jest coverage collection fails due to a Node 24 / `test-exclude` compatibility issue:
```
ERROR: The "original" argument must be of type function.
```
All 43 tests pass, but code coverage metrics cannot be generated. This blocks visibility into untested paths.

**Recommendation**: Update `test-exclude` dependency, or pin Node to v22 LTS for CI. Consider adding a `node-version` requirement to `package.json` `engines` field.

### 6. **Missing `makeRequest` Tests**

`src/__tests__/api.test.ts` line 202 has a TODO placeholder:
```typescript
it('should be tested with fetch mocking', () => {
  // TODO: Add makeRequest tests with fetch mocking
  expect(true).toBe(true);
});
```

The retry logic, timeout handling, and error creation in `makeRequest()` are the most critical code paths and remain untested at the unit level.

### 7. **CHANGELOG Not Updated**

`CHANGELOG.md` last entry is `[1.4.13] - 2025-08-23`. All changes from 1.5.x through 2.0.1 are undocumented. This is a significant documentation gap for a published npm package.

### 8. **No Handler-Level Error Wrapping**

Most handlers let Zod validation errors and API errors propagate raw. `tools.ts` `handleToolCall` wraps errors in `createErrorResponse()`, but Zod `ZodError` messages are not user-friendly:

```typescript
// tools.ts — catches all errors, but ZodError messages are verbose
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  return createErrorResponse(message);
}
```

**Recommendation**: Add specific `ZodError` handling to produce cleaner validation error messages.

---

## Code Quality Analysis

### Metrics

| Metric | Value | Assessment |
|--------|-------|------------|
| **Source Lines (src/, no tests)** | 3,807 | Appropriate for 39 tools |
| **Test Lines** | 520 | Low relative to source |
| **Test-to-Source Ratio** | ~14% | ⚠️ Below recommended 30%+ |
| **TypeScript Strict Mode** | ✅ Enabled | Excellent |
| **Type Errors** | 0 | ✅ Clean |
| **ESLint Warnings** | 0 | ✅ Clean |
| **Test Suites** | 3 passed | ✅ All green |
| **Test Cases** | 43 passed | ✅ All green |
| **Largest File** | `schemas.ts` (469 lines) | Acceptable |
| **Largest Handler** | `repository.ts` (465 lines) | Borderline, consider splitting |

### Code Style

- ✅ Consistent formatting (Prettier)
- ✅ Clear naming conventions (`handle*`, `create*`, `build*`)
- ✅ Proper JSDoc comments on most public functions
- ✅ No `any` types (`@typescript-eslint/no-explicit-any: warn` active, 0 warnings)
- ✅ ES modules throughout (`"type": "module"`)
- ✅ Modern target (ES2022)

### TypeScript Configuration

| Setting | Value | Status |
|---------|-------|--------|
| `strict` | `true` | ✅ |
| `isolatedModules` | `true` | ✅ |
| `declaration` | `true` | ✅ |
| `declarationMap` | `true` | ✅ |
| `sourceMap` | `true` | ✅ |
| `forceConsistentCasingInFileNames` | `true` | ✅ |
| Target | ES2022 | ✅ Modern |
| Module | Node16 | ✅ Correct for Node.js |

---

## Security Assessment

### Strengths

| Security Measure | Implementation | Status |
|-----------------|----------------|--------|
| **Read-only enforcement** | Runtime blocking in both `makeRequest()` and `makeTextRequest()` | ✅ |
| **Forced GET method** | `method: 'GET'` set explicitly in fetch calls | ✅ |
| **No credentials in code** | Environment-based configuration only | ✅ |
| **Input validation** | Zod schemas on all 39 tool inputs | ✅ |
| **Email validation** | Zod `.email()` on `BITBUCKET_EMAIL` | ✅ |
| **URL validation** | Zod `.url()` on `BITBUCKET_API_BASE` | ✅ |
| **Error sanitization** | Details extracted safely from API responses | ✅ |
| **HTTPS enforced** | Hardcoded `https://api.bitbucket.org/2.0` | ✅ |

### Potential Concerns

| Concern | Risk Level | Mitigation |
|---------|-----------|------------|
| **Credentials in debug logs** | Low | Only with explicit `BITBUCKET_DEBUG=true` |
| **No rate limiting** | Low | Respects Bitbucket native limits; 429 triggers retry |
| **Raw `fetch()` in `handleGetFileContent`** | Low | Still uses `buildRequestHeaders()` for auth |
| **Pipeline log truncation** | Very Low | 50KB limit prevents memory issues |

---

## Testing Coverage

### Current State

| File/Module | Test Coverage | Status |
|-------------|-------------|--------|
| `api.ts` (helpers) | ✅ Tested | `buildApiUrl`, `buildUrlParams`, `addQueryParams`, `buildAuthHeaders`, `buildRequestHeaders` |
| `api.ts` (makeRequest) | ❌ Missing | TODO placeholder — retry, timeout, error handling untested |
| `api.ts` (makeTextRequest) | ❌ Missing | No unit tests |
| `config.ts` | ✅ Comprehensive | `loadConfig`, `validateAuthentication`, `initializeConfig` |
| `errors.ts` | ✅ Comprehensive | All error classes and `createApiError` factory |
| `handlers/*.ts` | ❌ Missing | No unit tests for any handler |
| `schemas.ts` | ❌ Missing | No validation tests (low priority) |
| `tools.ts` | ❌ Missing | `handleToolCall` routing/error wrapping untested |
| `types.ts` | N/A | Interfaces only |

### Test Summary

```
Test Suites: 3 passed, 3 total
Tests:       43 passed, 43 total
Time:        1.575s
```

### Test Quality Assessment

The existing tests are well-written:
- ✅ Clear `describe`/`it` blocks with descriptive names
- ✅ Proper `beforeEach`/`afterEach` for environment isolation
- ✅ Mock isolation (`jest.mock`)
- ✅ Edge case coverage (invalid email, invalid URL, no auth)
- ⚠️ No integration/E2E tests in Jest (external test scripts exist: `test_all_tools.js`, `test_pr_445.js`, etc.)
- ⚠️ Coverage collection broken on Node 24

### Recommended Test Priorities

| Priority | Target | Tests Needed |
|----------|--------|-------------|
| **P0** | `makeRequest()` | Retry logic, timeout, read-only enforcement, error mapping |
| **P0** | `makeTextRequest()` | Same as above for text variant |
| **P1** | `handleToolCall()` routing | Valid tool dispatch, unknown tool error, Zod error formatting |
| **P2** | Handler functions | Mock `makeRequest`, validate schema parsing → response formatting |
| **P3** | Fix coverage tooling | Node 24 compatibility or pin Node version |

---

## Documentation Quality

### Strengths

| Document | Quality | Notes |
|----------|---------|-------|
| `README.md` | ⭐ Excellent | Clear setup, all 39 tools documented |
| `.github/copilot-instructions.md` | ⭐ Excellent | Comprehensive AI assistant instructions, up to date |
| `PUBLISHING.md` | ✅ Good | Clear publishing workflow |
| **Code Comments** | ✅ Good | JSDoc on public APIs and handlers |
| **Handler Comments** | ✅ Good | Each handler file has module-level doc comment |

### Gaps

| Gap | Impact |
|-----|--------|
| `CHANGELOG.md` stale (last entry v1.4.13) | Medium — missing 1.5.x through 2.0.x entries |
| No `CONTRIBUTING.md` | Low — community contributions may lack guidance |
| No `engines` field in `package.json` | Low — no declared Node.js version requirement |

---

## Performance Considerations

### Current Performance Patterns

| Pattern | Implementation | Status |
|---------|---------------|--------|
| **Pagination** | Properly capped at `MAX_PAGE_SIZE = 100` | ✅ |
| **File content** | Line-based pagination (max 10,000 lines) | ✅ |
| **Branch resolution** | `resolveRefToCommitSha()` for subdirectory browsing | ✅ |
| **Pipeline log truncation** | 50KB cap prevents memory issues | ✅ |
| **Request timeout** | `AbortController` with configurable timeout | ✅ |
| **Retry with backoff** | 3 attempts, exponential backoff (1s → 2s → 4s) | ✅ |

### Improvement Opportunities

| Opportunity | Effort | Impact |
|-------------|--------|--------|
| **Response caching** | Medium | Would help for repeated `resolveRefToCommitSha()` calls |
| **Use `makeTextRequest` for file content** | Low | Gains timeout + retry for file reads |
| **Parallel requests** | Low | `handleGetCommentThread()` could fetch root + all comments in parallel |
| **Connection pooling** | Medium | Consider `undici` for better HTTP/2 performance |

---

## Recommendations

### Priority 1: High Impact / Low Effort

| Recommendation | Effort | Impact |
|----------------|--------|--------|
| Fix VERSION mismatch (`1.5.1` → `2.0.1`) | 5 min | High — correct User-Agent & MCP registration |
| Deduplicate `VERSION` to single source | 10 min | Medium — prevents future drift |
| Extract shared `statusIcon()` to utils | 10 min | Low — reduces duplication |
| Use `makeTextRequest()` in `handleGetFileContent` | 30 min | Medium — gains retry + timeout |

### Priority 2: Medium Impact / Medium Effort

| Recommendation | Effort | Impact |
|----------------|--------|--------|
| Add `makeRequest`/`makeTextRequest` unit tests | 4h | High — tests most critical code path |
| Update CHANGELOG.md for 1.5.x–2.0.x | 2h | Medium — publishing transparency |
| Add ZodError formatting in `handleToolCall` | 1h | Medium — better user experience |
| Fix Jest coverage tooling (Node 24 compat) | 2h | Medium — visibility into test gaps |

### Priority 3: Future Enhancements

| Recommendation | Effort | Impact |
|----------------|--------|--------|
| Add handler unit tests (mock `makeRequest`) | 8h | High — test all 39 tools |
| Add `engines` field to `package.json` | 5 min | Low — declare Node version requirement |
| Add response caching for ref resolution | 4h | Medium — performance improvement |
| Create `CONTRIBUTING.md` | 2h | Low — community contribution guidance |
| Split `repository.ts` (465 lines) | 2h | Low — extracting branch/tag handlers |

---

## File-by-File Review

### `src/index.ts` — Entry Point

**Rating: 9/10**

✅ Clean, minimal (61 lines). Properly initializes config before creating server. Clean error handling with `process.exit(1)`.

⚠️ `VERSION` constant (`1.5.1`) out of sync with `package.json` (`2.0.1`). Duplicates the constant from `api.ts`.

---

### `src/api.ts` — API Layer

**Rating: 9.5/10**

✅ Excellent implementation: read-only enforcement, retry with exponential backoff, `AbortController` timeout, shared auth utilities (`buildAuthHeaders`, `buildRequestHeaders`), dual response types (`makeRequest<T>()` for JSON, `makeTextRequest()` for text).

⚠️ `VERSION` constant (`1.5.1`) duplicated from `index.ts` and out of sync with `package.json`.

---

### `src/config.ts` — Configuration

**Rating: 9.5/10**

✅ Clean Zod schema validation, graceful defaults, clear auth validation with helpful warnings, debug mode output.

⚠️ Minor: `BITBUCKET_REQUEST_TIMEOUT` uses `z.string().transform(Number)` which would silently produce `NaN` for non-numeric strings. A `.pipe(z.number())` would be safer.

---

### `src/errors.ts` — Error Handling

**Rating: 9/10**

✅ Well-designed error hierarchy with context-aware messages and actionable suggestions. `extractResourceFromUrl()` is a nice touch for better error messages.

⚠️ `NotFoundError` class is defined but `createApiError()` returns a generic `BitbucketApiError` for 404s (not `NotFoundError`). The class exists unused in the factory.

---

### `src/schemas.ts` — Input Validation

**Rating: 9.5/10**

✅ Comprehensive schemas for all 39 tools. Good use of `.describe()` for self-documenting fields. Constants centralized in `API_CONSTANTS`.

No significant issues.

---

### `src/tools.ts` — Tool Definitions & Routing

**Rating: 9/10**

✅ Clean separation: tool definitions (metadata + schema) in `getToolDefinitions()`, handler dispatch via registry lookup in `handleToolCall()`. Proper error wrapping with `createErrorResponse()`.

⚠️ ZodError messages propagate raw — could be more user-friendly.

---

### `src/types.ts` — Type Definitions

**Rating: 9/10**

✅ Comprehensive coverage of all Bitbucket API response types (20+ interfaces). Consistent use of `interface` over `type`. Good use of optional fields.

⚠️ Some interfaces could benefit from documenting which API endpoints they correspond to.

---

### `src/handlers/types.ts` — Handler Types

**Rating: 10/10**

✅ Clean, minimal (36 lines). `ToolResponse`, `ToolHandler`, `createResponse()`, `createErrorResponse()` — exactly what's needed.

---

### `src/handlers/index.ts` — Handler Registry

**Rating: 9.5/10**

✅ Clean registry pattern mapping 39 tool names to handlers. Well-organized by domain with clear section comments. Re-exports all handlers for convenience.

---

### `src/handlers/repository.ts` — Repository Tools

**Rating: 8.5/10**

✅ Good `resolveRefToCommitSha()` utility for uniform ref resolution. Handles complex branch names well via commit SHA fallback. Good error messages for 404s with branch suggestions.

⚠️ At 465 lines, this is the largest handler. Could split branch/tag handlers into their own file.  
⚠️ `handleGetFileContent()` uses raw `fetch()` bypassing `makeTextRequest()` retry/timeout logic.  
⚠️ Silent `catch {}` blocks in ref resolution and repo info fetching — consider logging in debug mode.

---

### `src/handlers/pullrequest.ts` — Pull Request Tools

**Rating: 9/10**

✅ Comprehensive PR tools (8 handlers). Good comment thread building with recursive reply discovery. Clean status formatting with emoji icons.

⚠️ `handleGetCommentThread()` fetches all comments with `pagelen: 100` — may miss comments in large PRs.  
⚠️ `statusIcon()` function duplicated in `commit.ts`.

---

### `src/handlers/diff.ts` — Diff Tools

**Rating: 9.5/10**

✅ Clean implementation. Good shared `formatDiffstatEntry()` helper. Properly uses `makeTextRequest()` for raw diffs.

No significant issues.

---

### `src/handlers/commit.ts` — Commit Tools

**Rating: 9/10**

✅ Clean implementation. Good `encodeURIComponent` usage for commit refs. File history with size reporting.

⚠️ `statusIcon()` duplicated from `pullrequest.ts`.

---

### `src/handlers/issue.ts` — Issue Tools

**Rating: 9/10**

✅ Clean, minimal (66 lines). Proper filtering parameters for state and kind.

No issues.

---

### `src/handlers/pipeline.ts` — Pipeline Tools

**Rating: 9.5/10**

✅ Well-implemented with good attention to detail: UUID normalization, human-readable duration formatting, pipeline state icons, log truncation at 50KB (keeps last 50KB for recent output).

---

### `src/handlers/workspace.ts` — Workspace & User Tools

**Rating: 9/10**

✅ Clean implementation. Good handling of Bitbucket API v2.0 limitations (no `/users/{username}` endpoint). `bb_list_user_pull_requests` is a useful addition.

⚠️ `handleGetUser()` throws a raw `Error` instead of `BitbucketApiError` for unsupported username lookups.

---

### `src/handlers/search.ts` — Search Tools

**Rating: 8.5/10**

✅ Proper code search integration with language/extension/repo filtering.

⚠️ `handleSearchRepositories()` fetches one page of repos and filters client-side. This won't scale for workspaces with many repos — pagination means most repos could be missed.

---

### `src/__tests__/api.test.ts` — API Tests

**Rating: 8/10**

✅ Good tests for helper functions. 20 test cases covering URL building, params, auth headers, request headers.

⚠️ `makeRequest()` and `makeTextRequest()` remain untested (TODO placeholder).

---

### `src/__tests__/config.test.ts` — Config Tests

**Rating: 9.5/10**

✅ Comprehensive: default config, env parsing, invalid email/URL rejection, auth validation, initialization logging. 12 test cases.

---

### `src/__tests__/errors.test.ts` — Error Tests

**Rating: 9/10**

✅ Covers all error classes and the `createApiError` factory with various status codes and error data formats. 11 test cases.

---

## Conclusion

The Bitbucket MCP Server has matured significantly from v1.4.13 to v2.0.1, nearly doubling its tool count to 39 while maintaining clean architecture and code quality. The modular handler registry pattern scales well, TypeScript strict mode catches issues at compile time, and the security-first read-only design remains solid.

### Summary of Scores

| Module | Rating |
|--------|--------|
| `index.ts` | 9/10 |
| `api.ts` | 9.5/10 |
| `config.ts` | 9.5/10 |
| `errors.ts` | 9/10 |
| `schemas.ts` | 9.5/10 |
| `tools.ts` | 9/10 |
| `types.ts` | 9/10 |
| `handlers/types.ts` | 10/10 |
| `handlers/index.ts` | 9.5/10 |
| `handlers/repository.ts` | 8.5/10 |
| `handlers/pullrequest.ts` | 9/10 |
| `handlers/diff.ts` | 9.5/10 |
| `handlers/commit.ts` | 9/10 |
| `handlers/issue.ts` | 9/10 |
| `handlers/pipeline.ts` | 9.5/10 |
| `handlers/workspace.ts` | 9/10 |
| `handlers/search.ts` | 8.5/10 |
| Tests (3 suites) | 8.5/10 |

### Critical Action Items

1. **Fix VERSION mismatch** — `1.5.1` → `2.0.1` (5 minutes)
2. **Use `makeTextRequest()` in file content handler** — gains retry + timeout (30 minutes)
3. **Add `makeRequest` unit tests** — most critical untested code (4 hours)
4. **Update CHANGELOG.md** — document 1.5.x–2.0.x changes (2 hours)

### Overall Assessment

**Final Score: 9.0/10** — Production-quality MCP server with excellent architecture, strong security design, and comprehensive Bitbucket API coverage. Main gaps are in test coverage for the API retry layer and version management hygiene.

---

*Generated by GitHub Copilot (Claude Opus 4.6) on February 8, 2026*  
*Previous review: December 20, 2025*
