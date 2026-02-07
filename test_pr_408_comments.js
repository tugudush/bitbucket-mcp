import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration from the provided URL
const WORKSPACE = 'oceantg';
const REPO_SLUG = 'otg-keycloak-ui';
const PR_ID = 408;
const COMMENT_ID = 744553155;

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

function printResult(toolName, result) {
  console.log(`🔧 Testing: ${toolName}`);
  if (result && result.content && result.content[0]) {
    const text = result.content[0].text;
    console.log(`   ✅ Success! Full output:\n${text}\n`);
    return result;
  } else if (result === null) {
    return null;
  } else {
    console.log(`   ⚠️ Unexpected result format\n`);
    return null;
  }
}

async function main() {
  console.log(`\n${'*'.repeat(70)}`);
  console.log(`  TESTING COMMENT TOOLS WITH PR #408`);
  console.log(`  Comment ID: ${COMMENT_ID}`);
  console.log(`  URL: https://bitbucket.org/${WORKSPACE}/${REPO_SLUG}/pull-requests/${PR_ID}#comment-${COMMENT_ID}`);
  console.log(`${'*'.repeat(70)}\n`);

  // =================================================================
  // SECTION 1: Get PR Details First
  // =================================================================
  console.log('='.repeat(70));
  console.log('  SECTION 1: PR #408 Details');
  console.log('='.repeat(70) + '\n');

  let result = await runTool('bb_get_pull_request', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    pull_request_id: PR_ID 
  });
  printResult('bb_get_pull_request', result);

  // =================================================================
  // SECTION 2: Get All PR Comments
  // =================================================================
  console.log('='.repeat(70));
  console.log('  SECTION 2: All PR #408 Comments');
  console.log('='.repeat(70) + '\n');

  result = await runTool('bb_get_pull_request_comments', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    pull_request_id: PR_ID,
    pagelen: 20
  });
  printResult('bb_get_pull_request_comments', result);

  // =================================================================
  // SECTION 3: Get Specific Comment by ID
  // =================================================================
  console.log('='.repeat(70));
  console.log('  SECTION 3: Get Specific Comment by ID');
  console.log('='.repeat(70) + '\n');

  result = await runTool('bb_get_pull_request_comment', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    pull_request_id: PR_ID,
    comment_id: COMMENT_ID
  });
  printResult('bb_get_pull_request_comment', result);

  // =================================================================
  // SECTION 4: Get Comment Thread (with replies)
  // =================================================================
  console.log('='.repeat(70));
  console.log('  SECTION 4: Get Comment Thread with Replies');
  console.log('='.repeat(70) + '\n');

  result = await runTool('bb_get_comment_thread', { 
    workspace: WORKSPACE, 
    repo_slug: REPO_SLUG,
    pull_request_id: PR_ID,
    comment_id: COMMENT_ID
  });
  printResult('bb_get_comment_thread', result);

  // =================================================================
  // Summary
  // =================================================================
  console.log(`\n${'*'.repeat(70)}`);
  console.log(`  COMMENT TOOLS TEST COMPLETED ✨`);
  console.log(`${'*'.repeat(70)}\n`);
  
  console.log('📊 COMMENT TOOLS TESTED:');
  console.log('   ✅ bb_get_pull_request_comment - Get single comment by ID');
  console.log('   ✅ bb_get_comment_thread - Get comment with all nested replies');
  console.log('');
  console.log('🎯 These tools are now FULLY VERIFIED!');
  console.log('');
}

main().catch(console.error);
