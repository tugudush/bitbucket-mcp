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
- **bb_get_pull_request_comments** - Get comments for a specific pull request
- **bb_get_pull_request_activity** - Get activity (reviews, approvals, comments) for a specific pull request

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

### Important Note for Windows Users

When configuring file paths in JSON configuration files:

- **Windows**: Multiple path formats are supported
  - **Double backslashes**: `"C:\\htdocs\\bitbucket-mcp\\build\\index.js"`
  - **Forward slashes**: `"C:/htdocs/bitbucket-mcp/build/index.js"`
  - **Unix-style with drive**: `"c:/htdocs/bitbucket-mcp/build/index.js"` (lowercase drive letter)
  - **Unix-style without colon**: `"c/htdocs/bitbucket-mcp/build/index.js"` (may work in some contexts)
  - **With spaces**: `"C:\\Program Files\\bitbucket-mcp\\build\\index.js"`
  - **With spaces (forward slash)**: `"C:/Program Files/bitbucket-mcp/build/index.js"`
- **macOS/Linux**: Use forward slashes `/`
  - Example: `"/home/user/bitbucket-mcp/build/index.js"`
  - **With spaces**: `"/home/user/My Projects/bitbucket-mcp/build/index.js"`

**Important**: Paths with spaces do NOT need extra quotes in JSON - the JSON string quotes handle the spaces automatically.

### Authentication

The server supports authenticated requests using Bitbucket API tokens or App Passwords:

**Recommended: API Tokens (replacing App Passwords as of September 2025)**

1. Create an API Token in your Bitbucket account settings
2. Set the environment variable:
   - `BITBUCKET_API_TOKEN` - Your API token

**Legacy: App Passwords (being deprecated September 9, 2025)**

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
      "args": ["C:\\htdocs\\bitbucket-mcp\\build\\index.js"],
      "env": {
        "BITBUCKET_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

**Example with legacy App Password:**

```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "node",
      "args": ["C:\\htdocs\\bitbucket-mcp\\build\\index.js"],
      "env": {
        "BITBUCKET_USERNAME": "your-username",
        "BITBUCKET_APP_PASSWORD": "your-app-password"
      }
    }
  }
}
```

**Example with spaces in path:**

```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "node",
      "args": ["C:\\Program Files\\bitbucket-mcp\\build\\index.js"],
      "env": {
        "BITBUCKET_USERNAME": "your-username",
        "BITBUCKET_APP_PASSWORD": "your-app-password"
      }
    }
  }
}
```

**Path Examples by Operating System:**

- **Windows (recommended)**: `"C:\\htdocs\\bitbucket-mcp\\build\\index.js"` (double backslashes)
- **Windows (alternative)**: `"C:/htdocs/bitbucket-mcp/build/index.js"` (forward slashes)
- **Windows (Unix-style)**: `"c:/htdocs/bitbucket-mcp/build/index.js"` (lowercase drive, forward slashes)
- **Windows (Unix-style alt)**: `"c/htdocs/bitbucket-mcp/build/index.js"` (no colon, may work in some contexts)
- **Windows with spaces**: `"C:\\Program Files\\bitbucket-mcp\\build\\index.js"`
- **Windows with spaces (alt)**: `"C:/Program Files/bitbucket-mcp/build/index.js"`
- **Windows Documents folder**: `"C:\\Users\\YourName\\Documents\\bitbucket-mcp\\build\\index.js"`
- **macOS/Linux**: `"/absolute/path/to/bitbucket-mcp/build/index.js"` (forward slashes only)
- **macOS/Linux with spaces**: `"/home/user/My Projects/bitbucket-mcp/build/index.js"`

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

### VS Code GitHub Copilot Integration

This MCP server is fully compatible with VS Code GitHub Copilot, enabling you to use Bitbucket data directly within your VS Code editor. Follow these steps to set it up:

#### Step 1: Install Required Extensions

1. **GitHub Copilot Extension** (if not already installed):

   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
   - Search for "GitHub Copilot" by GitHub
   - Install the extension
   - Sign in with your GitHub account

2. **MCP Extension for VS Code** (if available):
   - Search for "MCP" or "Model Context Protocol" in the Extensions marketplace
   - Install any official MCP extension for VS Code

#### Step 2: Configure MCP Server in VS Code

Create or update your VS Code settings to include the MCP server configuration:

1. Open VS Code Settings (Ctrl+, / Cmd+,)
2. Search for "mcp" or go to Extensions → MCP
3. Add the Bitbucket MCP server configuration:

**Option A: Using VS Code Settings UI**

- Navigate to Extensions → MCP → Servers
- Add a new server with these details:
  - Name: `bitbucket`
  - Command: `node`
  - Args: `["C:\\path\\to\\bitbucket-mcp\\build\\index.js"]` (Windows) or `["/path/to/bitbucket-mcp/build/index.js"]` (macOS/Linux)
  - Environment Variables:
    - `BITBUCKET_USERNAME`: your-username
    - `BITBUCKET_APP_PASSWORD`: your-app-password

**Option B: Using settings.json**
Add this to your VS Code `settings.json`:

**Windows:**

```json
{
  "mcp.servers": {
    "bitbucket": {
      "command": "node",
      "args": ["C:\\htdocs\\bitbucket-mcp\\build\\index.js"],
      "env": {
        "BITBUCKET_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

**Windows with legacy App Password:**

```json
{
  "mcp.servers": {
    "bitbucket": {
      "command": "node",
      "args": ["C:\\htdocs\\bitbucket-mcp\\build\\index.js"],
      "env": {
        "BITBUCKET_USERNAME": "your-username",
        "BITBUCKET_APP_PASSWORD": "your-app-password"
      }
    }
  }
}
```

**Windows with spaces in path:**

```json
{
  "mcp.servers": {
    "bitbucket": {
      "command": "node",
      "args": ["C:\\Program Files\\bitbucket-mcp\\build\\index.js"],
      "env": {
        "BITBUCKET_USERNAME": "your-username",
        "BITBUCKET_APP_PASSWORD": "your-app-password"
      }
    }
  }
}
```

**macOS/Linux:**

```json
{
  "mcp.servers": {
    "bitbucket": {
      "command": "node",
      "args": ["/absolute/path/to/bitbucket-mcp/build/index.js"],
      "env": {
        "BITBUCKET_USERNAME": "your-username",
        "BITBUCKET_APP_PASSWORD": "your-app-password"
      }
    }
  }
}
```

#### Step 3: Configure GitHub Copilot to Use MCP

1. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Run "GitHub Copilot: Configure MCP Servers"
3. Enable the Bitbucket MCP server
4. Restart VS Code if prompted

#### Step 4: Using Bitbucket Tools in VS Code

Once configured, you can use Bitbucket tools directly in VS Code through GitHub Copilot Chat:

**Open Copilot Chat:**

- Use Ctrl+Alt+I / Cmd+Alt+I, or
- Click the chat icon in the activity bar, or
- Open Command Palette and run "GitHub Copilot: Open Chat"

**Example Copilot Chat Commands:**

```
@copilot using bitbucket, show me repositories in myworkspace

@copilot get the README.md file from myworkspace/myrepo using bitbucket tools

@copilot list open pull requests for myworkspace/myrepo

@copilot search for "TODO" comments in myworkspace/myrepo using bitbucket

@copilot show me recent commits on main branch of myworkspace/myrepo
```

#### Step 5: Advanced VS Code Integration

**Workspace-Specific Configuration:**
Create a `.vscode/settings.json` file in your project root:

**For this project (recommended):**

```json
{
  "mcp.servers": {
    "bitbucket": {
      "command": "node",
      "args": ["${workspaceFolder}/build/index.js"],
      "env": {
        "BITBUCKET_USERNAME": "your-username",
        "BITBUCKET_APP_PASSWORD": "your-app-password"
      }
    }
  }
}
```

**For external installation:**

```json
{
  "mcp.servers": {
    "bitbucket": {
      "command": "node",
      "args": ["${workspaceFolder}/../bitbucket-mcp/build/index.js"],
      "env": {
        "BITBUCKET_USERNAME": "your-username",
        "BITBUCKET_APP_PASSWORD": "your-app-password"
      }
    }
  }
}
```

**Environment Variables via .env:**

1. Create a `.env` file in your workspace:

```env
BITBUCKET_USERNAME=your-username
BITBUCKET_APP_PASSWORD=your-app-password
```

2. Install the "DotENV" extension for VS Code
3. Update your MCP configuration to reference environment variables

#### Troubleshooting VS Code Integration

**Common Issues:**

1. **MCP Server Not Found:**

   - Verify the path to `build/index.js` is correct
   - Ensure the server is built (`npm run build`)
   - Check VS Code Developer Console for errors

2. **Authentication Errors:**

   - Verify `BITBUCKET_USERNAME` and `BITBUCKET_APP_PASSWORD` are set correctly
   - Test authentication by running the server manually
   - Check Bitbucket App Password permissions

3. **Extension Conflicts:**

   - Disable other MCP-related extensions temporarily
   - Restart VS Code after configuration changes
   - Check the VS Code Extensions view for conflicts

4. **Tool Not Available in Chat:**
   - Ensure the MCP server is properly registered
   - Try restarting VS Code
   - Use specific tool names with `bb_` prefix

**Debug Commands:**

```bash
# Test the MCP server manually
node build/index.js

# Check server output
BITBUCKET_USERNAME=your-user BITBUCKET_APP_PASSWORD=your-token node build/index.js
```

#### VS Code Features Integration

**IntelliSense and Code Completion:**

- GitHub Copilot will use Bitbucket repository data for better code suggestions
- Context from Bitbucket issues and PRs will inform suggestions

**Integrated Terminal:**

- Use Copilot Chat in the integrated terminal
- Access Bitbucket data while working on related code

**Side Panel Integration:**

- Keep Copilot Chat open in the side panel
- Query Bitbucket data while editing files

**Keyboard Shortcuts:**
Set up custom keyboard shortcuts for frequent Bitbucket queries:

1. Go to File → Preferences → Keyboard Shortcuts
2. Search for "GitHub Copilot"
3. Add custom keybindings for Copilot Chat

#### Best Practices for VS Code + Bitbucket MCP

1. **Context-Aware Queries:** Reference your current file or project when asking about Bitbucket data
2. **Batch Operations:** Ask Copilot to perform multiple Bitbucket operations in one query
3. **Code Integration:** Ask Copilot to analyze Bitbucket issues/PRs and suggest code changes
4. **Workflow Integration:** Use Bitbucket data to inform your development workflow in VS Code

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
