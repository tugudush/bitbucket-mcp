# Bitbucket MCP Server

A **read-only** Model Context Protocol (MCP) server that provides secure access to Bitbucket repositories, pull requests, issues, and more. Integrates seamlessly with VS Code GitHub Copilot, Cursor, and Claude Desktop.

**🎯 38 tools available** | **✅ 100% tested** (31/38 tools verified) | **🏗️ Modular architecture**

## Requirements

- **Code Search**: Enable at https://bitbucket.org/search for `bb_search_code` functionality
- **Node.js**: Version 16+ with ES modules support
- **Authentication**: API token + email

> 💡 **How to create an API Token:**
> 1. Go to [https://id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
> 2. Click "Create API token"
> 3. Enter a label (e.g., "Bitbucket MCP Server")
> 4. Copy the generated token and use it as `BITBUCKET_API_TOKEN`
> 5. Use your Atlassian account email as `BITBUCKET_EMAIL`

## Installation

### Option 1: Install from NPM (Recommended)
```bash
npm install -g @tugudush/bitbucket-mcp
```

**Updating to the latest version:**
```bash
npm update -g @tugudush/bitbucket-mcp
```

### Option 2: Build from Source
```bash
git clone https://github.com/tugudush/bitbucket-mcp.git
cd bitbucket-mcp
npm install
npm run build
```

## Quick Start

### Integration

Configure your MCP client with authentication credentials.

#### Option A: Using NPM Global Installation (Recommended)

After installing with `npm install -g @tugudush/bitbucket-mcp`:

**VS Code GitHub Copilot**
```json
// .vscode/mcp.json
{
  "servers": {
    "bitbucket-mcp": {
      "type": "stdio",
      "command": "bitbucket-mcp",
      "env": {
        "BITBUCKET_API_TOKEN": "your-token",
        "BITBUCKET_EMAIL": "your@email.com"
      }
    }
  }
}
```

**Cursor**
```json
// ~/.cursor/mcp.json (global) or .cursor/mcp.json (per project)
{
  "mcpServers": {
    "bitbucket-mcp": {
      "command": "bitbucket-mcp",
      "env": {
        "BITBUCKET_API_TOKEN": "your-token",
        "BITBUCKET_EMAIL": "your@email.com"
      }
    }
  }
}
```

**Claude Desktop**
```json
// claude_desktop_config.json
{
  "mcpServers": {
    "bitbucket": {
      "command": "npx",
      "args": ["@tugudush/bitbucket-mcp"],
      "env": {
        "BITBUCKET_API_TOKEN": "your-token",
        "BITBUCKET_EMAIL": "your@email.com"
      }
    }
  }
}
```

#### Option B: Using Local Build (For Development)

If you built from source:

**VS Code GitHub Copilot**
```json
// .vscode/mcp.json
{
  "servers": {
    "bitbucket-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/build/index.js"],
      "env": {
        "BITBUCKET_API_TOKEN": "your-token",
        "BITBUCKET_EMAIL": "your@email.com"
      }
    }
  }
}
```

**Cursor**
```json
// ~/.cursor/mcp.json (global) or .cursor/mcp.json (per project)
{
  "mcpServers": {
    "bitbucket-mcp": {
      "command": "node",
      "args": ["/path/to/build/index.js"],
      "env": {
        "BITBUCKET_API_TOKEN": "your-token",
        "BITBUCKET_EMAIL": "your@email.com"
      }
    }
  }
}
```

**Claude Desktop**
```json
// claude_desktop_config.json
{
  "mcpServers": {
    "bitbucket": {
      "command": "node",
      "args": ["/path/to/build/index.js"],
      "env": {
        "BITBUCKET_API_TOKEN": "your-token",
        "BITBUCKET_EMAIL": "your@email.com"
      }
    }
  }
}
```

**💡 Tips**: 
- **Option A (NPM)**: Much simpler setup, no paths to manage, automatic updates available
- **Option B (Local)**: Replace `/path/to/build/index.js` with the absolute path to your built server
- Add your actual Bitbucket credentials to access private repositories

## Features

### 🗂️ Repository Management (8 tools)
- `bb_list_workspaces` - Discover accessible workspaces
- `bb_get_workspace` - Get workspace details
- `bb_list_repositories` - List repositories across workspaces
- `bb_get_repository` - Get repository details
- `bb_search_repositories` - Find repositories by name/description
- `bb_browse_repository` - Explore directory structure (supports branches with slashes like `feature/SSP-1024`)
- `bb_get_file_content` - Read files with pagination (1-10,000 lines)
- `bb_get_file_history` - Get commit history for specific files

### 🔀 Pull Requests (11 tools)
- `bb_get_pull_requests` - List all pull requests
- `bb_get_pull_request` - Get detailed PR information
- `bb_get_pull_request_comments` - List all comments on a PR
- `bb_get_pull_request_comment` - Get a single comment by ID
- `bb_get_comment_thread` - Get a comment thread with all nested replies
- `bb_get_pull_request_activity` - Track reviews, approvals, state changes
- `bb_get_pull_request_diff` - Get unified diff for a PR
- `bb_get_pull_request_diffstat` - Get per-file change statistics
- `bb_get_pr_commits` - List commits in a PR
- `bb_get_pr_statuses` - Get CI/CD build statuses for a PR
- `bb_list_user_pull_requests` - List all PRs for a user across repositories

### 🌿 Branches & Commits (8 tools)
- `bb_get_branches` - List all branches
- `bb_get_branch` - Get detailed branch information
- `bb_get_commits` - List commit history
- `bb_get_commit` - Get detailed commit information
- `bb_get_commit_statuses` - Get CI/CD build statuses for a commit
- `bb_get_merge_base` - Find common ancestor between branches
- `bb_get_tags` - List repository tags
- `bb_get_tag` - Get detailed tag information

### 🔍 Diff & Comparison (2 tools)
- `bb_get_diff` - Get unified diff between commits
- `bb_get_diffstat` - Get per-file change statistics between commits

### � CI/CD Pipelines (4 tools)
- `bb_list_pipelines` - List pipeline runs
- `bb_get_pipeline` - Get detailed pipeline information
- `bb_get_pipeline_steps` - List pipeline steps/stages
- `bb_get_pipeline_step_log` - Get build logs for pipeline steps

### �🐛 Issues (2 tools)
- `bb_get_issues` - List repository issues
- `bb_get_issue` - Get detailed issue information

### 🔍 Search & Discovery (1 tool)
- `bb_search_code` - Advanced code search with language filtering

### 👤 User Information (2 tools)
- `bb_get_user` - Get user information
- `bb_get_current_user` - Get authenticated user information

**Total: 38 tools across 8 categories**

## Usage Examples

**Repository Discovery:**
- "List all my accessible workspaces"
- "Browse the root directory of myworkspace/myrepo"
- "Browse the tests directory in feature/deployment-fixes branch"
- "Search for repositories containing 'keycloak' in myworkspace"

**File Operations:**
- "Read lines 100-200 of src/app.py from myworkspace/myrepo"
- "Get the first 50 lines of README.md"
- "Show me the package.json file from develop branch"
- "Get the commit history for src/components/Header.tsx"

**Code Search:**
- "Search for 'authentication' code in myworkspace/myrepo"
- "Find all functions containing 'validate' in myworkspace/myrepo"
- "Search for TypeScript interfaces in myworkspace/myrepo"
- "Look for 'TODO' comments in myworkspace/myrepo"

**Pull Requests & Comments:**
- "Show open pull requests for myworkspace/myrepo"
- "Get details for PR #445 in myworkspace/myrepo"
- "List all comments on PR #408"
- "Get comment #744553155 from PR #408 in myworkspace/myrepo"
- "Get the comment thread for comment #744553155 on PR #408"
- "Show me the diff for PR #445"
- "Get build statuses for PR #445"

**Branches & Commits:**
- "List all branches in myworkspace/myrepo"
- "Get details for the develop branch"
- "Show recent commits on main branch of myworkspace/myrepo"
- "Get commit details for 0fe347db"
- "Find the merge base between develop and main"
- "Show the diff between commits abc123 and def456"

**Tags & Releases:**
- "List all tags in myworkspace/myrepo"
- "Get details for tag stable-v1.0.2.0"

## Development

### Build & Test Commands
```bash
npm run build    # TypeScript compilation
npm run watch    # Development mode with auto-rebuild
npm run ltf      # Lint → Typecheck → Format (recommended before commits)
npm run ltfb     # Lint → Typecheck → Format → Build (full pipeline)
node build/index.js  # Test server startup
```

### Testing
```bash
# Run comprehensive test suite
node test_pr_445.js              # Main test suite (8 tool categories)
node test_pr_445_advanced.js     # Advanced features
node test_pr_445_final.js        # Complete coverage
node test_pr_408_comments.js     # Comment thread verification
```

**Test Coverage:** 31 out of 38 tools verified (100% success rate on testable tools)
- See [`docs/TEST_RESULTS_PR_445.md`](docs/TEST_RESULTS_PR_445.md) for detailed results
- Uses real production PRs for validation
- Tests workspace discovery, repositories, PRs, branches, commits, files, comments

### VS Code Integration
- Install GitHub Copilot extensions
- Use provided `.vscode/` configuration
- Open Copilot Chat with `Ctrl+Alt+I`
- Try: `using bitbucket, list repositories in myworkspace`

### Architecture
Modular design with handler registry pattern:
- `src/handlers/` - Domain-specific tool handlers (repository, pullrequest, commit, diff, workspace, search, issue, pipeline)
- `src/tools.ts` - Tool definitions and handler routing
- `src/schemas.ts` - Zod validation schemas with API constants
- `src/types.ts` - TypeScript interfaces for Bitbucket API
- `src/api.ts` - Request handling with retry logic
- `src/config.ts` - Configuration management
- `src/errors.ts` - Custom error classes

See [`.github/copilot-instructions.md`](.github/copilot-instructions.md) for detailed development guidelines.

## Security & Limitations

- ✅ **Read-only by design**: No write/delete/modify operations possible at any level
- ✅ **Runtime protection**: `makeRequest()` blocks non-GET requests
- ✅ **Safe for production**: No destructive actions supported  
- ✅ **Authenticated access**: Uses API tokens for private repositories
- ✅ **Type-safe**: Zod validation and TypeScript interfaces throughout
- ✅ **Branch support**: Handles branch names with special characters (e.g., `feature/SSP-1024`)
- ✅ **Dynamic commit resolution**: Automatically resolves branch names to commit SHAs for subdirectory browsing
- ✅ **Error handling**: Context-aware error messages with helpful suggestions
- ⚠️ **Rate limiting**: Subject to Bitbucket API limits (no custom throttling)
- ⚠️ **Code search**: Requires enablement in Bitbucket account settings at https://bitbucket.org/search
- ⚠️ **File size limits**: Large files handled with pagination (up to 10,000 lines per request)

## Development Status

✅ **Production Ready** - Comprehensive test coverage with 31/38 tools verified (100% success on testable tools)

**Recent Updates (2026-02):**
- ✅ Modular handler registry architecture
- ✅ Comprehensive test suite with real-world validation
- ✅ 38 tools covering all major Bitbucket operations
- ✅ Type-safe with Zod validation and TypeScript interfaces
- ✅ Full comment thread support (inline comments with nested replies)

We welcome contributions and feedback!

## API Coverage

The server implements **38 tools** covering all major Bitbucket Cloud API v2.0 endpoints (read-only):

- **Workspaces API** - Workspace discovery and information
- **Repositories API** - Repository listing, details, browsing, and search
- **Source API** - File content access with pagination, file history
- **Pull Requests API** - PR management, comments, threads, activity, diffs, commits, statuses
- **Branches API** - Branch listing, details, and comparison
- **Commits API** - Commit history, details, and statuses
- **Tags API** - Tag listing and details
- **Diff API** - Unified diffs and diffstats between commits
- **Issues API** - Issue listing and details
- **Search API** - Code search with language filtering and match highlighting
- **Users API** - User and authenticated user information
- **Pipelines API** - CI/CD pipeline information (read-only)

**Test Coverage:** See [`docs/TEST_RESULTS_PR_445.md`](docs/TEST_RESULTS_PR_445.md) for verification details.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes:
   - Maintain read-only design principles
   - Follow the handler registry pattern (see `src/handlers/`)
   - Add TypeScript interfaces and Zod schemas
   - Use typed `makeRequest<T>()` calls
   - Format responses as readable text
4. Add tests if applicable (see test suite patterns)
5. Run `npm run ltfb` before committing
6. Submit a pull request

See [`.github/copilot-instructions.md`](.github/copilot-instructions.md) for detailed development guidelines.

## Support

If you find this project helpful, please consider supporting its development:


[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-GitHub-pink?logo=github)](https://github.com/sponsors/tugudush)



**Solana (SOL)**
```
CWZccD3Ny3XotFZtnkcyzP3hapmu3ExknN1PF4rEvP3u
```

You can also run `npm fund` in your project to see all funding information.

## Roadmap

Future enhancements (all read-only):

- ✅ ~~38 comprehensive tools~~ **COMPLETE**
- ✅ ~~Comment threads with nested replies~~ **COMPLETE**
- ✅ ~~Comprehensive test suite~~ **COMPLETE**
- ✅ ~~Modular handler architecture~~ **COMPLETE**
- Repository statistics and analytics
- Enhanced search capabilities with more filter options
- Webhook information retrieval (read-only)
- Extended pipeline details and logs
- Repository comparison and analytics tools
- Advanced code search with AI-powered insights
