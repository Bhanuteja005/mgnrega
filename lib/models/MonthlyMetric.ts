import mongoose, { Schema, Model } from 'mongoose';

export interface IMonthlyMetric {
  id: string;
  district_name: string;
  state_name: string;
  fin_year: string;
  month?: string;
  metrics: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const MonthlyMetricSchema = new Schema<IMonthlyMetric>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    district_name: {
      type: String,
      required: true,
      index: true,
    },
    state_name: {
      type: String,
      required: true,
      index: true,
    },
    fin_year: {
      type: String,
      required: true,
      index: true,
    },
    month: {
      type: String,
      index: true,
    },
    metrics: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'monthly_metrics',
  }
);

// Compound index for efficient queries
MonthlyMetricSchema.index({ state_name: 1, district_name: 1, fin_year: 1 });
MonthlyMetricSchema.index({ district_name: 1, createdAt: -1 });

// Prevent model recompilation in development
const MonthlyMetric: Model<IMonthlyMetric> =
  mongoose.models.MonthlyMetric || mongoose.model<IMonthlyMetric>('MonthlyMetric', MonthlyMetricSchema);

export default MonthlyMetric;
