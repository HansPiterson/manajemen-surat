import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import ws from 'ws';

// Manually parse .env file
const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://vbyufiksroxtgngzcjba.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

async function run() {
  console.log("Fetching users...");
  const { data: users, error: errUsers } = await supabase.from('users').select('*');
  console.log("Users:", users, "Error:", errUsers);

  console.log("Fetching divisions...");
  const { data: divisions, error: errDivisions } = await supabase.from('divisi').select('*');
  console.log("Divisions:", divisions, "Error:", errDivisions);

  console.log("Testing join on users...");
  const { data: joinUsers, error: errJoin } = await supabase.from('users').select('*, divisi:divisi_id(nama_divisi)');
  console.log("Join Users:", joinUsers, "Error:", errJoin);
}

run();
