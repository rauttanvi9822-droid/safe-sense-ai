/**
 * SafeSense AI — Progress Tracking Page
 */
import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, BarChart2, Activity, CheckCircle } from 'lucide-react';
import { Navbar } from '../components/Layout';
import { Card } from '../components/ui';
import { apiGetProgress } from '../lib/apiClient';
import { localDb } from '../lib/localDb';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ReferenceLine, Legend,
} from 'recharts';
import type { RiskCategory } from '../types';

const RISK_COLORS: Record<RiskCategory, string> = {
  LOW: '#22c55e', MODERATE: '#eab308', HIGH: '#f97316', CRITICAL: '#ef4444',
};

export default function ProgressTrackingPage() {
  const [sviTrend, setSviTrend] = useState<any[]>([]);
  const [moodTrend, setMoodTrend] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadProgress = async () => {
      setIsLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL;
        if (API_URL && localStorage.getItem('safesense_token')) {
          const data = await apiGetProgress();
          setSviTrend(data.svi_trend ?? []);
          setMoodTrend(data.mood_trend ?? []);
          setStats(data.stats ?? {});
        } else {
          throw new Error('Using local data');
        }
      } catch {
        try {
          // Local fallback
          const assessments = localDb.getAssessments();
          const svi = assessments.map((a, i) => ({
            name: `Assessment ${i + 1}`,
            date: a.date,
            svi: a.svi,
            risk: a.risk,
          }));
          setSviTrend(svi);

          const checkins = localDb.getCheckInHistory().reverse();
          const mood = checkins.map(c => ({
            date: c.date,
            mood: c.mood,
            stress_level: c.stress_level,
            safety_level: c.safety_level,
          }));
          setMoodTrend(mood);

          setStats({
            total_assessments: assessments.length,
            total_checkins: checkins.length,
            support_requests: localDb.getSupportRequests().length,
            checkin_streak: 0,
            latest_svi: svi[svi.length - 1] ?? null,
            average_svi: svi.length ? Math.round(svi.reduce((s, a) => s + a.svi, 0) / svi.length) : null,
          });
        } catch {
          setLoadError('Could not load progress data.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadProgress();
  }, []);

  const chartSviData = sviTrend.map((s, i) => ({
    name: s.date ?? `Assessment ${i + 1}`,
    SVI: s.svi,
  }));

  const chartMoodData = moodTrend.slice(-14).map(c => ({
    name: c.date?.slice(5) ?? '',
    Mood: c.mood,
    Stress: c.stress_level,
    Safety: c.safety_level,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0f2547] flex items-center gap-2">
            <TrendingUp size={22} className="text-cyan-600" />
            Your Progress
          </h1>
          <p className="text-slate-500 text-sm mt-1">How you've been doing over time — based on your check-ins and assessments.</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : loadError && sviTrend.length === 0 ? (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">{loadError}</div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                { label: 'Assessments', value: stats.total_assessments ?? 0, icon: <Activity size={16} />, color: 'text-blue-600 bg-blue-50' },
                { label: 'Check-ins', value: stats.total_checkins ?? 0, icon: <Calendar size={16} />, color: 'text-cyan-600 bg-cyan-50' },
                { label: 'Support Requests', value: stats.support_requests ?? 0, icon: <CheckCircle size={16} />, color: 'text-purple-600 bg-purple-50' },
                { label: 'Check-in Streak', value: `${stats.checkin_streak ?? 0} days`, icon: <BarChart2 size={16} />, color: 'text-green-600 bg-green-50' },
              ].map(item => (
                <Card key={item.label} className="p-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${item.color}`}>{item.icon}</div>
                  <div className="text-2xl font-bold text-[#0f2547]">{item.value}</div>
                  <div className="text-xs text-slate-500">{item.label}</div>
                </Card>
              ))}
            </div>

            {/* SVI Trend */}
            {chartSviData.length > 0 ? (
              <Card className="p-6 mt-6">
                <h2 className="font-semibold text-[#0f2547] mb-1 flex items-center gap-2">
                  <TrendingUp size={16} className="text-cyan-600" />
                  Stress Trend Over Time
                </h2>
                <p className="text-xs text-slate-400 mb-4">
                  Based on your assessments. This shows your reported stress over time — lower scores indicate less stress.
                </p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartSviData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="sviGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0891b2" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip formatter={(v: any) => [`SVI: ${v}`]} />
                      <ReferenceLine y={25} stroke="#22c55e" strokeDasharray="4 2" strokeOpacity={0.6} />
                      <ReferenceLine y={50} stroke="#eab308" strokeDasharray="4 2" strokeOpacity={0.6} />
                      <ReferenceLine y={75} stroke="#f97316" strokeDasharray="4 2" strokeOpacity={0.6} />
                      <Area type="monotone" dataKey="SVI" stroke="#0891b2" strokeWidth={2} fill="url(#sviGrad)" dot={{ r: 4, fill: '#0891b2' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 justify-center mt-2 flex-wrap">
                  {(['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as RiskCategory[]).map(r => (
                    <span key={r} className="flex items-center gap-1 text-xs text-slate-500">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_COLORS[r] }} />
                      {r}
                    </span>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="p-8 mt-6 text-center">
                <Activity size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 text-sm">No assessment data yet. Complete an assessment to see your SVI trend.</p>
              </Card>
            )}

            {/* Mood/Stress Trend */}
            {chartMoodData.length > 0 ? (
              <Card className="p-6 mt-6">
                <h2 className="font-semibold text-[#0f2547] mb-1">Daily Check-In Trends</h2>
                <p className="text-xs text-slate-400 mb-4">Last 14 days · Scale 1–5 (higher mood/safety is better; lower stress is better)</p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartMoodData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="Mood" stroke="#0891b2" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Stress" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
                      <Line type="monotone" dataKey="Safety" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="2 2" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            ) : (
              <Card className="p-8 mt-6 text-center">
                <Calendar size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 text-sm">No check-in data yet. Complete a daily check-in to see trends.</p>
              </Card>
            )}
          </>
        )}

        <p className="mt-6 text-xs text-slate-400 text-center">
          Your progress data is private to your account. These are personal tracking indicators — not clinical measurements.
        </p>
      </div>
    </div>
  );
}
