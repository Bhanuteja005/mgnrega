'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Home,
  Users,
  IndianRupee,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowLeft,
  Volume2,
  Share2,
  AlertCircle,
  BarChart3,
  Loader2,
  ServerCrash,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DistrictSummary } from '@/lib/types';
import { formatNumber, formatCurrency } from '@/lib/utils';
import NProgress from 'nprogress';

export default function DistrictPage() {
  const params = useParams();
  const router = useRouter();
  const districtName = decodeURIComponent(params.id as string);

  const [summary, setSummary] = useState<DistrictSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetchDistrictSummary();
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [districtName]);

  const fetchDistrictSummary = async () => {
    try {
      setLoading(true);
      NProgress.start();
      const response = await fetch(
        `/api/districts/${encodeURIComponent(districtName)}/summary`
      );
      const data = await response.json();

      if (response.ok) {
        setSummary(data);
      } else {
        setError(data.error || 'Failed to fetch district data');
      }
    } catch (err: any) {
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
      NProgress.done();
    }
  };

  const playAudioExplanation = () => {
    if (!summary) return;

    setAudioPlaying(true);

    const text = `${summary.district_name} जिले में, ${summary.latest_period.month} ${summary.latest_period.fin_year} के दौरान, ${formatNumber(summary.current_metrics.households_worked)} परिवारों को काम मिला। कुल ${formatNumber(summary.current_metrics.individuals_worked)} लोगों ने काम किया और ${formatCurrency(summary.current_metrics.wages_paid)} रुपये की मजदूरी का भुगतान किया गया।`;

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      utterance.onend = () => setAudioPlaying(false);
      utterance.onerror = () => {
        alert('Audio playback failed. Please try again.');
        setAudioPlaying(false);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Audio playback is not supported in this browser.');
      setAudioPlaying(false);
    }
  };

  const stopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setAudioPlaying(false);
  };

  const handleBack = () => {
    startTransition(() => {
      router.push('/');
    });
  };

  const shareData = async () => {
    if (navigator.share && summary) {
      try {
        await navigator.share({
          title: `MGNREGA Report for ${summary.district_name}`,
          text: `Check out the latest MGNREGA performance for ${summary.district_name}: ${formatNumber(summary.current_metrics.households_worked)} households employed.`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-4">
        <Loader2 className="w-20 h-20 text-blue-600 animate-spin" />
        <h2 className="mt-6 text-2xl font-display font-semibold text-gray-700">
          Loading data for {districtName}...
        </h2>
        <p className="mt-2 text-gray-500">Please wait a moment.</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <ServerCrash className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-gray-800 mb-2">
            Error Loading Data
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleBack}
            disabled={isPending}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back to Home
          </button>
        </div>
      </div>
    );
  }

  const chartData = summary.trends.last_12_months.reverse().map((item) => ({
    name: `${item.month?.substring(0, 3)} '${item.fin_year?.substring(5)}`,
    households: item.households_worked,
    wages: Math.round(item.wages_paid / 100000), // Convert to lakhs
    workers: item.individuals_worked,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={isPending}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">Back</span>
            </button>
            <div className="flex-1 text-center px-4">
              <h1 className="text-xl sm:text-2xl font-display font-bold text-gray-800 truncate">
                {summary.district_name}
              </h1>
              <p className="text-sm text-gray-500">
                {summary.latest_period.month} {summary.latest_period.fin_year}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={shareData}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Share"
              >
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Audio Explain Button */}
        <div className="mb-8">
          <button
            onClick={audioPlaying ? stopAudio : playAudioExplanation}
            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl shadow-lg transition-all duration-300 ${
              audioPlaying
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white text-lg font-semibold transform hover:scale-105`}
          >
            <Volume2 className={`w-6 h-6 ${audioPlaying ? 'animate-pulse' : ''}`} />
            <span>{audioPlaying ? 'रोकें / Stop' : 'हिंदी में सुनें / Listen in Hindi'}</span>
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Households Card */}
          <MetricCard
            icon={Home}
            emoji="🏠"
            title="परिवार / Households"
            value={formatNumber(summary.current_metrics.households_worked)}
            subtitle="Employed this month"
            color="green"
          />
          {/* Workers Card */}
          <MetricCard
            icon={Users}
            emoji="👥"
            title="श्रमिक / Workers"
            value={formatNumber(summary.current_metrics.individuals_worked)}
            subtitle="Individual workers"
            color="blue"
          />
          {/* Wages Card */}
          <MetricCard
            icon={IndianRupee}
            emoji="💰"
            title="मजदूरी / Wages"
            value={formatCurrency(summary.current_metrics.wages_paid)}
            subtitle="Total paid this month"
            color="yellow"
            isCurrency
          />
          {/* Completed Works Card */}
          <MetricCard
            icon={CheckCircle}
            emoji="✅"
            title="पूर्ण कार्य / Completed"
            value={formatNumber(summary.current_metrics.completed_works)}
            subtitle="Works completed"
            color="purple"
          />
        </div>

        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <InfoCard
            icon={IndianRupee}
            title="औसत मजदूरी दर / Avg Wage"
            value={`₹${summary.current_metrics.avg_wage_rate.toFixed(0)}`}
            subtitle="per day per person"
            color="emerald"
          />
          <InfoCard
            icon={Clock}
            title="औसत रोजगार / Avg Days"
            value={summary.current_metrics.avg_days_employment.toFixed(0)}
            subtitle="days per household"
            color="sky"
          />
          <InfoCard
            icon={TrendingUp}
            title="चल रहे कार्य / Ongoing"
            value={formatNumber(summary.current_metrics.ongoing_works)}
            subtitle="projects in progress"
            color="orange"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          {/* Line Chart - Employment Trend */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm p-6 border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-gray-800">
                  रोजगार रुझान / Employment Trend
                </h2>
                <p className="text-sm text-gray-500">Last 12 months households and workers data</p>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="households" stroke="#3b82f6" strokeWidth={2.5} name="परिवार / Households" dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="workers" stroke="#8b5cf6" strokeWidth={2.5} name="श्रमिक / Workers" dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart - Wages Paid */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-gray-800">
                  मजदूरी भुगतान / Wages
                </h2>
                <p className="text-sm text-gray-500">Monthly wages paid (in Lakhs ₹)</p>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip cursor={{fill: 'rgba(239, 246, 255, 0.5)'}} content={<CustomTooltip />} />
                  <Bar dataKey="wages" fill="#10b981" name="मजदूरी / Wages (Lakhs)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Data Info */}
        <div className="bg-white rounded-lg p-4 text-center border-2 border-gray-200">
          <p className="text-sm text-gray-600">
            📊 Total <span className="font-semibold">{summary.total_records}</span> historical records available •
            Last updated: {new Date(summary.last_updated).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </main>
    </div>
  );
}

// Reusable components for cards
const MetricCard = ({ icon: Icon, emoji, title, value, subtitle, color, isCurrency }: any) => (
  <div className={`bg-white rounded-2xl shadow-sm p-6 border-2 border-gray-200 hover:shadow-xl hover:border-${color}-500 transition-all duration-300 transform hover:-translate-y-1.5`}>
    <div className="flex items-center justify-between mb-3">
      <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
      <span className="text-3xl">{emoji}</span>
    </div>
    <div>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className={`font-display font-bold text-gray-800 ${isCurrency ? 'text-3xl' : 'text-4xl'}`}>
        {value}
      </p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  </div>
);

const InfoCard = ({ icon: Icon, title, value, subtitle, color }: any) => (
  <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-gray-200 hover:shadow-lg transition-all">
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-display font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="label font-bold text-gray-800">{`${label}`}</p>
        {payload.map((pld: any) => (
          <p key={pld.dataKey} style={{ color: pld.color }} className="text-sm">
            {`${pld.name}: ${pld.dataKey === 'wages' ? `₹${pld.value}L` : formatNumber(pld.value)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};
