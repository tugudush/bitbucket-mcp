# Development Guide

This guide provides instructions for setting up, building, and manually testing the Bitbucket MCP Server.

## Prerequisites

- Node.js 16+
- NPM

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Build Commands

- **Full Pipeline** (Lint + Typecheck + Format + Build):
  ```bash
  npm run ltfb
  ```
- **Build only**:
  ```bash
  npm run build
  ```
- **Watch mode**:
  ```bash
  npm run watch
  ```

## Testing

### Automated Tests (Jest)
Run the unit test suite:
```bash
npm test
```

### Integration Tests (Live API)
The `test_all_tools.js` script verifies all tools against the live Bitbucket API. It automatically loads credentials from `.vscode/mcp.json` if present.

```bash
node test_all_tools
```

### Manual JSON-RPC Testing
You can test manually by piping JSON requests to the executable.

1. **Create a request file** (e.g., `request.json`):
   ```json
   {
     "jsonrpc": "2.0",
     "id": 1,
     "method": "tools/list",
     "params": {}
   }
   ```

2. **Run the server**:
   ```bash
   # Windows (Git Bash)
   cat request.json | node.exe build

   # Mac/Linux
   cat request.json | node build
   ```

   *Note: Set `BITBUCKET_API_TOKEN` and `BITBUCKET_EMAIL` environment variables for authenticated requests.*

   **Example (Windows Git Bash):**
   ```bash
   export BITBUCKET_API_TOKEN="your-token"
   export BITBUCKET_EMAIL="your-email"
   cat request.json | node.exe build/index.js
   ```

## Debugging

Enable debug logging to see internal state (printed to stderr):

```bash
BITBUCKET_DEBUG=true node build/index.js
```

