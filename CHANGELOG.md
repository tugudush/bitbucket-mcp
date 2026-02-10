# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **TOON output format support** ([bc0dc89](https://github.com/tugudush/bitbucket-mcp/commit/bc0dc89))
  - Added `output_format` parameter to all 37 tools with three format options:
    - `text` (default) — Human-readable formatted output (preserves backward compatibility)
    - `json` — Pretty-printed JSON with 2-space indentation
    - `toon` — Token-Oriented Object Notation (30-60% token savings for LLM consumption)
  - New dependency: `@toon-format/toon` ^2.1.0 for compact tabular format generation
- **JMESPath filtering support** ([bc0dc89](https://github.com/tugudush/bitbucket-mcp/commit/bc0dc89))
  - Added `filter` parameter to all 37 tools for powerful data transformation
  - Supports JMESPath query expressions applied before format conversion
  - New dependency: `jmespath` ^0.16.0, `@types/jmespath` ^0.15.2
  - Examples: array filtering, object projection, nested queries
- **Structured data in responses** ([bc0dc89](https://github.com/tugudush/bitbucket-mcp/commit/bc0dc89))
  - Extended `ToolResponse` interface with optional `_data` field
  - Added `createDataResponse()` helper function in `src/handlers/types.ts`
  - Updated all 37 handlers across 8 modules to provide structured API data alongside text output
  - Enables format conversion and filtering without breaking existing text-based integrations
- **Comprehensive output format tests** ([bc0dc89](https://github.com/tugudush/bitbucket-mcp/commit/bc0dc89))
  - New test suite: `src/__tests__/output-format.test.ts` with 22 tests
  - Coverage: default text format, JSON conversion, TOON conversion, JMESPath filtering, edge cases, env var default
  - Total test count increased from 146 to 168 tests
- **Competitive analysis documentation** ([bc0dc89](https://github.com/tugudush/bitbucket-mcp/commit/bc0dc89))
  - Added `docs/bitbucket-mcp-reviews-and-ranking.md` with comprehensive review of 6 Bitbucket MCP servers
  - Feature matrix comparison, detailed reviews, and project rankings

### Changed
- **Tool schema architecture** ([bc0dc89](https://github.com/tugudush/bitbucket-mcp/commit/bc0dc89))
  - Refactored `src/tools.ts` with `toolSchema()` helper for automatic output option injection
  - Enhanced `handleToolCall()` with post-processing pipeline: extract options → call handler → apply filter → convert format
  - Added `formatOutput()`, `extractOutputOptions()`, and `stripData()` utility functions
- **Jest configuration** ([bc0dc89](https://github.com/tugudush/bitbucket-mcp/commit/bc0dc89))
  - Updated `transformIgnorePatterns` to transform `@toon-format/toon` and `jmespath` ESM packages
  - Ensures proper Jest compatibility with new dependencies
- **Configuration** — Added `BITBUCKET_DEFAULT_FORMAT` environment variable to `src/config.ts`
  - Allows users to set a global default output format (`text`, `json`, or `toon`) via MCP client env config
  - Per-call `output_format` always takes priority over the env var
  - Falls back to `text` when unset (fully backward compatible)

## [3.3.1] - 2026-02-09

### Fixed
- **Documentation accuracy** — Updated all documentation to reflect correct tool and test counts
  - Fixed tool count: 38 → 37 tools (after removing `bb_list_user_pull_requests` in v3.3.0)
  - Fixed test count: 148 → 146 tests (after removing `bb_list_user_pull_requests` tests in v3.3.0)
  - Updated files: README.md, CHANGELOG.md, .github/copilot-instructions.md, docs/reviews/2026-02-08-codebase-review.md, docs/test-results.md
  - Clarified that `bb_get_user` was fixed (not newly added) in v3.3.0
  - Added strikethrough note to v3.0.0 entry documenting that `bb_list_user_pull_requests` was removed in v3.3.0

## [3.3.0] - 2026-02-09

### Added
- **Comprehensive handler unit tests** ([#72](https://github.com/tugudush/bitbucket-mcp/issues/72), [PR #80](https://github.com/tugudush/bitbucket-mcp/pull/80))
  - 8 new test suites covering all handler modules: repository, pullrequest, commit, diff, issue, pipeline, search, workspace
  - 146 total tests across 11 test suites (up from 64 tests in 3 suites)
  - 92.2% statement coverage, 78.5% branch coverage, 97.3% function coverage
  - Mocked `makeRequest`/`makeTextRequest` with thorough edge case testing
- **`fetchAllPages<T>()` utility** ([#75](https://github.com/tugudush/bitbucket-mcp/issues/75), [PR #82](https://github.com/tugudush/bitbucket-mcp/pull/82))
  - Generic pagination helper in `api.ts` that follows `next` links across all pages
  - Safety limit of 50 pages (~5,000 items) to prevent infinite loops
  - Used by `handleGetCommentThread()` to fetch full comment sets on large PRs

### Changed
- **Repository search now uses server-side filtering** ([#76](https://github.com/tugudush/bitbucket-mcp/issues/76), [PR #81](https://github.com/tugudush/bitbucket-mcp/pull/81))
  - `bb_search_repositories` now uses Bitbucket's BBQL `q` parameter for server-side name/description search
  - Defaults to `pagelen=100` (max) and supports `sort` parameter (e.g., `-updated_on`)
  - Eliminates the previous single-page client-side filtering limitation
- **Comment thread pagination** ([#75](https://github.com/tugudush/bitbucket-mcp/issues/75), [PR #82](https://github.com/tugudush/bitbucket-mcp/pull/82))
  - `handleGetCommentThread()` now uses `fetchAllPages()` to retrieve all comments across paginated results
  - PRs with >100 comments now correctly find all nested replies
  - Added `calculateDepth()` for visual indent formatting of nested replies

### Fixed
- **Jest coverage tooling** ([#73](https://github.com/tugudush/bitbucket-mcp/issues/73), [PR #80](https://github.com/tugudush/bitbucket-mcp/pull/80))
  - Updated Jest to v30.0.5 and related dependencies to resolve `test-exclude` module incompatibility
  - `jest --coverage` now works correctly with coverage metrics available
- **Stale jest.setup.js reference** — Removed `BITBUCKET_READ_ONLY` env var from test setup
- **`bb_get_user` tool** — Fixed to use correct `GET /users/{selected_user}` endpoint instead of throwing an unsupported error
  - Supports lookup by username or UUID, falls back to `GET /user` for current user
  - Updated `GetUserSchema` parameter from `username` to `selected_user` to match Bitbucket API
  - Made `BitbucketUser` fields (`username`, `account_id`, `created_on`) optional for private profiles

### Removed
- **`bb_list_user_pull_requests` tool** — Removed entirely; the endpoint `GET /pullrequests/{selected_user}` does not exist in Bitbucket Cloud API v2.0
  - No cross-repository user PR listing endpoint exists; use `bb_get_pull_requests` per repository instead
  - Removed handler, schema, tool definition, registry entry, and tests

## [3.2.2] - 2026-02-08

### Added
- **Codebase review**: Added comprehensive code quality review document (`docs/reviews/2026-02-08-codebase-review.md`)
  - Detailed architecture analysis with 38 tools across 8 handler modules
  - Test coverage metrics (64 unit tests, all passing)
  - Code quality assessment (zero linting/type errors, no `any` usage)
  - Identified 2 high, 4 medium, 3 low priority findings with actionable recommendations
  - Security review and error handling analysis
  - LOC metrics: 1,805 core source lines, ~2,000 handler lines, ~1,007 test lines

### Removed
- **Documentation consolidation**: Removed `DEVELOPMENT.md` to avoid duplication with README
  - Development and debugging information now centralized in README
- **Outdated review document**: Removed `docs/reviews/codebase-review.md` (replaced with timestamped version)

### Changed
- **Documentation structure**: Updated `.github/copilot-instructions.md` and README to reflect documentation reorganization
- **Review process**: Established timestamped review document pattern for future code reviews

## [3.2.1] - 2026-02-08

### Changed
- **Claude Code configuration**: Updated README with correct Claude Code MCP setup using CLI and `.mcp.json` format
  - Replaced outdated `claude_desktop_config.json` references with proper Claude Code configuration
  - Added CLI command examples using `claude mcp add --transport stdio`
  - Updated documentation for both NPM global installation and local build options
- **Documentation consolidation**: Removed redundant DEVELOPMENT.md, moved debugging info to README
  - Added Debugging section to README with `BITBUCKET_DEBUG` flag documentation
  - Streamlined development documentation to avoid duplication

## [3.2.0] - 2026-02-07

### Added
- **Version increment automation**: Added `scripts/version-increment.js` for automated version bumping
- **Publishing guide improvements**: Streamlined version increment workflow in PUBLISHING.md

### Changed
- **Publishing workflow**: Updated commit, tag, and push instructions for better clarity

## [3.1.0] - 2026-02-06

### Removed
- **Obsolete test files**: Removed `docs/TEST_RESULTS_PR_445.md` and related test scripts
  - Cleaned up `test_pr_408_comments.js`, `test_pr_445.js`, `test_pr_445_advanced.js`, `test_pr_445_final.js`
  - Superseded by more comprehensive testing implementations

### Changed
- **Dependencies**: Updated to latest versions including TypeScript, ESLint plugins, and Jest
- **CI workflow**: Added automated build and testing with GitHub Actions
  - Removed push triggers for cleaner workflow
  - Updated to latest actions versions and Node.js 24+
- **Icons**: Updated emoji icons in README for CI/CD Pipelines and Issues sections

### Added
- **Husky integration**: Added pre-commit hooks for code quality checks

## [3.0.0] - 2026-02-08

### Added

- **Commit handler module**: New `src/handlers/commit.ts` with dedicated handlers for commit operations
  - `bb_get_commit` — Get detailed commit information (hash, message, author, date, parents)
  - `bb_get_commit_statuses` — Retrieve CI/CD build statuses for a specific commit with status icons
  - `bb_get_merge_base` — Find the common ancestor between two commits or branches
  - `bb_get_file_history` — View commit history for a specific file with author and size metadata

- **Pipeline handler module**: New `src/handlers/pipeline.ts` with full CI/CD pipeline support
  - `bb_list_pipelines` — List pipeline runs for a repository sorted by most recent
  - `bb_get_pipeline` — Get detailed info for a specific pipeline run (status, branch, commit, trigger, duration)
  - `bb_get_pipeline_steps` — List steps/stages of a pipeline with execution details
  - `bb_get_pipeline_step_log` — Retrieve build log output for a pipeline step (truncated to 50K chars for large logs)
  - Helper utilities for UUID normalization, pipeline state formatting, and human-readable duration display

- **Pull request enhancements**: Extended `src/handlers/pullrequest.ts` with new tools
  - `bb_get_pr_commits` — List commits belonging to a pull request
  - `bb_get_pr_statuses` — Get CI/CD build statuses for a pull request
  - `bb_get_pull_request_comment` — Fetch a single PR comment by ID
  - `bb_get_comment_thread` — Retrieve comment thread with all nested replies

- **Repository handler enhancements**: Extended `src/handlers/repository.ts` with detail tools
  - `bb_get_tag` — Get detailed tag information including target commit
  - `bb_get_branch` — Get detailed branch information with merge strategies

- **Workspace and user tools**: Extended `src/handlers/workspace.ts` with user-facing tools
  - `bb_get_user` — Get information about a specific Bitbucket user
  - `bb_get_current_user` — Get details of the currently authenticated user
  - ~~`bb_list_user_pull_requests`~~ — *(Removed in v3.3.0: endpoint does not exist in Bitbucket API v2.0)*

- **Comprehensive TypeScript interfaces** in `src/types.ts` for strong typing
  - `BitbucketCommitDetailed` — Detailed commit with parents and repository info
  - `BitbucketCommitStatus` — CI/CD build status with state enum (`SUCCESSFUL`, `FAILED`, `INPROGRESS`, `STOPPED`)
  - `BitbucketTag` — Tag ref with target commit details
  - `BitbucketBranchDetailed` — Branch with merge strategies and default merge strategy
  - `BitbucketMergeBase` — Merge base result interface
  - `BitbucketFileHistoryEntry` — File history with commit and size metadata
  - `BitbucketPipeline` — Pipeline run with state, target, trigger, and duration
  - `BitbucketPipelineStep` — Pipeline step with script commands and image info
  - `BitbucketPRTask` — PR task with state and creator
  - `BitbucketSrcListingResponse` — Typed source listing response

- **New Zod schemas** in `src/schemas.ts` for all new tools with descriptive field documentation

- **Comprehensive test coverage**: All tools tested with real-world validation
  - Test approach: Sequential discovery with dynamic ID extraction
  - Coverage: 31 out of 38 tools verified (100% success rate on testable tools)
  - Validates workspace discovery, repositories, PRs, branches, commits, files, comments

- **Expanded API test coverage** in `src/__tests__/api.test.ts` with significantly more test cases

### Changed

- **Handler registry**: Updated `src/handlers/index.ts` with 37 total registered tools
  - Tools organized by domain: repository, pull request, diff, commit, issue, workspace/user, search, pipeline
- **Tool definitions**: Updated `src/tools.ts` with definitions for all new tools
- **Documentation**: Updated `README.md`, `.github/copilot-instructions.md`, and `docs/reviews/codebase-review.md` to reflect new architecture and tools
- **Tool count**: Expanded from ~24 tools to **37 tools** total, with 31 verified via automated tests (100% pass rate on testable tools)

## [2.0.1] - 2026-01-26

### Added
- **Update instructions**: Added instructions for updating to the latest version in README

## [2.0.0] - 2026-01-26

### Added
- **PR comment retrieval**: New `bb_get_pull_request_comment` tool to fetch a single PR comment by ID
  - Implemented `handleGetPullRequestComment` handler with `GetPullRequestCommentSchema` validation
  - Enhanced `BitbucketComment` interface with `updated_on` and `deleted` fields
- **Comment threads**: New `bb_get_comment_thread` tool to retrieve comment threads with all nested replies
  - Implemented `handleGetCommentThread` handler with `GetCommentThreadSchema` validation
- **Git reference resolution**: Implemented `resolveRefToCommitSha` function for uniform git reference resolution
  - Enables robust handling of branches, tags, and commit SHAs when browsing repositories
- **Test suite**: Added `test_all_tools.js` — discovery-based test script with sequential workspace → repo → PR → issue testing

### Changed
- **Documentation**: Updated README and `.github/copilot-instructions.md` with PR comment and comment thread tool documentation

## [1.5.1] - 2025-12-20

### Added
- **Cursor IDE support**: Added Cursor configuration examples in README for MCP integration

### Changed
- **Version**: Bumped version to 1.5.1 in package.json and related files

## [1.5.0] - 2025-12-20

### Added
- **Modular handler architecture**: Major refactoring — replaced large switch statement in `tools.ts` with handler registry pattern
  - New `src/handlers/` directory with domain-specific handler modules:
    - `repository.ts` — Repository, branch, tag, file, and browsing operations
    - `pullrequest.ts` — Pull request listing, details, comments, and activity
    - `issue.ts` — Issue listing and detail retrieval
    - `workspace.ts` — Workspace discovery and user operations
    - `search.ts` — Repository and code search operations
    - `diff.ts` — Diff and diffstat operations (already existed, now modularized)
  - `src/handlers/index.ts` — Central handler registry mapping tool names to handlers
  - `src/handlers/types.ts` — Shared `ToolHandler` and `ToolResponse` interfaces
  - Reduced `tools.ts` from ~800 lines to a clean lookup pattern
- **API test suite**: Added `src/__tests__/api.test.ts` with comprehensive API layer tests
- **Development guide**: Created `DEVELOPMENT.md` with detailed development and authentication documentation
- **Publishing guide**: Created `docs/publishing.md` with comprehensive NPM and GitHub releases workflow
- **Codebase review**: Added `docs/reviews/codebase-review.md` with architecture analysis

### Changed
- **Authentication**: Streamlined authentication process, removed legacy app password support
  - Simplified to API token (`BITBUCKET_API_TOKEN` + `BITBUCKET_EMAIL`) only
  - Removed deprecated app password configuration from code and documentation
- **README**: Streamlined authentication section and enhanced integration instructions

### Removed
- **Legacy files**: Removed `src/index-new.ts` and `src/index-old.ts` (consolidated into modular architecture)
- **App password auth**: Removed legacy app password authentication support from config and API layer

## [1.4.13] - 2025-08-23

### Changed
- **Changelog**: Removed "Unreleased" section from CHANGELOG.md
  - Cleaned up changelog to reflect actual release state
  - Removed placeholder "Unreleased" section since v1.4.12 was already released via GitHub
  - Improved changelog accuracy by aligning with actual release workflow

## [1.4.12] - 2025-08-23

### Removed
- **Build scripts**: Removed `release` script from package.json
  - Eliminated `npm run release` command from available npm scripts
  - Simplified package.json by removing automated release workflow script

## [1.4.11] - 2025-08-23

### Added
- **Changelog maintenance**: Enhanced changelog management and documentation practices 😄
  - Updated CHANGELOG.md with comprehensive version history and detailed release notes
  - Emphasized the importance of keeping changelog current with each release
  - Added systematic approach to documenting changes, fixes, and new features
  - Demonstrated commitment to transparency and project documentation standards
  - Because good changelogs make developers (and users) happy! 📝

## [1.4.10] - 2025-08-23

### Changed
- **Publishing automation**: Updated GitHub release commands to automatically use the latest git tag
  - Modified `gh release create` commands in PUBLISHING.md to use `$(git describe --tags --abbrev=0)` 
  - Eliminates need to manually specify version numbers when creating releases
  - Streamlines publishing workflow by automatically detecting the version created by `npm version`
  - Updated all examples and documentation to use the automated approach

## [1.4.9] - 2025-08-23

### Added
- **Publishing guide**: Created comprehensive, beginner-friendly publishing documentation
  - Simplified PUBLISHING.md with clear step-by-step instructions
  - Added git tags and GitHub releases workflow integration
  - Included troubleshooting section and package.json configuration examples
  - Added support for pre-release versions and automated publishing workflow

## [1.4.8] - 2025-08-20

### Fixed
- **Repository browsing**: Reverted to commit SHA resolution for subdirectory browsing in `bb_browse_repository` tool
  - Restored hybrid URL approach to properly handle complex branch names (e.g., `feature/SSP-1024`)
  - Re-implemented commit SHA resolution logic for subdirectory access to avoid Bitbucket API URL parsing issues
  - Root directory browsing continues to use `?at={ref}` pattern (works with all branch names)
  - Subdirectory browsing now uses `/src/{commit_sha}/{path}/` pattern (resolves branch to commit SHA first)
  - This fixes regression introduced in v1.4.6 where branches with forward slashes would fail on subdirectory access

## [1.4.7] - 2025-08-20

### Added
- **Changelog integration**: Added comprehensive changelog management and distribution
  - Created CHANGELOG.md following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format
  - Added changelog to npm package files for distribution with published packages
  - Added `release` script for automated build, publish, and git operations
  - Integrated changelog with GitHub releases workflow

### Changed
- **Package distribution**: Updated `files` array in package.json to include CHANGELOG.md and README.md
- **Release workflow**: Enhanced npm scripts with automated release command

## [1.4.6] - 2025-08-20

### Changed
- **Repository browsing**: Simplified URL construction for subdirectory access in `bb_browse_repository` tool ([#022a60f](https://github.com/tugudush/bitbucket-mcp/commit/022a60fc07c5fe607ada19f58747e18b07f18d0c))
  - Removed complex commit SHA resolution logic for subdirectories
  - Now uses direct `/src/{ref}/{path}/` pattern consistently with file content access
  - Eliminates fallback mechanisms and reduces code complexity by 25 lines
  - Improves reliability for browsing subdirectories with branch names containing special characters

### Technical Details
- Refactored `handleToolCall` function in `src/tools.ts`
- Simplified subdirectory URL construction from 31 lines to 12 lines
- Removed try-catch block for commit SHA resolution
- Unified URL pattern with file content retrieval method
- Maintained trailing slash handling for proper directory browsing

---

*This changelog was generated based on commit [022a60f](https://github.com/tugudush/bitbucket-mcp/commit/022a60fc07c5fe607ada19f58747e18b07f18d0c) from August 20, 2025*
