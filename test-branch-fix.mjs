#!/usr/bin/env node

// Test the fixed branch handling
import { spawn } from 'child_process';

async function testFixedBranchHandling() {
  console.log('Testing fixed branch handling...\n');
  
  return new Promise((resolve, reject) => {
    const server = spawn('node', ['build/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd(),
      env: {
        ...process.env,
        BITBUCKET_API_TOKEN: 'ATATT3xFfGF0qtjINJnWm5Jcj5wlFHS4KHSdDWXX2LRtizlPUIMdvMxKp6G4pgBAVJxDiTS1Z0Fnw4x-ggefxEFF3NslfMg10UE5K2QEgYhvMkGUiwj_DKoiJIredpfBjW7vdHLZw4CRs_JklGS9kCJs9eJ3iXgdTXk0D3MhUNlbW1a2Ubj6cLc=0F9CB982',
        BITBUCKET_EMAIL: 'jerome2kph@gmail.com'
      }
    });
    
    let outputData = '';
    let errorData = '';
    
    server.stdout.on('data', (data) => {
      outputData += data.toString();
    });
    
    server.stderr.on('data', (data) => {
      errorData += data.toString();
      console.log('Server stderr:', data.toString());
    });
    
    server.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
      resolve({ outputData, errorData, code });
    });
    
    // Test multiple scenarios
    const messages = [
      // Initialize
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: {
            name: "test-client",
            version: "1.0.0"
          }
        }
      },
      // Test bb_list_directory with jerome branch
      {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "bb_list_directory",
          arguments: {
            workspace: "tugudush",
            repo_slug: "bitcointools",
            ref: "jerome"
          }
        }
      },
      // Test bb_get_file_content with jerome branch
      {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "bb_get_file_content",
          arguments: {
            workspace: "tugudush",
            repo_slug: "bitcointools",
            file_path: "btc-php-rate-json.php",
            ref: "jerome"
          }
        }
      }
    ];
    
    // Send messages
    let messageIndex = 0;
    function sendNextMessage() {
      if (messageIndex < messages.length) {
        const message = JSON.stringify(messages[messageIndex]) + '\n';
        console.log(`Sending message ${messageIndex + 1}:`, messages[messageIndex].method);
        server.stdin.write(message);
        messageIndex++;
        setTimeout(sendNextMessage, 500);
      } else {
        setTimeout(() => {
          server.stdin.end();
        }, 1000);
      }
    }
    
    setTimeout(sendNextMessage, 100);
    
    // Set timeout
    setTimeout(() => {
      server.kill();
      reject(new Error('Test timeout'));
    }, 15000);
  });
}

testFixedBranchHandling()
  .then(result => {
    console.log('\n=== Test Results ===');
    
    if (result.outputData) {
      const lines = result.outputData.split('\n').filter(line => line.trim());
      lines.forEach((line, index) => {
        try {
          const parsed = JSON.parse(line);
          if (parsed.result?.content) {
            if (parsed.id === 2) {
              console.log('\n📁 Directory listing with jerome branch:');
              console.log(parsed.result.content[0].text.substring(0, 300) + '...');
            } else if (parsed.id === 3) {
              console.log('\n📄 File content with jerome branch:');
              console.log(parsed.result.content[0].text.substring(0, 500) + '...');
            }
          } else if (parsed.error) {
            console.log(`\n❌ Error in response ${parsed.id}:`, parsed.error.message);
          }
        } catch (e) {
          // Ignore non-JSON lines
        }
      });
    }
    
    console.log('\n✅ Branch handling test completed!');
  })
  .catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
