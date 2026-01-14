// Quick test script to verify Supabase connection
// Run with: node test-connection.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ylccqmleggazinzsbzgb.supabase.co';
const supabaseKey = 'sb_publishable_u9c5zQSSICdSyHHAkMaMUg_PmoBw3XO';

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
        console.error('   Go to: https://supabase.com/dashboard/project/ylccqmleggazinzsbzgb');
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
