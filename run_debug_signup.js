const crypto = require('crypto');

const fs = require('fs');
const path = require('path');

// Read .env.local dynamically to avoid hardcoding secrets
const envPath = path.join(__dirname, '.env.local');
let serviceKey = '';
let url = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      serviceKey = line.split('=')[1].trim();
    } else if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      const baseUrl = line.split('=')[1].trim();
      url = `${baseUrl}/rest/v1`;
    }
  }
}


async function test() {
  try {
    const testId = crypto.randomUUID();
    const testEmail = `debug-test-${Date.now()}@monvana.online`;
    
    console.log(`Calling rpc/debug_signup with ID: ${testId}, Email: ${testEmail}...`);
    const res = await fetch(`${url}/rpc/debug_signup`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_id: testId,
        p_email: testEmail,
        p_first_name: 'Debug',
        p_last_name: 'User'
      })
    });

    const status = res.status;
    const text = await res.text();
    console.log("Status Code:", status);
    console.log("Response Text:", text);
  } catch (err) {
    console.error("Debug signup call failed:", err);
  }
}

test();
