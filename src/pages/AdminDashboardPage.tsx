import { useState } from 'react';
import {
  Users, Settings, Globe, BarChart3, FileText, Shield,
  Plus, Trash2, Edit, Check, AlertTriangle, Database,
  Activity, Lock, FlaskConical
} from 'lucide-react';
import { Navbar, PageHeader, StatCard } from '../components/Layout';
import { Card, Alert, Button, Badge, PrototypeDisclaimer } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import type { DemoScenario } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import clsx from 'clsx';

type AdminTab = 'overview' | 'users' | 'resources' | 'languages' | 'demo' | 'audit' | 'config';

const TAB_ITEMS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
  { id: 'users', label: 'Users', icon: <Users size={16} /> },
  { id: 'resources', label: 'Support Resources', icon: <Shield size={16} /> },
  { id: 'languages', label: 'Languages', icon: <Globe size={16} /> },
  { id: 'demo', label: 'Demo Mode', icon: <FlaskConical size={16} /> },
  { id: 'audit', label: 'Audit Logs', icon: <FileText size={16} /> },
  { id: 'config', label: 'Configuration', icon: <Settings size={16} /> },
];

const ANALYTICS_DATA = [
  { month: 'Oct', assessments: 12, critical: 2, high: 4 },
  { month: 'Nov', assessments: 19, critical: 3, high: 7 },
  { month: 'Dec', assessments: 15, critical: 1, high: 5 },
  { month: 'Jan', assessments: 24, critical: 4, high: 9 },
  { month: 'Feb', assessments: 18, critical: 2, high: 6 },
];

const RISK_PIE = [
  { name: 'LOW', value: 22, color: '#22c55e' },
  { name: 'MODERATE', value: 31, color: '#eab308' },
  { name: 'HIGH', value: 28, color: '#f97316' },
  { name: 'CRITICAL', value: 12, color: '#ef4444' },
];

const MOCK_USERS = [
  { id: 'u1', email: 'victim@demo.safesense', name: 'Demo User', role: 'victim', status: 'active' },
  { id: 'u2', email: 'counsellor@demo.safesense', name: 'Dr. Priya Sharma', role: 'counsellor', status: 'active' },
  { id: 'u3', email: 'admin@demo.safesense', name: 'System Admin', role: 'admin', status: 'active' },
];

const AUDIT_LOGS = [
  { id: 'log1', time: '2025-02-08 14:32', user: 'counsellor@demo.safesense', action: 'Viewed case SSA-2025-0001', ip: '10.0.0.1' },
  { id: 'log2', time: '2025-02-08 13:15', user: 'admin@demo.safesense', action: 'Updated support resource r-001', ip: '10.0.0.2' },
  { id: 'log3', time: '2025-02-08 11:05', user: 'counsellor@demo.safesense', action: 'Marked case SSA-2025-0003 as reviewed', ip: '10.0.0.1' },
  { id: 'log4', time: '2025-02-07 16:22', user: 'admin@demo.safesense', action: 'Added new language: Gujarati (pending)', ip: '10.0.0.2' },
];

export default function AdminDashboardPage() {
  const { demoMode, setDemoScenario, toggleDemoMode } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeader
          title="Admin Dashboard"
          subtitle="System management and configuration"
          badge="Admin Access"
        />

        <Alert type="warning" className="mb-6 text-xs">
          <Lock size={13} className="inline mr-1" />
          <strong>Restricted Area:</strong> This dashboard is for authorized administrators only.
          All actions are audit-logged.
        </Alert>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="md:w-52 flex-shrink-0">
            <Card className="p-2">
              {TAB_ITEMS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                    activeTab === tab.id
                      ? 'bg-[#0f2547] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </Card>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'resources' && <ResourcesTab />}
            {activeTab === 'languages' && <LanguagesTab />}
            {activeTab === 'demo' && (
              <DemoModeTab
                demoMode={demoMode}
                setDemoScenario={setDemoScenario}
                toggleDemoMode={toggleDemoMode}
              />
            )}
            {activeTab === 'audit' && <AuditTab />}
            {activeTab === 'config' && <ConfigTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      <PrototypeDisclaimer />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Cases" value={93} icon={<Database size={18} />} color="bg-blue-50 text-blue-600" />
        <StatCard label="Active Users" value={14} icon={<Users size={18} />} color="bg-green-50 text-green-600" />
        <StatCard label="This Month" value={18} icon={<Activity size={18} />} color="bg-cyan-50 text-cyan-600" />
        <StatCard label="Critical (Open)" value={2} icon={<AlertTriangle size={18} />} color="bg-red-50 text-red-600" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="font-semibold text-[#0f2547] mb-1">Monthly Assessments</h3>
          <p className="text-xs text-slate-400 italic mb-4">Anonymized aggregate data</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ANALYTICS_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="assessments" fill="#0891b2" radius={[3, 3, 0, 0]} name="Total" />
                <Bar dataKey="high" fill="#f97316" radius={[3, 3, 0, 0]} name="High" />
                <Bar dataKey="critical" fill="#ef4444" radius={[3, 3, 0, 0]} name="Critical" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-[#0f2547] mb-1">Risk Distribution</h3>
          <p className="text-xs text-slate-400 italic mb-4">Anonymized aggregate data</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={RISK_PIE} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {RISK_PIE.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} cases`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {RISK_PIE.map((e) => (
              <span key={e.name} className="flex items-center gap-1 text-xs text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
                {e.name}: {e.value}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function UsersTab() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-[#0f2547]">User Management</h2>
        <Button size="sm">
          <Plus size={14} /> Add User
        </Button>
      </div>
      <Alert type="info" className="text-xs">
        In production, user management is handled via Supabase Auth with proper invitation flows and password policies.
      </Alert>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {['Name', 'Email', 'Role', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_USERS.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700">{u.name}</td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{u.email}</td>
                <td className="px-4 py-3"><Badge variant="info">{u.role}</Badge></td>
                <td className="px-4 py-3"><span className="text-xs text-green-600">● {u.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost"><Edit size={13} /></Button>
                    <Button size="sm" variant="ghost" className="text-red-500"><Trash2 size={13} /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ResourcesTab() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-[#0f2547]">Support Resources</h2>
        <Button size="sm">
          <Plus size={14} /> Add Resource
        </Button>
      </div>
      <Alert type="warning" className="text-xs">
        <strong>Important:</strong> Before publishing any resource, verify all contact details, phone numbers, and website URLs with the relevant organization. Do not publish unverified information.
      </Alert>
      <Card className="p-4">
        <p className="text-sm text-slate-600">
          Resource management allows administrators to add, edit, verify, and deactivate support
          resources shown on the public Resources page. Each resource should be verified before
          being marked as active.
        </p>
        <div className="mt-4 grid gap-3">
          {[
            { name: 'NHAA Helpline — 14566', category: 'Victim Support', verified: false },
            { name: 'iCall — Psychological Counselling', category: 'Counselling', verified: false },
            { name: 'Vandrevala Foundation Helpline', category: 'Mental Health', verified: false },
            { name: 'Legal Aid Services', category: 'Legal', verified: false },
          ].map((r) => (
            <div key={r.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <p className="text-sm font-medium text-slate-800">{r.name}</p>
                <p className="text-xs text-slate-500">{r.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${r.verified ? 'text-green-600' : 'text-amber-600'}`}>
                  {r.verified ? '● Verified' : '● Pending Verification'}
                </span>
                <Button size="sm" variant="ghost"><Edit size={13} /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function LanguagesTab() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-[#0f2547]">Language Management</h2>
        <Button size="sm">
          <Plus size={14} /> Add Language
        </Button>
      </div>
      <Alert type="info" className="text-xs">
        New languages can be added by providing translations for the assessment question set and UI labels. Requires developer integration and content review.
      </Alert>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {['Code', 'Language', 'Status', 'Questions', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[
              { code: 'en', name: 'English', status: 'Active', questions: 7 },
              { code: 'hi', name: 'Hindi (हिन्दी)', status: 'Active', questions: 7 },
              { code: 'mr', name: 'Marathi (मराठी)', status: 'Active', questions: 7 },
              { code: 'gu', name: 'Gujarati (ગુજરાતી)', status: 'Pending', questions: 0 },
              { code: 'ta', name: 'Tamil (தமிழ்)', status: 'Pending', questions: 0 },
              { code: 'te', name: 'Telugu (తెలుగు)', status: 'Pending', questions: 0 },
            ].map((l) => (
              <tr key={l.code} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{l.code}</td>
                <td className="px-4 py-3 text-slate-700">{l.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${l.status === 'Active' ? 'text-green-600' : 'text-amber-600'}`}>
                    {l.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{l.questions}/7</td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="ghost"><Edit size={13} /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function DemoModeTab({
  demoMode,
  setDemoScenario,
  toggleDemoMode,
}: {
  demoMode: any;
  setDemoScenario: (s: DemoScenario) => void;
  toggleDemoMode: () => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-[#0f2547]">Demo Mode</h2>
      <Alert type="warning">
        <strong>Demo Mode</strong> uses synthetic test data only. It must NEVER be enabled in a production environment with real case data.
      </Alert>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-[#0f2547]">Demo Mode Status</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              When enabled, a banner will appear on all pages and assessments will use synthetic scores.
            </p>
          </div>
          <button
            onClick={toggleDemoMode}
            className={clsx(
              'relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0f2547]',
              demoMode.active ? 'bg-cyan-600' : 'bg-slate-300'
            )}
          >
            <div
              className={clsx(
                'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
                demoMode.active ? 'translate-x-7' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {demoMode.active && (
          <>
            <h3 className="font-semibold text-slate-700 mb-3">Select Demo Scenario</h3>
            <div className="grid grid-cols-2 gap-3">
              {(['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as DemoScenario[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setDemoScenario(s)}
                  className={clsx(
                    'p-4 rounded-xl border-2 font-semibold text-sm transition-all',
                    demoMode.scenario === s
                      ? 'border-[#0f2547] bg-[#0f2547]/5 text-[#0f2547]'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  )}
                >
                  {s}
                  {demoMode.scenario === s && <Check size={14} className="inline ml-2" />}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3">
              The selected scenario will be used for all assessments run in demo mode, producing an SVI score in the corresponding risk band.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}

function AuditTab() {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-[#0f2547]">Audit Logs</h2>
      <Alert type="info" className="text-xs">
        All sensitive actions are logged for accountability. In production, logs are append-only and stored securely.
      </Alert>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {['Time', 'User', 'Action', 'IP'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {AUDIT_LOGS.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{log.time}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{log.user}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{log.action}</td>
                <td className="px-4 py-3 text-xs text-slate-400 font-mono">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ConfigTab() {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-[#0f2547]">Assessment Configuration</h2>
      <Alert type="info" className="text-xs">
        Configuration changes affect the assessment engine. Changes require admin authorization and should be tested in demo mode first.
      </Alert>
      <Card className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">AI Service URL</label>
          <input
            type="text"
            defaultValue="(Not configured — using prototype mock engine)"
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0f2547]"
          />
          <p className="text-xs text-slate-400 mt-1">Set VITE_AI_SERVICE_URL environment variable to connect a real AI service.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Risk Thresholds</label>
          <div className="grid grid-cols-4 gap-3 text-sm">
            {[
              { label: 'LOW', range: '0–25', color: 'bg-green-50 border-green-200 text-green-700' },
              { label: 'MODERATE', range: '26–50', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
              { label: 'HIGH', range: '51–75', color: 'bg-orange-50 border-orange-200 text-orange-700' },
              { label: 'CRITICAL', range: '76–100', color: 'bg-red-50 border-red-200 text-red-700' },
            ].map((t) => (
              <div key={t.label} className={`p-3 rounded-lg border text-center ${t.color}`}>
                <p className="font-bold">{t.label}</p>
                <p className="text-xs">{t.range}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2 italic">
            Prototype thresholds — not clinically validated. Adjustable in a validated production system.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Supabase Configuration</label>
          <input
            type="text"
            defaultValue="(Set VITE_SUPABASE_URL)"
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500 focus:outline-none mb-2"
            readOnly
          />
          <input
            type="text"
            defaultValue="(Set VITE_SUPABASE_ANON_KEY)"
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500 focus:outline-none"
            readOnly
          />
          <p className="text-xs text-slate-400 mt-1">Configure via .env file. Never commit API keys to source control.</p>
        </div>
      </Card>
    </div>
  );
}
