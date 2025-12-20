import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SERVER_PATH = path.join(__dirname, 'build', 'index.js');
const NODE_EXE = 'node.exe'; // Use node.exe for Windows Git Bash compatibility
const MCP_CONFIG_PATH = path.join(__dirname, '.vscode', 'mcp.json');

// Load credentials from mcp.json
let env = { ...process.env };
try {
  if (fs.existsSync(MCP_CONFIG_PATH)) {
    const mcpConfig = JSON.parse(fs.readFileSync(MCP_CONFIG_PATH, 'utf8'));
    const serverConfig = mcpConfig.servers && mcpConfig.servers['bitbucket-mcp'];
    if (serverConfig && serverConfig.env) {
      console.log('🔑 Loaded credentials from .vscode/mcp.json');
      env = { ...env, ...serverConfig.env };
    }
  }
} catch (e) {
  console.warn('⚠️ Could not load .vscode/mcp.json:', e.message);
}

// State
let workspace = '';
let repoSlug = '';
let filePath = '';
let issueId = 0;
let prId = 0;

// Helper to run a tool
function runTool(name, args) {
  return new Promise((resolve, reject) => {
    const server = spawn(NODE_EXE, [SERVER_PATH], { env });
    
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name,
        arguments: args
      }
    };

    let output = '';
    let errorOutput = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    server.on('close', (code) => {
      if (code !== 0) {
        // console.error(`Server exited with code ${code}`);
        // console.error('Stderr:', errorOutput);
      }
      
      try {
        // Parse the last line that looks like JSON
        const lines = output.trim().split('\n');
        const jsonLine = lines.find(line => line.startsWith('{') && line.endsWith('}'));
        
        if (jsonLine) {
          const response = JSON.parse(jsonLine);
          if (response.error) {
            console.error(`❌ ${name} failed:`, response.error.message);
            resolve(null);
          } else {
            console.log(`✅ ${name} success`);
            resolve(response.result);
          }
        } else {
          console.error(`❌ ${name} no JSON response`);
          console.error('Output:', output);
          resolve(null);
        }
      } catch (e) {
        console.error(`❌ ${name} parse error:`, e.message);
        resolve(null);
      }
    });

    // Send request
    server.stdin.write(JSON.stringify(request) + '\n');
    server.stdin.end();
  });
}

async function main() {
  console.log('🚀 Starting full tool test suite...\n');

  // 1. List Workspaces
  const workspaces = await runTool('bb_list_workspaces', {});
  if (workspaces && workspaces.content[0].text) {
    // Extract workspace name from text output (simple parsing)
    // Format: "- workspace_name (Display Name)"
    const match = workspaces.content[0].text.match(/- ([^\s]+)/);
    if (match) {
      workspace = match[1];
      console.log(`   Found workspace: ${workspace}`);
    }
  }

  if (!workspace) {
    console.error('Could not find a workspace. Aborting tests.');
    return;
  }

  // 2. Get Workspace Details
  await runTool('bb_get_workspace', { workspace });

  // 3. List Repositories
  const repos = await runTool('bb_list_repositories', { workspace });
  if (repos && repos.content[0].text) {
    // Extract repo slug
    // Format: "- repo_slug (Public/Private)"
    const match = repos.content[0].text.match(/- ([^\s]+)/);
    if (match) {
      repoSlug = match[1];
      console.log(`   Found repository: ${repoSlug}`);
    }
  }

  if (!repoSlug) {
    console.error('Could not find a repository. Aborting repo-dependent tests.');
    return;
  }

  // 4. Get Repository Details
  await runTool('bb_get_repository', { workspace, repo_slug: repoSlug });

  // 5. Get Branches
  await runTool('bb_get_branches', { workspace, repo_slug: repoSlug });

  // 6. Browse Repository
  const files = await runTool('bb_browse_repository', { workspace, repo_slug: repoSlug });
  if (files && files.content[0].text) {
    // Find a file (not a directory)
    // Format: "📄 filename"
    const match = files.content[0].text.match(/📄 ([^\n]+)/);
    if (match) {
      filePath = match[1].trim();
      console.log(`   Found file: ${filePath}`);
    } else {
        // Fallback to README.md if not found in list
        filePath = 'README.md';
    }
  }

  // 7. Get File Content
  if (filePath) {
    await runTool('bb_get_file_content', { workspace, repo_slug: repoSlug, file_path: filePath });
  }

  // 8. Get Commits
  await runTool('bb_get_commits', { workspace, repo_slug: repoSlug });

  // 9. Get Issues
  const issues = await runTool('bb_get_issues', { workspace, repo_slug: repoSlug });
  if (issues && issues.content[0].text) {
    // Extract issue ID
    // Format: "- #1: Title"
    const match = issues.content[0].text.match(/- #(\d+):/);
    if (match) {
      issueId = parseInt(match[1]);
      console.log(`   Found issue: #${issueId}`);
    }
  }

  // 10. Get Issue Details
  if (issueId) {
    await runTool('bb_get_issue', { workspace, repo_slug: repoSlug, issue_id: issueId });
  } else {
    console.log('   Skipping bb_get_issue (no issues found)');
  }

  // 11. Get Pull Requests
  const prs = await runTool('bb_get_pull_requests', { workspace, repo_slug: repoSlug });
  if (prs && prs.content[0].text) {
    // Extract PR ID
    // Format: "- #1: Title"
    const match = prs.content[0].text.match(/- #(\d+):/);
    if (match) {
      prId = parseInt(match[1]);
      console.log(`   Found PR: #${prId}`);
    }
  }

  // 12. Get PR Details
  if (prId) {
    await runTool('bb_get_pull_request', { workspace, repo_slug: repoSlug, pull_request_id: prId });
    await runTool('bb_get_pull_request_comments', { workspace, repo_slug: repoSlug, pull_request_id: prId });
    await runTool('bb_get_pull_request_activity', { workspace, repo_slug: repoSlug, pull_request_id: prId });
  } else {
    console.log('   Skipping PR details (no PRs found)');
  }

  // 13. Get Current User
  await runTool('bb_get_current_user', {});

  // 14. Search Repositories
  await runTool('bb_search_repositories', { workspace, query: 'test' });

  // 15. Search Code
  await runTool('bb_search_code', { workspace, search_query: 'function' });

  console.log('\n✨ Test suite completed.');
}

main().catch(console.error);
