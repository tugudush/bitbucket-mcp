# Bitbucket MCP Servers — Comparative Review & Ranking

> **Date**: February 10, 2026
> **Reviewed by**: AI-assisted analysis of public GitHub repositories
> **Our project**: `@tugudush/bitbucket-mcp` (this codebase)

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Quick Comparison Matrix](#quick-comparison-matrix)
- [Detailed Reviews](#detailed-reviews)
  - [1. @tugudush/bitbucket-mcp (This Project)](#1-tugudushbitbucket-mcp-this-project)
  - [2. aashari/mcp-server-atlassian-bitbucket](#2-aasharimcp-server-atlassian-bitbucket)
  - [3. MatanYemini/bitbucket-mcp](#3-matanyeminibitbucket-mcp)
  - [4. pdogra1299/bitbucket-mcp-server](#4-pdogra1299bitbucket-mcp-server)
  - [5. garc33/bitbucket-server-mcp-server](#5-garc33bitbucket-server-mcp-server)
  - [6. RexySaragih/mcp-bitbucket](#6-rexysaragihmcp-bitbucket)
- [Final Ranking](#final-ranking)
- [Key Takeaways](#key-takeaways)

---

## Executive Summary

Six Bitbucket MCP server implementations were evaluated across architecture, feature coverage, code quality, testing, documentation, security, and community adoption. Each serves slightly different niches — Cloud vs. Server APIs, read-only vs. read-write, monolithic vs. modular — but all aim to bridge Bitbucket with AI assistants via the Model Context Protocol.

---

## Quick Comparison Matrix

| Feature | tugudush (Ours) | aashari | MatanYemini | pdogra1299 | garc33 | RexySaragih |
|---|---|---|---|---|---|---|
| **GitHub Stars** | N/A (private) | 109 | 84 | 16 | 51 | 2 |
| **Forks** | N/A | 44 | 48 | 8 | 33 | 0 |
| **Target Platform** | Cloud | Cloud | Cloud + Server | Cloud + Server | Server (on-prem) | Cloud |
| **Language** | TypeScript | TypeScript | TypeScript | TypeScript | TypeScript | TypeScript |
| **Total Tools** | 37 | 6 (generic) | ~30+ | ~35+ | 14 | ~15 |
| **Read/Write** | Read-only | Read + Write | Read + Write | Read + Write | Read + Write | Read + Write |
| **Input Validation** | Zod schemas | Zod schemas | Manual/Zod | Axios-based | Manual | Zod |
| **Architecture** | Modular handlers | Controllers/Services/CLI | Monolithic (single file) | Handlers + Tools | Monolithic (single file) | Modular (tools/) |
| **Test Suite** | 148 unit + 31 integration | Jest configured | Jest configured | None | 1 test file | None |
| **Test Coverage** | 92.2% statements | Present but unknown % | Present but unknown % | None | Minimal | None |
| **npm Published** | Yes (`@tugudush/bitbucket-mcp`) | Yes (`@aashari/...`) | Yes (`bitbucket-mcp`) | Yes (`@nexus2520/...`) | No | No |
| **Docker Support** | No | No | No | No | Yes | No |
| **Smithery Listing** | No | No | No | No | Yes | No |
| **HTTP Transport** | No | Yes (stdio + HTTP) | No | No | No | No |
| **CLI Mode** | No | Yes | No | No | No | No |
| **Error Handling** | Custom error classes | Standard | Standard | Standard | Standard | Standard |
| **Retry Logic** | Yes (3 attempts) | Unknown | Unknown | No | No | No |
| **Rate Limit Handling** | Respects limits | Unknown | Unknown | No | No | No |
| **Pagination Support** | Full (fetchAllPages) | Via query params | Auto-follow (`all` flag) | Server-level pagination | Yes | Yes |
| **Code Search** | Yes | Via generic GET | No | Server-only | Yes | No |
| **File Browsing** | Yes | Via generic GET | No | Yes | Yes | No |
| **PR Comments** | Yes (single + threads) | Via generic tools | Yes (CRUD + inline) | Yes (with code suggestions) | Yes (threaded) | Yes |
| **Branch Handling** | Complex names supported | Via API paths | Standard | Standard | Standard | Standard |
| **Linting** | ESLint + Prettier | ESLint + Prettier | ESLint | None | ESLint | None |
| **CI/CD** | Husky pre-commit | Semantic release | CodeQL GitHub Actions | None | GitHub Actions | None |
| **License** | MIT | ISC | MIT | MIT | Apache 2.0 | None |
| **Last Updated** | Feb 2026 (active) | Feb 2026 (active) | Jan 2026 | Jan 2026 | Oct 2025 | Feb 2026 |

---

## Detailed Reviews

### 1. @tugudush/bitbucket-mcp (This Project)

**Repository**: This codebase
**Version**: 3.3.1 | **Platform**: Bitbucket Cloud | **Stars**: N/A (private)

#### Architecture — ★★★★★

The most architecturally mature implementation reviewed:

- **Modular handler registry pattern** with 8 domain-specific handler files (`repository.ts`, `pullrequest.ts`, `commit.ts`, `diff.ts`, `workspace.ts`, `search.ts`, `issue.ts`, `pipeline.ts`)
- **Centralized Zod schemas** in a dedicated `schemas.ts` with `.describe()` annotations for automatic documentation
- **`zodToJsonSchema()`** for auto-generating MCP tool input schemas — eliminates manual schema maintenance
- **Clean separation**: `api.ts` (HTTP layer), `config.ts` (environment), `errors.ts` (error classes), `tools.ts` (routing), `types.ts` (interfaces)
- **Handler registry** replaces switch-case: easy to add new tools without touching routing logic

#### Features — ★★★★★

- **37 total tools** (31 testable) — the most comprehensive read-only coverage
- Covers repositories, PRs, commits, diffs, branches, tags, pipelines, issues, workspaces, code search, file content, file history, user info
- **`fetchAllPages<T>()`** generic utility for exhaustive pagination
- **Complex branch name handling** with hybrid URL pattern (root vs. subdirectory)
- **PR comment threads** with full nested reply resolution
- **Code search** with language filtering and rich match highlighting

#### Code Quality — ★★★★★

- **Strict TypeScript** with comprehensive interfaces (no `any` usage in public API)
- **Custom error classes** (`AuthenticationError`, `NotFoundError`, etc.) with contextual suggestions
- **API retry logic** (3 attempts) with proper error surfacing
- **Lazy config loading** to handle environment variable timing issues
- **`API_CONSTANTS`** centralized for maintainability
- Full lint + typecheck + format pipeline (`npm run ltfb`)

#### Testing — ★★★★★

- **148 unit tests across 11 suites** — by far the most comprehensive
- **92.2% statement coverage** with Jest 30
- **31/37 integration tests** verified against real Bitbucket API
- Handler mocks for `makeRequest`/`makeTextRequest` with formatting and pagination verification
- **Copilot instruction file** (`.github/copilot-instructions.md`) documenting all patterns

#### Security — ★★★★★

- **Read-only by design** — no POST/PUT/DELETE at any level
- **Runtime GET-only enforcement** in `makeRequest()`
- **Sensitive data guidelines** in documentation
- API token + email authentication (no deprecated app passwords)

#### Documentation — ★★★★★

- Extremely thorough `copilot-instructions.md` (effectively an architecture decision record)
- CHANGELOG, PUBLISHING guide, test results documentation
- Inline JSDoc comments throughout
- Version management scripts

#### Weaknesses

- **Read-only only** — no write operations (by design, but limits use cases)
- **No HTTP transport** — stdio only
- **No CLI mode** for standalone testing
- **No Docker support**
- **Cloud-only** — no Bitbucket Server/Data Center support

---

### 2. aashari/mcp-server-atlassian-bitbucket

**Repository**: https://github.com/aashari/mcp-server-atlassian-bitbucket
**Version**: 3.0.0 | **Platform**: Bitbucket Cloud | **Stars**: 109 | **Forks**: 44

#### Architecture — ★★★★☆

- **Well-structured MVC-like pattern**: `controllers/`, `services/`, `tools/`, `cli/`, `types/`, `utils/`
- **Generic API approach** with just 6 tools (`bb_get`, `bb_post`, `bb_put`, `bb_patch`, `bb_delete`, `bb_clone`)
- Uses the raw Bitbucket API paths directly — maximum flexibility but shifts complexity to the user/AI
- **Dual transport**: stdio (default) + HTTP mode with Express
- **CLI mode** for direct terminal usage without MCP
- **TOON format** (Token-Oriented Object Notation) for 30-60% token cost savings
- **JMESPath filtering** for response transformation

#### Features — ★★★★☆

- **6 generic tools** that can access ANY Bitbucket API endpoint
- Covers all read AND write operations through generic HTTP verbs
- **Repository cloning** via `bb_clone` tool
- **JMESPath** (`jq` parameter) for powerful response filtering
- Full CRUD on PRs, comments, branches, etc.
- **Scoped API Token support** with deprecation warnings for app passwords

#### Code Quality — ★★★★☆

- **Clean TypeScript** with proper typing
- **Semantic versioning** with automated release pipeline
- **Prettier + ESLint** configuration
- Dependencies are modern and well-maintained
- Good use of Zod for validation

#### Testing — ★★★☆☆

- Jest configured with `ts-jest`
- CLI integration tests present
- Coverage reporting configured but actual coverage percentage unknown
- Test infrastructure is solid but less proven than our suite

#### Security — ★★★☆☆

- **Full read/write access** including DELETE operations — higher risk surface
- Scoped API token support is a security positive
- No runtime write protection mechanism
- Generic tools mean any API call is possible (potential for unintended mutations)

#### Documentation — ★★★★★

- **Excellent user-facing documentation** — best README of all reviewed projects
- Real-world examples, cost optimization tips, JMESPath patterns
- Multiple AI assistant configuration examples (Claude, Cursor, Continue.dev, Cline)
- CLI usage documentation
- Debug mode documentation

#### Weaknesses

- **Generic tools are a double-edged sword** — users must know exact Bitbucket API paths
- No purpose-built tools for common operations (AI must construct API paths)
- Write operations without safety guardrails
- No Bitbucket Server support (Cloud only)

---

### 3. MatanYemini/bitbucket-mcp

**Repository**: https://github.com/MatanYemini/bitbucket-mcp
**Version**: 5.0.6 | **Platform**: Cloud + Server | **Stars**: 84 | **Forks**: 48

#### Architecture — ★★☆☆☆

- **Monolithic single-file architecture** — `src/index.ts` is **141,809 bytes** (~3,500+ lines)
- Only one additional file: `src/pagination.ts`
- All tool definitions, handlers, API calls, and types in a single file
- No separation of concerns — extremely difficult to maintain or extend
- Uses axios for HTTP requests

#### Features — ★★★★★

- **Most feature-rich for write operations**: create/update/merge/decline PRs, approve, request changes
- **Draft PR support** (create, publish, convert to draft)
- **Inline PR comments** with file path and line number
- **Comment CRUD** (create, read, update, delete, resolve, reopen)
- **PR tasks** management (Bitbucket Server)
- **Dangerous operations** gating via `BITBUCKET_ENABLE_DANGEROUS` flag
- **Auto-pagination** with `all: true` flag and 1,000 item safety cap
- **Cloud + Server dual support** — one of only two projects supporting both
- **Configurable logging** with Winston

#### Code Quality — ★★☆☆☆

- 141KB single file is a major red flag for maintainability
- Dependencies slightly outdated (MCP SDK `1.1.1` vs. latest)
- **npm published** and actively maintained
- CodeQL security scanning via GitHub Actions
- Has ESLint but the monolithic structure undermines its value

#### Testing — ★★☆☆☆

- Jest configured in `package.json`
- Tests exist but scope/coverage is unclear from repository structure
- No visible test directory in `src/` — tests may be minimal

#### Security — ★★★★☆

- **`BITBUCKET_ENABLE_DANGEROUS` flag** for gating destructive operations — good safety pattern
- CodeQL scanning on PRs
- "Safety First" messaging in README
- Still allows write operations when enabled

#### Documentation — ★★★★☆

- Comprehensive README with all tools documented
- Installation via npx well-documented
- Troubleshooting section for common auth errors
- Cursor integration guide
- Some redundancy in README (pagination params repeated multiple times)

#### Weaknesses

- **Monolithic 141KB single file** — extremely poor maintainability
- No modular architecture
- Limited separation of concerns
- Dependencies lagging behind
- Test coverage unclear

---

### 4. pdogra1299/bitbucket-mcp-server

**Repository**: https://github.com/pdogra1299/bitbucket-mcp-server
**Version**: 1.4.0 | **Platform**: Cloud + Server | **Stars**: 16 | **Forks**: 8

#### Architecture — ★★★☆☆

- **Reasonable modular structure**: `src/handlers/`, `src/tools/`, `src/types/`, `src/utils/`
- Tool definitions in dedicated `definitions.ts` (33KB — large but at least separated)
- Clean `index.ts` entry point (8KB)
- Supports both Cloud and Server via `BITBUCKET_BASE_URL` toggle

#### Features — ★★★★★

- **Most comprehensive tool set for write operations** including:
  - PR tasks (create, update, mark done, delete, convert to/from comments) — **Bitbucket Server only**
  - Code suggestions in comments (markdown suggestion blocks)
  - **Code snippet-based commenting** (auto-find line numbers from code snippets)
  - Search code and search repositories
  - File operations (list, search, get content)
  - Full PR lifecycle (create, update, approve, decline, merge, request changes)
  - Branch management (list, get, delete with protection)
- **Smart truncation** for large files
- **Dual platform**: Cloud + Server with different auth flows

#### Code Quality — ★★★☆☆

- TypeScript with reasonable typing
- Uses axios for HTTP
- No linting or formatting tools configured
- No test suite at all
- `memory-bank/` directory suggests Cursor/Windsurf integration for development context
- Missing ESLint, Prettier, or any code quality tooling

#### Testing — ☆☆☆☆☆

- **No test suite** — zero tests, no Jest configuration
- No test scripts in `package.json`
- Represents a significant quality gap

#### Security — ★★☆☆☆

- Full read/write including delete and merge operations
- No safety flags or dangerous operation gating
- App password auth (no scoped API token support noted)
- No runtime protection for write operations

#### Documentation — ★★★★☆

- Extensive README (45KB) with detailed tool documentation
- SETUP_GUIDE for both Cloud and Server
- CHANGELOG maintained
- Good usage examples with code snippets
- `memory-bank/` provides internal development context

#### Weaknesses

- **Zero test coverage** — critical gap for production use
- No code quality tooling (lint, format)
- Large tool definitions file suggests some architectural debt
- No CI/CD pipeline visible
- No Docker support

---

### 5. garc33/bitbucket-server-mcp-server

**Repository**: https://github.com/garc33/bitbucket-server-mcp-server
**Version**: 1.0.0 | **Platform**: Bitbucket Server (on-prem) | **Stars**: 51 | **Forks**: 33

#### Architecture — ★★☆☆☆

- **Monolithic single-file** — `src/index.ts` at 47KB
- One test file in `src/__tests__/`
- Uses axios + Winston
- Simple but not scalable

#### Features — ★★★★☆

- **14 tools** focused on Bitbucket Server (on-premises) workflows
- `list_projects`, `list_repositories`, `create_pull_request`, `merge_pull_request`, `decline_pull_request`
- **Advanced code and file search** with project/repo scoping
- `get_file_content` with pagination
- `browse_repository` for directory navigation
- **read-only mode** via `BITBUCKET_READ_ONLY` env var
- **Large diff handling** with per-file `maxLinesPerFile` truncation (first 60% + last 40%)
- **Smithery listing** for easy installation
- **Docker support** via Dockerfile

#### Code Quality — ★★★☆☆

- TypeScript with basic typing
- ESLint configured
- Prettier available
- Winston logging
- Code is functional but the monolithic structure limits quality

#### Testing — ★★☆☆☆

- Single test file (`index.test.ts`, ~9.5KB)
- Jest configured
- Minimal coverage compared to the codebase size

#### Security — ★★★☆☆

- **Read-only mode** configurable — good safety pattern
- Supports token and username/password auth
- Write operations available by default
- No runtime write protection beyond config flag

#### Documentation — ★★★★☆

- Well-structured README with usage examples
- Per-tool documentation with use cases
- Docker and Smithery installation guides
- Read-only mode documentation
- Configuration examples for VS Code MCP settings

#### Weaknesses

- **Monolithic 47KB single file**
- **Bitbucket Server only** — no Cloud support
- Minimal test coverage
- Not npm published
- Last updated October 2025 — potentially stale

---

### 6. RexySaragih/mcp-bitbucket

**Repository**: https://github.com/RexySaragih/mcp-bitbucket
**Version**: 1.0.0 | **Platform**: Bitbucket Cloud | **Stars**: 2 | **Forks**: 0

#### Architecture — ★★★☆☆

- **Modular structure**: `src/clients/`, `src/tools/`, `src/types/`, `src/utils/`
- Domain-specific tool files: `branch.ts`, `pull-request.ts`, `repository.ts`, `file-operations.ts`
- Clean entry point at 4.5KB
- Uses `@modelcontextprotocol/sdk` 1.0.4 (very old version)

#### Features — ★★★★☆

- ~15 tools covering read + write operations
- **File write operations** (`write_file`, `commit_files`) — unique among reviewed projects
- Branch creation from Jira tickets with auto-naming
- PR CRUD (create, update with merge, inline comments)
- Code search, branch compare
- **Smart parameter handling** with URL extraction from Bitbucket URLs
- **Environment variable fallbacks** for workspace/repository
- `.env` file support via dotenv

#### Code Quality — ★★☆☆☆

- TypeScript but using very old MCP SDK (1.0.4)
- No linting or formatting configured
- No license file
- Zod 4.x for validation (modern)
- Minimal external dependencies

#### Testing — ☆☆☆☆☆

- **No tests at all** — no Jest, no test scripts
- No CI/CD pipeline

#### Security — ★★☆☆☆

- Full read/write including file mutations and branch deletion
- Protected branch checks for delete operations
- No dangerous operation gating
- Atlassian API token auth

#### Documentation — ★★★☆☆

- README covers all tools with examples
- Cursor configuration guide
- Smart parameter handling documentation
- `.env` setup instructions
- Missing license, contributing guidelines

#### Weaknesses

- **Very new** (January 2026) with minimal community adoption
- **No tests** whatsoever
- **No license** — legally ambiguous for use
- Old MCP SDK version (1.0.4)
- No npm publication
- No CI/CD, linting, or formatting

---

## Final Ranking

| Rank | Project | Overall Score | Best For |
|------|---------|--------------|----------|
| **#1** | **@tugudush/bitbucket-mcp** (Ours) | ★★★★★ (4.8/5) | Production-grade read-only Bitbucket Cloud operations with best-in-class testing and architecture |
| **#2** | **aashari/mcp-server-atlassian-bitbucket** | ★★★★☆ (4.2/5) | Flexible generic API access with excellent documentation and token optimization |
| **#3** | **pdogra1299/bitbucket-mcp-server** | ★★★☆☆ (3.3/5) | Most comprehensive write features for Cloud + Server with innovative commenting |
| **#4** | **MatanYemini/bitbucket-mcp** | ★★★☆☆ (3.2/5) | Widest feature set with safety-gated write ops, limited by monolithic architecture |
| **#5** | **garc33/bitbucket-server-mcp-server** | ★★★☆☆ (3.0/5) | Best choice for Bitbucket Server (on-premise) with Docker support |
| **#6** | **RexySaragih/mcp-bitbucket** | ★★☆☆☆ (2.2/5) | File write operations, but too immature for production use |

### Scoring Breakdown

| Category (Weight) | tugudush | aashari | pdogra1299 | MatanYemini | garc33 | RexySaragih |
|---|---|---|---|---|---|---|
| Architecture (20%) | 5.0 | 4.0 | 3.0 | 2.0 | 2.0 | 3.0 |
| Features (20%) | 4.5 | 4.0 | 5.0 | 5.0 | 4.0 | 4.0 |
| Code Quality (15%) | 5.0 | 4.0 | 3.0 | 2.0 | 3.0 | 2.0 |
| Testing (20%) | 5.0 | 3.0 | 0.0 | 2.0 | 2.0 | 0.0 |
| Security (10%) | 5.0 | 3.0 | 2.0 | 4.0 | 3.0 | 2.0 |
| Documentation (10%) | 5.0 | 5.0 | 4.0 | 4.0 | 4.0 | 3.0 |
| Community/Maturity (5%) | 3.0 | 5.0 | 2.0 | 4.0 | 3.0 | 1.0 |
| **Weighted Total** | **4.8** | **3.8** | **2.8** | **2.9** | **2.8** | **2.2** |

---

## Key Takeaways

### Why Our Project Leads

1. **Best-in-class testing** — 148 unit tests with 92.2% coverage is unmatched in this space
2. **Cleanest architecture** — modular handler registry pattern is maintainable and extensible
3. **Production-grade error handling** — custom error classes with retry logic
4. **Read-only safety** — zero risk of accidental data mutation, enforced at runtime
5. **Comprehensive Bitbucket Cloud coverage** — 37 tools covering virtually all read operations

### Where Others Excel

- **aashari** — generic API approach provides unmatched flexibility; TOON format and JMESPath are innovative for token optimization; best community adoption (109 stars)
- **pdogra1299** — code snippet-based commenting and PR tasks are unique features
- **MatanYemini** — broadest feature set overall; dangerous operation gating is a smart safety pattern; most forks (48) indicating community interest
- **garc33** — only viable option for Bitbucket Server (on-premise); Docker support and Smithery listing set it apart for enterprise use
- **RexySaragih** — file write operations (`write_file`, `commit_files`) are unique and valuable

### Improvement Opportunities for Our Project

Based on this review, features worth considering:

1. **Write operations** (with safety gating like MatanYemini's `BITBUCKET_ENABLE_DANGEROUS`)
2. **Bitbucket Server support** (like pdogra1299 and MatanYemini)
3. **HTTP transport mode** (like aashari) for debugging and multi-client support
4. **CLI mode** for standalone testing without MCP client
5. **TOON/JMESPath-style response filtering** for token optimization
6. **Docker support** for containerized deployments
7. **npm/Smithery publication** for wider distribution
8. **Generic fallback tool** (like aashari's `bb_get`) for API endpoints not covered by specific tools

---

*This review was conducted by analyzing public GitHub repositories, their source code, documentation, structure, and community metrics. All assessments are based on the state of each project as of February 10, 2026.*
