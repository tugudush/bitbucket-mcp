# Bitbucket MCP Server - AI Coding Instructions

## Architecture Overview

This is a **Model Context Protocol (MCP)** server providing read-only access to Bitbucket API v2.0. The architecture follows a modular pattern with clear separation of concerns:

- **TypeScript interfaces** - Strict typing for all Bitbucket API responses
- **Zod schemas** - Input validation using `z.object()` with descriptive field documentation
- **Tool registration** - Each tool uses `zodToJsonSchema()` for automatic schema generation  
- **Handler registry pattern** - Modular domain-based handlers (replaces switch-case)
- **Authentication system** - Supports API tokens
- **Branch handling** - Uses `?at=branch` for listings and `/src/{ref}/{file}` for file content
- **Read-only by design** - All operations are safe GET requests

## Enhanced Features (2025-2026 Update)

### Modular Architecture
- **`src/index.ts`** - Main MCP server entry point
- **`src/tools.ts`** - Tool definitions and handler registry routing
- **`src/handlers/`** - Domain-specific tool handlers (repository, pullrequest, diff, etc.)
- **`src/handlers/index.ts`** - Central handler registry export
- **`src/handlers/types.ts`** - Shared handler interfaces
- **`src/config.ts`** - Configuration management with Zod validation
- **`src/errors.ts`** - Custom error classes with helpful suggestions
- **`src/api.ts`** - API layer with retry logic and dual response types
- **`src/types.ts`** - Comprehensive TypeScript interfaces
- **`src/schemas.ts`** - Centralized Zod schemas and API constants

### Authentication & Security
- **API Token Priority**: Uses `BITBUCKET_API_TOKEN` + `BITBUCKET_EMAIL`
- **Runtime Protection**: Blocks non-GET requests at the `makeRequest()` level
- **Configuration Validation**: Type-safe environment variable parsing with error suggestions

### Handler Registry Pattern (2025-2026)
Replaced large switch statements with modular, domain-based handlers:
```typescript
// src/handlers/index.ts - Central registry
export const toolHandlers: Record<string, ToolHandler> = {
  bb_get_repository: handleGetRepository,
  bb_list_repositories: handleListRepositories,
  bb_get_pull_requests: handleGetPullRequests,
  // ... 38 total tools organized by domain
};

// src/tools.ts - Clean lookup pattern
export async function handleToolCall(request: CallToolRequest) {
  const { name, arguments: args } = request.params;
  const handler = toolHandlers[name];
  return handler ? await handler(args) : errorResponse;
}
```

**Domain Organization:**
- `src/handlers/repository.ts` - Repository operations
- `src/handlers/pullrequest.ts` - Pull request operations
- `src/handlers/commit.ts` - Commit operations
- `src/handlers/diff.ts` - Diff operations
- `src/handlers/workspace.ts` - Workspace operations
- `src/handlers/search.ts` - Search operations
- `src/handlers/issue.ts` - Issue operations
- `src/handlers/pipeline.ts` - Pipeline operations

### Working Tools (38 total, 31 testable)
- **`bb_list_workspaces`** - Workspace discovery and exploration
- **`bb_browse_repository`** - Repository structure navigation
- **`bb_get_file_content`** - Line-based pagination (1-10,000 lines)
- **`bb_search_code`** - Code search with language filtering (requires account enablement)
- **`bb_get_pull_request_comment`** - Get a single PR comment by ID
- **`bb_get_comment_thread`** - Get comment thread with nested replies (fetches all pages)

**Test Coverage:** 148 unit tests across 11 suites (92.2% statements), plus 31/38 integration tests verified

## Critical Development Workflow

### Quality Pipeline (Essential)
```bash
npm run ltf     # lint → typecheck → format (recommended before commits)
npm run ltfb    # lint → typecheck → format → build (full pipeline)
npm run build   # TypeScript compilation + executable permissions
npm run watch   # Development mode with auto-rebuild
```

### MCP Server Testing
```bash
# Manual server test (should show startup message)
node build/index.js

# Test with API token authentication
BITBUCKET_API_TOKEN=token BITBUCKET_EMAIL=email node build/index.js
```

## Project-Specific Patterns

### 1. Tool Naming Convention
**All tools MUST use `bb_` prefix** to avoid MCP namespace conflicts:
```typescript
name: 'bb_get_repository'  // ✅ Correct
name: 'get_repository'     // ❌ Wrong - conflicts with GitHub MCP
```

### 2. Configuration Management Pattern
Environment-based with graceful fallback and type safety:
```typescript
// From src/config.ts - Uses Zod for validation
const ConfigSchema = z.object({
  BITBUCKET_API_TOKEN: z.string().optional(),
  BITBUCKET_EMAIL: z.string().email().optional(),
  // ... other fields
});

export function loadConfig(): Config {
  return ConfigSchema.parse(process.env);
}

// Authentication: API tokens
if (apiToken && email) {
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
  headers.Authorization = `Basic ${auth}`;
}
```

### 3. Error Handling Pattern
Custom error classes with context and suggestions:
```typescript
// From src/errors.ts
export class AuthenticationError extends BitbucketApiError {
  constructor(details?: string) {
    super(401, 'Unauthorized', details,
      'Check your authentication credentials (BITBUCKET_API_TOKEN + BITBUCKET_EMAIL)');
  }
}
```

### 4. Constants Management
Centralized API constants for maintainability:
```typescript
// From src/index.ts
const API_CONSTANTS = {
  MAX_PAGE_SIZE: 100,
  DEFAULT_FILE_LINES: 1000,
  MAX_FILE_LINES: 10000,
  DEFAULT_TIMEOUT_MS: 30000,
  REQUEST_TIMEOUT_MS: config.BITBUCKET_REQUEST_TIMEOUT,
  RETRY_ATTEMPTS: 3,
} as const;
```

### 5. File Content with Pagination
Line-based pagination for large files:
```typescript
const start = parsed.start ? Math.max(1, parsed.start) : 1;
const limit = parsed.limit ? Math.min(parsed.limit, API_CONSTANTS.MAX_FILE_LINES) : API_CONSTANTS.DEFAULT_FILE_LINES;
const endLine = Math.min(start + limit - 1, lines.length);
const paginatedLines = lines.slice(start - 1, endLine);
```

### 6. Repository Browsing Pattern
Directory navigation with item type icons:
```typescript
const itemList = data.values
  .map((item: BitbucketSrcItem) => {
    const isDir = item.type === 'commit_directory';
    const icon = isDir ? '📁' : '📄';
    return `${icon} ${item.path}`;
  }).join('\n');
```

### 7. TypeScript Interface Pattern
**Always use strongly-typed interfaces instead of `any`**:
```typescript
const data = await makeRequest<BitbucketApiResponse<BitbucketRepository>>(url);
data.values.map((repo: BitbucketRepository) => ...)  // ✅ Type-safe
```

### 8. Parameter Naming Conventions
**Critical**: Use exact parameter names defined in Zod schemas:
```typescript
// ✅ Correct parameter names
bb_get_commit({ commit: 'abc123' })        // NOT commit_hash
bb_get_tag({ name: 'v1.0.0' })             // NOT tag_name
bb_get_branch({ name: 'develop' })         // NOT branch_name
bb_get_merge_base({ revspec: 'a..b' })    // NOT spec

// Common mistakes found during testing:
// ❌ commit_hash → ✅ commit
// ❌ tag_name → ✅ name
// ❌ branch_name → ✅ name
// ❌ spec → ✅ revspec (for merge_base only)
```

**Reference**: Always check `src/schemas.ts` for exact parameter names before calling tools.

## Security & Limitations

- **Read-only by design** - No POST/PUT/DELETE operations at any level
- **Runtime protection** - `makeRequest()` blocks non-GET methods
- **Rate limiting** - Respects Bitbucket API limits (no custom throttling)
- **Private repos** - Require authentication; public repos work without credentials
- **File size limits** - Large files handled with pagination (up to 10,000 lines per request)
- **Code search** - Requires account-level enablement in Bitbucket settings

## Recent Improvements (2025-2026)

### Modular Architecture Refactoring (2026-02)
- **Handler Registry Pattern**: Replaced 500+ line switch statements with modular handlers
- **Domain Organization**: Tools organized by domain in `src/handlers/`
- **Type Safety**: Shared `ToolHandler` and `ToolResponse` interfaces
- **Maintainability**: Individual handler files easier to test and modify

### Comprehensive Testing (2026-02)
- **148 unit tests across 11 suites**: All 8 handler modules + api, config, errors
- **92.2% statement coverage**: `jest --coverage` fully operational (Jest 30)
- **31/38 integration tools verified**: 100% success on testable tools
- **Real-world validation**: Using actual production scenarios
- **Dynamic ID extraction**: Pattern for extracting IDs from responses
- **Discovery-based approach**: Sequential workspace → repo → PR → issue testing

### Enhanced Configuration (2025-08)
- **Type-safe config**: Zod schema validation with helpful error messages
- **Authentication detection**: Automatic method detection with deprecation warnings
- **Enhanced logging**: Clear startup status with emojis (🔒 Mode, 🔐 Auth, ⚠️ Warnings)
- **Lazy loading**: Fixed authentication timing issues with dynamic config loading

### Improved Error Handling (2025-08)
- **Custom error classes**: Context-aware errors with helpful suggestions
- **Resource-specific messages**: Better error context based on API URL patterns
- **Graceful degradation**: Fallback authentication methods with warnings

### Removed Redundant Features (2025-08)
- **BITBUCKET_READ_ONLY setting**: Removed as redundant (all operations are read-only by design)
- **ReadOnlyModeError class**: Simplified to regular Error for non-GET protection
- **Tool filtering logic**: Unnecessary since no write operations exist

## Tool Development Guidelines

When adding new tools:
1. Create TypeScript interface for API response in `src/types.ts`
2. Define Zod schema with `.describe()` for each field in `src/schemas.ts`
3. Create handler function in appropriate `src/handlers/*.ts` file
4. Register handler in `toolHandlers` registry in `src/handlers/index.ts`
5. Add tool definition in `getToolDefinitions()` in `src/tools.ts`
6. Use typed `makeRequest<YourInterface>()` calls
7. Format response as readable text with consistent structure
8. Add pagination support for large datasets using `API_CONSTANTS`
9. Handle errors with `createApiError()` function

**Example: Adding a new tool**
```typescript
// 1. Define interface in src/types.ts
export interface BitbucketDeployment {
  uuid: string;
  environment: string;
  state: string;
}

// 2. Define schema in src/schemas.ts
export const GetDeploymentsSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  pagelen: z.number().optional().describe(`Max ${API_CONSTANTS.MAX_PAGE_SIZE}`),
});

// 3. Create handler in src/handlers/repository.ts
export async function handleGetDeployments(args: unknown): Promise<ToolResponse> {
  const parsed = GetDeploymentsSchema.parse(args);
  const url = buildApiUrl(`/repositories/${parsed.workspace}/${parsed.repo_slug}/deployments`);
  const data = await makeRequest<BitbucketApiResponse<BitbucketDeployment>>(url);
  // Format and return response...
}

// 4. Register in src/handlers/index.ts
export const toolHandlers: Record<string, ToolHandler> = {
  // ... existing tools
  bb_get_deployments: handleGetDeployments,
};

// 5. Add definition in src/tools.ts
export function getToolDefinitions(): Tool[] {
  return [
    // ... existing tools
    {
      name: 'bb_get_deployments',
      description: 'Get deployments for a repository',
      inputSchema: zodToJsonSchema(GetDeploymentsSchema) as Tool['inputSchema'],
    },
  ];
}
```

See existing tools in `src/handlers/` for reference patterns.

## Testing Patterns

### Testing Approach
Test scripts should follow this pattern for comprehensive MCP tool coverage:

**Discovery-based testing approach:**
- Sequential discovery: workspaces → repos → PRs → issues
- Dynamic ID extraction from response text
- Credential loading from `.vscode/mcp.json`
- Pattern: Extract and reuse IDs for dependent tests

**Testing coverage areas:**
- Core repository operations (workspace, repo listing, browsing)
- Pull request functionality (listing, details, comments, diffs)
- Branch and commit operations (listing, details, comparisons)
- File operations (browsing, content retrieval, history)
- Search and discovery features
- User information retrieval

### Testing Pattern Example
```javascript
// Load credentials from .vscode/mcp.json
const mcpConfig = JSON.parse(fs.readFileSync(MCP_CONFIG_PATH, 'utf8'));
env = { ...process.env, ...mcpConfig.servers['bitbucket-mcp'].env };

// Run tool via MCP stdio protocol
function runTool(name, args) {
  const server = spawn(NODE_EXE, [SERVER_PATH], { env });
  const request = { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } };
  server.stdin.write(JSON.stringify(request) + '\n');
  // Parse JSON response from stdout
}

// Extract dynamic IDs from response text
const match = result.content[0].text.match(/- #(\d+):/);
const prId = match ? parseInt(match[1]) : null;
```

### Test Coverage
- **148 unit tests across 11 suites** (92.2% statement coverage)
- **31 out of 38 integration tools verified** (100% success on testable tools)
- Handler tests mock `makeRequest`/`makeTextRequest` and verify formatting, errors, pagination
- Some tools require specific repository features (issue trackers, CI/CD pipelines)

## Integration Points & Configuration

### VS Code MCP Integration
- Configuration in `.vscode/mcp.json` using stdio transport
- Path formats: Windows supports both `C:\\path\\to\\build\\index.js` and `C:/path/to/build/index.js`
- Use `${workspaceFolder}/build/index.js` for workspace-relative paths
- **Auth**: Use `BITBUCKET_API_TOKEN` + `BITBUCKET_EMAIL`

### Claude Code Integration
- CLI-based setup: `claude mcp add --transport stdio` with `--env` flags
- Project-scope config: `.mcp.json` file in project root
- Environment variables passed via `env` object in configuration
- **Note**: App passwords are deprecated - use API tokens with email

### Cross-Platform Considerations
- **Windows**: JSON paths handle spaces automatically, no extra escaping needed
- **chmod +x**: Unix executable permissions set during build (npm scripts)
- **Module type**: ES modules (`"type": "module"` in package.json)

## API Response Patterns

### Pagination Standard
Most endpoints follow this pattern:
```typescript
const params = new URLSearchParams();
if (parsed.page) params.append('page', parsed.page.toString());
if (parsed.pagelen) params.append('pagelen', Math.min(parsed.pagelen, 100).toString());
```

### Enhanced Search Pattern
**✅ WORKING**: Code search functionality available with account enablement:
```typescript
// ✅ Working endpoint in Bitbucket Cloud API:
// /2.0/workspaces/{workspace}/search/code

// Features available:
// - Repository scoping with repo_slug parameter
// - Language filtering with automatic mapping
// - Rich match highlighting with line numbers
// - Query enhancement with repo:, lang:, ext: filters
```

**✅ Repository Search**: Server-side BBQL filtering:
```typescript
// bb_search_repositories uses Bitbucket's q parameter (BBQL)
const q = `name ~ "${query}" OR description ~ "${query}"`;
const params = { q, pagelen: 100, sort: parsed.sort };
// No longer limited to single-page client-side filtering
```

Requirements for code search:
- Code search must be enabled in Bitbucket account settings
- Repository-scoped searches require repo_slug parameter
- Search indexing may take time for existing repositories

### Response Transformation
Convert API responses to readable text format for AI consumption:
```typescript
const prList = data.values
  .map((pr: BitbucketPullRequest) => 
    `- #${pr.id}: ${pr.title}\n` +
    `  Author: ${pr.author.display_name}\n` +
    `  State: ${pr.state}`
  ).join('\n\n');
```

## Recent Fixes & Patterns

### Authentication Configuration Fix (2025-08)
**Problem**: Configuration was loaded at module import time, causing environment variables set after import to be ignored.
**Solution**: Implemented lazy config loading using `getConfig()` function in `makeRequest()`.
```typescript
// Fixed pattern in src/api.ts
function getConfig() {
  return loadConfig();
}

export async function makeRequest<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
  // Get config dynamically to handle environment changes
  const config = getConfig();
  // ... rest of function
}
```

### Repository Browsing with Complex Branch Names (2025-08)
**Problem**: Branch names with forward slashes (e.g., `feature/SSP-1024`) failed when browsing subdirectories due to Bitbucket API URL parsing issues.
**Solution**: Hybrid approach using different URL patterns for root vs subdirectory browsing.

**Root Directory Pattern** (works with any branch name):
```
/repositories/{workspace}/{repo}/src/?at={branch}
```

**Subdirectory Pattern** (requires commit SHA):
```
/repositories/{workspace}/{repo}/src/{commit_sha}/{path}/
```

### Enhanced Features (2025-08)
- **Workspace discovery**: `bb_list_workspaces` for workspace exploration
- **Repository browsing**: `bb_browse_repository` for directory navigation with full branch support
- **Branch compatibility**: Handles complex branch names like `feature/SSP-1024`, `hotfix/security-patch`
- **File pagination**: Enhanced `bb_get_file_content` with line-based pagination
- **Code search**: `bb_search_code` with language filtering and rich match highlighting
- **Authentication fixes**: Lazy config loading resolves environment variable timing issues
- **PR comment retrieval**: `bb_get_pull_request_comment` fetches single comment by ID
- **Comment threads**: `bb_get_comment_thread` fetches root comment with all nested replies (paginated via `fetchAllPages()`)

### Pagination Utility (2026-02)
- **`fetchAllPages<T>()`**: Generic helper in `api.ts` that follows `next` links across all pages
- Safety limit of 50 pages (~5,000 items) to prevent infinite loops
- Used by `handleGetCommentThread()` for large PRs with >100 comments

### Branch Handling (Fixed 2025-08)
- **Root directory listings**: Use `?at=branch` query parameter (works with all branch names)
- **Subdirectory browsing**: Use `/src/{commit_sha}/{path}` pattern (resolves branch to commit SHA first)
- **Branch name support**: Handles special characters like `feature/SSP-1024` correctly
- **Dynamic commit resolution**: Automatically fetches commit SHA for branches when browsing subdirectories

### Repository Browsing Pattern (Enhanced 2025-08)
**Hybrid URL approach for robust branch handling:**
```typescript
if (path) {
  // For subdirectories: Get commit SHA first, then use /src/{commit_sha}/{path}
  const branchUrl = buildApiUrl(`/repositories/${workspace}/${repo_slug}/refs/branches/${encodeURIComponent(ref)}`);
  const branchData = await makeRequest<{ target: { hash: string } }>(branchUrl);
  const commitSha = branchData.target.hash;
  url = buildApiUrl(`/repositories/${workspace}/${repo_slug}/src/${commitSha}/${encodedPath}/`);
} else {
  // For root directory: Use ?at=branch (works with branch names containing slashes)
  url = buildApiUrl(`/repositories/${workspace}/${repo_slug}/src/?at=${encodeURIComponent(ref)}`);
}
```

### File Content URL Pattern (Fixed 2025-08)  
```typescript
// ✅ Correct pattern that works
const url = `${BITBUCKET_API_BASE}/repositories/${workspace}/${repo_slug}/src/${ref}/${file_path}`;

// ❌ Old pattern that failed
const url = `${BITBUCKET_API_BASE}/repositories/${workspace}/${repo_slug}/src/${file_path}?at=${ref}`;
```

## Usage Examples for Enhanced Features

### Workspace Discovery
```bash
# List accessible workspaces
bb_list_workspaces --pagelen 10

# Browse repository structure with complex branch names
bb_browse_repository --workspace myworkspace --repo_slug myrepo --ref "feature/SSP-1024" --limit 20
bb_browse_repository --workspace myworkspace --repo_slug myrepo --ref "hotfix/security-fix" --path "src"

# Browse subdirectories (automatically resolves commit SHA)
bb_browse_repository --workspace myworkspace --repo_slug myrepo --ref "feature/deployment" --path "src/components"

# Read file with pagination
bb_get_file_content --workspace myworkspace --repo_slug myrepo --file_path README.md --start 1 --limit 50

# Search for code (requires account-level enablement)
bb_search_code --workspace myworkspace --repo_slug myrepo --search_query "function authentication"
bb_search_code --workspace myworkspace --search_query "class extends"
```

### PR Comment Operations
```bash
# Get a single comment by ID
bb_get_pull_request_comment --workspace myworkspace --repo_slug myrepo --pull_request_id 123 --comment_id 12345678

# Get a comment thread with all nested replies
bb_get_comment_thread --workspace myworkspace --repo_slug myrepo --pull_request_id 123 --comment_id 12345678
```

## Development Status & References

🚧 **Active Development**: This project is under continuous development. Features may be incomplete or subject to breaking changes.

**Reference Implementations:**
- **[bitbucket-server-mcp-server](https://github.com/garc33/bitbucket-server-mcp-server)** - MCP server for Bitbucket Server (on-premises)
  - Useful for understanding server-side Bitbucket API patterns
  - Reference for authentication and repository management approaches
- **[mcp-server-atlassian-bitbucket](https://github.com/aashari/mcp-server-atlassian-bitbucket)** - Alternative Atlassian Bitbucket MCP implementation
  - Excellent reference for Cloud API integration patterns
  - Inspiration for tool naming conventions and response formatting

**Development Guidelines:**
1. Always check reference implementations before adding new features
2. Maintain compatibility with existing MCP patterns from reference repos
3. Follow read-only design principles established in this codebase
4. Test against both public and private repositories
5. Consider breaking changes impact on existing integrations
