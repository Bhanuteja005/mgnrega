import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MonthlyMetric from '@/lib/models/MonthlyMetric';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: districtName } = await params;

    if (!districtName) {
      return NextResponse.json(
        { error: 'District name is required' },
        { status: 400 }
      );
    }

    // Decode URL-encoded district name
    const decodedDistrictName = decodeURIComponent(districtName);

    // Connect to database
    await connectDB();

    // Get the latest record for the district
    const record = await MonthlyMetric.findOne({
      district_name: decodedDistrictName,
    })
      .sort({ fin_year: -1, month: -1 })
      .lean();

    if (!record) {
      return NextResponse.json(
        {
          error: 'District not found',
          message: `No data available for district: ${decodedDistrictName}`,
        },
        { status: 404 }
      );
    }

    // Return the raw record with all field names
    return NextResponse.json({
      district: decodedDistrictName,
      available_fields: Object.keys(record.metrics).sort(),
      sample_data: record.metrics,
      record_info: {
        district_name: record.district_name,
        state_name: record.state_name,
        fin_year: record.fin_year,
        month: record.month,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to fetch debug info',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
