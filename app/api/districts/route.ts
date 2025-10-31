import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MonthlyMetric from '@/lib/models/MonthlyMetric';
import { getCachedData, setCachedData } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stateName = searchParams.get('state');

    if (!stateName) {
      return NextResponse.json(
        {
          error: 'State name is required',
          message: 'Please provide a state parameter',
        },
        { status: 400 }
      );
    }

    // Try cache first
    const cacheKey = `api:districts:${stateName}`;
    const cachedDistricts = await getCachedData<any[]>(cacheKey);

    if (cachedDistricts) {
      return NextResponse.json({
        state: stateName,
        districts: cachedDistricts,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Connect to database
    await connectDB();

    // Get districts for the state
    const districtData = await MonthlyMetric.aggregate([
      {
        $match: { state_name: stateName },
      },
      {
        $group: {
          _id: '$district_name',
          record_count: { $sum: 1 },
          last_updated: { $max: '$updatedAt' },
          latest_fin_year: { $max: '$fin_year' },
        },
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          record_count: 1,
          last_updated: 1,
          latest_fin_year: 1,
        },
      },
      {
        $sort: { name: 1 },
      },
    ]);

    if (districtData.length === 0) {
      return NextResponse.json(
        {
          error: 'No districts found',
          message: `No data available for state: ${stateName}`,
        },
        { status: 404 }
      );
    }

    // Cache for 1 hour
    await setCachedData(cacheKey, districtData, 3600);

    return NextResponse.json({
      state: stateName,
      districts: districtData,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to fetch districts',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
