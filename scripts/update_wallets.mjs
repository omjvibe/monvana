import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log("Fetching wallets without account numbers...");
  const { data: wallets, error } = await supabase
    .from('wallets')
    .select('id, account_number');
    
  if (error) {
    console.error("Error fetching wallets:", error);
    return;
  }
  
  const walletsToUpdate = wallets.filter(w => !w.account_number);
  console.log(`Found ${walletsToUpdate.length} wallets to update.`);
  
  for (const wallet of walletsToUpdate) {
    let newNumber;
    while (true) {
      newNumber = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
      const { count, error: countErr } = await supabase
        .from('wallets')
        .select('*', { count: 'exact', head: true })
        .eq('account_number', newNumber);
      
      if (count === 0) break;
    }
    
    const { error: updateErr } = await supabase
      .from('wallets')
      .update({ account_number: newNumber })
      .eq('id', wallet.id);
      
    if (updateErr) {
      console.error(`Error updating wallet ${wallet.id}:`, updateErr);
    } else {
      console.log(`Updated wallet ${wallet.id} with ${newNumber}`);
    }
  }
  console.log("Done.");
}

main();
