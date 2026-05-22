# Issue 002 Resolution Plan

## Goal

Fix `bb_get_file_content` so refs containing `/` resolve correctly, while preserving existing support for plain branch names, tag names, and commit SHAs. Apply the same correction to the subdirectory branch of `bb_browse_repository`, because it shares the same ref-to-commit logic.

## Current Diagnosis

- Live reproduction against PR 576 confirmed that the current implementation is still broken for slash-containing branch names.
- The failing code path is `resolveRefToCommitSha(...)` in `src/handlers/repository.ts`.
- That helper currently tries only `/repositories/{workspace}/{repo}/commit/{revision}`.
- Bitbucket Cloud returns `404 Not Found - Commit not found` for that endpoint when `revision` is a branch name containing `/`, even when the branch name is percent-encoded.
- After that failure, `handleGetFileContent(...)` falls back to `/src/{encodedRef}/{file_path}`, which is also known to fail for slash-containing refs.
- Current unit coverage does not include a regression test for `bb_get_file_content` with a slash-containing branch name, so the defect was not caught by the existing test suite.

## Scope

Files expected to change:

- `src/handlers/repository.ts`
- `src/__tests__/handlers/repository.test.ts`
- `build/handlers/repository.js`
- `build/__tests__/handlers/repository.test.js` if the build emits test artifacts in the current workflow

Files that should not need behavioral changes:

- Root-path browsing in `handleBrowseRepository(...)`, because `?at={ref}` already works for branch names containing `/`
- Tool schemas in `src/schemas.ts`
- Public tool names and request shapes

## Implementation Plan

### 1. Replace the resolution strategy in `resolveRefToCommitSha(...)`

Keep the helper as the single owning abstraction for ref resolution, but change its lookup order.

Planned lookup order:

1. If `ref` already looks like a commit SHA, either return it directly or validate it through `/commit/{revision}`.
2. Try `/refs/branches/{encodeURIComponent(ref)}` and return `target.hash` on success.
3. Try `/refs/tags/{encodeURIComponent(ref)}` and return `target.hash` on success.
4. Try `/commit/{encodeURIComponent(ref)}` last, as a compatibility path for commit refs and any Bitbucket revisions that are still resolvable there.

Important implementation rule:

- Only suppress `404` during this resolution sequence.
- Do not swallow `401`, `403`, `429`, `500`, network failures, or malformed responses. Those should surface to the caller instead of being misclassified as an unresolved ref.

Why this order:

- Branch lookup via `/refs/branches/{name}` is already known to work for names containing `/`.
- Tag lookup via `/refs/tags/{name}` preserves the helper's intended cross-ref behavior.
- `/commit/{revision}` is still useful, but it cannot remain the first or only path.

### 2. Tighten fallback behavior in `handleGetFileContent(...)`

After the helper is fixed, adjust caller behavior so known-bad fallbacks are not retried.

Planned behavior:

- If ref resolution returns a commit SHA, continue using `/src/{commitSha}/{file_path}`.
- If resolution returns `null` and the ref contains `/`, do not fall back to `/src/{encodedRef}/{file_path}`. Throw a targeted `BitbucketApiError` explaining that the ref could not be resolved and suggesting a commit SHA as a workaround.
- If resolution returns `null` and the ref does not contain `/`, preserve the current direct-ref fallback to avoid regressing simple cases where `/src/{ref}/{file_path}` still works.

Why this change is necessary:

- The current fallback masks the real defect and retries a request shape that is already known to fail for slash-containing refs.
- A precise error is better than a misleading second 404.

### 3. Apply the same rule to subdirectory browsing

The subdirectory path of `handleBrowseRepository(...)` uses the same helper and the same fallback pattern.

Planned change:

- Keep root browsing unchanged.
- For `path`-based browsing, reuse the new helper logic.
- Prevent slash-containing refs from falling back to `/src/{encodedRef}/{path}` when resolution fails.
- Return the same style of actionable error message used by `handleGetFileContent(...)`.

### 4. Add focused regression coverage

Expand `src/__tests__/handlers/repository.test.ts` with behavior-scoped tests that cover the failure we reproduced.

Tests to add:

1. `handleGetFileContent` resolves a slash-containing branch via `/refs/branches/{name}` and then reads the file by commit SHA.
2. `handleBrowseRepository` resolves a slash-containing branch for subdirectory browsing via `/refs/branches/{name}`.
3. `handleGetFileContent` resolves a tag name via `/refs/tags/{name}` so the helper still supports tags after the branch fix.
4. Non-404 resolution failures are rethrown instead of silently returning `null`.
5. Slash-containing refs do not fall back to `/src/{encodedRef}/...` after resolution failure.

Test assertions should verify both behavior and request shape, especially:

- the exact endpoint passed to `makeRequest(...)`
- that `makeTextRequest(...)` receives a `/src/{commitSha}/{file_path}` URL when resolution succeeds
- that `makeTextRequest(...)` is not called with `/src/{encodedRef}/...` for a slash-containing ref after a failed lookup

### 5. Rebuild emitted artifacts

Once the TypeScript source and tests are updated, rebuild the compiled output so `build/` stays aligned with `src/`.

Planned command sequence:

1. `npm test -- --runInBand src/__tests__/handlers/repository.test.ts`
2. `npm run typecheck`
3. `npm run build`

If the narrow repository test fails first, fix that slice before widening validation.

### 6. Perform a live smoke verification

After the code change is in place, rerun the same real-world scenario that reproduced the defect.

Target verification:

- `bb_get_file_content` for PR 576 using ref `feature/SSP-2230-figma-company-details-page-match-product-panel` should succeed.
- `bb_get_file_content` using the PR head commit SHA should still succeed.
- `bb_browse_repository` on a subdirectory for a slash-containing branch should succeed.

This should be treated as post-fix confirmation, not as the primary automated safety net.

## Acceptance Criteria

- `bb_get_file_content` succeeds for branch names containing `/`.
- `bb_browse_repository` subdirectory access succeeds for branch names containing `/`.
- Existing support for plain branch names, tags, and commit SHAs is preserved.
- Resolution failures no longer hide non-404 API errors.
- Slash-containing refs no longer retry the known-bad `/src/{encodedRef}/...` fallback path.
- The focused repository handler tests pass.
- The project still typechecks and builds successfully.

## Risks And Watchpoints

- Tag behavior must be preserved. Fixing branches only is not enough because the current helper claims to support branches, tags, and commit SHAs uniformly.
- Bitbucket responses differ between branch, tag, and commit endpoints. The helper should use the existing `BitbucketBranchDetailed` and `BitbucketTag` shapes instead of relying on loose `any`-like assumptions.
- A broad catch in the helper would reintroduce the current blind spot. The new logic must distinguish `404` from all other failures.
- If short commit SHAs are allowed, any validation shortcut should preserve current behavior rather than narrowing accepted input unintentionally.

## Recommended Execution Order

1. Update `resolveRefToCommitSha(...)` in `src/handlers/repository.ts`.
2. Update `handleGetFileContent(...)` fallback behavior.
3. Update the `path` branch of `handleBrowseRepository(...)`.
4. Add the focused regression tests in `src/__tests__/handlers/repository.test.ts`.
5. Run the narrow repository test file.
6. Run `npm run typecheck`.
7. Run `npm run build`.
8. Re-run the live PR 576 smoke test.

---

## Progress Notes

### Implementation completed

All source changes were applied to branch `bug/fix-ref-with-slashes`.

**`src/handlers/repository.ts`**

1. Added `isNotFound(err)` helper — returns `true` only for `BitbucketApiError` with status `404`.
2. Rewrote `resolveRefToCommitSha(...)`:
   - Lookup order: `/refs/branches/{ref}` → `/refs/tags/{ref}` → `/commit/{ref}`.
   - Each step uses optional chaining (`branchData?.target?.hash`, etc.) so that a Jest `undefined` return from an unmocked call falls through rather than throwing a `TypeError`.
   - Only 404 responses are swallowed; all other errors are re-thrown.
3. Tightened fallback in `handleGetFileContent(...)`: when `resolveRefToCommitSha` returns `null` and `ref` contains `/`, throws a `BitbucketApiError(404, …)` with a targeted diagnostic and suggestion; no retry against the known-bad `/src/{encodedRef}/…` URL.
4. Applied the same change to the `path` branch of `handleBrowseRepository(...)`.

**`src/__tests__/handlers/repository.test.ts`**

- Added `import { BitbucketApiError } from '../../errors.js'` (new import needed for rejection mocks).
- Updated `should browse subdirectory by resolving ref to commit SHA`: changed the first `mockMakeRequest` return value from `{ hash: 'abc123' }` (old commit endpoint shape) to `{ name: 'feature/test', target: { hash: 'abc123' } }` (new branch endpoint shape).
- Added 5 new regression tests:
  1. `should resolve slash-containing branch via /refs/branches and read file by commit SHA`
  2. `should resolve tag ref via /refs/tags when branch lookup returns 404`
  3. `should rethrow non-404 resolution errors without falling back`
  4. `should throw targeted error for unresolvable slash-containing ref and not call makeTextRequest`
  5. `should resolve slash-containing branch for subdirectory via /refs/branches`

### Validation results

| Step | Command | Result |
|------|---------|--------|
| Narrow test | `npm test -- --runInBand src/__tests__/handlers/repository.test.ts` | 22/22 ✅ |
| Full suite | `npm test -- --runInBand` | 189/189 ✅ (was 184) |
| Typecheck | `npm run typecheck` | Clean ✅ |
| Build | `npm run build` | Clean ✅ |
| Live smoke | PR 576 slash branch via MCP | ✅ All calls succeeded using branch name directly |

### Live smoke test results (2026-05-22)

After restarting VS Code and the MCP server to load the new build, all calls using ref `feature/SSP-2230-figma-company-details-page-match-product-panel` succeeded without requiring a commit SHA workaround:

| Call | Ref used | Result |
|------|----------|--------|
| `bb_get_file_content` — `product-item.tsx` | slash branch name | ✅ 115 lines returned |
| `bb_get_file_content` — `product-item.tsx` | `develop` (no slash) | ✅ 122 lines returned |
| `bb_get_file_content` — `status-badge.tsx` | slash branch name | ✅ 13 lines returned |
| `bb_get_file_content` — `status-badge.styles.ts` | slash branch name | ✅ 41 lines returned |
| `bb_get_pull_request_diff` — PR 576 | n/a | ✅ Diff returned |

All acceptance criteria are met. Issue-002 is closed.

## Definition Of Done

The issue is resolved when the PR 576 branch-name repro succeeds without requiring a commit SHA workaround, the repository handler tests cover that case explicitly, and the compiled server output matches the TypeScript source.

**Status: DONE ✅** — Live smoke test passed 2026-05-22.
