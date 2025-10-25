// Quick test for calendar extraction function
// Run with: node functions/test-function.js

const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

async function testCalendarExtraction() {
  console.log('Testing calendar extraction function...\n');

  const functions = admin.functions();
  const calendarExtraction = functions.httpsCallable('calendarExtraction');

  // Test 1: Event with time
  console.log('Test 1: "Soccer practice tomorrow at 4pm"');
  try {
    const result1 = await calendarExtraction({ text: 'Soccer practice tomorrow at 4pm' });
    console.log('✅ Result:', JSON.stringify(result1.data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n---\n');

  // Test 2: Non-event
  console.log('Test 2: "Can you pick up milk?"');
  try {
    const result2 = await calendarExtraction({ text: 'Can you pick up milk?' });
    console.log('✅ Result:', JSON.stringify(result2.data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n✅ Tests complete!');
  process.exit(0);
}

testCalendarExtraction().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
