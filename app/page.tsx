'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Search, TrendingUp, Info, Navigation, Loader2 } from 'lucide-react';
import type { District } from '@/lib/types';
import NProgress from 'nprogress';

export default function Home() {
  const router = useRouter();
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetchDistricts();
  }, []);

  const fetchDistricts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/districts?state=UTTAR PRADESH');
      const data = await response.json();
      
      if (response.ok) {
        setDistricts(data.districts);
      } else {
        setError(data.error || 'Failed to fetch districts');
      }
    } catch (err: any) {
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = () => {
    setDetectingLocation(true);
    NProgress.start();
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // For demo, just show the first district
          // In production, you would reverse geocode the coordinates
          alert(`Location detected: ${position.coords.latitude}, ${position.coords.longitude}\nShowing nearest district...`);
          if (districts.length > 0) {
            handleDistrictSelect(districts[0].name);
          }
          setDetectingLocation(false);
          NProgress.done();
        },
        (error) => {
          alert('Could not detect location. Please select manually.');
          setDetectingLocation(false);
          NProgress.done();
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
      setDetectingLocation(false);
      NProgress.done();
    }
  };

  const filteredDistricts = districts.filter((district) =>
    district.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDistrictSelect = (districtName: string) => {
    startTransition(() => {
      router.push(`/district/${encodeURIComponent(districtName)}`);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-4xl font-display font-bold text-gray-800">
                MGNREGA Dashboard
              </h1>
            </div>
            <p className="text-lg font-display font-medium text-gray-600">
              हमारी आवाज़, हमारे अधिकार
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Our Voice, Our Rights - Track Employment Data for Uttar Pradesh
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Info Card */}
        <div className="mb-8 bg-white border-2 border-blue-200 p-6 rounded-2xl shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Info className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-gray-800 mb-1">
                अपने जिले का चयन करें / Select Your District
              </h3>
              <p className="text-gray-600">
                अपने जिले के MGNREGA प्रदर्शन को देखने के लिए नीचे से चुनें या स्वचालित रूप से पता लगाएं।
              </p>
            </div>
          </div>
        </div>

        {/* Search and Location */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="जिला खोजें... / Search for your district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-lg font-sans text-gray-900 placeholder:text-gray-500 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all shadow-sm hover:shadow-md"
            />
          </div>
          <button
            onClick={detectLocation}
            disabled={detectingLocation || isPending}
            className="px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {detectingLocation ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Navigation className="w-5 h-5" />
            )}
            <span>{detectingLocation ? 'Detecting...' : 'Auto-Detect Location'}</span>
          </button>
        </div>

        {/* Districts Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
            <p className="mt-4 text-gray-600 font-medium font-display">Loading districts...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-sm">
            <p className="text-red-700 font-semibold">{error}</p>
            <button
              onClick={fetchDistricts}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 text-center">
              <p className="text-gray-600">
                Showing <span className="font-semibold text-blue-600">{filteredDistricts.length}</span> of {districts.length} districts in Uttar Pradesh.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredDistricts.map((district) => (
                <button
                  key={district.name}
                  onClick={() => handleDistrictSelect(district.name)}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 text-left border-2 border-gray-200 hover:border-blue-500 transform hover:-translate-y-1.5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                      <MapPin className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                      {district.record_count} records
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                      {district.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Financial Year: {district.latest_fin_year}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {filteredDistricts.length === 0 && !loading && !error && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg font-display">
              No districts found matching "<span className="font-semibold">{searchQuery}</span>"
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              📊 Data source: data.gov.in MGNREGA Open API
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Last updated: {new Date().toLocaleDateString('en-IN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
