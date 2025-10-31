export interface District {
  name: string;
  record_count: number;
  last_updated: string;
  latest_fin_year: string;
}

export interface State {
  name: string;
  district_count: number;
  record_count: number;
  last_updated: string;
}

export interface DistrictSummary {
  district_name: string;
  state_name: string;
  last_updated: string;
  latest_period: {
    fin_year: string;
    month: string;
  };
  current_metrics: {
    households_worked: number;
    individuals_worked: number;
    total_expenditure: number;
    wages_paid: number;
    avg_wage_rate: number;
    avg_days_employment: number;
    completed_works: number;
    ongoing_works: number;
  };
  trends: {
    last_12_months: Array<{
      month: string;
      fin_year: string;
      households_worked: number;
      individuals_worked: number;
      wages_paid: number;
      persondays: number;
    }>;
  };
  total_records: number;
}

export interface MetricData {
  id: string;
  district_name: string;
  state_name: string;
  fin_year: string;
  month: string;
  metrics: {
    households_worked: number;
    individuals_worked: number;
    total_expenditure: number;
    wages_paid: number;
    avg_wage_rate: number;
    avg_days_employment: number;
    completed_works: number;
    ongoing_works: number;
    persondays: number;
    women_persondays: number;
    sc_persondays: number;
    st_persondays: number;
    active_job_cards: number;
    active_workers: number;
  };
  updated_at: string;
}
