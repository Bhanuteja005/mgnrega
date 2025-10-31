import 'dotenv/config';
import axios from 'axios';

const API_URL = process.env.DATA_SOURCE_URL!;
const API_KEY = process.env.DATA_API_KEY!;

async function testAPI() {
  console.log('Testing API with different parameter combinations...\n');

  // Test 1: Basic query without filters
  try {
    console.log('Test 1: Basic query (no filters, limit 10)');
    const response1 = await axios.get(API_URL, {
      params: {
        'api-key': API_KEY,
        format: 'json',
        limit: 10,
      },
      timeout: 30000,
    });
    console.log('✅ Response status:', response1.status);
    console.log('📊 Records count:', response1.data?.records?.length || 0);
    if (response1.data?.records?.[0]) {
      console.log('📝 Sample record keys:', Object.keys(response1.data.records[0]));
      console.log('📝 Sample record:', JSON.stringify(response1.data.records[0], null, 2));
    }
  } catch (error: any) {
    console.error('❌ Test 1 failed:', error.message);
  }

  console.log('\n---\n');

  // Test 2: With state filter
  try {
    console.log('Test 2: With Uttar Pradesh filter');
    const response2 = await axios.get(API_URL, {
      params: {
        'api-key': API_KEY,
        format: 'json',
        limit: 10,
        'filters[state_name]': 'Uttar Pradesh',
      },
      timeout: 30000,
    });
    console.log('✅ Response status:', response2.status);
    console.log('📊 Records count:', response2.data?.records?.length || 0);
  } catch (error: any) {
    console.error('❌ Test 2 failed:', error.message);
  }

  console.log('\n---\n');

  // Test 3: Different state filter format
  try {
    console.log('Test 3: With alternate filter format');
    const response3 = await axios.get(API_URL, {
      params: {
        'api-key': API_KEY,
        format: 'json',
        limit: 10,
        'filters[state_name]': 'UTTAR PRADESH',
      },
      timeout: 30000,
    });
    console.log('✅ Response status:', response3.status);
    console.log('📊 Records count:', response3.data?.records?.length || 0);
  } catch (error: any) {
    console.error('❌ Test 3 failed:', error.message);
  }

  console.log('\n---\n');

  // Test 4: Get all states available
  try {
    console.log('Test 4: Fetching all records to see available states');
    const response4 = await axios.get(API_URL, {
      params: {
        'api-key': API_KEY,
        format: 'json',
        limit: 100,
      },
      timeout: 30000,
    });
    console.log('✅ Response status:', response4.status);
    console.log('📊 Records count:', response4.data?.records?.length || 0);
    
    if (response4.data?.records?.length > 0) {
      const states = [...new Set(response4.data.records.map((r: any) => r.state_name))];
      console.log('🌍 Available states:', states);
    }
  } catch (error: any) {
    console.error('❌ Test 4 failed:', error.message);
  }
}

testAPI();
