# Codebase Review — Bitbucket MCP Server

**Date:** 2026-02-08
**Version:** 3.2.1
**Reviewer:** GitHub Copilot (automated)

---

## 1. Executive Summary

The Bitbucket MCP Server is a well-structured, read-only Model Context Protocol server providing 38 tools for interacting with the Bitbucket Cloud API v2.0. The codebase demonstrates strong architectural decisions: modular handler registry, strict TypeScript typing, Zod-based input validation, and defense-in-depth read-only enforcement. All 148 unit tests pass across 11 suites with 92.2% statement coverage, lint and type checks are clean. Remaining areas for improvement include reducing code duplication in the API layer and minor schema/config cleanup.

**Overall Rating: Strong** — Production-quality architecture with comprehensive test coverage and good separation of concerns.

> **Update (2026-02-09):** Issues H1, H2, M2, M3, and L1 from this review have been resolved via PRs [#80](https://github.com/tugudush/bitbucket-mcp/pull/80), [#81](https://github.com/tugudush/bitbucket-mcp/pull/81), and [#82](https://github.com/tugudush/bitbucket-mcp/pull/82). See updated findings in §12.

---

## 2. Project Metrics

| Metric | Value |
|---|---|
| Source files (src/) | 18 files |
| Lines of code (src/*.ts) | 1,805 |
| Lines of code (handlers/) | ~2,000 |
| Lines of test code | ~3,600 |
| Total tools | 38 |
| Unit tests | 148 (all passing) |
| Test suites | 11 (api, config, errors + 8 handlers) |
| Statement coverage | 92.2% |
| Lint status | Clean |
| TypeScript strict mode | Enabled |
| `any` usage in src/ | 0 explicit `any` types |
| TODO/FIXME markers | 0 |

---

## 3. Architecture

### 3.1 Strengths

- **Modular handler registry pattern**: Tools are organized into domain-specific handler files (`repository.ts`, `pullrequest.ts`, `commit.ts`, `diff.ts`, `issue.ts`, `pipeline.ts`, `workspace.ts`, `search.ts`) and registered in a central `toolHandlers` map. This replaces brittle switch statements and makes adding new tools straightforward.

- **Clean layered architecture**:
  - `index.ts` — MCP server bootstrap (60 lines, minimal)
  - `tools.ts` — Tool definitions + handler dispatch
  - `schemas.ts` — Zod schemas for all 38 tools
  - `types.ts` — TypeScript interfaces for API responses
  - `api.ts` — HTTP layer with retry, timeout, auth
  - `errors.ts` — Domain-specific error hierarchy
  - `config.ts` — Environment validation with Zod
  - `handlers/` — Domain-organized business logic

- **Type safety**: Strict mode enabled, zero `any` usage in production code, `unknown` used for handler args with Zod parsing at boundaries.

- **Defense-in-depth read-only enforcement**: Both `makeRequest()` and `makeTextRequest()` block non-GET methods at runtime, regardless of what callers pass.

- **Consistent response formatting**: All handlers return `ToolResponse` via `createResponse()` / `createErrorResponse()` helpers — uniform MCP output.

### 3.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    MCP Client                       │
└────────────────────────┬────────────────────────────┘
                         │ stdio
┌────────────────────────▼────────────────────────────┐
│  index.ts  (Server bootstrap)                       │
│    ├── ListToolsRequest → getToolDefinitions()      │
│    └── CallToolRequest  → handleToolCall()          │
├─────────────────────────────────────────────────────┤
│  tools.ts  (Registry dispatch)                      │
│    └── toolHandlers[name](args)                     │
├─────────────────────────────────────────────────────┤
│  handlers/  (Domain logic)                          │
│    ├── repository.ts  (9 tools)                     │
│    ├── pullrequest.ts (8 tools)                     │
│    ├── diff.ts        (4 tools)                     │
│    ├── commit.ts      (4 tools)                     │
│    ├── pipeline.ts    (4 tools)                     │
│    ├── workspace.ts   (5 tools)                     │
│    ├── search.ts      (2 tools)                     │
│    └── issue.ts       (2 tools)                     │
├─────────────────────────────────────────────────────┤
│  api.ts  (HTTP + auth + retry)                      │
│  schemas.ts  (Zod validation)                       │
│  types.ts  (TS interfaces)                          │
│  errors.ts  (Error hierarchy)                       │
│  config.ts  (Env validation)                        │
└─────────────────────────────────────────────────────┘
```

---

## 4. Code Quality

### 4.1 Lint & Type Safety

- **ESLint**: Clean — zero warnings or errors.
- **TypeScript**: Strict mode, `noEmit` check passes cleanly.
- **No `any`**: The entire production codebase avoids `any`. Handler args use `unknown` and are validated via Zod `.parse()`.
- **ESLint config**: Uses flat config format, `@typescript-eslint` rules, `no-explicit-any` set to `warn`.

### 4.2 Code Style & Consistency

- Consistent handler function signatures: `(args: unknown) => Promise<ToolResponse>`.
- Consistent string formatting for API response output (template literals, bullet-point style).
- Consistent parameter naming (`workspace`, `repo_slug`, `pull_request_id`) across all schemas.
- Proper JSDoc comments on all exported functions.
- Clean imports — no unused imports detected.

### 4.3 Positive Patterns

| Pattern | Where | Notes |
|---|---|---|
| Handler registry | `handlers/index.ts` | Eliminates switch; O(1) lookup |
| Zod-based validation | `schemas.ts` | Each schema has `.describe()` for MCP |
| `zodToJsonSchema()` | `tools.ts` | Auto-generates JSON Schema for MCP SDK |
| Retry with backoff | `api.ts` | Exponential backoff on 5xx/429 |
| AbortController timeout | `api.ts` | Per-request timeout enforcement |
| Lazy config loading | `api.ts:getConfig()` | Avoids module-time env binding |
| `resolveRefToCommitSha()` | `repository.ts` | Handles branches with slashes |
| `createResponse()` helper | `handlers/types.ts` | Uniform response construction |

---

## 5. Testing

### 5.1 Current State

- **11 test suites** covering `api.ts`, `config.ts`, `errors.ts`, and all 8 handler modules — 148 tests, all passing.
- Tests are well-structured with proper mocking (`jest.mock`, `mockFetch`), fake timers for retry/timeout scenarios, and thorough edge case coverage.
- API tests cover: successful requests, read-only enforcement, auth headers, retry logic (500, 429), timeout/abort, non-JSON error responses, `fetchAllPages()` pagination.
- Config tests cover: default values, env parsing, email validation, URL validation, auth detection, debug logging.
- Error tests cover: all error classes, `createApiError()` factory, URL-based resource extraction.
- Handler tests cover: response formatting, error handling, pagination logic, mocked API calls.

### 5.2 Coverage Gap — ~~Critical~~ **RESOLVED**

> **Resolved (2026-02-08):** PR [#80](https://github.com/tugudush/bitbucket-mcp/pull/80) added comprehensive unit tests for all 8 handler modules. 92.2% statement coverage achieved.

~~**No handler tests exist.**~~ All 8 handler files now have dedicated test suites with mocked `makeRequest`/`makeTextRequest` calls.

### 5.3 Coverage Tooling Issue — ~~High~~ **RESOLVED**

> **Resolved (2026-02-08):** PR [#80](https://github.com/tugudush/bitbucket-mcp/pull/80) updated Jest to v30.0.5 and related dependencies. `jest --coverage` now works correctly.

~~Running `jest --coverage` fails due to a `test-exclude` module incompatibility.~~

### 5.4 `jest.setup.js` Stale Reference — **RESOLVED**

> **Resolved (2026-02-08):** The `BITBUCKET_READ_ONLY` env var reference was removed from `jest.setup.js`.

---

## 6. Security

### 6.1 Strengths

- **Runtime read-only enforcement**: Both `makeRequest()` and `makeTextRequest()` reject non-GET methods before any network call.
- **No secrets in code**: Auth credentials come from environment variables only.
- **Input validation**: All handler inputs are validated through Zod schemas before use.
- **URL encoding**: Branch names, file paths, and refs are properly encoded with `encodeURIComponent()`.

### 6.2 Observations

- **Credentials in debug logging**: When `BITBUCKET_DEBUG=true`, the config logs `BITBUCKET_API_TOKEN` length and `BITBUCKET_EMAIL` value to stderr. This is acceptable since debug mode is opt-in and only outputs to stderr (not tool responses), but the email logging could be reconsidered.

- **No request body validation needed**: Since only GET requests are made, there's no risk of request body injection.

---

## 7. Error Handling

### 7.1 Strengths

- Custom error hierarchy (`BitbucketApiError` → `AuthenticationError`, `NotFoundError`, `ForbiddenError`, `RateLimitError`) with status codes, details, and user-facing suggestions.
- `createApiError()` factory extracts resource type from URL patterns for contextual messages.
- Handler-level `try/catch` in `handleToolCall()` converts all thrown errors to MCP-compatible error responses.
- `handleBrowseRepository()` catches 404 errors and provides enhanced messages suggesting branch alternatives.

### 7.2 Potential Improvements

- **Missing error handling in `handleSearchCode()`**: If code search is not enabled for the account, the raw API error propagates. A specific catch could suggest enabling code search in Bitbucket settings.
- **`handleGetUser()` throws a plain `Error`** for unsupported username lookups. This could use a custom error type for consistency, though the impact is minimal.

---

## 8. API Layer

### 8.1 Strengths

- `makeRequest<T>()` with generics provides type-safe API responses throughout.
- `makeTextRequest()` for diff/log endpoints that return `text/plain`.
- `buildApiUrl()`, `addQueryParams()`, `buildUrlParams()` utilities keep URL construction DRY.
- Retry logic handles transient failures (5xx, 429) with exponential backoff.
- Request timeout via `AbortController`.

### 8.2 Code Duplication

`makeRequest()` and `makeTextRequest()` share ~80% identical code (auth, timeout, retry loop, error handling). The only differences are:
- `Accept` header (`application/json` vs `text/plain`)
- Response parsing (`.json()` vs `.text()`)
- `redirect: 'follow'` in text requests

**Recommendation:** Extract the shared retry/timeout/auth logic into a private `_executeRequest()` function, with the response type as a parameter. This would eliminate ~60 lines of duplication.

---

## 9. Schema & Type Design

### 9.1 Strengths

- All 38 tool schemas defined with Zod in `schemas.ts`, each field with `.describe()` for MCP discoverability.
- `API_CONSTANTS` centralizes magic numbers (page sizes, retry counts, file limits).
- TypeScript interfaces in `types.ts` cover all API response shapes comprehensively (374 lines).

### 9.2 Observations

- **`GetUserSchema`** has a `username` field that's immediately rejected if provided — the schema should arguably not include it, or it should be removed and the tool description updated. Currently it's misleading to MCP clients that see `username` as an accepted parameter.
- **Pagination schemas** repeat the same `page`/`pagelen` pattern across ~15 schemas. A shared `PaginationSchema` base could reduce repetition, e.g.:
  ```typescript
  const PaginationParams = z.object({
    page: z.number().optional().describe('Page number for pagination'),
    pagelen: z.number().optional().describe(`Number of items per page (max ${API_CONSTANTS.MAX_PAGE_SIZE})`),
  });
  ```

---

## 10. Configuration

### 10.1 Strengths

- Zod schema validation for all env vars with typed defaults.
- `initializeConfig()` provides clear startup logging with emoji indicators.
- `validateAuthentication()` cleanly detects auth method and returns structured result.
- Lazy loading via `getConfig()` in `api.ts` avoids stale config.

### 10.2 Observations

- **`BITBUCKET_REQUEST_TIMEOUT` type transform**: The schema uses `z.string().transform(Number)`. A user setting `BITBUCKET_REQUEST_TIMEOUT=abc` would silently produce `NaN`. Consider adding `.pipe(z.number().positive())` for validation.

---

## 11. Handler-Specific Observations

### `repository.ts` (455 LOC)
- `resolveRefToCommitSha()` is a well-designed utility that uniformly handles branches, tags, and commit SHAs via the `/commit/{revision}` endpoint.
- `handleBrowseRepository()` has proper fallback logic: tries commit SHA resolution first, falls back to direct ref if that fails.
- `handleGetFileContent()` correctly paginates with line numbers and uses `makeTextRequest()`.

### `pullrequest.ts` (423 LOC)
- `handleGetCommentThread()` now uses `fetchAllPages()` to retrieve all comments across paginated results, resolving the previous pagelen=100 limitation. ✅
- `calculateDepth()` function properly computes indent depth by walking up parent chains.
- The `findReplies()` recursive function still passes a `depth` parameter that is not used internally — minor cleanup opportunity.

### `pipeline.ts` (231 LOC)
- `normalizeUuid()` correctly handles both `{uuid}` and bare `uuid` formats.
- `formatDuration()` is well-implemented with hours/minutes/seconds breakdown.
- Step log truncation (50KB tail) is a pragmatic choice for MCP context limits.

### `search.ts` (125 LOC)
- `handleSearchRepositories()` now uses Bitbucket's server-side BBQL `q` parameter for name/description filtering. ✅
- Defaults to `pagelen=100` and supports `sort` parameter for flexible result ordering.
- BBQL injection prevention via double-quote escaping in user input.
- Code search (`handleSearchCode()`) works independently with workspace-level search endpoint.

### `diff.ts` (175 LOC)
- Clean implementation with shared `formatDiffstatEntry()` helper.
- Correctly uses `makeTextRequest()` for raw diff endpoints.

---

## 12. Findings Summary

### Critical (0)
None.

### High Priority (2) — **BOTH RESOLVED**

| # | Finding | Location | Status |
|---|---|---|---|
| H1 | ~~No handler unit tests~~ | `src/handlers/` | ✅ **Resolved** — [PR #80](https://github.com/tugudush/bitbucket-mcp/pull/80): 8 handler test suites added (148 total tests, 92.2% coverage) |
| H2 | ~~Coverage tooling broken~~ | `jest --coverage` | ✅ **Resolved** — [PR #80](https://github.com/tugudush/bitbucket-mcp/pull/80): Jest updated to v30, coverage works |

### Medium Priority (4) — 2 RESOLVED

| # | Finding | Location | Status |
|---|---|---|---|
| M1 | API layer code duplication | `api.ts` L80-175, L180-275 | Open — Extract shared retry/timeout logic into private helper |
| M2 | ~~Comment thread pagination limit~~ | `pullrequest.ts` | ✅ **Resolved** — [PR #82](https://github.com/tugudush/bitbucket-mcp/pull/82): Uses `fetchAllPages()` for full pagination |
| M3 | ~~Repo search is single-page only~~ | `search.ts` | ✅ **Resolved** — [PR #81](https://github.com/tugudush/bitbucket-mcp/pull/81): Uses BBQL server-side filtering |
| M4 | Timeout config accepts NaN | `config.ts` L18 | Open — Add `.pipe(z.number().positive())` after transform |

### Low Priority (3) — 1 RESOLVED

| # | Finding | Location | Status |
|---|---|---|---|
| L1 | ~~Stale env var in jest.setup.js~~ | `jest.setup.js` L4 | ✅ **Resolved** — [PR #80](https://github.com/tugudush/bitbucket-mcp/pull/80): Removed `BITBUCKET_READ_ONLY` |
| L2 | `GetUserSchema` has misleading field | `schemas.ts` L204 | Open — Remove `username` field or clarify limitation |
| L3 | Unused `depth` parameter | `pullrequest.ts` L218 | Open — Remove parameter or use for indent formatting |

---

## 13. Recommendations Prioritized

1. ~~**Add handler tests** (H1)~~ — ✅ **RESOLVED** via PR #80
2. ~~**Fix coverage tooling** (H2)~~ — ✅ **RESOLVED** via PR #80
3. **Refactor API duplication** (M1) — Extract shared request execution logic to reduce maintenance burden.
4. ~~**Paginate comment thread fetching** (M2)~~ — ✅ **RESOLVED** via PR #82
5. ~~**Add server-side repo search** (M3)~~ — ✅ **RESOLVED** via PR #81
6. **Clean up minor issues** (L2-L3) — Quick wins for code hygiene.

---

## 14. Conclusion

This is a well-engineered MCP server with clean separation of concerns, strong type safety, and robust error handling. The modular handler registry pattern makes it easy to add new Bitbucket tools. With the addition of comprehensive handler tests (148 tests, 92.2% coverage), working coverage tooling, full comment thread pagination, and server-side repository search, the project has reached excellent quality. Remaining improvements are limited to API layer refactoring (M1), timeout validation (M4), and minor schema cleanup (L2-L3).
