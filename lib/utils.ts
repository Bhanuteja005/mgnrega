import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatNumber(num: number | undefined | null): string {
  // Handle undefined, null, or non-numeric values
  if (num === undefined || num === null || typeof num !== 'number' || isNaN(num)) {
    return '0';
  }
  
  if (num >= 10000000) {
    return `${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `${(num / 100000).toFixed(2)} Lakh`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(2)} K`;
  }
  return Math.round(num).toString();
}

export function formatCurrency(amount: number | undefined | null): string {
  return `₹${formatNumber(amount)}`;
}

export function getMetricStatus(
  current: number,
  previous: number
): 'good' | 'warning' | 'bad' {
  const change = ((current - previous) / previous) * 100;
  
  if (change > 10) return 'good';
  if (change < -10) return 'bad';
  return 'warning';
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}
