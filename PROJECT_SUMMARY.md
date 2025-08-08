# Bitbucket MCP Server - Project Summary

## 🎯 Project Overview

This is a comprehensive Model Context Protocol (MCP) server that provides **read-only** access to Bitbucket repositories, issues, pull requests, and other resources. It's designed as the Bitbucket equivalent of the GitHub MCP server with a focus on security and safety.

## ✅ Implemented Features

### 🔧 Core Tools (14 total)

1. **Repository Management**
   - `bb_get_repository` - Get detailed repository information
   - `bb_list_repositories` - List repositories in a workspace
   - `bb_get_file_content` - Retrieve file contents from repositories
   - `bb_search_code` - Search for code within repositories

2. **Pull Request Operations**
   - `bb_get_pull_requests` - List pull requests with filtering options
   - `bb_get_pull_request` - Get detailed PR information
   - `bb_get_pull_request_comments` - Get PR comments (inline and general)
   - `bb_get_pull_request_activity` - Get PR activity (reviews, approvals, changes)

3. **Issue Management**
   - `bb_get_issues` - List issues with state and kind filtering
   - `bb_get_issue` - Get detailed issue information

4. **Version Control**
   - `bb_get_commits` - Retrieve commit history for branches
   - `bb_get_branches` - List repository branches

5. **User & Workspace Info**
   - `bb_get_user` - Get Bitbucket user information
   - `bb_get_workspace` - Get workspace details

## 🛡️ Security Features

- **Read-only by design** - No destructive operations possible
- **Authentication support** - Uses Bitbucket App Passwords
- **Error handling** - Graceful error management
- **Rate limiting aware** - Respects API limits
- **Tool name prefixing** - All tools prefixed with `bb_` to avoid conflicts

## 🎨 VS Code GitHub Copilot Integration

### Full VS Code Support
- **Complete VS Code configuration** - Pre-configured .vscode/ directory
- **GitHub Copilot Chat integration** - Use Bitbucket tools directly in Copilot Chat
- **Code snippets** - Quick commands with tab completion
- **Debug configuration** - Full debugging support for MCP server
- **Task automation** - Build, run, and test tasks
- **Extension recommendations** - Curated list of helpful extensions

### Chat Commands
```
@copilot using bitbucket, list repositories in myworkspace
@copilot using bitbucket, show open pull requests for myworkspace/myrepo
@copilot using bitbucket, get README.md from myworkspace/myrepo
```

### Code Snippets
- `bb-repos` → List repositories
- `bb-prs` → List pull requests  
- `bb-file` → Get file content
- `bb-search` → Search code
- `bb-analyze` → Repository analysis

## 📁 Project Structure

```
bitbucket-mcp/
├── src/
│   └── index.ts              # Main server implementation
├── build/                    # Compiled JavaScript
├── .vscode/                  # Complete VS Code integration
│   ├── settings.json         # MCP server & Copilot configuration
│   ├── mcp.json              # MCP server definition
│   ├── tasks.json            # Build, run, test, and debug tasks
│   ├── launch.json           # Debug configurations
│   ├── extensions.json       # Recommended extensions
│   └── snippets/
│       └── bitbucket-mcp.code-snippets  # Chat command snippets
├── .github/
│   └── copilot-instructions.md
├── README.md                 # Main documentation with VS Code setup
├── VSCODE_SETUP.md          # Comprehensive VS Code integration guide
├── EXAMPLES.md               # Usage examples
├── PROJECT_SUMMARY.md       # This file
├── LICENSE                   # MIT license
├── .env.example              # Environment configuration template
├── .gitignore               # Git ignore rules
├── package.json             # Project dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

## 🚀 Getting Started

### 1. Standard Installation
```bash
cd bitbucket-mcp
npm install
npm run build
```

### 2. VS Code GitHub Copilot Setup
```bash
# Set environment variables
export BITBUCKET_USERNAME="your-username"
export BITBUCKET_APP_PASSWORD="your-app-password"

# Install GitHub Copilot extensions in VS Code
# The project includes complete VS Code configuration
```

### 3. Claude Desktop Integration
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "node",
      "args": ["/path/to/bitbucket-mcp/build/index.js"],
      "env": {
        "BITBUCKET_USERNAME": "your-username",
        "BITBUCKET_APP_PASSWORD": "your-app-password"
      }
    }
  }
}
```

### 4. VS Code Integration
- Open project in VS Code
- Install recommended extensions (GitHub Copilot, etc.)
- Use Ctrl+Alt+I to open Copilot Chat
- Try: `@copilot using bitbucket, list repositories in myworkspace`

## 💡 Usage Examples

### Claude Desktop / VS Code Copilot Chat
- "List repositories in myworkspace"
- "Show me open pull requests for myworkspace/myrepo"  
- "Get the README.md file from myworkspace/myrepo"
- "Search for 'TODO' comments in myworkspace/myrepo"
- "Show me recent commits on the main branch"

### VS Code Snippets (type + Tab)
- `bb-repos` → "@copilot using bitbucket, list repositories in workspace"
- `bb-prs` → "@copilot using bitbucket, show pull requests for repo"
- `bb-file` → "@copilot using bitbucket, get file content"
- `bb-search` → "@copilot using bitbucket, search for code"
- `bb-analyze` → Complete repository analysis workflow

## 🔄 Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch mode for development
- `npm run start` - Start the MCP server
- `npm run prepare` - Prepare for publishing

## 🌟 Key Design Decisions

1. **Read-only focus** - Prevents accidental modifications
2. **Comprehensive API coverage** - Supports most common Bitbucket operations
3. **Flexible authentication** - Works with or without credentials
4. **Error resilience** - Graceful handling of API errors
5. **MCP best practices** - Follows official MCP server patterns

## 🛠️ Technical Stack

- **TypeScript** - Type-safe development
- **MCP SDK** - Official Model Context Protocol SDK
- **Zod** - Schema validation
- **Node.js** - Runtime environment
- **Bitbucket REST API 2.0** - Data source

## 📋 Supported API Endpoints

- `/repositories` - Repository information and listing
- `/pullrequests` - Pull request operations
- `/issues` - Issue management
- `/commits` - Commit history
- `/refs/branches` - Branch information
- `/src` - File content retrieval
- `/search/code` - Code search
- `/users` - User information
- `/workspaces` - Workspace details

## 🔒 Security Considerations

- All operations are read-only
- Requires explicit authentication for private resources
- No write, delete, or modify operations
- Safe for production use with sensitive repositories

## 📈 Future Enhancements

Potential read-only additions:
- Repository statistics and analytics
- Pipeline status information (read-only)
- Webhook configuration viewing
- Advanced search capabilities
- Repository comparison tools

This server provides a comprehensive, secure, and user-friendly way to integrate Bitbucket data with AI assistants through the Model Context Protocol.
