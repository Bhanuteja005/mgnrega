'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Home,
  Users,
  IndianRupee,
  CheckCircle,
  Clock,
  ArrowLeft,
  Volume2,
  Share2,
  AlertCircle,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type { DistrictSummary } from '@/lib/types';
import { formatNumber, formatCurrency } from '@/lib/utils';

export default function DistrictPage() {
  const params = useParams();
  const router = useRouter();
  const districtName = decodeURIComponent(params.id as string);

  const [summary, setSummary] = useState<DistrictSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  useEffect(() => {
    fetchDistrictSummary();
  }, [districtName]);

  const fetchDistrictSummary = async () => {
    try {
      setLoading(true);
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
    }
  };

  const playAudioExplanation = () => {
    if (!summary) return;

    setAudioPlaying(true);

    const text = `${summary.district_name} जिले में ${summary.latest_period.month} महीने में ${summary.current_metrics.households_worked} परिवारों को रोजगार मिला। कुल ${formatNumber(summary.current_metrics.individuals_worked)} लोगों ने काम किया और ${formatCurrency(summary.current_metrics.wages_paid)} मजदूरी का भुगतान किया गया। ${summary.current_metrics.completed_works} कार्य पूर्ण हुए।`;

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.85;
      utterance.onend = () => setAudioPlaying(false);
      utterance.onerror = () => setAudioPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Audio playback not supported in this browser');
      setAudioPlaying(false);
    }
  };

  const stopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setAudioPlaying(false);
  };

  const shareData = async () => {
    const shareText = summary ? 
      `${summary.district_name} में ${summary.current_metrics.households_worked} परिवारों को MGNREGA के तहत रोजगार मिला। देखें: ${window.location.href}` : 
      '';
    
    if (navigator.share && summary) {
      try {
        await navigator.share({
          title: `MGNREGA - ${summary.district_name}`,
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Error Loading Data
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
          >
            Go Back to Home
          </button>
        </div>
      </div>
    );
  }

  const chartData = summary.trends.last_12_months.reverse().map((item) => ({
    name: `${item.month?.substring(0, 3)}`,
    households: item.households_worked,
    wages: item.wages_paid / 100000, // In lakhs
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-blue-600 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {summary.district_name}
              </h1>
              <div className="flex items-center justify-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-gray-500" />
                <p className="text-sm text-gray-600">
                  {summary.latest_period.month} {summary.latest_period.fin_year}
                </p>
              </div>
            </div>
            <button
              onClick={shareData}
              className="p-3 rounded-lg hover:bg-blue-50 transition-colors"
              aria-label="Share"
            >
              <Share2 className="w-5 h-5 text-blue-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Audio Button */}
        <div className="mb-6">
          <button
            onClick={audioPlaying ? stopAudio : playAudioExplanation}
            className={`w-full flex items-center justify-center gap-3 px-8 py-5 rounded-2xl shadow-xl transition-all transform hover:scale-105 ${
              audioPlaying
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
            } text-white text-xl font-bold`}
          >
            <Volume2 className={`w-7 h-7 ${audioPlaying ? 'animate-pulse' : ''}`} />
            <span>{audioPlaying ? 'बंद करें / Stop Audio' : '🔊 सुनें / Listen Explanation'}</span>
          </button>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Households Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg p-6 border-l-4 border-green-600 transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <Home className="w-10 h-10 text-green-600" />
              <span className="text-4xl">🏠</span>
            </div>
            <p className="text-sm font-semibold text-green-700 mb-1">परिवार / Households</p>
            <p className="text-4xl font-black text-green-900">
              {formatNumber(summary.current_metrics.households_worked)}
            </p>
            <p className="text-xs text-green-600 mt-2">Families Employed</p>
          </div>

          {/* Workers Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6 border-l-4 border-blue-600 transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-10 h-10 text-blue-600" />
              <span className="text-4xl">👥</span>
            </div>
            <p className="text-sm font-semibold text-blue-700 mb-1">श्रमिक / Workers</p>
            <p className="text-4xl font-black text-blue-900">
              {formatNumber(summary.current_metrics.individuals_worked)}
            </p>
            <p className="text-xs text-blue-600 mt-2">Total Individuals</p>
          </div>

          {/* Wages Card */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl shadow-lg p-6 border-l-4 border-yellow-600 transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <IndianRupee className="w-10 h-10 text-yellow-600" />
              <span className="text-4xl">💰</span>
            </div>
            <p className="text-sm font-semibold text-yellow-700 mb-1">मजदूरी / Wages</p>
            <p className="text-3xl font-black text-yellow-900">
              {formatCurrency(summary.current_metrics.wages_paid)}
            </p>
            <p className="text-xs text-yellow-600 mt-2">Total Paid</p>
          </div>

          {/* Completed Works Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg p-6 border-l-4 border-purple-600 transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <CheckCircle className="w-10 h-10 text-purple-600" />
              <span className="text-4xl">✅</span>
            </div>
            <p className="text-sm font-semibold text-purple-700 mb-1">पूर्ण कार्य / Works</p>
            <p className="text-4xl font-black text-purple-900">
              {formatNumber(summary.current_metrics.completed_works)}
            </p>
            <p className="text-xs text-purple-600 mt-2">Completed</p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-5 border-t-4 border-blue-500">
            <p className="text-sm font-semibold text-gray-600 mb-1">औसत मजदूरी दर</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{summary.current_metrics.avg_wage_rate.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">per day</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-t-4 border-green-500">
            <p className="text-sm font-semibold text-gray-600 mb-1">औसत रोजगार दिन</p>
            <p className="text-2xl font-bold text-gray-900">
              {summary.current_metrics.avg_days_employment.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500 mt-1">days per household</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-t-4 border-orange-500 flex items-center gap-3">
            <Clock className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-sm font-semibold text-gray-600">चल रहे कार्य</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(summary.current_metrics.ongoing_works)}
              </p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Line Chart */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">
                12 महीने का रुझान / 12-Month Trend
              </h2>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '2px solid #3b82f6',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line
                    type="monotone"
                    dataKey="households"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    name="Households"
                    dot={{ fill: '#3b82f6', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <IndianRupee className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">
                मजदूरी भुगतान / Wage Payments
              </h2>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '2px solid #10b981',
                      borderRadius: '8px'
                    }} 
                    formatter={(value: number) => `₹${value.toFixed(2)} L`}
                  />
                  <Bar
                    dataKey="wages"
                    fill="#10b981"
                    name="Wages (₹ Lakhs)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white text-center shadow-xl">
          <p className="text-lg font-semibold mb-2">
            📊 Total {summary.total_records} historical records available
          </p>
          <p className="text-sm opacity-90">
            Last updated: {new Date(summary.last_updated).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </main>
    </div>
  );
}
