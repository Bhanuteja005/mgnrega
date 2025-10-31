import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MonthlyMetric from '@/lib/models/MonthlyMetric';
import { getCachedData, setCachedData } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Try to get from cache first
    const cacheKey = 'api:states';
    const cachedStates = await getCachedData<any[]>(cacheKey);

    if (cachedStates) {
      return NextResponse.json({
        states: cachedStates,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Connect to database
    await connectDB();

    // Get distinct states with record counts
    const stateData = await MonthlyMetric.aggregate([
      {
        $group: {
          _id: '$state_name',
          district_count: { $addToSet: '$district_name' },
          record_count: { $sum: 1 },
          last_updated: { $max: '$updatedAt' },
        },
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          district_count: { $size: '$district_count' },
          record_count: 1,
          last_updated: 1,
        },
      },
      {
        $sort: { name: 1 },
      },
    ]);

    // Cache for 1 hour
    await setCachedData(cacheKey, stateData, 3600);

    return NextResponse.json({
      states: stateData,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to fetch states',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
