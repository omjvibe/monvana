const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
let serviceKey = '';
let baseUrl = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      serviceKey = line.split('=')[1].trim().replace(/['"]/g, '');
    } else if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      baseUrl = line.split('=')[1].trim().replace(/['"]/g, '');
    }
  }
}

async function check() {
  const url = `${baseUrl}/rest/v1/bank_settings?select=key,value`;
  try {
    const response = await fetch(url, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Fetch error:', text);
      return;
    }
    
    const data = await response.json();
    console.log('Bank Settings in Database:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

check();
