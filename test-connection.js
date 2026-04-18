// Quick test script to verify Supabase connection
// Run with: node test-connection.js
//
// IMPORTANT: Set your Supabase credentials in .env.local or as environment variables
// This script reads from environment variables to avoid exposing credentials

if (typeof process.loadEnvFile === 'function') {
  process.loadEnvFile('.env.local');
}

const { createClient } = require('@supabase/supabase-js');

// Read from environment variables (set in .env.local or system env)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('\nPlease set environment variables:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
  console.error('\nOr create a .env.local file with these values.');
  console.error('\nThis script auto-loads .env.local when supported by your Node version.');
  process.exit(1);
}

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Check if tables exist
    console.log('\n1. Testing rooms table...');
    const { data, error } = await supabase
      .from('rooms')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error.message);
      if (error.message.includes('does not exist')) {
        console.error('\n💡 SOLUTION: Run the database schema!');
        console.error('   Go to: https://supabase.com/dashboard');
        console.error('   Select your project');
        console.error('   Click: SQL Editor → New Query');
        console.error('   Copy/paste contents of supabase/schema.sql');
        console.error('   Click: Run');
      }
      return;
    }

    console.log('✅ Rooms table exists!');

    // Test 2: Try to create a test room
    console.log('\n2. Testing room creation...');
    const { data: room, error: insertError } = await supabase
      .from('rooms')
      .insert({})
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating room:', insertError.message);
      return;
    }

    console.log('✅ Room created successfully!');
    console.log('   Room ID:', room.id);

    // Clean up test room
    await supabase.from('rooms').delete().eq('id', room.id);
    console.log('✅ Test room cleaned up');

    console.log('\n🎉 All tests passed! Your Supabase connection is working.');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testConnection();
