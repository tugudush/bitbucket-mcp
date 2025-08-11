#!/usr/bin/env node

// Examine bitcointools files to understand the project
async function examineBitcointools() {
  console.log('Examining bitcointools repository files...\n');
  
  const token = 'ATATT3xFfGF0qtjINJnWm5Jcj5wlFHS4KHSdDWXX2LRtizlPUIMdvMxKp6G4pgBAVJxDiTS1Z0Fnw4x-ggefxEFF3NslfMg10UE5K2QEgYhvMkGUiwj_DKoiJIredpfBjW7vdHLZw4CRs_JklGS9kCJs9eJ3iXgdTXk0D3MhUNlbW1a2Ubj6cLc=0F9CB982';
  const email = 'jerome2kph@gmail.com';
  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  
  const filesToExamine = [
    'btc-php-rate-json.php',
    'analyticstracking.php',
    'Requests.php',
    '.gitignore'
  ];
  
  for (const fileName of filesToExamine) {
    console.log(`\n=== Examining: ${fileName} ===`);
    
    const fileUrl = `https://api.bitbucket.org/2.0/repositories/tugudush/bitcointools/src/${fileName}`;
    
    try {
      const response = await fetch(fileUrl, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'text/plain',
          'User-Agent': 'bitbucket-mcp-server/1.0.0'
        }
      });
      
      if (response.ok) {
        const content = await response.text();
        console.log('Size:', content.length, 'bytes');
        console.log('Content:');
        console.log('---');
        console.log(content);
        console.log('---');
      } else {
        console.log('❌ Failed to fetch:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
  
  // Also check some directories to understand structure
  const dirsToCheck = ['css', 'js', 'images'];
  
  for (const dirName of dirsToCheck) {
    console.log(`\n=== Directory: ${dirName} ===`);
    
    const dirUrl = `https://api.bitbucket.org/2.0/repositories/tugudush/bitcointools/src/${dirName}`;
    
    try {
      const response = await fetch(dirUrl, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
          'User-Agent': 'bitbucket-mcp-server/1.0.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.values) {
          console.log('Contains', data.values.length, 'items:');
          data.values.forEach(item => {
            const icon = item.type === 'commit_directory' ? '📁' : '📄';
            const size = item.size != null ? ` (${item.size} bytes)` : '';
            console.log(`  ${icon} ${item.path}${size}`);
          });
        }
      } else {
        console.log('❌ Failed to fetch directory:', response.status);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
}

examineBitcointools().catch(console.error);
