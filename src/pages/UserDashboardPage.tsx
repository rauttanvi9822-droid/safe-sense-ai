import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowRight, BarChart2 } from 'lucide-react';
import { Navbar } from '../components/Layout';
import { Card, Alert, PrototypeDisclaimer } from '../components/ui';
import { SVIMeter } from '../components/SVIMeter';
import type { RiskCategory } from '../types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

// Mock assessment history for a victim user
const MOCK_HISTORY = [
  { id: 'a1', date: '2025-01-10', svi: 48, risk: 'MODERATE' as RiskCategory, counsellor: 'Dr. Priya Sharma', status: 'reviewed' },
  { id: 'a2', date: '2025-01-18', svi: 61, risk: 'HIGH' as RiskCategory, counsellor: 'Dr. Priya Sharma', status: 'reviewed' },
  { id: 'a3', date: '2025-01-28', svi: 55, risk: 'HIGH' as RiskCategory, counsellor: 'Dr. Priya Sharma', status: 'reviewed' },
  { id: 'a4', date: '2025-02-05', svi: 38, risk: 'MODERATE' as RiskCategory, counsellor: 'Dr. Priya Sharma', status: 'pending_review' },
];

const chartData = MOCK_HISTORY.map((a, i) => ({
  name: `Assessment ${i + 1}`,
  date: a.date,
  SVI: a.svi,
}));

const riskColors: Record<RiskCategory, string> = {
  LOW: '#22c55e',
  MODERATE: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

export default function UserDashboardPage() {
  const navigate = useNavigate();
  const lastAssessment = MOCK_HISTORY[MOCK_HISTORY.length - 1];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f2547]">My Assessment Dashboard</h1>
            <p className="text-slate-500 mt-1">Track your assessment history and progress.</p>
          </div>
          <button
            onClick={() => navigate('/assessment')}
            className="inline-flex items-center gap-2 bg-[#0f2547] text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-[#1a3a6b] transition-colors"
          >
            <MessageCircle size={16} />
            New Assessment
          </button>
        </div>

        <PrototypeDisclaimer />

        {/* Latest SVI */}
        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          <Card className="p-5 col-span-1">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">Latest SVI</p>
            <SVIMeter score={lastAssessment.svi} risk={lastAssessment.risk} />
          </Card>
          <Card className="p-5 sm:col-span-2">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Latest Assessment Summary</p>
            <p className="text-xs text-slate-400 mb-3">
              Assessment #{MOCK_HISTORY.length} — {lastAssessment.date}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Risk Category</span>
                <span className="font-semibold" style={{ color: riskColors[lastAssessment.risk] }}>{lastAssessment.risk}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Counsellor</span>
                <span className="text-slate-700">{lastAssessment.counsellor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="text-slate-700 capitalize">{lastAssessment.status.replace('_', ' ')}</span>
              </div>
            </div>
            <Link to="/resources" className="inline-flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-800 mt-4">
              View Support Resources <ArrowRight size={14} />
            </Link>
          </Card>
        </div>

        {/* Trend Chart */}
        <Card className="p-6 mt-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-[#0f2547] flex items-center gap-2">
              <BarChart2 size={18} className="text-cyan-600" />
              Assessment Trend
            </h2>
          </div>
          <p className="text-xs text-slate-400 mb-4 italic">
            Assessment trend — not a clinical measurement.
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  formatter={(v) => [`SVI: ${v}`, '']}
                  labelStyle={{ fontSize: 12 }}
                />
                <ReferenceLine y={25} stroke="#22c55e" strokeDasharray="4 2" strokeOpacity={0.5} label={{ value: 'LOW', position: 'right', fontSize: 10, fill: '#22c55e' }} />
                <ReferenceLine y={50} stroke="#eab308" strokeDasharray="4 2" strokeOpacity={0.5} label={{ value: 'MOD', position: 'right', fontSize: 10, fill: '#eab308' }} />
                <ReferenceLine y={75} stroke="#f97316" strokeDasharray="4 2" strokeOpacity={0.5} label={{ value: 'HIGH', position: 'right', fontSize: 10, fill: '#f97316' }} />
                <Line type="monotone" dataKey="SVI" stroke="#0891b2" strokeWidth={2} dot={{ r: 4, fill: '#0891b2' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Assessment history table */}
        <Card className="mt-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-[#0f2547]">Assessment History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['#', 'Date', 'SVI', 'Risk', 'Counsellor', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_HISTORY.map((a, i) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                    <td className="px-4 py-3 text-slate-700">{a.date}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: riskColors[a.risk] }}>{a.svi}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: riskColors[a.risk] + '20',
                          color: riskColors[a.risk],
                        }}
                      >
                        {a.risk}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{a.counsellor}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs capitalize ${a.status === 'reviewed' ? 'text-green-600' : 'text-amber-600'}`}>
                        {a.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Alert type="disclaimer" className="mt-6 text-xs">
          Assessment scores shown are from a prototype system and are not clinically validated measurements.
        </Alert>
      </div>
    </div>
  );
}
