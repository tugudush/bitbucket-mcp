# Bitbucket MCP Server

A Model Context Protocol (MCP) server for Bitbucket that provides read-only access to repositories, pull requests, issues, commits, branches, users, and workspaces. This server enables AI assistants to interact with Bitbucket data through a standardized interface.

## Features

This server provides the following **read-only** tools:

### Repository Management
- **bb_get_repository** - Get detailed information about a specific repository
- **bb_list_repositories** - List repositories in a workspace
- **bb_get_file_content** - Get the content of a file from a repository
- **bb_search_code** - Search for code in a repository

### Pull Requests
- **bb_get_pull_requests** - Get pull requests for a repository (with filtering)
- **bb_get_pull_request** - Get detailed information about a specific pull request

### Issues
- **bb_get_issues** - Get issues for a repository (with filtering)
- **bb_get_issue** - Get detailed information about a specific issue

### Version Control
- **bb_get_commits** - Get commits for a repository branch
- **bb_get_branches** - Get branches for a repository

### Users & Workspaces
- **bb_get_user** - Get information about a Bitbucket user
- **bb_get_workspace** - Get information about a workspace

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### From NPM (when published)

```bash
npm install -g bitbucket-mcp-server
```

### From Source

1. Clone this repository:
```bash
git clone <repository-url>
cd bitbucket-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Configuration

### Authentication

The server supports authenticated requests using Bitbucket App Passwords:

1. Create an App Password in your Bitbucket account settings
2. Set the following environment variables:
   - `BITBUCKET_USERNAME` - Your Bitbucket username
   - `BITBUCKET_APP_PASSWORD` - Your App Password

Without authentication, you can still access public repositories and data.

### Claude Desktop Integration

Add this to your Claude Desktop configuration file:

#### macOS
Location: `~/Library/Application Support/Claude/claude_desktop_config.json`

#### Windows
Location: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "node",
      "args": ["/absolute/path/to/bitbucket-mcp-server/build/index.js"],
      "env": {
        "BITBUCKET_USERNAME": "your-username",
        "BITBUCKET_APP_PASSWORD": "your-app-password"
      }
    }
  }
}
```

Or using npx (if installed globally):

```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "npx",
      "args": ["bitbucket-mcp-server"],
      "env": {
        "BITBUCKET_USERNAME": "your-username",
        "BITBUCKET_APP_PASSWORD": "your-app-password"
      }
    }
  }
}
```

## Usage Examples

Once configured, you can ask Claude to:

- "Show me the repositories in the `myworkspace` workspace"
- "Get the content of `README.md` from the `myworkspace/myrepo` repository"
- "List all open pull requests for `myworkspace/myrepo`"
- "Show me the recent commits on the main branch of `myworkspace/myrepo`"
- "Search for 'TODO' comments in `myworkspace/myrepo`"
- "Get information about the user `johndoe`"
- "Show me all issues labeled as 'bug' in `myworkspace/myrepo`"

## Security Features

This server is designed with security and safety in mind:

- **Read-only operations**: All tools are strictly read-only. No write, create, update, or delete operations are supported
- **No destructive actions**: Cannot create pull requests, delete repositories, modify issues, or perform any destructive operations
- **Authentication required for private data**: Private repositories and workspaces require proper authentication
- **Rate limiting awareness**: Respects Bitbucket API rate limits
- **Error handling**: Graceful error handling with informative messages

## Development

### Project Structure

```
src/
├── index.ts          # Main server implementation
└── (future modules)  # Additional modules as needed

build/                # Compiled JavaScript output
```

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run watch  # Watches for changes and rebuilds
```

### Running Locally

```bash
npm run start
```

## API Coverage

The server implements tools for the most commonly used Bitbucket API endpoints:

- Repositories API (read-only operations)
- Pull Requests API (read-only operations)
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
