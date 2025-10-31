import 'dotenv/config';
import axios, { AxiosError } from 'axios';
import connectDB from '../lib/db';
import MonthlyMetric from '../lib/models/MonthlyMetric';

// Configuration from environment variables
const API_URL = process.env.DATA_SOURCE_URL!;
const API_KEY = process.env.DATA_API_KEY!;
const STATE_NAME = (process.env.STATE_NAME || 'Uttar Pradesh').toUpperCase();
const DATA_FORMAT = process.env.DATA_FORMAT || 'json';

// Constants for pagination and retry logic
const FETCH_LIMIT = 1000; // Records per API call
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_TIMEOUT_MS = 3600000; // 1 hour

// Circuit breaker state
let circuitBreakerFailures = 0;
let circuitBreakerOpenUntil = 0;

interface MGNREGARecord {
  state_name: string;
  district_name: string;
  fin_year: string;
  month?: string;
  [key: string]: any;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if circuit breaker is open
 */
function isCircuitBreakerOpen(): boolean {
  if (circuitBreakerOpenUntil > Date.now()) {
    console.log('⚠️  Circuit breaker is OPEN. Skipping API call.');
    return true;
  }
  // Reset if timeout passed
  if (circuitBreakerOpenUntil > 0 && circuitBreakerOpenUntil <= Date.now()) {
    console.log('✅ Circuit breaker reset.');
    circuitBreakerFailures = 0;
    circuitBreakerOpenUntil = 0;
  }
  return false;
}

/**
 * Record API failure for circuit breaker
 */
function recordCircuitBreakerFailure(): void {
  circuitBreakerFailures++;
  console.log(`❌ Circuit breaker failure count: ${circuitBreakerFailures}`);
  
  if (circuitBreakerFailures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreakerOpenUntil = Date.now() + CIRCUIT_BREAKER_TIMEOUT_MS;
    console.error(
      `🚨 Circuit breaker OPENED due to ${circuitBreakerFailures} consecutive failures. ` +
      `Will retry after ${CIRCUIT_BREAKER_TIMEOUT_MS / 1000 / 60} minutes.`
    );
  }
}

/**
 * Fetch paginated records from data.gov.in API with retry logic
 */
async function fetchPaginatedRecords(offset: number, limit: number, retries = 0): Promise<MGNREGARecord[]> {
  if (isCircuitBreakerOpen()) {
    throw new Error('Circuit breaker is open. API calls suspended.');
  }

  try {
    console.log(`📡 Fetching records: offset=${offset}, limit=${limit}`);
    
    const response = await axios.get(API_URL, {
      params: {
        'api-key': API_KEY,
        format: DATA_FORMAT,
        limit: limit,
        offset: offset,
        'filters[state_name]': STATE_NAME,
      },
      timeout: 30000, // 30 second timeout
    });

    const records = response.data?.records || [];
    console.log(`✅ Fetched ${records.length} records (offset: ${offset})`);
    
    // Reset circuit breaker on success
    circuitBreakerFailures = 0;
    
    return records;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(`❌ Error fetching data at offset ${offset}:`, axiosError.message);

    // Handle rate limiting
    if (axiosError.response?.status === 429) {
      const retryAfter = parseInt(axiosError.response.headers['retry-after'] || '60', 10);
      console.log(`⏳ Rate limited. Waiting ${retryAfter} seconds...`);
      await sleep(retryAfter * 1000);
    }

    // Retry with exponential backoff
    if (retries < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, retries);
      console.log(`🔄 Retrying in ${delay}ms... (attempt ${retries + 1}/${MAX_RETRIES})`);
      await sleep(delay);
      return fetchPaginatedRecords(offset, limit, retries + 1);
    }

    // Record failure for circuit breaker
    recordCircuitBreakerFailure();
    throw error;
  }
}

/**
 * Fetch all records with pagination
 */
async function fetchAllRecords(): Promise<MGNREGARecord[]> {
  let offset = 0;
  let allRecords: MGNREGARecord[] = [];
  let hasMore = true;

  console.log(`\n🚀 Starting ETL for state: ${STATE_NAME}\n`);

  while (hasMore) {
    try {
      const records = await fetchPaginatedRecords(offset, FETCH_LIMIT);
      
      if (records.length === 0) {
        hasMore = false;
        console.log('✅ No more records to fetch.');
      } else {
        allRecords = allRecords.concat(records);
        offset += FETCH_LIMIT;
        
        // Add a small delay between requests to be respectful
        await sleep(500);
      }
    } catch (error) {
      console.error('❌ Failed to fetch records:', error);
      
      // If circuit breaker is open, stop fetching
      if (isCircuitBreakerOpen()) {
        console.log('⚠️  Stopping ETL due to circuit breaker.');
        break;
      }
      
      // Otherwise, stop on error
      hasMore = false;
    }
  }

  return allRecords;
}

/**
 * Transform and store records in MongoDB
 */
async function storeRecords(records: MGNREGARecord[]): Promise<void> {
  console.log(`\n💾 Storing ${records.length} records in MongoDB...\n`);

  let insertedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (const record of records) {
    try {
      const id = `${record.district_name}-${record.fin_year}${record.month ? `-${record.month}` : ''}`;
      
      const existingRecord = await MonthlyMetric.findOne({ id });

      if (existingRecord) {
        // Update existing record
        await MonthlyMetric.updateOne(
          { id },
          {
            $set: {
              district_name: record.district_name,
              state_name: record.state_name,
              fin_year: record.fin_year,
              month: record.month,
              metrics: record,
              updatedAt: new Date(),
            },
          }
        );
        updatedCount++;
      } else {
        // Insert new record
        await MonthlyMetric.create({
          id,
          district_name: record.district_name,
          state_name: record.state_name,
          fin_year: record.fin_year,
          month: record.month,
          metrics: record,
        });
        insertedCount++;
      }

      // Progress indicator
      if ((insertedCount + updatedCount) % 100 === 0) {
        console.log(`📊 Progress: ${insertedCount + updatedCount}/${records.length} records processed`);
      }
    } catch (error) {
      console.error(`❌ Error storing record for ${record.district_name}:`, error);
      errorCount++;
    }
  }

  console.log('\n📈 ETL Summary:');
  console.log(`   ✅ Inserted: ${insertedCount}`);
  console.log(`   🔄 Updated: ${updatedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📊 Total processed: ${insertedCount + updatedCount + errorCount}/${records.length}\n`);
}

/**
 * Main ETL execution
 */
async function runETL(): Promise<void> {
  const startTime = Date.now();
  console.log('═══════════════════════════════════════════════════════');
  console.log('🏗️  MGNREGA ETL Pipeline Starting...');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🌍 State: ${STATE_NAME}`);
  console.log(`🔗 API URL: ${API_URL}`);
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Database connection established\n');

    // Fetch all records
    const records = await fetchAllRecords();

    if (records.length === 0) {
      console.log('⚠️  No records fetched. Exiting.');
      return;
    }

    // Store records
    await storeRecords(records);

    // Log completion
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ ETL Pipeline Completed Successfully!');
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log('═══════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════');
    console.error('❌ ETL Pipeline Failed');
    console.error('═══════════════════════════════════════════════════════');
    console.error(error);
    process.exit(1);
  } finally {
    // Close database connection
    process.exit(0);
  }
}

// Run the ETL if this script is executed directly
if (require.main === module) {
  runETL();
}

export { runETL, fetchAllRecords, storeRecords };
