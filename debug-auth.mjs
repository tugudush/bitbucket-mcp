// Debug authentication to compare what MCP server sends vs what works
import { spawn } from 'child_process';

console.log('Testing MCP server authentication...\n');

// Test the MCP server with our current environment
const mcp = spawn('node', ['build/index.js'], {
  env: {
    ...process.env,
    BITBUCKET_API_TOKEN: 'ATATT3xFfGF0qtjINJnWm5Jcj5wlFHS4KHSdDWXX2LRtizlPUIMdvMxKp6G4pgBAVJxDiTS1Z0Fnw4x-ggefxEFF3NslfMg10UE5K2QEgYhvMkGUiwj_DKoiJIredpfBjW7vdHLZw4CRs_JklGS9kCJs9eJ3iXgdTXk0D3MhUNlbW1a2Ubj6cLc=0F9CB982',
    BITBUCKET_EMAIL: 'jerome2kph@gmail.com'
  }
});

mcp.stdout.on('data', (data) => {
  console.log('MCP STDOUT:', data.toString());
});

mcp.stderr.on('data', (data) => {
  console.log('MCP STDERR:', data.toString());
});

mcp.on('close', (code) => {
  console.log(`MCP process exited with code ${code}`);
});

// Give it time to start up and show debug output
setTimeout(() => {
  console.log('Terminating MCP server...');
  mcp.kill();
}, 3000);
