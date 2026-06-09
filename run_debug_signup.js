const crypto = require('crypto');

const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByYXRrcHd6Y3lxc3ZxcHVjcmp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDg1NzIxOSwiZXhwIjoyMDk2NDMzMjE5fQ.yl__Xg23niLhnc5sqYwHurUuJm5fvBzBNIReiiE8Qjw';
const url = 'https://pratkpwzcyqsvqpucrjw.supabase.co/rest/v1';

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
