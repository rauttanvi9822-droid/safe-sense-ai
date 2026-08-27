import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, AlertTriangle, Clock, TrendingUp,
  Eye, RefreshCw
} from 'lucide-react';
import { Navbar, PageHeader, StatCard } from '../components/Layout';
import { Card, RiskBadge, Button, Input, Alert } from '../components/ui';
import type { RiskCategory } from '../types';

interface CaseRow {
  id: string;
  caseRef: string;
  date: string;
  language: string;
  interactionType: string;
  svi: number;
  risk: RiskCategory;
  status: string;
  lastAssessment: string;
  counsellor: string;
}

const MOCK_CASES: CaseRow[] = [
  { id: 'c001', caseRef: 'SSA-2025-0001', date: '2025-02-01', language: 'English', interactionType: 'Text', svi: 72, risk: 'HIGH', status: 'Under Review', lastAssessment: '2025-02-05', counsellor: 'Dr. Priya Sharma' },
  { id: 'c002', caseRef: 'SSA-2025-0002', date: '2025-02-02', language: 'Hindi', interactionType: 'Text', svi: 85, risk: 'CRITICAL', status: 'Escalated', lastAssessment: '2025-02-06', counsellor: 'Dr. Arjun Mehta' },
  { id: 'c003', caseRef: 'SSA-2025-0003', date: '2025-02-03', language: 'Marathi', interactionType: 'Voice', svi: 42, risk: 'MODERATE', status: 'Follow-up Due', lastAssessment: '2025-02-03', counsellor: 'Dr. Priya Sharma' },
  { id: 'c004', caseRef: 'SSA-2025-0004', date: '2025-02-04', language: 'English', interactionType: 'Text', svi: 18, risk: 'LOW', status: 'Closed', lastAssessment: '2025-02-04', counsellor: 'Dr. Arjun Mehta' },
  { id: 'c005', caseRef: 'SSA-2025-0005', date: '2025-02-05', language: 'Hindi', interactionType: 'Text', svi: 67, risk: 'HIGH', status: 'Open', lastAssessment: '2025-02-07', counsellor: 'Unassigned' },
  { id: 'c006', caseRef: 'SSA-2025-0006', date: '2025-02-06', language: 'English', interactionType: 'Text', svi: 55, risk: 'HIGH', status: 'Under Review', lastAssessment: '2025-02-08', counsellor: 'Dr. Priya Sharma' },
  { id: 'c007', caseRef: 'SSA-2025-0007', date: '2025-02-07', language: 'Marathi', interactionType: 'Voice', svi: 30, risk: 'MODERATE', status: 'Open', lastAssessment: '2025-02-07', counsellor: 'Unassigned' },
];

const riskRowBg: Record<RiskCategory, string> = {
  LOW: 'hover:bg-green-50',
  MODERATE: 'hover:bg-yellow-50',
  HIGH: 'hover:bg-orange-50',
  CRITICAL: 'hover:bg-red-50',
};

export default function CounsellorDashboardPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskCategory | 'all'>('all');

  const filtered = MOCK_CASES.filter((c) => {
    const matchSearch =
      !search ||
      c.caseRef.toLowerCase().includes(search.toLowerCase()) ||
      c.counsellor.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === 'all' || c.risk === riskFilter;
    return matchSearch && matchRisk;
  });

  const stats = {
    total: MOCK_CASES.length,
    pending: MOCK_CASES.filter((c) => c.status === 'Open').length,
    high: MOCK_CASES.filter((c) => c.risk === 'HIGH').length,
    critical: MOCK_CASES.filter((c) => c.risk === 'CRITICAL').length,
    followup: MOCK_CASES.filter((c) => c.status === 'Follow-up Due').length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeader
          title="Counsellor Dashboard"
          subtitle="Review and manage assigned cases"
          badge="Authorized Access Only"
        />

        <Alert type="disclaimer" className="mb-6 text-xs">
          This dashboard contains assessment data for review purposes only. All cases require human professional evaluation. SVI scores are prototype indicators, not clinical diagnoses.
        </Alert>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard label="Total Active Cases" value={stats.total} icon={<Users size={18} />} color="bg-blue-50 text-blue-600" />
          <StatCard label="Pending Reviews" value={stats.pending} icon={<Clock size={18} />} color="bg-amber-50 text-amber-600" />
          <StatCard label="High Risk" value={stats.high} icon={<TrendingUp size={18} />} color="bg-orange-50 text-orange-600" />
          <StatCard label="Critical Risk" value={stats.critical} icon={<AlertTriangle size={18} />} color="bg-red-50 text-red-600" />
          <StatCard label="Follow-ups Due" value={stats.followup} icon={<RefreshCw size={18} />} color="bg-purple-50 text-purple-600" />
        </div>

        {/* Filters */}
        <Card className="p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search by case ID or counsellor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRiskFilter(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    riskFilter === r
                      ? 'bg-[#0f2547] text-white border-[#0f2547]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {r === 'all' ? 'All' : r}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Case table */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-[#0f2547]">Cases ({filtered.length})</h2>
            <span className="text-xs text-slate-400">Click a row to view case details</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Case ID', 'Date', 'Language', 'Mode', 'SVI', 'Risk', 'Status', 'Last Assessment', 'Counsellor', 'Action'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className={`cursor-pointer transition-colors ${riskRowBg[c.risk]}`}
                    onClick={() => navigate(`/counsellor/case/${c.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.caseRef}</td>
                    <td className="px-4 py-3 text-slate-600">{c.date}</td>
                    <td className="px-4 py-3 text-slate-600">{c.language}</td>
                    <td className="px-4 py-3 text-slate-600">{c.interactionType}</td>
                    <td className="px-4 py-3 font-bold text-slate-700">{c.svi}</td>
                    <td className="px-4 py-3">
                      <RiskBadge risk={c.risk} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600">{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{c.lastAssessment}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{c.counsellor}</td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); navigate(`/counsellor/case/${c.id}`); }}
                      >
                        <Eye size={14} /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-8 text-slate-400">No cases found matching your filters.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
