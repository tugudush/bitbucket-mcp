# Bitbucket MCP Server

⚠️ **WORK IN PROGRESS** - This is an actively developed project and may have breaking changes or incomplete features.

A **read-only** Model Context Protocol (MCP) server that provides secure access to Bitbucket repositories, pull requests, issues, and more. Integrates seamlessly with VS Code GitHub Copilot and Claude Desktop.

## ✨ Enhanced Features

**Repository Discovery & Exploration:**
- **Workspace Discovery**: `bb_list_workspaces` - Discover accessible workspaces
- **Enhanced Repository Browsing**: `bb_list_repositories` - List repositories across workspaces
- **Directory Navigation**: `bb_browse_repository` - Explore repository structure and file organization

**Advanced File Operations:**
- **Paginated File Content**: `bb_get_file_content` - Read files with line-based pagination (1-10,000 lines)
- **Directory Navigation**: `bb_browse_repository` - Explore repository structure and file organization

**Pull Request Management:**
- **PR Overview**: `bb_get_pull_requests`, `bb_get_pull_request` - Browse and analyze pull requests
- **Review System**: `bb_get_pull_request_comments`, `bb_get_pull_request_activity` - Track discussions and approvals

**Issue Tracking:**
- **Issue Management**: `bb_get_issues`, `bb_get_issue` - Monitor bugs and feature requests

**Version Control:**
- **Branch Operations**: `bb_get_branches`, `bb_get_commits` - Explore repository history

**User & Workspace Info:**
- **Identity**: `bb_get_user`, `bb_get_workspace` - Access user and workspace details

**Code Search:**
- **Advanced Code Search**: `bb_search_code` - Search for code across repositories with language filtering and rich match highlighting

## 🔒 Security Features

**Read-Only Mode** (Optional): Set `BITBUCKET_READ_ONLY=true` to restrict to safe, non-modifying operations only. Perfect for production deployments and CI/CD integration.

## 📋 Code Search Requirements

**Code Search Setup**: The `bb_search_code` feature requires code search to be enabled in your Bitbucket account settings:
1. Go to your Bitbucket account settings
2. Navigate to "Code search" section https://bitbucket.org/search
3. Enable code search for your repositories
4. Note: Search may take time to index existing repositories

## Quick Start

### 1. Install & Build
```bash
git clone <repository-url>
cd bitbucket-mcp
npm install
npm run build
```

### 2. Authentication Setup

**Choose one of these methods:**

**Option A: Set in MCP Configuration (Recommended)**
Configure directly in your MCP client config (see Integration section below).

**Option B: Environment Variables (for manual testing)**
```bash
# API Tokens (Recommended - App Passwords deprecated Sept 9, 2025)
export BITBUCKET_API_TOKEN="your-api-token"
export BITBUCKET_EMAIL="your-atlassian-email"

# Legacy App Passwords
export BITBUCKET_USERNAME="your-username"  
export BITBUCKET_APP_PASSWORD="your-app-password"
```

### 3. Integration

**VS Code GitHub Copilot:**
```json
// .vscode/mcp.json
{
  "servers": {
    "bitbucket-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["./build/index.js"],
      "env": {
        "BITBUCKET_API_TOKEN": "your-token",
        "BITBUCKET_EMAIL": "your@email.com"
      }
    }
  }
}
```

**Claude Desktop:**
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

## Enhanced Usage Examples

**Repository Discovery:**
- `"List all my accessible workspaces"`
- `"Browse the root directory of myworkspace/myrepo"`
- `"Show the structure of src/components in myworkspace/myrepo"`

**Advanced File Operations:**
- `"Read lines 100-200 of src/app.py from myworkspace/myrepo"`
- `"Get the first 50 lines of README.md"`
- `"Show me the package.json file with pagination"`

**Code Search:**
- `"Search for 'authentication' code in myworkspace/myrepo"`
- `"Find all functions containing 'validate' in myworkspace/myrepo"`
- `"Search for TypeScript interfaces in myworkspace/myrepo"`
- `"Look for 'TODO' comments in myworkspace/myrepo"`

**Enhanced Search:**
- `"Search for 'authentication' code in myworkspace/myrepo"`
- `"Find all TypeScript files containing 'interface' in myworkspace/myrepo"`

**Read-Only Mode:**
```bash
# Enable read-only mode for production
export BITBUCKET_READ_ONLY=true
node build/index.js
```

## Usage Examples

**In VS Code Copilot Chat or Claude:**
- `"List repositories in myworkspace"`
- `"Show open pull requests for myworkspace/myrepo"`
- `"Get README.md from myworkspace/myrepo"`
- `"Search for 'TODO' comments in myworkspace/myrepo"`
- `"Find TypeScript files with 'interface' definitions in myworkspace/myrepo"`
- `"Show recent commits on main branch of myworkspace/myrepo"`

## Development

**Build & Test:**
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

- ✅ **Read-only operations**: No write/delete/modify operations possible
- ✅ **Safe for production**: No destructive actions supported  
- ✅ **Read-only mode**: Optional `BITBUCKET_READ_ONLY=true` for maximum security
- ✅ **Authenticated access**: Uses API tokens or App Passwords for private repos
- ⚠️ **Rate limiting**: Subject to Bitbucket API limits
- ⚠️ **File size limits**: Large files may be truncated

## License

MIT License - See [LICENSE](LICENSE) for details.

## Support

- 📋 [Create an issue](../../issues) for bugs or feature requests
- 📖 Check existing [documentation](../../wiki) and issues
- 🚀 [Contributing guidelines](CONTRIBUTING.md)

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

## Limitations

- **Read-only**: This server intentionally does not support write operations
- **Rate limiting**: Subject to Bitbucket API rate limits
- **Large files**: File content retrieval may be limited by API response sizes
- **Authentication**: Requires API token or App Password for private repositories
- **Code search**: Requires code search to be enabled in Bitbucket account settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes (maintaining read-only nature)
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:

1. Check existing issues in the repository
2. Create a new issue with detailed information
3. Include Bitbucket MCP Server version and environment details

## Roadmap

Future enhancements (all read-only):

- Repository statistics and analytics
- Enhanced search capabilities with more filter options
- Webhook information retrieval
- Pipeline status (read-only)
- More detailed branch and commit information
- Repository comparison tools
- Advanced code search filters and sorting
