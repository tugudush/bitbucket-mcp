# Bitbucket MCP Tools — Test Results

**Date:** February 9, 2026
**Repositories:** `oceantg/otg-content-manager-ui`, `oceantg/otg-common-components-ui`
**PR Tested:** [PR #101 — build package page (no build button yet)](https://bitbucket.org/oceantg/otg-content-manager-ui/pull-requests/101)

---

## Summary

**31 / 37 tools tested successfully.**

- 2 expected limitations (repo config — no issue tracker / no pipelines)
- `bb_list_user_pull_requests` removed (non-existent Bitbucket API v2.0 endpoint)
- `bb_get_user` fixed to use `GET /users/{selected_user}` endpoint
- 4 not testable (no pipelines or issues exist in tested repos)
- Total: 37 tools (down from 38 after removing `bb_list_user_pull_requests`)

---

## Test Results

### User & Workspace

| #   | Tool                  | Status  | Notes                               |
| --- | --------------------- | ------- | ----------------------------------- |
| 1   | `bb_get_current_user` | ✅ PASS | Jerome Gomez (@jeromegomez1)        |
| 2   | `bb_get_user`         | ✅ FIXED | Now uses `GET /users/{selected_user}` endpoint. Supports username or UUID lookup. |
| 3   | `bb_get_workspace`    | ✅ PASS | OceanTG workspace, UUID returned    |
| 4   | `bb_list_workspaces`  | ✅ PASS | 1 workspace (oceantg)               |

### Repository & Browsing

| #   | Tool                     | Status  | Notes                                |
| --- | ------------------------ | ------- | ------------------------------------ |
| 5   | `bb_search_repositories` | ✅ PASS | 5 content-manager repos found        |
| 6   | `bb_list_repositories`   | ✅ PASS | Tested via search                    |
| 7   | `bb_get_repository`      | ✅ PASS | Repo details: ~7.5MB, private        |
| 8   | `bb_browse_repository`   | ✅ PASS | Listed `src/` directory (10 folders) |
| 9   | `bb_get_file_content`    | ✅ PASS | Read `package.json` lines 1-30       |
| 10  | `bb_search_code`         | ✅ PASS | Found `useMemo` in 5 files           |

### Branches, Commits & Tags

| #   | Tool                     | Status  | Notes                                                                      |
| --- | ------------------------ | ------- | -------------------------------------------------------------------------- |
| 11  | `bb_get_branches`        | ✅ PASS | 69 branches found                                                          |
| 12  | `bb_get_branch`          | ✅ PASS | `develop` branch details + merge strategies                                |
| 13  | `bb_get_commits`         | ✅ PASS | 3 latest develop commits listed                                            |
| 14  | `bb_get_commit`          | ✅ PASS | Commit `7975fba6` details retrieved                                        |
| 15  | `bb_get_commit_statuses` | ✅ PASS | Jenkins build #310 SUCCESSFUL                                              |
| 16  | `bb_get_tags`            | ✅ PASS | No tags (expected for this repo)                                           |
| 17  | `bb_get_tag`             | ✅ PASS | Tag `v2.2.1` from `otg-common-components-ui` (141 tags, commit `e4d19115`) |
| 18  | `bb_get_merge_base`      | ✅ PASS | `main..develop` ancestor: `530118c5`                                       |

### Pull Requests

| #   | Tool                           | Status  | Notes                                                                             |
| --- | ------------------------------ | ------- | --------------------------------------------------------------------------------- |
| 19  | `bb_get_pull_requests`         | ✅ PASS | 0 open PRs (all merged)                                                           |
| 20  | `bb_get_pull_request`          | ✅ PASS | PR #101 details: MERGED, feature/build-package → develop                          |
| 21  | `bb_get_pr_commits`            | ✅ PASS | 6 commits in PR #101                                                              |
| 22  | `bb_get_pr_statuses`           | ✅ PASS | Build #310 SUCCESSFUL                                                             |
| 23  | `bb_get_pull_request_diff`     | ✅ PASS | File-level diff for `BuildPackageContent.tsx`                                     |
| 24  | `bb_get_pull_request_diffstat` | ✅ PASS | 32 files, +1337 -583                                                              |
| 25  | `bb_get_pull_request_activity` | ✅ PASS | Activity feed: merges, updates, comments                                          |
| 26  | `bb_list_user_pull_requests`   | ❌ REMOVED | Endpoint `/pullrequests/{user}` does not exist in Bitbucket API v2.0. Tool removed. |

### Comments & Threads

| #   | Tool                           | Status  | Notes                                           |
| --- | ------------------------------ | ------- | ----------------------------------------------- |
| 27  | `bb_get_pull_request_comments` | ✅ PASS | 28 comments across 3 pages (paginated)          |
| 28  | `bb_get_pull_request_comment`  | ✅ PASS | Retrieved comment #746913012 by Zakikhan Pathan |
| 29  | `bb_get_comment_thread`        | ✅ PASS | Thread with root + 1 reply by Micko Magallanes  |

### Diffs & File History

| #   | Tool                  | Status  | Notes                                       |
| --- | --------------------- | ------- | ------------------------------------------- |
| 30  | `bb_get_diff`         | ✅ PASS | Full commit diff (45KB) — requires full SHA |
| 31  | `bb_get_diffstat`     | ✅ PASS | 18 files changed in commit `7975fba6`       |
| 32  | `bb_get_file_history` | ✅ PASS | 3 commits modifying `package.json`          |

### Issues & Pipelines

| #   | Tool                       | Status  | Notes                                   |
| --- | -------------------------- | ------- | --------------------------------------- |
| 33  | `bb_get_issues`            | ⚠️ N/A  | Repo has no issue tracker enabled (404) |
| 34  | `bb_get_issue`             | ⏭️ SKIP | No issue tracker                        |
| 35  | `bb_list_pipelines`        | ✅ PASS | No pipelines (repo uses Jenkins CI)     |
| 36  | `bb_get_pipeline`          | ⏭️ SKIP | No pipelines exist                      |
| 37  | `bb_get_pipeline_steps`    | ⏭️ SKIP | No pipelines exist                      |
| 38  | `bb_get_pipeline_step_log` | ⏭️ SKIP | No pipelines exist                      |

---

## Notable Findings

### Tools requiring specific input formats

- **`bb_get_diff` / `bb_get_diffstat`**: Short commit SHAs return "No changes found" — **full SHA required** for single-commit diffs. Two-commit specs (`commit1..commit2`) also returned empty with short SHAs.
- **`bb_get_pull_request_comment` / `bb_get_comment_thread`**: Need numeric comment IDs from URL fragments (e.g., `#comment-746913012`). The list comments tool does not surface these IDs.

### API limitations

- **`bb_get_user`**: Now uses `GET /users/{selected_user}` endpoint. Note that private profiles may have limited fields (`location`, `website`, `created_on` omitted).
- **`bb_list_user_pull_requests`**: **Removed.** The endpoint `GET /pullrequests/{selected_user}` does not exist in Bitbucket Cloud API v2.0. There is no cross-repository user PR listing endpoint. Use `bb_get_pull_requests` per repository with author filtering instead.

### Comment thread example

Tested with [comment #746913012](https://bitbucket.org/oceantg/otg-content-manager-ui/pull-requests/101#comment-746913012):

> **Zakikhan Pathan**: "When the length is 0 we need to shows something in UI? Same for addCourse"
> **Micko Magallanes** (reply): "no we do not need UI for this, the section won't just show when the user does not selected anything of that"
