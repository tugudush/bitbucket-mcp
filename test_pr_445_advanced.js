import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - using data from PR #445
const WORKSPACE = 'oceantg';
const REPO_SLUG = 'otg-keycloak-ui';
const PR_ID = 445;
const COMMIT_HASH = '0fe347db'; // From PR commits
const BRANCH_NAME = 'develop'; // Source branch
const FILE_PATH = 'src/pages/create-tenant/create-tenant.tsx'; // From diff
const TAG_NAME = 'stable-v1.0.2.0'; // From tags list

const SERVER_PATH = path.join(__dirname, 'build', 'index.js');
const NODE_EXE = 'node.exe';
const MCP_CONFIG_PATH = path.join(__dirname, '.vscode', 'mcp.json');

// Load credentials
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

// Helper to run a tool
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

function section(title) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(70)}\n`);
}

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
  console.log(`  ADVANCED TOOLS TEST FOR PR #445`);
  console.log(`  Testing remaining tools with actual data`);
  console.log(`${'*'.repeat(70)}\n`);

  // =================================================================
  // SECTION 1: Commit Tools
  // =================================================================
  section('SECTION 1: Commit Details & History');

  let result = await runTool('bb_get_commit', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    commit_hash: COMMIT_HASH
  });
  printResult('bb_get_commit', result, 600);

  result = await runTool('bb_get_commit_statuses', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    commit_hash: COMMIT_HASH
  });
  printResult('bb_get_commit_statuses', result, 600);

  result = await runTool('bb_get_file_history', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    commit: 'develop',
    path: FILE_PATH,
    pagelen: 5
  });
  printResult('bb_get_file_history', result, 800);

  // =================================================================
  // SECTION 2: Branch Comparison Tools
  // =================================================================
  section('SECTION 2: Branch Comparison & Diff');

  result = await runTool('bb_get_diff', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    spec: `${COMMIT_HASH}`
  });
  printResult('bb_get_diff', result, 1000);

  result = await runTool('bb_get_diffstat', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    spec: `${COMMIT_HASH}`
  });
  printResult('bb_get_diffstat', result, 600);

  result = await runTool('bb_get_merge_base', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    spec: 'develop..main'
  });
  printResult('bb_get_merge_base', result, 400);

  // =================================================================
  // SECTION 3: Tag Tools
  // =================================================================
  section('SECTION 3: Tag Details');

  result = await runTool('bb_get_tag', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    tag_name: TAG_NAME
  });
  printResult('bb_get_tag', result, 400);

  // =================================================================
  // SECTION 4: Branch Details (with correct parameter)
  // =================================================================
  section('SECTION 4: Branch Details');

  result = await runTool('bb_get_branch', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    name: 'develop'
  });
  printResult('bb_get_branch (develop)', result, 400);

  result = await runTool('bb_get_branch', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    name: 'qc'
  });
  printResult('bb_get_branch (qc)', result, 400);

  // =================================================================
  // SECTION 5: User Tools
  // =================================================================
  section('SECTION 5: User Information');

  result = await runTool('bb_get_user', { 
    username: 'jeromegomez1'
  });
  printResult('bb_get_user (jeromegomez1)', result, 300);

  result = await runTool('bb_get_user', {});
  printResult('bb_get_user (current user)', result, 300);

  result = await runTool('bb_list_user_pull_requests', { 
    selected_user: 'jeromegomez1',
    state: 'OPEN',
    pagelen: 5
  });
  printResult('bb_list_user_pull_requests', result, 600);

  // =================================================================
  // SECTION 6: Pipeline Tools
  // =================================================================
  section('SECTION 6: CI/CD Pipeline Information');

  result = await runTool('bb_list_pipelines', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    pagelen: 5
  });
  printResult('bb_list_pipelines', result, 800);

  // Try to get first pipeline details if available
  // (We'd need to parse a pipeline UUID from the result, so this is tentative)
  // For now, let's test with a placeholder to show functionality
  console.log('   ℹ️ Note: bb_get_pipeline, bb_get_pipeline_steps, bb_get_pipeline_step_log');
  console.log('   require specific pipeline UUIDs from the list. Skipping detailed pipeline tests.\n');

  // =================================================================
  // SECTION 7: File Browsing with Subdirectories
  // =================================================================
  section('SECTION 7: Advanced File Browsing');

  result = await runTool('bb_browse_repository', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    ref: 'develop',
    path: 'src',
    limit: 10
  });
  printResult('bb_browse_repository (src/)', result, 600);

  result = await runTool('bb_browse_repository', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    ref: 'develop',
    path: 'src/pages',
    limit: 10
  });
  printResult('bb_browse_repository (src/pages/)', result, 600);

  result = await runTool('bb_get_file_content', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    file_path: FILE_PATH,
    ref: 'develop',
    start: 1,
    limit: 100
  });
  printResult(`bb_get_file_content (${FILE_PATH})`, result, 1200);

  // =================================================================
  // Summary
  // =================================================================
  console.log(`\n${'*'.repeat(70)}`);
  console.log(`  ADVANCED TOOLS TEST COMPLETED ✨`);
  console.log(`${'*'.repeat(70)}\n`);
  
  console.log('📊 Summary:');
  console.log('   ✅ Commit tools tested');
  console.log('   ✅ Branch comparison tools tested');
  console.log('   ✅ Tag tools tested');
  console.log('   ✅ Branch details tested');
  console.log('   ✅ User tools tested');
  console.log('   ✅ Pipeline listing tested');
  console.log('   ✅ Advanced file browsing tested');
  console.log('');
  console.log('ℹ️  Some tools require specific IDs from dynamic data:');
  console.log('   - bb_get_pipeline / bb_get_pipeline_steps / bb_get_pipeline_step_log');
  console.log('   - bb_get_pull_request_comment / bb_get_comment_thread');
  console.log('   - bb_get_issue (repo has no issue tracker)');
  console.log('');
}

main().catch(console.error);
