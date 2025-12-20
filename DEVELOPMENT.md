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

## Manual Testing

The server communicates via `stdio` using the Model Context Protocol (JSON-RPC 2.0). You can test it manually by piping JSON requests to the executable.

### 1. Basic Connection Test (List Tools)

Create a file named `request_list_tools.json`:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

Run the server with this input:

**Mac/Linux:**
```bash
cat request_list_tools.json | node build/index.js
```

**Windows (PowerShell):**
```powershell
Get-Content request_list_tools.json | node build/index.js
```

**Windows (Command Prompt):**
```cmd
type request_list_tools.json | node build/index.js
```

### 2. Testing Specific Tools

To test a tool like `bb_list_workspaces`, create `request_call_tool.json`:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "bb_list_workspaces",
    "arguments": {}
  }
}
```

Run it similarly:
```bash
cat request_call_tool.json | node build/index.js
```

### 3. Authentication

To test with authentication, set the environment variables before running the command.

**Mac/Linux:**
```bash
export BITBUCKET_API_TOKEN="your-token"
export BITBUCKET_EMAIL="your-email"
cat request_call_tool.json | node build/index.js
```

**Windows (PowerShell):**
```powershell
$env:BITBUCKET_API_TOKEN="your-token"
$env:BITBUCKET_EMAIL="your-email"
Get-Content request_call_tool.json | node build/index.js
```

## Debugging

Enable debug logging to see detailed information about the server's internal state and environment variables. Debug logs are printed to `stderr` so they don't interfere with the JSON-RPC output on `stdout`.

```bash
BITBUCKET_DEBUG=true node build/index.js
```

## Running Tests

Run the automated test suite (Jest):

```bash
npm test
```
