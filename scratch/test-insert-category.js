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
  
  console.log('Logging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (authError) {
    console.error('Login Error:', authError);
    return;
  }
  
  console.log('Logged in successfully. User ID:', authData.user.id);
  
  console.log('Inserting category...');
  const { data, error } = await supabase
    .from('categories')
    .insert({
      title: 'Test Category',
      subtitle: 'หมวดหมู่ทดสอบ',
      description: 'คำอธิบายทดสอบ',
      icon_name: 'Zap',
      color: '#FF0000',
      enabled: true,
      subcategories: ['ย่อย1', 'ย่อย2']
    })
    .select()
    .single();
    
  if (error) {
    console.error('Insert Error:', error);
  } else {
    console.log('Insert Success:', data);
  }
}

run();
