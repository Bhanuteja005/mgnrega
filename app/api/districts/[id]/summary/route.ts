import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MonthlyMetric from '@/lib/models/MonthlyMetric';
import { getCachedData, setCachedData } from '@/lib/cache';

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

    // Try cache first
    const cacheKey = `api:district:summary:${decodedDistrictName}`;
    const cachedSummary = await getCachedData<any>(cacheKey);

    if (cachedSummary) {
      return NextResponse.json({
        ...cachedSummary,
        cached: true,
      });
    }

    // Connect to database
    await connectDB();

    // Get all records for the district
    const records = await MonthlyMetric.find({
      district_name: decodedDistrictName,
    })
      .sort({ fin_year: -1, month: -1 })
      .lean();

    if (records.length === 0) {
      return NextResponse.json(
        {
          error: 'District not found',
          message: `No data available for district: ${decodedDistrictName}`,
        },
        { status: 404 }
      );
    }

    // Get latest record
    const latestRecord = records[0];

    // Calculate summary statistics
    const totalHouseholdsWorked = latestRecord.metrics.Total_Households_Worked || 0;
    const totalIndividualsWorked = latestRecord.metrics.Total_Individuals_Worked || 0;
    const totalExpenditure = parseFloat(latestRecord.metrics.Total_Exp || '0');
    const wagesPaid = parseFloat(latestRecord.metrics.Wages || '0');
    const avgWageRate = parseFloat(
      latestRecord.metrics.Average_Wage_rate_per_day_per_person || '0'
    );
    const avgDaysEmployment = parseFloat(
      latestRecord.metrics.Average_days_of_employment_provided_per_Household || '0'
    );
    const completedWorks = latestRecord.metrics.Number_of_Completed_Works || 0;
    const ongoingWorks = latestRecord.metrics.Number_of_Ongoing_Works || 0;

    // Get last 12 months data for trends
    const last12Months = records.slice(0, 12).map((record) => ({
      month: record.month,
      fin_year: record.fin_year,
      households_worked: record.metrics.Total_Households_Worked || 0,
      individuals_worked: record.metrics.Total_Individuals_Worked || 0,
      wages_paid: parseFloat(record.metrics.Wages || '0'),
      persondays: record.metrics.Persondays_of_Central_Liability_so_far || 0,
    }));

    const summary = {
      district_name: decodedDistrictName,
      state_name: latestRecord.state_name,
      last_updated: latestRecord.updatedAt,
      latest_period: {
        fin_year: latestRecord.fin_year,
        month: latestRecord.month,
      },
      current_metrics: {
        households_worked: totalHouseholdsWorked,
        individuals_worked: totalIndividualsWorked,
        total_expenditure: totalExpenditure,
        wages_paid: wagesPaid,
        avg_wage_rate: avgWageRate,
        avg_days_employment: avgDaysEmployment,
        completed_works: completedWorks,
        ongoing_works: ongoingWorks,
      },
      trends: {
        last_12_months: last12Months,
      },
      total_records: records.length,
      timestamp: new Date().toISOString(),
    };

    // Cache for 30 minutes
    await setCachedData(cacheKey, summary, 1800);

    return NextResponse.json({
      ...summary,
      cached: false,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to fetch district summary',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
