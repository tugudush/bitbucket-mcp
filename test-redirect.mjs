// Test redirect handling for Bitbucket API

const apiToken = "ATATT3xFfGF0qtjINJnWm5Jcj5wlFHS4KHSdDWXX2LRtizlPUIMdvMxKp6G4pgBAVJxDiTS1Z0Fnw4x-ggefxEFF3NslfMg10UE5K2QEgYhvMkGUiwj_DKoiJIredpfBjW7vdHLZw4CRs_JklGS9kCJs9eJ3iXgdTXk0D3MhUNlbW1a2Ubj6cLc=0F9CB982";
const email = "jerome2kph@gmail.com";

async function testRedirect() {
  console.log("Testing redirect handling...\n");
  
  const url = "https://api.bitbucket.org/2.0/repositories/tugudush/template2/src";
  const headers = {
    Accept: 'application/json',
    'User-Agent': 'bitbucket-mcp-server/1.0.0',
    Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`
  };

  try {
    console.log("=== Making request to:", url);
    const response = await fetch(url, {
      method: 'GET',
      headers,
      redirect: 'follow' // Explicitly follow redirects
    });

    console.log("Status:", response.status, response.statusText);
    console.log("Final URL:", response.url);
    console.log("Response OK:", response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Success! Found", data.values?.length || 0, "items");
      console.log("First few items:");
      data.values?.slice(0, 3).forEach(item => {
        console.log(`  - ${item.path} (${item.type})`);
      });
    } else {
      const errorText = await response.text();
      console.log("❌ Error:", errorText.substring(0, 200));
    }
  } catch (error) {
    console.error("❌ Exception:", error.message);
  }
}

testRedirect();
