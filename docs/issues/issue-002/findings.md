# Issue 002 Findings

## Summary

- Reported symptom: `bb_get_file_content` returned `404 Not Found - Commit not found` when called with a `ref` containing `/`, based on the screenshots attached to this issue.
- Current repository state does not match that failing behavior. Both the source handler and the compiled build already resolve the ref to a commit SHA first and then read the file by commit SHA.
- Most likely explanation: the screenshots were captured against an older or stale server build, or during a runtime path where ref-to-commit resolution failed and the handler fell back to the older direct-ref file URL.

## Evidence Collected

- The attached screenshots show repeated `bb_get_file_content` calls failing when the requested `ref` contains `/`.
- The current implementation in `src/handlers/repository.ts` defines `resolveRefToCommitSha(...)` and uses it in `handleGetFileContent(...)`.
- The compiled artifact in `build/handlers/repository.js` matches the source implementation, so this is not just an unbuilt source-only change in the working tree.
- Git history shows the relevant behavior was introduced by commit `69fc562` on 2026-01-27: `feat: implement resolveRefToCommitSha function for uniform git reference resolution`.
- Narrow validation passed: `npm test -- --runInBand src/__tests__/handlers/repository.test.ts`.

## Root Cause Assessment

- The original failure is consistent with Bitbucket's `/src/{ref}/{file_path}` route not reliably handling refs that contain `/`.
- The current handler avoids that by resolving the supplied ref through `/commit/{revision}` first, then using `/src/{commitSha}/{file_path}`.
- This is the same workaround described in the screenshot note: use the PR head commit hash as the file-content address instead of the branch name.
- There is still a verification gap: the current automated tests for `handleGetFileContent(...)` cover line pagination and `HEAD` resolution, but they do not include a regression case for a slash-containing ref.
- There is also still a fallback risk: if `resolveRefToCommitSha(...)` fails at runtime, the handler falls back to `/src/{encodedRef}/{file_path}`, which is the same shape as the original failing request.

## Conclusion

- I did not find an active source-code defect in the checked-in `bb_get_file_content` implementation.
- I did find two reasons this issue can still appear unresolved in practice:
	1. the failing screenshots may have come from an older or stale build that predates commit `69fc562`
	2. even in the current code, a ref-resolution failure would send execution back through the older direct-ref path
- The highest-value follow-up is a live integration repro against a known branch whose name contains `/`, plus a dedicated regression test for `handleGetFileContent(...)` covering that case.

## Confidence

- Medium confidence.
- The code path and history are clear, and the narrow unit suite passes.
- I did not perform a live Bitbucket API reproduction for the sanitized branch/repository shown in the screenshots, so runtime behavior against that exact repository remains unverified.
