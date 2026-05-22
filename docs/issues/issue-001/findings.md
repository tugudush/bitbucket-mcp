# Incident Investigation Report: issue-001

## 1. Executive Summary

This report documents findings from an investigation into two distinct issues encountered while running Bitbucket MCP server tools:
1. **Invalid `pagelen` error (400 Bad Request)** when invoking `bb_get_pull_request_activity`.
2. **"No changes found" and "No structured data available" warning** when querying commit differences with `bb_get_diffstat` using short (12-character) SHAs and requesting JSON output format.

Both issues have been traced to technical constraints within the upstream Bitbucket Cloud API and the MCP server's response handling architecture. This document provides a detailed breakdown of the root causes and actionable recommendations to resolve or work around them.

---

## 2. Issue 1: Pull Request Activity Invalid `pagelen`

### Symptom
When calling `bb_get_pull_request_activity` with `pagelen: 100`, the server returns:
```
Error: Bitbucket API error: 400 Bad Request - Invalid pagelen
```

### Root Cause Analysis
1. **Endpoint Restrictions:** In the Bitbucket Cloud Rest API, the pull request activity endpoint `/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/activity` strictly limits the maximum value of the `pagelen` parameter to **50**. Specifying any value higher than `50` triggers a `400 Bad Request` validation error from Bitbucket.
2. **MCP Clamping Behavior:** The MCP server schema defined in [src/schemas.ts](src/schemas.ts#L108) accepts a `pagelen` argument and describes its maximum as `API_CONSTANTS.MAX_PAGE_SIZE` (which is `100`). In [src/api.ts](src/api.ts#L328), the query parameter builder clamps any numerical `pagelen` or `limit` parameter to `API_CONSTANTS.MAX_PAGE_SIZE` (`100`). 
3. **Outcome:** A request specifying `pagelen: 100` passes client schema checks and is sent directly to Bitbucket with `pagelen=100`, triggering the upstream 400 Bad Request error.

### Recommendations & Fixes
* **Workaround:** Invoke `bb_get_pull_request_activity` with a `pagelen` of `50` or less, or omit the parameter entirely to use the internal default.
* **Code Improvement:** Update [src/handlers/pullrequest.ts](src/handlers/pullrequest.ts#L275) to restrict the activity endpoint `pagelen` to a maximum of `50` before making the API call:
  ```typescript
  const parsed = GetPullRequestActivitySchema.parse(args);
  const params = {
    page: parsed.page,
    pagelen: parsed.pagelen ? Math.min(parsed.pagelen, 50) : undefined,
  };
  ```

---

## 3. Issue 2: Commit Diffstat "No changes found" and Format Warning

### Symptom
When executing `bb_get_diffstat` with `spec: "7aa293afaa6b..d9d840270c5e"`, `topic: true`, and `output_format: "json"`, the output shows:
```
[Note: output_format="json" or filter requested, but no structured data is available for this tool response. Returning default text output.]

No changes found for spec: 7aa293afaa6b..d9d840270c5e
```

### Root Cause Analysis
This behavior is driven by two independent factors resolving simultaneously:

#### A. Revision Specifier Strictness (Upstream Bitbucket)
* **Short SHAs vs. Full SHAs:** The Bitbucket Cloud diff and diffstat endpoints (`/diff/{spec}` and `/diffstat/{spec}`) are highly restrictive regarding the revision specifier. Passing short 12-character commit SHAs (like `7aa293afaa6b..d9d840270c5e`) results in Bitbucket failing to resolve changes and returning a valid HTTP 200 response containing an empty `values` list.
* **Correction:** Using **full 40-character commit SHAs** allows Bitbucket to correctly compute and return the repository difference.

#### B. Output Format Warning (MCP Engine)
* **Response Wrapper:** In [src/handlers/diff.ts](src/handlers/diff.ts#L187), if the API responds with an empty values list, the handler returns:
  ```typescript
  if (!data.values || data.values.length === 0) {
    return createResponse(`No changes found for spec: ${parsed.spec}`);
  }
  ```
* **Empty Payload Architecture:** The [createResponse](src/handlers/types.ts#L26) helper wraps standard plaintext outputs. It does **not** populate the `_data` field on the `ToolResponse` interface because it assumes there is no structured data to convey.
* **Formatting Engine Fallback:** The MCP formatting pipeline in [src/tools.ts](src/tools.ts#L441) processes requested formats (such as `"json"` or `"toon"`). If an output format other than plaintext is requested but `result._data` is absent, the engine prepends the fallback warning and displays the plaintext description.

### Recommendations & Fixes
* **Workaround:** Always use **full 40-character SHAs** (or full branch/tag names) when specifying commit ranges for diffs or diffstats.
* **Code Improvement:** Modify the handler in [src/handlers/diff.ts](src/handlers/diff.ts#L140) to always provide `_data` using `createDataResponse`, even on empty arrays, so that format translation can complete without emitting warnings:
  ```typescript
  if (!data.values || data.values.length === 0) {
    return createDataResponse(
      `No changes found for spec: ${parsed.spec}`,
      data
    );
  }
  ```

---

## 4. Summary of Verification Status

Both behaviors match documented test results in [docs/test-results.md](docs/test-results.md#L103) which outlines that short commit SHAs fail to resolve diffs. Implementing boundary-checks and payload preservation on failure states ensures a robust and reliable developer experience going forward.
