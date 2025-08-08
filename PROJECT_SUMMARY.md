# Bitbucket MCP Server - Project Summary

## 🎯 Project Overview

This is a comprehensive Model Context Protocol (MCP) server that provides **read-only** access to Bitbucket repositories, issues, pull requests, and other resources. It's designed as the Bitbucket equivalent of the GitHub MCP server with a focus on security and safety.

## ✅ Implemented Features

### 🔧 Core Tools (12 total)

1. **Repository Management**
   - `bb_get_repository` - Get detailed repository information
   - `bb_list_repositories` - List repositories in a workspace
   - `bb_get_file_content` - Retrieve file contents from repositories
   - `bb_search_code` - Search for code within repositories

2. **Pull Request Operations**
   - `bb_get_pull_requests` - List pull requests with filtering options
   - `bb_get_pull_request` - Get detailed PR information

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

## 📁 Project Structure

```
bitbucket-mcp/
├── src/
│   └── index.ts              # Main server implementation
├── build/                    # Compiled JavaScript
├── .vscode/
│   └── mcp.json              # VS Code MCP configuration
├── .github/
│   └── copilot-instructions.md
├── README.md                 # Comprehensive documentation
├── EXAMPLES.md               # Usage examples
├── LICENSE                   # MIT license
├── .env.example              # Environment configuration template
├── .gitignore               # Git ignore rules
├── package.json             # Project dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

## 🚀 Getting Started

### 1. Installation
```bash
cd bitbucket-mcp
npm install
npm run build
```

### 2. Configuration
Set environment variables:
- `BITBUCKET_USERNAME` - Your Bitbucket username
- `BITBUCKET_APP_PASSWORD` - Your App Password

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

## 💡 Usage Examples

- "List repositories in myworkspace"
- "Show me open pull requests for myworkspace/myrepo"
- "Get the README.md file from myworkspace/myrepo"
- "Search for 'TODO' comments in myworkspace/myrepo"
- "Show me recent commits on the main branch"

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
