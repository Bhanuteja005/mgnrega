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

    // Calculate summary statistics - handle multiple possible field names
    const totalHouseholdsWorked = 
      parseInt(latestRecord.metrics.Total_Households_Worked || 
               latestRecord.metrics.total_households_worked ||
               latestRecord.metrics['Total Households Worked'] || '0');
    
    const totalIndividualsWorked = 
      parseInt(latestRecord.metrics.Total_Individuals_Worked || 
               latestRecord.metrics.total_individuals_worked ||
               latestRecord.metrics['Total Individuals Worked'] || '0');
    
    const totalExpenditure = 
      parseFloat(latestRecord.metrics.Total_Exp || 
                latestRecord.metrics.total_exp ||
                latestRecord.metrics['Total Expenditure'] || '0');
    
    const wagesPaid = 
      parseFloat(latestRecord.metrics.Wages || 
                latestRecord.metrics.wages ||
                latestRecord.metrics['Total Wages'] || '0');
    
    const avgWageRate = 
      parseFloat(latestRecord.metrics.Average_Wage_rate_per_day_per_person || 
                latestRecord.metrics.average_wage_rate ||
                latestRecord.metrics['Average Wage Rate'] || '0');
    
    const avgDaysEmployment = 
      parseFloat(latestRecord.metrics.Average_days_of_employment_provided_per_Household || 
                latestRecord.metrics.average_days_employment ||
                latestRecord.metrics['Average Days of Employment'] || '0');
    
    const completedWorks = 
      parseInt(latestRecord.metrics.Number_of_Completed_Works || 
               latestRecord.metrics.completed_works ||
               latestRecord.metrics['Completed Works'] || '0');
    
    const ongoingWorks = 
      parseInt(latestRecord.metrics.Number_of_Ongoing_Works || 
               latestRecord.metrics.ongoing_works ||
               latestRecord.metrics['Ongoing Works'] || '0');

    // Get last 12 months data for trends
    const last12Months = records.slice(0, 12).map((record) => ({
      month: record.month,
      fin_year: record.fin_year,
      households_worked: parseInt(record.metrics.Total_Households_Worked || 
                                  record.metrics.total_households_worked ||
                                  record.metrics['Total Households Worked'] || '0'),
      individuals_worked: parseInt(record.metrics.Total_Individuals_Worked || 
                                   record.metrics.total_individuals_worked ||
                                   record.metrics['Total Individuals Worked'] || '0'),
      wages_paid: parseFloat(record.metrics.Wages || 
                            record.metrics.wages ||
                            record.metrics['Total Wages'] || '0'),
      persondays: parseInt(record.metrics.Persondays_of_Central_Liability_so_far || 
                          record.metrics.persondays ||
                          record.metrics['Person Days'] || '0'),
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
