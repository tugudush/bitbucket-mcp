import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration for PR #445
const WORKSPACE = 'oceantg';
const REPO_SLUG = 'otg-keycloak-ui';
const PR_ID = 445;

const SERVER_PATH = path.join(__dirname, 'build', 'index.js');
const NODE_EXE = 'node.exe';
const MCP_CONFIG_PATH = path.join(__dirname, '.vscode', 'mcp.json');

// Load credentials from mcp.json
let env = { ...process.env };
try {
  if (fs.existsSync(MCP_CONFIG_PATH)) {
    const mcpConfig = JSON.parse(fs.readFileSync(MCP_CONFIG_PATH, 'utf8'));
    const serverConfig = mcpConfig.servers && mcpConfig.servers['bitbucket-mcp'];
    if (serverConfig && serverConfig.env) {
      console.log('🔑 Loaded credentials from .vscode/mcp.json\n');
      env = { ...env, ...serverConfig.env };
    }
  }
} catch (e) {
  console.warn('⚠️ Could not load .vscode/mcp.json:', e.message);
}

// Helper to run a tool and return result
function runTool(name, args) {
  return new Promise((resolve) => {
    const server = spawn(NODE_EXE, [SERVER_PATH], { env });
    
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name, arguments: args }
    };

    let output = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.on('close', () => {
      try {
        const lines = output.trim().split('\n');
        const jsonLine = lines.find(line => line.startsWith('{') && line.endsWith('}'));
        
        if (jsonLine) {
          const response = JSON.parse(jsonLine);
          if (response.error) {
            console.error(`   ❌ Error: ${response.error.message}\n`);
            resolve(null);
          } else {
            resolve(response.result);
          }
        } else {
          console.error(`   ❌ No JSON response\n`);
          resolve(null);
        }
      } catch (e) {
        console.error(`   ❌ Parse error: ${e.message}\n`);
        resolve(null);
      }
    });

    server.stdin.write(JSON.stringify(request) + '\n');
    server.stdin.end();
  });
}

// Helper to print section header
function section(title) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(70)}\n`);
}

// Helper to print test result
function printResult(toolName, result, maxLength = 500) {
  console.log(`🔧 Testing: ${toolName}`);
  if (result && result.content && result.content[0]) {
    const text = result.content[0].text;
    const preview = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    console.log(`   ✅ Success! Preview:\n${preview}\n`);
  } else if (result === null) {
    // Error already printed
  } else {
    console.log(`   ⚠️ Unexpected result format\n`);
  }
}

async function main() {
  console.log(`\n${'*'.repeat(70)}`);
  console.log(`  COMPREHENSIVE TEST FOR PR #445`);
  console.log(`  Workspace: ${WORKSPACE}`);
  console.log(`  Repository: ${REPO_SLUG}`);
  console.log(`  Pull Request: #${PR_ID}`);
  console.log(`${'*'.repeat(70)}\n`);

  // =================================================================
  // SECTION 1: Workspace & Repository Tools
  // =================================================================
  section('SECTION 1: Workspace & Repository Tools');

  let result = await runTool('bb_list_workspaces', {});
  printResult('bb_list_workspaces', result, 300);

  result = await runTool('bb_get_workspace', { workspace: WORKSPACE });
  printResult('bb_get_workspace', result, 300);

  result = await runTool('bb_list_repositories', { workspace: WORKSPACE, pagelen: 5 });
  printResult('bb_list_repositories', result, 400);

  result = await runTool('bb_get_repository', { workspace: WORKSPACE, repo_slug: REPO_SLUG });
  printResult('bb_get_repository', result, 400);

  result = await runTool('bb_search_repositories', { workspace: WORKSPACE, query: 'keycloak' });
  printResult('bb_search_repositories', result, 300);

  // =================================================================
  // SECTION 2: Pull Request Core Tools
  // =================================================================
  section('SECTION 2: Pull Request Core Tools');

  result = await runTool('bb_get_pull_requests', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    pagelen: 5 
  });
  printResult('bb_get_pull_requests', result, 600);

  result = await runTool('bb_get_pull_request', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    pull_request_id: PR_ID 
  });
  printResult('bb_get_pull_request', result, 600);

  // =================================================================
  // SECTION 3: PR Comments & Activity Tools
  // =================================================================
  section('SECTION 3: PR Comments & Activity Tools');

  result = await runTool('bb_get_pull_request_comments', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    pull_request_id: PR_ID,
    pagelen: 10
  });
  printResult('bb_get_pull_request_comments', result, 800);

  result = await runTool('bb_get_pull_request_activity', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    pull_request_id: PR_ID,
    pagelen: 10
  });
  printResult('bb_get_pull_request_activity', result, 800);

  // Test comment thread (if we find a comment ID)
  // For now, we'll skip this unless we parse a comment ID from previous results

  // =================================================================
  // SECTION 4: PR Diff & Commit Tools
  // =================================================================
  section('SECTION 4: PR Diff & Commit Tools');

  result = await runTool('bb_get_pull_request_diff', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    pull_request_id: PR_ID
  });
  printResult('bb_get_pull_request_diff', result, 1500);

  result = await runTool('bb_get_pull_request_diffstat', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    pull_request_id: PR_ID
  });
  printResult('bb_get_pull_request_diffstat', result, 800);

  result = await runTool('bb_get_pr_commits', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    pull_request_id: PR_ID,
    pagelen: 10
  });
  printResult('bb_get_pr_commits', result, 800);

  result = await runTool('bb_get_pr_statuses', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    pull_request_id: PR_ID
  });
  printResult('bb_get_pr_statuses', result, 600);

  // =================================================================
  // SECTION 5: Branch & Commit Tools
  // =================================================================
  section('SECTION 5: Branch & Commit Tools');

  result = await runTool('bb_get_branches', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    pagelen: 10
  });
  printResult('bb_get_branches', result, 800);

  // Get branch details for a common branch (main, master, or develop)
  result = await runTool('bb_get_branch', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    branch_name: 'main'
  });
  printResult('bb_get_branch (main)', result, 400);

  result = await runTool('bb_get_commits', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    pagelen: 5
  });
  printResult('bb_get_commits', result, 800);

  // Get first commit details (we'll need to parse a commit hash)
  // For now skip unless we parse from previous result

  // =================================================================
  // SECTION 6: File Browsing Tools
  // =================================================================
  section('SECTION 6: File Browsing Tools');

  result = await runTool('bb_browse_repository', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    limit: 20
  });
  printResult('bb_browse_repository', result, 800);

  // Try to get README.md or package.json (common files)
  result = await runTool('bb_get_file_content', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    file_path: 'README.md',
    start: 1,
    limit: 50
  });
  printResult('bb_get_file_content (README.md)', result, 1000);

  result = await runTool('bb_get_file_content', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    file_path: 'package.json',
    start: 1,
    limit: 100
  });
  printResult('bb_get_file_content (package.json)', result, 1000);

  // =================================================================
  // SECTION 7: User & Search Tools
  // =================================================================
  section('SECTION 7: User & Search Tools');

  result = await runTool('bb_get_current_user', {});
  printResult('bb_get_current_user', result, 300);

  // Test search code (requires account-level enablement)
  result = await runTool('bb_search_code', { 
    workspace: WORKSPACE,
    search_query: 'function',
    repo_slug: REPO_SLUG
  });
  printResult('bb_search_code', result, 800);

  // =================================================================
  // SECTION 8: Additional Repository Tools
  // =================================================================
  section('SECTION 8: Additional Repository Tools');

  result = await runTool('bb_get_tags', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    pagelen: 10
  });
  printResult('bb_get_tags', result, 500);

  result = await runTool('bb_get_issues', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    pagelen: 5
  });
  printResult('bb_get_issues', result, 500);

  // =================================================================
  // Summary
  // =================================================================
  console.log(`\n${'*'.repeat(70)}`);
  console.log(`  TEST SUITE COMPLETED ✨`);
  console.log(`${'*'.repeat(70)}\n`);
}

main().catch(console.error);
