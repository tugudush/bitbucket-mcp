# Bitbucket MCP Server - AI Coding Instructions

⚠️ **DEVELOPMENT STATUS**: This is an actively developed project with ongoing improvements and potential breaking changes.

## Architecture Overview

This is a **Model Context Protocol (MCP)** server providing read-only access to Bitbucket API v2.0. The architecture follows a single-file pattern with clear separation of concerns:

- **TypeScript interfaces** - Strict typing for all Bitbucket API responses
- **Zod schemas** - Input validation using `z.object()` with descriptive field documentation
- **Tool registration** - Each tool uses `zodToJsonSchema()` for automatic schema generation  
- **Tool implementations** - Switch-case pattern with typed `makeRequest<T>()` calls
- **Authentication system** - Supports both API tokens (recommended) and App Passwords (legacy)
- **Branch handling** - Uses `?at=branch` for listings and `/src/{ref}/{file}` for file content
- **Read-only mode** - Optional security enhancement with `BITBUCKET_READ_ONLY=true`

## Enhanced Features (2025 Update)

### New Tools Added
- **`bb_list_workspaces`** - Workspace discovery and exploration
- **`bb_browse_repository`** - Repository structure navigation
- **Enhanced `bb_get_file_content`** - Line-based pagination (1-10,000 lines)
- **`bb_search_code`** - Code search with language filtering and match highlighting

### Removed Features
- **None** - All features are now operational

### Code Search Implementation
- **Working endpoint**: `/2.0/workspaces/{workspace}/search/code` 
- **Requirement**: Code search must be enabled in Bitbucket account settings `https://bitbucket.org/search`
- **Features**: Language filtering, repository scoping, rich match highlighting with line numbers

### Security Enhancement: Read-Only Mode
```bash
# Enable maximum security mode
export BITBUCKET_READ_ONLY=true
node build/index.js  # Shows "Mode: READ-ONLY" in startup

# Normal mode (default)
export BITBUCKET_READ_ONLY=false  # or unset
node build/index.js  # Shows "Mode: FULL ACCESS" in startup
```

Read-only mode filters available tools and provides runtime protection against accidental modifications.

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

# Test with API token authentication (recommended)
BITBUCKET_API_TOKEN=token BITBUCKET_EMAIL=email node build/index.js

# Test with legacy App Password authentication  
BITBUCKET_USERNAME=user BITBUCKET_APP_PASSWORD=pass node build/index.js

# Test read-only mode
BITBUCKET_READ_ONLY=true node build/index.js
```

## Project-Specific Patterns

### 1. Tool Naming Convention
**All tools MUST use `bb_` prefix** to avoid MCP namespace conflicts:
```typescript
name: 'bb_get_repository'  // ✅ Correct
name: 'get_repository'     // ❌ Wrong - conflicts with GitHub MCP
```

### 2. Enhanced Authentication Pattern
Environment-based with graceful fallback (prioritizes API tokens over App Passwords):
```typescript
// From src/index.ts - Updated for API token migration
const apiToken = process.env.BITBUCKET_API_TOKEN;
const email = process.env.BITBUCKET_EMAIL;
const username = process.env.BITBUCKET_USERNAME;
const appPassword = process.env.BITBUCKET_APP_PASSWORD;

if (apiToken && email) {
  // Use Basic authentication with email (recommended)
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
  headers.Authorization = `Basic ${auth}`;
} else if (username && appPassword) {
  // Use Basic authentication with username (legacy fallback)
  const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');
  headers.Authorization = `Basic ${auth}`;
}
```

### 3. Read-Only Mode Pattern
Tool filtering based on security requirements:
```typescript
// Filter tools in read-only mode
const availableTools = isReadOnlyMode 
  ? allTools.filter(tool => readOnlyTools.includes(tool.name))
  : allTools;

// Runtime protection
if (isReadOnlyMode && !readOnlyTools.includes(name)) {
  throw new Error(`Tool ${name} is not available in read-only mode`);
}
```

### 4. Enhanced File Content with Pagination
Line-based pagination for large files:
```typescript
const start = parsed.start ? Math.max(1, parsed.start) : 1;
const limit = parsed.limit ? Math.min(parsed.limit, 10000) : 1000;
const endLine = Math.min(start + limit - 1, lines.length);
const paginatedLines = lines.slice(start - 1, endLine);
```

### 5. Repository Browsing Pattern
Directory navigation with item type icons:
```typescript
const itemList = data.values
  .map((item: BitbucketSrcItem) => {
    const isDir = item.type === 'commit_directory';
    const icon = isDir ? '📁' : '📄';
    return `${icon} ${item.path}`;
  }).join('\n');
```

### 6. Error Handling Standard
Bitbucket-specific error wrapping with API context:
```typescript
throw new Error(`Bitbucket API error: ${response.status} ${response.statusText} - ${errorText}`);
```

### 7. TypeScript Interface Pattern
**Always use strongly-typed interfaces instead of `any`**:
```typescript
const data = await makeRequest<BitbucketApiResponse<BitbucketRepository>>(url);
data.values.map((repo: BitbucketRepository) => ...)  // ✅ Type-safe
```

## Integration Points & Configuration

### VS Code MCP Integration
- Configuration in `.vscode/mcp.json` using stdio transport
- Path formats: Windows supports both `C:\\path\\to\\build\\index.js` and `C:/path/to/build/index.js`
- Use `${workspaceFolder}/build/index.js` for workspace-relative paths
- **Auth**: Use `BITBUCKET_API_TOKEN` + `BITBUCKET_EMAIL` (recommended) or legacy `BITBUCKET_USERNAME`+`BITBUCKET_APP_PASSWORD`
- **Security**: Add `BITBUCKET_READ_ONLY: "true"` for production environments

### Claude Desktop Integration
- Requires `claude_desktop_config.json` modification with `mcpServers` section
- Environment variables passed via `env` object in configuration
- **Migration Note**: App passwords deprecated Sept 9, 2025 - migrate to API tokens with email
- **Security**: Set `BITBUCKET_READ_ONLY` env var for safe operation

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

## Security & Limitations

- **Read-only by design** - No POST/PUT/DELETE operations enforced at multiple levels
- **Optional read-only mode** - Additional security layer with `BITBUCKET_READ_ONLY=true`
- **Rate limiting** - Respects Bitbucket API limits (no custom throttling)
- **Private repos** - Require authentication; public repos work without credentials
- **File size limits** - Large files handled with pagination (up to 10,000 lines per request)
- **Code search** - Requires account-level enablement in Bitbucket settings, provides rich search results with match highlighting

## Tool Development Guidelines

When adding new tools:
1. Create TypeScript interface for API response
2. Define Zod schema with `.describe()` for each field
3. Add tool name to `readOnlyTools` array if appropriate
4. Register tool with `bb_` prefix in `ListToolsRequestSchema` handler
5. Implement in `CallToolRequestSchema` switch statement
6. Use typed `makeRequest<YourInterface>()` calls
7. Format response as readable text with consistent structure
8. Add pagination support for large datasets

See existing tools like `bb_browse_repository` as reference pattern for enhanced features.

## Recent Fixes & Patterns

### Enhanced Features (2025-08)
- **Workspace discovery**: `bb_list_workspaces` for workspace exploration
- **Repository browsing**: `bb_browse_repository` for directory navigation
- **File pagination**: Enhanced `bb_get_file_content` with line-based pagination
- **Code search**: `bb_search_code` with language filtering and rich match highlighting
- **Read-only mode**: Security enhancement with tool filtering and runtime protection

### Branch Handling (Fixed 2025-08)
- **Directory listings**: Use `?at=branch` query parameter
- **File content**: Use `/src/{ref}/{file_path}` URL pattern
- **Avoid**: `/src/{file_path}?at=branch` (causes 404s)

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

# Browse repository structure  
bb_browse_repository --workspace myworkspace --repo_slug myrepo --limit 20

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
