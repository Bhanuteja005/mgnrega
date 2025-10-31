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
    const { searchParams } = new URL(request.url);
    
    const from = searchParams.get('from'); // Format: YYYY-MM
    const to = searchParams.get('to'); // Format: YYYY-MM
    const limit = parseInt(searchParams.get('limit') || '100', 10);

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

    // Build query
    const query: any = { district_name: decodedDistrictName };

    // Add date filters if provided
    // Note: This is a simple filter - you may want to enhance it
    // to parse fin_year and month properly

    // Get metrics records
    const metrics = await MonthlyMetric.find(query)
      .sort({ fin_year: -1, month: -1 })
      .limit(limit)
      .lean();

    if (metrics.length === 0) {
      return NextResponse.json(
        {
          error: 'No metrics found',
          message: `No data available for district: ${decodedDistrictName}`,
        },
        { status: 404 }
      );
    }

    // Transform metrics for response
    const transformedMetrics = metrics.map((record) => ({
      id: record.id,
      district_name: record.district_name,
      state_name: record.state_name,
      fin_year: record.fin_year,
      month: record.month,
      metrics: {
        households_worked: record.metrics.Total_Households_Worked || 0,
        individuals_worked: record.metrics.Total_Individuals_Worked || 0,
        total_expenditure: parseFloat(record.metrics.Total_Exp || '0'),
        wages_paid: parseFloat(record.metrics.Wages || '0'),
        avg_wage_rate: parseFloat(
          record.metrics.Average_Wage_rate_per_day_per_person || '0'
        ),
        avg_days_employment: parseFloat(
          record.metrics.Average_days_of_employment_provided_per_Household || '0'
        ),
        completed_works: record.metrics.Number_of_Completed_Works || 0,
        ongoing_works: record.metrics.Number_of_Ongoing_Works || 0,
        persondays: record.metrics.Persondays_of_Central_Liability_so_far || 0,
        women_persondays: record.metrics.Women_Persondays || 0,
        sc_persondays: record.metrics.SC_persondays || 0,
        st_persondays: record.metrics.ST_persondays || 0,
        active_job_cards: record.metrics.Total_No_of_Active_Job_Cards || 0,
        active_workers: record.metrics.Total_No_of_Active_Workers || 0,
      },
      updated_at: record.updatedAt,
    }));

    return NextResponse.json({
      district_name: decodedDistrictName,
      metrics: transformedMetrics,
      count: transformedMetrics.length,
      filters: {
        from,
        to,
        limit,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to fetch metrics',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
