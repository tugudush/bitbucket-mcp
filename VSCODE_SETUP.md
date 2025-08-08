# VS Code GitHub Copilot Integration Guide

This guide provides step-by-step instructions for integrating the Bitbucket MCP Server with VS Code and GitHub Copilot.

## Quick Setup Checklist

- [ ] Node.js 18+ installed
- [ ] GitHub Copilot extension installed in VS Code
- [ ] Bitbucket MCP Server built (`npm run build`)
- [ ] Environment variables configured
- [ ] MCP server configured in VS Code
- [ ] GitHub Copilot MCP integration enabled

## Detailed Setup Instructions

### 1. Prerequisites

**Install Node.js:**
- Download and install Node.js 18 or higher from [nodejs.org](https://nodejs.org/)
- Verify installation: `node --version` and `npm --version`

**Install GitHub Copilot Extension:**
1. Open VS Code
2. Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (macOS)
3. Search for "GitHub Copilot"
4. Install both:
   - GitHub Copilot (by GitHub)
   - GitHub Copilot Chat (by GitHub)
5. Sign in with your GitHub account when prompted

### 2. Environment Setup

**Option A: Using .env file (Recommended)**
1. Create a `.env` file in the project root:
```env
BITBUCKET_USERNAME=your-username
BITBUCKET_APP_PASSWORD=your-app-password
```

**Option B: System Environment Variables**
```bash
# Windows (Command Prompt)
set BITBUCKET_USERNAME=your-username
set BITBUCKET_APP_PASSWORD=your-app-password

# Windows (PowerShell)
$env:BITBUCKET_USERNAME="your-username"
$env:BITBUCKET_APP_PASSWORD="your-app-password"

# macOS/Linux
export BITBUCKET_USERNAME="your-username"
export BITBUCKET_APP_PASSWORD="your-app-password"
```

**Creating Bitbucket App Password:**
1. Go to Bitbucket Settings → Personal settings → App passwords
2. Click "Create app password"
3. Give it a name (e.g., "MCP Server")
4. Select permissions: Repositories (Read), Account (Read)
5. Copy the generated password

### 3. Build the MCP Server

```bash
# In the bitbucket-mcp directory
npm install
npm run build
```

### 4. VS Code Configuration

**Method 1: Use the provided configuration files**
The project includes pre-configured VS Code settings:
- `.vscode/settings.json` - MCP server configuration
- `.vscode/mcp.json` - MCP server definition
- `.vscode/tasks.json` - Build and run tasks
- `.vscode/launch.json` - Debug configuration

**Method 2: Manual configuration**
1. Open VS Code settings (`Ctrl+,` / `Cmd+,`)
2. Search for "mcp"
3. Add MCP server configuration in settings.json:

**Windows:**
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
      "args": ["/path/to/bitbucket-mcp/build/index.js"],
      "env": {
        "BITBUCKET_USERNAME": "your-username",
        "BITBUCKET_APP_PASSWORD": "your-app-password"
      }
    }
  }
}
```

**Using workspace folder (cross-platform):**
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

### 5. Enable MCP Integration

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run "GitHub Copilot: Configure MCP Servers"
3. Enable the Bitbucket MCP server
4. Restart VS Code

### 6. Testing the Integration

**Test 1: Check MCP Server**
1. Open integrated terminal (`Ctrl+` ` / `Cmd+` `)
2. Run: `node build/index.js`
3. Should see: "Bitbucket MCP Server running on stdio"

**Test 2: Test with Copilot Chat**
1. Open Copilot Chat (`Ctrl+Alt+I` / `Cmd+Alt+I`)
2. Try: `@copilot list available tools`
3. Should see Bitbucket tools with `bb_` prefix

**Test 3: Use a Bitbucket tool**
1. In Copilot Chat, try: `@copilot using bitbucket, list repositories in myworkspace`
2. Replace "myworkspace" with an actual workspace name

## Usage in VS Code

### Opening Copilot Chat

**Keyboard Shortcuts:**
- `Ctrl+Alt+I` / `Cmd+Alt+I` - Open chat panel
- `Ctrl+Shift+I` / `Cmd+Shift+I` - Open inline chat

**Menu Options:**
- View → Command Palette → "GitHub Copilot: Open Chat"
- Click the chat icon in the activity bar

### Using Bitbucket Tools

**Basic Commands:**
```
@copilot using bitbucket, list repositories in myworkspace
@copilot using bitbucket, get README.md from myworkspace/myrepo
@copilot using bitbucket, show open pull requests for myworkspace/myrepo
```

**Advanced Workflows:**
```
@copilot analyze myworkspace/myrepo using bitbucket tools and provide:
1. Repository overview
2. Recent activity summary
3. Open issues and PRs
4. Code quality insights
```

### Code Snippets

Type these prefixes in VS Code and press Tab:
- `bb-repos` - List repositories
- `bb-prs` - List pull requests
- `bb-file` - Get file content
- `bb-search` - Search code
- `bb-analyze` - Repository analysis

### Integrated Workflows

**Context-Aware Development:**
```
@copilot I'm working on this file. Using bitbucket tools:
1. Check if there are related issues in myworkspace/myrepo
2. Show recent commits that might affect this code
3. Look for similar code patterns in the repository
```

**Code Review Assistance:**
```
@copilot using bitbucket, help me review PR #123 in myworkspace/myrepo
Show me what changed and suggest potential issues
```

## Advanced Configuration

### Workspace-Specific Settings

Create `.vscode/settings.json` in your project:
```json
{
  "mcp.servers": {
    "bitbucket": {
      "command": "node",
      "args": ["${workspaceFolder}/path/to/bitbucket-mcp/build/index.js"],
      "env": {
        "BITBUCKET_USERNAME": "${env:BITBUCKET_USERNAME}",
        "BITBUCKET_APP_PASSWORD": "${env:BITBUCKET_APP_PASSWORD}"
      }
    }
  }
}
```

### Custom Tasks

Use the provided tasks in VS Code:
- `Ctrl+Shift+P` → "Tasks: Run Task"
- Select "Build Bitbucket MCP Server" or "Start Bitbucket MCP Server"

### Debugging

1. Set breakpoints in TypeScript source
2. Press `F5` or use "Run and Debug" panel
3. Select "Debug Bitbucket MCP Server"

## Troubleshooting

### Common Issues

**1. "MCP server not found"**
- Check that `build/index.js` exists (`npm run build`)
- Verify the path in VS Code settings
- Restart VS Code

**2. "Authentication failed"**
- Check environment variables are set correctly
- Verify Bitbucket App Password permissions
- Test with: `node build/index.js` in terminal

**3. "Tools not available in Copilot Chat"**
- Ensure GitHub Copilot Chat extension is installed
- Check if MCP integration is enabled in Copilot settings
- Try: `@copilot list available tools`

**4. "Permission denied"**
- Check Bitbucket App Password has Repository:Read permission
- Verify workspace/repository names are correct
- Test with public repositories first

### Debug Commands

```bash
# Test MCP server manually
node build/index.js

# Check with environment variables
BITBUCKET_USERNAME=user BITBUCKET_APP_PASSWORD=pass node build/index.js

# Enable debug logging
DEBUG=* node build/index.js
```

### VS Code Developer Tools

1. Help → Toggle Developer Tools
2. Check Console for MCP-related errors
3. Look for network requests to Bitbucket API

## Best Practices

### Security
- Never commit `.env` files with credentials
- Use workspace-specific environment variables
- Regularly rotate Bitbucket App Passwords

### Performance
- Use pagination for large repositories
- Cache frequently accessed data
- Avoid concurrent API calls

### Workflow Integration
- Combine Bitbucket data with local file context
- Use in code reviews and planning
- Integrate with VS Code tasks and debugging

## Getting Help

**VS Code Issues:**
1. Check VS Code Developer Console
2. Verify extension compatibility
3. Update VS Code and extensions

**MCP Server Issues:**
1. Check server logs in terminal
2. Test API credentials manually
3. Review Bitbucket API documentation

**GitHub Copilot Issues:**
1. Check Copilot extension status
2. Verify GitHub account permissions
3. Review MCP integration settings
