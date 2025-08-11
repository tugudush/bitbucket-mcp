# VS Code Configuration Template

This directory contains template configuration files for VS Code that you can customize for your development environment.

## Setup Instructions

1. **Copy this template directory:**
   ```bash
   cp -r .vscode-template .vscode
   ```

2. **Update the configuration files:**
   
   **In `.vscode/settings.json` and `.vscode/mcp.json`:**
   - Replace `your-api-token` with your actual Bitbucket API token
   - Replace `your-atlassian-email` with your Atlassian account email address

3. **Install recommended extensions:**
   - Open VS Code in this workspace
   - VS Code will prompt you to install recommended extensions
   - Or manually install: GitHub Copilot, GitHub Copilot Chat

## Files Included

- **`settings.json`** - Workspace settings with MCP and Copilot configuration
- **`mcp.json`** - MCP server configuration for direct MCP client usage
- **`extensions.json`** - Recommended VS Code extensions

## Important Notes

- **Never commit `.vscode` directory** - It contains your personal API tokens
- **The `.vscode` directory is in `.gitignore`** - Your personal configuration won't be accidentally committed
- **Update tokens regularly** - API tokens should be rotated periodically for security

## Alternative: Environment Variables

Instead of putting tokens in VS Code configuration files, you can set environment variables:

```bash
export BITBUCKET_API_TOKEN=your-api-token
export BITBUCKET_EMAIL=your-atlassian-email
```

Then modify the `env` section in the configuration files to reference these variables (though VS Code may not expand them automatically).
