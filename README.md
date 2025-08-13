# Bitbucket MCP Server

A **read-only** Model Context Protocol (MCP) server that provides secure access to Bitbucket repositories, pull requests, issues, and more. Integrates seamlessly with VS Code GitHub Copilot and Claude Desktop.

## Requirements

- **Code Search**: Enable at https://bitbucket.org/search for `bb_search_code` functionality
- **Node.js**: Version 16+ with ES modules support
- **Authentication**: API token + email or username + app password

## Quick Start

### 1. Install & Build
```bash
git clone <repository-url>
cd bitbucket-mcp
npm install
npm run build
```

### 2. Authentication (Optional - for testing only)

**⚠️ Note**: This step is only needed for manual testing. If you're going directly to step 3 (Integration), you can skip this step as authentication is configured in the integration files.

For manual server testing, choose one authentication method:

**API Tokens (Recommended)**
```bash
export BITBUCKET_API_TOKEN="your-api-token"
export BITBUCKET_EMAIL="your-atlassian-email"
```

**App Passwords (Legacy - deprecated Sept 9, 2025)**
```bash
export BITBUCKET_USERNAME="your-username"  
export BITBUCKET_APP_PASSWORD="your-app-password"
```

**Without Authentication**: The server will work with public repositories only.

### 3. Integration (Authentication included here)

**For most users, this is where you actually configure authentication credentials.**

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

**💡 Tip**: Replace `/path/to/build/index.js` with the absolute path to your built server, and add your actual Bitbucket credentials to access private repositories.

## Features

**Repository Management**
- `bb_list_workspaces` - Discover accessible workspaces
- `bb_list_repositories` - List repositories across workspaces
- `bb_get_repository` - Get repository details
- `bb_browse_repository` - Explore directory structure (supports branches with slashes like `feature/SSP-1024`)
- `bb_get_file_content` - Read files with pagination (1-10,000 lines)

**Pull Requests & Issues**
- `bb_get_pull_requests`, `bb_get_pull_request` - Browse pull requests
- `bb_get_pull_request_comments`, `bb_get_pull_request_activity` - Track reviews
- `bb_get_issues`, `bb_get_issue` - Monitor issues

**Version Control**
- `bb_get_branches`, `bb_get_commits` - Explore repository history

**Search & Discovery**
- `bb_search_code` - Advanced code search with language filtering
- `bb_search_repositories` - Find repositories

**User & Workspace Info**
- `bb_get_user`, `bb_get_current_user` - User information
- `bb_get_workspace` - Workspace details

## Usage Examples

**Repository Discovery:**
- "List all my accessible workspaces"
- "Browse the root directory of myworkspace/myrepo"
- "Browse the tests directory in feature/deployment-fixes branch"

**Advanced File Operations:**
- "Read lines 100-200 of src/app.py from myworkspace/myrepo"
- "Get the first 50 lines of README.md"
- "Show me the package.json file with pagination"

**Code Search:**
- "Search for 'authentication' code in myworkspace/myrepo"
- "Find all functions containing 'validate' in myworkspace/myrepo"
- "Search for TypeScript interfaces in myworkspace/myrepo"
- "Look for 'TODO' comments in myworkspace/myrepo"

**Pull Requests & Issues:**
- "List repositories in myworkspace"
- "Show open pull requests for myworkspace/myrepo"
- "Get README.md from myworkspace/myrepo"
- "Show recent commits on main branch of myworkspace/myrepo"

## Development

```bash
npm run ltf     # Lint + Typecheck + Format
npm run build   # Compile TypeScript  
npm run watch   # Development mode
node build/index.js  # Test server
```

**VS Code Integration:**
- Install GitHub Copilot extensions
- Use provided `.vscode/` configuration
- Open Copilot Chat with `Ctrl+Alt+I`
- Try: `using bitbucket, list repositories in myworkspace`

## Security & Limitations

- ✅ **Read-only by design**: No write/delete/modify operations possible
- ✅ **Safe for production**: No destructive actions supported  
- ✅ **Authenticated access**: Uses API tokens or App Passwords for private repos
- ✅ **Branch support**: Handles branch names with special characters (e.g., `feature/SSP-1024`)
- ✅ **Dynamic commit resolution**: Automatically resolves branch names to commit SHAs for subdirectory browsing
- ⚠️ **Rate limiting**: Subject to Bitbucket API limits
- ⚠️ **Code search**: Requires enablement in Bitbucket account settings
- ⚠️ **File size limits**: Large files may be truncated

## Development Status & Related Projects

🚧 **This project is under active development** and may contain incomplete features or breaking changes. We welcome contributions and feedback!

**Related MCP Servers for Reference:**
- [bitbucket-server-mcp-server](https://github.com/garc33/bitbucket-server-mcp-server) - MCP server for Bitbucket Server (on-premises)
- [mcp-server-atlassian-bitbucket](https://github.com/aashari/mcp-server-atlassian-bitbucket) - Alternative Atlassian Bitbucket MCP implementation

These repositories provide excellent reference implementations and inspiration for Bitbucket API integration patterns.

## API Coverage

The server implements tools for the most commonly used Bitbucket API endpoints:

- **Repositories API** (read-only operations)
- **Pull Requests API** (read-only operations)
  - Pull request details and listing
  - Pull request comments (inline and general)
  - Pull request activity (reviews, approvals, state changes)
- **Issues API** (read-only operations)
- **Source API** (file content access)
- **Search API** (code search with language filtering and match highlighting)
- **Users API** (user information)
- **Workspaces API** (workspace information)
- **Branches API** (branch listing and information)
- **Commits API** (commit history and details)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes (maintaining read-only nature)
4. Add tests if applicable
5. Submit a pull request

## Roadmap

Future enhancements (all read-only):

- Repository statistics and analytics
- Enhanced search capabilities with more filter options
- Webhook information retrieval
- Pipeline status (read-only)
- More detailed branch and commit information
- Repository comparison tools
- Advanced code search filters and sorting
