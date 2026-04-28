# `bb_get_context` — PR Context Bundle Tool

> **Status**: ✅ Implemented (2026-04-28)

## Summary

A convenience tool that returns a curated bundle of PR context in a single call, reducing the number of round-trips an AI agent needs to make (currently 4-5 separate tool calls). Fetches PR details, diffstat, build statuses, and comments **in parallel** via `Promise.all`.

## Input

The tool accepts **three input modes**:

### Mode 1: Direct parameters
```
workspace: string       — The workspace or username
repo_slug: string       — The repository name
pull_request_id: number — The pull request ID
```

### Mode 2: Bitbucket PR URL (parsed automatically)
```
url: string — e.g. https://bitbucket.org/workspace/repo/pull-requests/42
```

### Mode 3: Branch lookup
```
workspace: string — The workspace or username
repo_slug: string — The repository name
branch: string    — Branch name to look up the open PR for
```

If a **branch name** is provided instead of a PR ID, the tool looks up the open PR for that branch via `?q=source.branch.name="{branch}" AND state="OPEN"`. If no open PR exists for the branch, returns an error.

### Options
```
detail_level: "summary" | "full"  — Controls response verbosity (default: "summary")
```

The standard `output_format` and `filter` options (text/json/toon + JMESPath) also apply.

## Output

### Summary mode (default)
- **PR metadata**: title, state, author, source → destination branch, created/updated dates, reviewers
- **Diffstat**: files changed, insertions, deletions (counts only)
- **Build status**: all commit statuses with pass/fail icons
- **Comment preview**: total count + last 3 comments (truncated to 3 lines each)

### Full mode
All of the above, plus:
- **PR description** (full text)
- **Full diffstat** (per-file breakdown with status, path, +/- counts)
- **Last 20 comments** with content

### Structured data (`_data`)

The response includes structured data for JSON/TOON output and JMESPath filtering:

```json
{
  "pull_request": { "id", "title", "state", "author", "source_branch", "destination_branch", ... },
  "diffstat": { "files_changed", "lines_added", "lines_removed", "files": [...] },
  "build_statuses": [{ "name", "state", "description" }],
  "comments": { "total", "showing", "items": [...] }
}
```

## Scope decisions

| Feature | Decision | Rationale |
|---------|----------|-----------|
| Linked issues | **Excluded from v1** | Bitbucket has no first-class linking; parsing descriptions is fragile |
| Branch input | **Supported via PR lookup** | Resolves branch → open PR automatically |
| Git remote URL | **Supported** | Parse `https://bitbucket.org/{workspace}/{repo}/pull-requests/{id}` |
| Detail levels | **summary / full** | Keeps token usage reasonable for LLM context windows |
| Error handling | **Graceful** | Diffstat/statuses/comments use `.catch(() => null)` — PR metadata failure is fatal, but missing sub-data degrades gracefully |

## Implementation

### Files modified
- `src/schemas.ts` — `GetContextSchema` with fields: `workspace`, `repo_slug`, `pull_request_id`, `branch`, `url`, `detail_level`
- `src/handlers/pullrequest.ts` — `handleGetContext()` handler + `parseBitbucketPrUrl()` helper
- `src/handlers/index.ts` — Registered `handleGetContext` in exports and `toolHandlers` registry
- `src/tools.ts` — Added `bb_get_context` tool definition

### Architecture
- **Composite wrapper** — calls Bitbucket API directly via `makeRequest()`, not internal handler functions
- **Parallel fetching** — PR details fetched first, then diffstat + statuses + comments fetched concurrently
- **URL parsing** — handles both `https://bitbucket.org/` and `https://www.bitbucket.org/` prefixes
- **Branch resolution** — uses Bitbucket's `q` parameter (BBQL) to find open PRs by source branch

## Test results

All four input modes verified against live Bitbucket API:

| Test | Input Mode | Result |
|------|-----------|--------|
| Direct params (summary) | `workspace` + `repo_slug` + `pull_request_id` | ✅ PR metadata, diffstat counts, build status, comment count |
| Direct params (full) | Same + `detail_level: "full"` | ✅ All summary + per-file diffstat breakdown |
| URL parsing | `url: "https://bitbucket.org/..."` | ✅ Extracted workspace/repo/PR ID from URL automatically |
| Branch lookup | `workspace` + `repo_slug` + `branch` | ✅ Correctly reported "No open PR found" for merged branch |