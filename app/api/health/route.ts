import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MonthlyMetric from '@/lib/models/MonthlyMetric';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Connect to database
    await connectDB();

    // Get last updated timestamp
    const lastRecord = await MonthlyMetric.findOne()
      .sort({ updatedAt: -1 })
      .select('updatedAt')
      .lean();

    // Get record count
    const recordCount = await MonthlyMetric.countDocuments();

    // Get distinct states count
    const statesCount = await MonthlyMetric.distinct('state_name').then(
      (states) => states.length
    );

    // Get distinct districts count
    const districtsCount = await MonthlyMetric.distinct('district_name').then(
      (districts) => districts.length
    );

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        last_updated: lastRecord?.updatedAt || null,
        record_count: recordCount,
        states_count: statesCount,
        districts_count: districtsCount,
      },
      version: '1.0.0',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
        },
        error: error.message,
      },
      { status: 500 }
    );
  }
}
