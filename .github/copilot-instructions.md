# Bitbucket MCP Server - AI Coding Instructions

## Architecture Overview

This is a **Model Context Protocol (MCP)** server providing read-only access to Bitbucket API v2.0. The architecture follows a modular pattern with clear separation of concerns:

- **TypeScript interfaces** - Strict typing for all Bitbucket API responses
- **Zod schemas** - Input validation using `z.object()` with descriptive field documentation
- **Tool registration** - Each tool uses `zodToJsonSchema()` for automatic schema generation  
- **Tool implementations** - Switch-case pattern with typed `makeRequest<T>()` calls
- **Authentication system** - Supports API tokens
- **Branch handling** - Uses `?at=branch` for listings and `/src/{ref}/{file}` for file content
- **Read-only by design** - All operations are safe GET requests

## Enhanced Features (2025 Update)

### Modular Architecture
- **`src/index.ts`** - Main MCP server with tool implementations
- **`src/config.ts`** - Configuration management with Zod validation
- **`src/errors.ts`** - Custom error classes with helpful suggestions

### Authentication & Security
- **API Token Priority**: Uses `BITBUCKET_API_TOKEN` + `BITBUCKET_EMAIL`
- **Runtime Protection**: Blocks non-GET requests at the `makeRequest()` level
- **Configuration Validation**: Type-safe environment variable parsing with error suggestions

### Working Tools
- **`bb_list_workspaces`** - Workspace discovery and exploration
- **`bb_browse_repository`** - Repository structure navigation
- **`bb_get_file_content`** - Line-based pagination (1-10,000 lines)
- **`bb_search_code`** - Code search with language filtering (requires account enablement)

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

## Security & Limitations

- **Read-only by design** - No POST/PUT/DELETE operations at any level
- **Runtime protection** - `makeRequest()` blocks non-GET methods
- **Rate limiting** - Respects Bitbucket API limits (no custom throttling)
- **Private repos** - Require authentication; public repos work without credentials
- **File size limits** - Large files handled with pagination (up to 10,000 lines per request)
- **Code search** - Requires account-level enablement in Bitbucket settings

## Recent Improvements (2025-08)

### Removed Redundant Features
- **BITBUCKET_READ_ONLY setting**: Removed as redundant (all operations are read-only by design)
- **ReadOnlyModeError class**: Simplified to regular Error for non-GET protection
- **Tool filtering logic**: Unnecessary since no write operations exist

### Enhanced Configuration
- **Type-safe config**: Zod schema validation with helpful error messages
- **Authentication detection**: Automatic method detection with deprecation warnings
- **Enhanced logging**: Clear startup status with emojis (🔒 Mode, 🔐 Auth, ⚠️ Warnings)

### Improved Error Handling
- **Custom error classes**: Context-aware errors with helpful suggestions
- **Resource-specific messages**: Better error context based on API URL patterns
- **Graceful degradation**: Fallback authentication methods with warnings

## Tool Development Guidelines

When adding new tools:
1. Create TypeScript interface for API response
2. Define Zod schema with `.describe()` for each field
3. Register tool with `bb_` prefix in `ListToolsRequestSchema` handler
4. Implement in `CallToolRequestSchema` switch statement
5. Use typed `makeRequest<YourInterface>()` calls
6. Format response as readable text with consistent structure
7. Add pagination support for large datasets using `API_CONSTANTS`
8. Handle errors with `createApiError()` function

See existing tools like `bb_browse_repository` as reference pattern for enhanced features.

## Integration Points & Configuration

### VS Code MCP Integration
- Configuration in `.vscode/mcp.json` using stdio transport
- Path formats: Windows supports both `C:\\path\\to\\build\\index.js` and `C:/path/to/build/index.js`
- Use `${workspaceFolder}/build/index.js` for workspace-relative paths
- **Auth**: Use `BITBUCKET_API_TOKEN` + `BITBUCKET_EMAIL`

### Claude Desktop Integration
- Requires `claude_desktop_config.json` modification with `mcpServers` section
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
