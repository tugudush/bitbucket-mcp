# Bitbucket MCP Server - AI Coding Instructions

## Architecture Overview

This is a **Model Context Protocol (MCP)** server providing read-only access to Bitbucket API v2.0. The architecture follows a single-file pattern with clear separation of concerns:

- **TypeScript interfaces** (lines 15-142 in `src/index.ts`) - Strict typing for all Bitbucket API responses
- **Zod schemas** (lines 144-229) - Input validation using `z.object()` with descriptive field documentation
- **Tool registration** (lines 309-365) - Each tool uses `zodToJsonSchema()` for automatic schema generation
- **Tool implementations** (lines 373-870) - Switch-case pattern with typed `makeRequest<T>()` calls

## Critical Development Workflow

### Quality Pipeline (Essential)
```bash
npm run ltf    # lint → format → typecheck (before commits)
npm run build  # TypeScript compilation + executable permissions
npm run watch  # Development mode with auto-rebuild
```

### MCP Server Testing
```bash
# Manual server test (should show startup message)
node build/index.js

# Test with authentication
BITBUCKET_USERNAME=user BITBUCKET_APP_PASSWORD=pass node build/index.js
```

## Project-Specific Patterns

### 1. Tool Naming Convention
**All tools MUST use `bb_` prefix** to avoid MCP namespace conflicts:
```typescript
name: 'bb_get_repository'  // ✅ Correct
name: 'get_repository'     // ❌ Wrong - conflicts with GitHub MCP
```

### 2. Authentication Pattern
Environment-based with graceful fallback:
```typescript
// From src/index.ts lines 276-283
const username = process.env.BITBUCKET_USERNAME;
const appPassword = process.env.BITBUCKET_APP_PASSWORD;
if (username && appPassword) {
  const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');
  headers.Authorization = `Basic ${auth}`;
}
```

### 3. Error Handling Standard
Bitbucket-specific error wrapping with API context:
```typescript
throw new Error(`Bitbucket API error: ${response.status} ${response.statusText} - ${errorText}`);
```

### 4. TypeScript Interface Pattern
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

### Claude Desktop Integration
- Requires `claude_desktop_config.json` modification with `mcpServers` section
- Environment variables passed via `env` object in configuration

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

- **Read-only by design** - No POST/PUT/DELETE operations
- **Rate limiting** - Respects Bitbucket API limits (no custom throttling)
- **Private repos** - Require authentication; public repos work without credentials
- **File size limits** - Large files may be truncated by Bitbucket API

## Tool Development Guidelines

When adding new tools:
1. Create TypeScript interface for API response
2. Define Zod schema with `.describe()` for each field
3. Register tool with `bb_` prefix in `ListToolsRequestSchema` handler
4. Implement in `CallToolRequestSchema` switch statement
5. Use typed `makeRequest<YourInterface>()` calls
6. Format response as readable text with consistent structure

See existing tools like `bb_get_repository` (lines 373-405) as reference pattern.
