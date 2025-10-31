#!/usr/bin/env node
/**
 * Verification script to test all project components
 * Run with: npx tsx scripts/verify-project.ts
 */

import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logResult(result: TestResult) {
  const symbol = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
  const color = result.status === 'pass' ? 'green' : result.status === 'fail' ? 'red' : 'yellow';
  const duration = result.duration ? ` (${result.duration}ms)` : '';
  log(color, `${symbol} ${result.name}${duration}`);
  if (result.message) {
    console.log(`   ${result.message}`);
  }
}

async function testHealthEndpoint() {
  const name = 'Health Endpoint';
  const start = Date.now();
  
  try {
    const response = await axios.get(`${BASE_URL}/api/health`, { timeout: 5000 });
    const duration = Date.now() - start;
    
    if (response.status === 200 && response.data.status === 'ok') {
      results.push({
        name,
        status: 'pass',
        message: `Database: ${response.data.database.connected ? 'Connected' : 'Disconnected'}, Records: ${response.data.database.record_count}`,
        duration,
      });
    } else {
      results.push({
        name,
        status: 'fail',
        message: 'Unexpected response format',
        duration,
      });
    }
  } catch (error: any) {
    results.push({
      name,
      status: 'fail',
      message: error.message,
    });
  }
}

async function testStatesEndpoint() {
  const name = 'States Endpoint';
  const start = Date.now();
  
  try {
    const response = await axios.get(`${BASE_URL}/api/states`, { timeout: 5000 });
    const duration = Date.now() - start;
    
    if (response.status === 200 && Array.isArray(response.data.states)) {
      results.push({
        name,
        status: 'pass',
        message: `Found ${response.data.states.length} state(s)`,
        duration,
      });
    } else {
      results.push({
        name,
        status: 'fail',
        message: 'Invalid response format',
        duration,
      });
    }
  } catch (error: any) {
    results.push({
      name,
      status: 'fail',
      message: error.message,
    });
  }
}

async function testDistrictsEndpoint() {
  const name = 'Districts Endpoint';
  const start = Date.now();
  
  try {
    const response = await axios.get(`${BASE_URL}/api/districts?state=UTTAR PRADESH`, { timeout: 5000 });
    const duration = Date.now() - start;
    
    if (response.status === 200 && Array.isArray(response.data.districts)) {
      results.push({
        name,
        status: 'pass',
        message: `Found ${response.data.districts.length} district(s) for Uttar Pradesh`,
        duration,
      });
    } else {
      results.push({
        name,
        status: 'fail',
        message: 'Invalid response format',
        duration,
      });
    }
  } catch (error: any) {
    results.push({
      name,
      status: 'fail',
      message: error.message,
    });
  }
}

async function testDistrictSummaryEndpoint() {
  const name = 'District Summary Endpoint';
  const start = Date.now();
  
  try {
    // Get first district
    const districtsResponse = await axios.get(`${BASE_URL}/api/districts?state=UTTAR PRADESH`);
    if (districtsResponse.data.districts.length === 0) {
      results.push({
        name,
        status: 'warning',
        message: 'No districts available to test',
      });
      return;
    }
    
    const firstDistrict = districtsResponse.data.districts[0].name;
    const response = await axios.get(
      `${BASE_URL}/api/districts/${encodeURIComponent(firstDistrict)}/summary`,
      { timeout: 5000 }
    );
    const duration = Date.now() - start;
    
    if (response.status === 200 && response.data.district_name) {
      results.push({
        name,
        status: 'pass',
        message: `Summary for ${firstDistrict}: ${response.data.current_metrics.households_worked} households`,
        duration,
      });
    } else {
      results.push({
        name,
        status: 'fail',
        message: 'Invalid response format',
        duration,
      });
    }
  } catch (error: any) {
    results.push({
      name,
      status: 'fail',
      message: error.message,
    });
  }
}

async function testCompareEndpoint() {
  const name = 'Compare Endpoint';
  const start = Date.now();
  
  try {
    // Get first two districts
    const districtsResponse = await axios.get(`${BASE_URL}/api/districts?state=UTTAR PRADESH`);
    if (districtsResponse.data.districts.length < 2) {
      results.push({
        name,
        status: 'warning',
        message: 'Not enough districts to test comparison',
      });
      return;
    }
    
    const district1 = districtsResponse.data.districts[0].name;
    const district2 = districtsResponse.data.districts[1].name;
    
    const response = await axios.get(
      `${BASE_URL}/api/compare?district1=${encodeURIComponent(district1)}&district2=${encodeURIComponent(district2)}`,
      { timeout: 5000 }
    );
    const duration = Date.now() - start;
    
    if (response.status === 200 && response.data.districts) {
      results.push({
        name,
        status: 'pass',
        message: `Compared ${district1} vs ${district2}`,
        duration,
      });
    } else {
      results.push({
        name,
        status: 'fail',
        message: 'Invalid response format',
        duration,
      });
    }
  } catch (error: any) {
    results.push({
      name,
      status: 'fail',
      message: error.message,
    });
  }
}

async function checkEnvironment() {
  const name = 'Environment Variables';
  const required = ['DATABASE_URL', 'DATA_SOURCE_URL', 'DATA_API_KEY'];
  const missing = required.filter((key) => !process.env[key]);
  
  if (missing.length === 0) {
    results.push({
      name,
      status: 'pass',
      message: 'All required variables set',
    });
  } else {
    results.push({
      name,
      status: 'fail',
      message: `Missing: ${missing.join(', ')}`,
    });
  }
}

async function checkDependencies() {
  const name = 'Dependencies';
  
  try {
    const fs = await import('fs');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const requiredDeps = ['next', 'react', 'mongoose', 'axios', 'ioredis'];
    const missing = requiredDeps.filter((dep) => !packageJson.dependencies[dep]);
    
    if (missing.length === 0) {
      results.push({
        name,
        status: 'pass',
        message: `All ${requiredDeps.length} required dependencies installed`,
      });
    } else {
      results.push({
        name,
        status: 'fail',
        message: `Missing: ${missing.join(', ')}`,
      });
    }
  } catch (error: any) {
    results.push({
      name,
      status: 'fail',
      message: error.message,
    });
  }
}

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  log('blue', '🧪 MGNREGA Project Verification');
  console.log('='.repeat(60) + '\n');
  
  log('yellow', '📋 Running tests...\n');
  
  // Environment checks
  await checkEnvironment();
  await checkDependencies();
  
  // API tests
  await testHealthEndpoint();
  await testStatesEndpoint();
  await testDistrictsEndpoint();
  await testDistrictSummaryEndpoint();
  await testCompareEndpoint();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  log('blue', '📊 Test Results');
  console.log('='.repeat(60) + '\n');
  
  results.forEach(logResult);
  
  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const warnings = results.filter((r) => r.status === 'warning').length;
  
  console.log('\n' + '='.repeat(60));
  log('blue', '📈 Summary');
  console.log('='.repeat(60));
  log('green', `✅ Passed: ${passed}/${results.length}`);
  if (failed > 0) log('red', `❌ Failed: ${failed}/${results.length}`);
  if (warnings > 0) log('yellow', `⚠️  Warnings: ${warnings}/${results.length}`);
  console.log('='.repeat(60) + '\n');
  
  if (failed === 0) {
    log('green', '🎉 All tests passed! Project is ready.');
  } else {
    log('red', '❌ Some tests failed. Please fix the issues above.');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  log('red', `\n❌ Verification failed: ${error.message}`);
  process.exit(1);
});
