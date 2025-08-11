#!/usr/bin/env node

// Test jerome branch directly
async function testJeromeBranch() {
  console.log('Testing jerome branch of bitcointools...\n');
  
  const token = 'ATATT3xFfGF0qtjINJnWm5Jcj5wlFHS4KHSdDWXX2LRtizlPUIMdvMxKp6G4pgBAVJxDiTS1Z0Fnw4x-ggefxEFF3NslfMg10UE5K2QEgYhvMkGUiwj_DKoiJIredpfBjW7vdHLZw4CRs_JklGS9kCJs9eJ3iXgdTXk0D3MhUNlbW1a2Ubj6cLc=0F9CB982';
  const email = 'jerome2kph@gmail.com';
  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  
  // Try different URL patterns for jerome branch
  const urls = [
    'https://api.bitbucket.org/2.0/repositories/tugudush/bitcointools/src/jerome',
    'https://api.bitbucket.org/2.0/repositories/tugudush/bitcointools/src?at=jerome',
    'https://api.bitbucket.org/2.0/repositories/tugudush/bitcointools/refs/branches/jerome',
    // Compare with master
    'https://api.bitbucket.org/2.0/repositories/tugudush/bitcointools/src/master',
    'https://api.bitbucket.org/2.0/repositories/tugudush/bitcointools/src?at=master'
  ];
  
  for (const url of urls) {
    console.log(`\n=== Testing: ${url} ===`);
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
          'User-Agent': 'bitbucket-mcp-server/1.0.0'
        }
      });
      
      console.log('Status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.values && Array.isArray(data.values)) {
          console.log('✅ Directory listing successful!');
          console.log('Number of items:', data.values.length);
          console.log('Items:');
          data.values.forEach((item, index) => {
            const name = item.path.split('/').pop() || item.path;
            const typeIcon = item.type === 'commit_directory' ? '📁' : '📄';
            const sizeInfo = item.size != null ? ` (${item.size} bytes)` : '';
            console.log(`  ${index + 1}. ${typeIcon} ${name}${sizeInfo} - ${item.path}`);
          });
        } else if (data.name) {
          console.log('✅ Branch info:', data.name);
          console.log('Target commit:', data.target?.hash?.substring(0, 8));
        } else {
          console.log('Response keys:', Object.keys(data));
        }
      } else {
        const errorText = await response.text();
        console.log('❌ Error:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.error('❌ Request failed:', error.message);
    }
  }
}

testJeromeBranch().catch(console.error);
