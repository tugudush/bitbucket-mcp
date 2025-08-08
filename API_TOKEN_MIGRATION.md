# API Token Migration Guide

## Overview

As of **September 9, 2025**, Bitbucket is replacing App Passwords with API Tokens. This MCP server has been updated to support both methods, with API tokens being the recommended approach.

## Migration Steps

### 1. Create an API Token

1. Go to your Bitbucket account settings
2. Navigate to **API tokens** under Access management
3. Click **Create API token**
4. Select the following permissions:
   - **Repositories**: Read
   - **Pull requests**: Read
   - **Issues**: Read
   - **Account**: Read
5. Copy the generated token

### 2. Update Environment Variables

**Replace:**
```bash
BITBUCKET_USERNAME=your-username
BITBUCKET_APP_PASSWORD=your-app-password
```

**With:**
```bash
BITBUCKET_API_TOKEN=your-api-token
```

### 3. Update Configuration Files

**VS Code (.vscode/settings.json or .vscode/mcp.json):**
```json
{
  "mcp.servers": {
    "bitbucket": {
      "env": {
        "BITBUCKET_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

**Claude Desktop (claude_desktop_config.json):**
```json
{
  "mcpServers": {
    "bitbucket": {
      "env": {
        "BITBUCKET_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

## Backward Compatibility

The server will continue to support App Passwords for backward compatibility:

- **Priority**: API Token (Bearer auth) is checked first
- **Fallback**: App Password (Basic auth) is used if no API token is provided
- **Both**: You can have both configured - API token will take precedence

## Authentication Flow

```typescript
// Priority order:
if (BITBUCKET_API_TOKEN) {
  // Use Bearer authentication (recommended)
  headers.Authorization = `Bearer ${apiToken}`;
} else if (BITBUCKET_USERNAME && BITBUCKET_APP_PASSWORD) {
  // Use Basic authentication (legacy)
  headers.Authorization = `Basic ${base64(username:password)}`;
}
```

## Testing the Migration

1. Set your API token: `export BITBUCKET_API_TOKEN=your-token`
2. Test the server: `node build/index.js`
3. Verify authentication in your MCP client (VS Code/Claude)

## Timeline

- **August 2025**: API tokens available and recommended
- **September 9, 2025**: App passwords discontinued
- **June 9, 2026**: Existing app passwords become inactive

## Troubleshooting

**"Authentication failed" with API token:**
- Verify the token has correct permissions
- Check that the token hasn't expired
- Ensure environment variable is properly set

**Server still using App Password:**
- Check that `BITBUCKET_API_TOKEN` is set
- Restart your MCP client after setting the token
- Clear any cached environment variables
