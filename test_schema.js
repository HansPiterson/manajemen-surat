import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_schema_info'); // Wait, there's no such RPC.
  // I will just select 1 row from users to see its columns
  const { data: users, error: err } = await supabase.from('users').select('*').limit(1);
  console.log("Users:", users, err);
}
check();
