import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MonthlyMetric from '@/lib/models/MonthlyMetric';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const district1 = searchParams.get('district1');
    const district2 = searchParams.get('district2');
    const metric = searchParams.get('metric') || 'all';

    if (!district1 || !district2) {
      return NextResponse.json(
        {
          error: 'Both district1 and district2 parameters are required',
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Get latest records for both districts
    const [records1, records2] = await Promise.all([
      MonthlyMetric.find({ district_name: district1 })
        .sort({ fin_year: -1, month: -1 })
        .limit(12)
        .lean(),
      MonthlyMetric.find({ district_name: district2 })
        .sort({ fin_year: -1, month: -1 })
        .limit(12)
        .lean(),
    ]);

    if (records1.length === 0 || records2.length === 0) {
      return NextResponse.json(
        {
          error: 'One or both districts not found',
        },
        { status: 404 }
      );
    }

    const latest1 = records1[0];
    const latest2 = records2[0];

    // Helper to extract metric value
    const getMetricValue = (record: any, metricKey: string): number => {
      const metricMap: Record<string, string> = {
        households: 'Total_Households_Worked',
        individuals: 'Total_Individuals_Worked',
        expenditure: 'Total_Exp',
        wages: 'Wages',
        works_completed: 'Number_of_Completed_Works',
        works_ongoing: 'Number_of_Ongoing_Works',
        persondays: 'Persondays_of_Central_Liability_so_far',
        avg_wage: 'Average_Wage_rate_per_day_per_person',
        avg_employment: 'Average_days_of_employment_provided_per_Household',
      };

      const key = metricMap[metricKey] || metricKey;
      const value = record.metrics[key];
      return parseFloat(value || '0');
    };

    // Calculate comparison
    const comparison = {
      districts: {
        district1: {
          name: district1,
          state: latest1.state_name,
          fin_year: latest1.fin_year,
          month: latest1.month,
        },
        district2: {
          name: district2,
          state: latest2.state_name,
          fin_year: latest2.fin_year,
          month: latest2.month,
        },
      },
      metrics: {
        households_worked: {
          district1: getMetricValue(latest1, 'households'),
          district2: getMetricValue(latest2, 'households'),
          difference:
            getMetricValue(latest1, 'households') - getMetricValue(latest2, 'households'),
          percentage_diff:
            ((getMetricValue(latest1, 'households') - getMetricValue(latest2, 'households')) /
              getMetricValue(latest2, 'households')) *
            100,
        },
        individuals_worked: {
          district1: getMetricValue(latest1, 'individuals'),
          district2: getMetricValue(latest2, 'individuals'),
          difference:
            getMetricValue(latest1, 'individuals') - getMetricValue(latest2, 'individuals'),
          percentage_diff:
            ((getMetricValue(latest1, 'individuals') - getMetricValue(latest2, 'individuals')) /
              getMetricValue(latest2, 'individuals')) *
            100,
        },
        total_expenditure: {
          district1: getMetricValue(latest1, 'expenditure'),
          district2: getMetricValue(latest2, 'expenditure'),
          difference:
            getMetricValue(latest1, 'expenditure') - getMetricValue(latest2, 'expenditure'),
          percentage_diff:
            ((getMetricValue(latest1, 'expenditure') - getMetricValue(latest2, 'expenditure')) /
              getMetricValue(latest2, 'expenditure')) *
            100,
        },
        wages_paid: {
          district1: getMetricValue(latest1, 'wages'),
          district2: getMetricValue(latest2, 'wages'),
          difference: getMetricValue(latest1, 'wages') - getMetricValue(latest2, 'wages'),
          percentage_diff:
            ((getMetricValue(latest1, 'wages') - getMetricValue(latest2, 'wages')) /
              getMetricValue(latest2, 'wages')) *
            100,
        },
      },
      trends: {
        district1: records1.slice(0, 12).map((r) => ({
          month: r.month,
          fin_year: r.fin_year,
          households: getMetricValue(r, 'households'),
          wages: getMetricValue(r, 'wages'),
        })),
        district2: records2.slice(0, 12).map((r) => ({
          month: r.month,
          fin_year: r.fin_year,
          households: getMetricValue(r, 'households'),
          wages: getMetricValue(r, 'wages'),
        })),
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(comparison);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to compare districts',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
