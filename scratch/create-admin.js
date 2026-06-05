const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const email = 'admin_test@example.com';
  const password = 'password123';
  
  console.log('Registering user...');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        phone: '1234567890',
        role: 'admin'
      }
    }
  });
  
  if (error) {
    console.error('SignUp Error:', error);
    return;
  }
  
  console.log('User registered successfully:', data.user.id);
}

run();
