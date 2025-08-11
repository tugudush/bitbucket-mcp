# Bitbucket MCP Server

A **read-only** Model Context Protocol (MCP) server that provides secure access to Bitbucket repositories, pull requests, issues, and more. Integrates seamlessly with VS Code GitHub Copilot and Claude Desktop.

## Features

**Read-only tools for secure repository access:**

- **Repositories**: `bb_get_repository`, `bb_list_repositories`, `bb_get_file_content`, `bb_search_code`, `bb_list_directory`
- **Pull Requests**: `bb_get_pull_requests`, `bb_get_pull_request`, `bb_get_pull_request_comments`, `bb_get_pull_request_activity`
- **Issues**: `bb_get_issues`, `bb_get_issue`
- **Version Control**: `bb_get_commits`, `bb_get_branches`
- **Users & Workspaces**: `bb_get_user`, `bb_get_workspace`

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
        "BITBUCKET_EMAIL": "your-email"
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
        "BITBUCKET_EMAIL": "your-email"
      }
    }
  }
}
```

## Usage Examples

**In VS Code Copilot Chat or Claude:**
- `"List repositories in myworkspace"`
- `"Show open pull requests for myworkspace/myrepo"`
- `"Get README.md from myworkspace/myrepo"`
- `"Search for 'TODO' comments in myworkspace/myrepo"`
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
- ✅ **Authenticated access**: Uses API tokens or App Passwords for private repos
- ⚠️ **Rate limiting**: Subject to Bitbucket API limits
- ⚠️ **File size limits**: Large files may be truncated

## License

MIT License - See [LICENSE](LICENSE) for details.

## Support

- 📋 [Create an issue](../../issues) for bugs or feature requests
- 📖 Check existing [documentation](../../wiki) and issues
- 🚀 [Contributing guidelines](CONTRIBUTING.md)

## API Coverage

The server implements tools for the most commonly used Bitbucket API endpoints:

- Repositories API (read-only operations)
- Pull Requests API (read-only operations)
  - Pull request details and listing
  - Pull request comments (inline and general)
  - Pull request activity (reviews, approvals, state changes)
- Issues API (read-only operations)
- Source API (file content access)
- Search API (code search)
- Users API (user information)
- Workspaces API (workspace information)

## Limitations

- **Read-only**: This server intentionally does not support write operations
- **Rate limiting**: Subject to Bitbucket API rate limits
- **Large files**: File content retrieval may be limited by API response sizes
- **Authentication**: Requires App Password for private repositories

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
- Advanced search capabilities
- Webhook information retrieval
- Pipeline status (read-only)
- More detailed branch and commit information
- Repository comparison tools
