# Implementation Plan: issue-001 Fixes

To address the findings identified in the investigation report, the codebase needs to be modified in two files. Below is the detailed step-by-step action plan to apply, verify, and consolidate these changes.

---

## 1. Action Items & Code Changes

### Issue 1: Clamping `pagelen` for PR Activity Endpoint
* **File to modify:** [src/handlers/pullrequest.ts](src/handlers/pullrequest.ts)
* **Underlying Handler:** `handleGetPullRequestActivity`
* **Change Description:** Constrain the `pagelen` parameter to a maximum of `50` specifically for this API route, rendering requests with `pagelen: 100` safe for the upstream API.
* **Proposed Code Modification:**
  ```typescript
  // Replace:
  const params = {
    page: parsed.page,
    pagelen: parsed.pagelen,
  };

  // With:
  const params = {
    page: parsed.page,
    pagelen: parsed.pagelen ? Math.min(parsed.pagelen, 50) : undefined,
  };
  ```

### Issue 2: Retaining Structured `_data` for Empty Diff/Diffstat Responses
* **File to modify:** [src/handlers/diff.ts](src/handlers/diff.ts)
* **Underlying Handlers:** `handleGetPullRequestDiffstat` and `handleGetDiffstat`
* **Change Description:** Replace execution branches returning `createResponse()` with `createDataResponse()` where structured data format is requested but data values are empty. This retains access to the empty `_data` payload structure, preventing formatting pipeline warning overrides when non-text outputs (e.g. JSON/TOON) are requested.
* **Proposed Code Modification (`handleGetPullRequestDiffstat`):**
  ```typescript
  // Replace:
  if (!data.values || data.values.length === 0) {
    return createResponse(
      `No changes found in pull request #${parsed.pull_request_id}.`
    );
  }

  // With:
  if (!data.values || data.values.length === 0) {
    return createDataResponse(
      `No changes found in pull request #${parsed.pull_request_id}.`,
      data
    );
  }
  ```

* **Proposed Code Modification (`handleGetDiffstat`):**
  ```typescript
  // Replace:
  if (!data.values || data.values.length === 0) {
    return createResponse(`No changes found for spec: ${parsed.spec}`);
  }

  // With:
  if (!data.values || data.values.length === 0) {
    return createDataResponse(
      `No changes found for spec: ${parsed.spec}`,
      data
    );
  }
  ```

---

## 2. Verification Protocol

Once the code changes are written, the following validation steps will be executed:

1. **Build Checklist:**
   * Run the quality pipeline: `npm run ltf` (lint, format, and typecheck keys) or `npm run ltfb` to perform a full build. Ensure no type errors compile.
2. **Unit & Integration Test Suites:**
   * Execute the Jest unit test suites (`jest`) to confirm existing checks for PR and Diff handlers continue to pass without regression.
   * Verify that any specific mock expectations within unit tests are updated to account for `_data` being defined instead of undefined during empty responses.
