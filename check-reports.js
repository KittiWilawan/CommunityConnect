const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: reports, error: reportsError } = await supabase.from('reports').select('*');
  const { data: categories, error: categoriesError } = await supabase.from('categories').select('*');
  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*');

  console.log('Reports Count:', reports ? reports.length : 'Error', reportsError);
  console.log('Categories Count:', categories ? categories.length : 'Error', categoriesError);
  console.log('Profiles Count:', profiles ? profiles.length : 'Error', profilesError);
  console.log('Reports Data:', reports);
}

test();
