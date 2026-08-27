import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Calendar, UserCheck, Clock, CheckCircle,
  AlertTriangle, FileText, RefreshCw
} from 'lucide-react';
import { Navbar, PageHeader } from '../components/Layout';
import { Card, Alert, Button, RiskBadge, PrototypeDisclaimer, Select, TextArea } from '../components/ui';
import { SVIMeter } from '../components/SVIMeter';
import type { RiskCategory } from '../types';

// Mock case detail data
const MOCK_CASE_DETAIL: Record<string, any> = {
  c001: {
    caseRef: 'SSA-2025-0001',
    date: '2025-02-01',
    language: 'English',
    interactionType: 'Text',
    svi: 72,
    risk: 'HIGH' as RiskCategory,
    status: 'Under Review',
    counsellor: 'Dr. Priya Sharma',
    followUpDate: '2025-02-15',
    humanReviewStatus: 'In Progress',
    indicators: [
      'Elevated fear indicators',
      'Distress-related language',
      'Safety concern indicators',
    ],
    recommendedSupport: 'Prompt human support recommended. Priority counsellor review advised.',
    history: [
      { date: '2025-01-10', svi: 48, risk: 'MODERATE' as RiskCategory },
      { date: '2025-01-18', svi: 61, risk: 'HIGH' as RiskCategory },
      { date: '2025-02-01', svi: 72, risk: 'HIGH' as RiskCategory },
    ],
    notes: '',
  },
  c002: {
    caseRef: 'SSA-2025-0002',
    date: '2025-02-02',
    language: 'Hindi',
    interactionType: 'Text',
    svi: 85,
    risk: 'CRITICAL' as RiskCategory,
    status: 'Escalated',
    counsellor: 'Dr. Arjun Mehta',
    followUpDate: '2025-02-10',
    humanReviewStatus: 'Urgent',
    indicators: [
      'Elevated fear indicators',
      'Threat/intimidation indicators',
      'Safety concern indicators',
      'Social isolation indicators',
    ],
    recommendedSupport: 'Immediate human support recommended.',
    history: [
      { date: '2025-01-15', svi: 55, risk: 'HIGH' as RiskCategory },
      { date: '2025-02-02', svi: 85, risk: 'CRITICAL' as RiskCategory },
    ],
    notes: '',
  },
};

const DEFAULT_CASE = MOCK_CASE_DETAIL['c001'];

export default function CaseDetailPage() {
  const { caseId } = useParams();
  const caseData = MOCK_CASE_DETAIL[caseId ?? ''] ?? DEFAULT_CASE;
  const [notes, setNotes] = useState<string>(caseData.notes ?? '');
  const [assignedCounsellor, setAssignedCounsellor] = useState<string>(caseData.counsellor);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PageHeader
          title={`Case: ${caseData.caseRef}`}
          subtitle={`Assessment Date: ${caseData.date}`}
          back="/counsellor"
          actions={
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleSave}>
                <CheckCircle size={14} /> Mark Reviewed
              </Button>
              <Button size="sm" variant="secondary">
                <RefreshCw size={14} /> Request Follow-up
              </Button>
            </div>
          }
        />

        {saved && (
          <Alert type="success" className="mb-4">Case marked as reviewed.</Alert>
        )}

        <PrototypeDisclaimer />

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {/* SVI + Risk */}
          <Card className="p-6">
            <h2 className="font-semibold text-[#0f2547] mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" />
              Assessment Result
            </h2>
            <SVIMeter score={caseData.svi} risk={caseData.risk} size="md" />
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Human Review Status</span>
                <span className="font-medium text-slate-700">{caseData.humanReviewStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Follow-up Date</span>
                <span className="text-slate-700">{caseData.followUpDate}</span>
              </div>
            </div>
          </Card>

          {/* Metadata */}
          <Card className="p-6">
            <h2 className="font-semibold text-[#0f2547] mb-3 flex items-center gap-2">
              <FileText size={16} className="text-cyan-600" />
              Case Metadata
            </h2>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Case Reference', value: caseData.caseRef },
                { label: 'Language', value: caseData.language },
                { label: 'Interaction Type', value: caseData.interactionType },
                { label: 'Current Status', value: caseData.status },
                { label: 'Assigned Counsellor', value: caseData.counsellor },
              ].map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="font-medium text-slate-700">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Possible indicators */}
        <Card className="p-6 mt-4">
          <h2 className="font-semibold text-[#0f2547] mb-3">Possible Indicators Detected</h2>
          <p className="text-xs text-slate-500 italic mb-3">
            These are prototype-generated possible indicators and are NOT a clinical diagnosis.
          </p>
          <ul className="space-y-2">
            {caseData.indicators.map((ind: string) => (
              <li key={ind} className="flex items-center gap-2 text-sm text-slate-700">
                <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0" />
                {ind}
              </li>
            ))}
          </ul>
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm font-medium text-[#0f2547]">Recommended Support Pathway</p>
            <p className="text-sm text-slate-600 mt-1">{caseData.recommendedSupport}</p>
          </div>
        </Card>

        {/* Assessment history */}
        <Card className="p-6 mt-4">
          <h2 className="font-semibold text-[#0f2547] mb-3 flex items-center gap-2">
            <Clock size={16} className="text-cyan-600" />
            Assessment History
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 pr-4 text-xs text-slate-500">Date</th>
                  <th className="text-left py-2 pr-4 text-xs text-slate-500">SVI</th>
                  <th className="text-left py-2 text-xs text-slate-500">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {caseData.history.map((h: any, i: number) => (
                  <tr key={i}>
                    <td className="py-2 pr-4 text-slate-600">{h.date}</td>
                    <td className="py-2 pr-4 font-semibold text-slate-700">{h.svi}</td>
                    <td className="py-2">
                      <RiskBadge risk={h.risk} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Counsellor actions */}
        <Card className="p-6 mt-4">
          <h2 className="font-semibold text-[#0f2547] mb-4 flex items-center gap-2">
            <UserCheck size={16} className="text-cyan-600" />
            Counsellor Actions
          </h2>
          <div className="space-y-4">
            <Select
              label="Assign / Reassign Counsellor"
              value={assignedCounsellor}
              onChange={(e) => setAssignedCounsellor(e.target.value)}
              options={[
                { value: 'Dr. Priya Sharma', label: 'Dr. Priya Sharma' },
                { value: 'Dr. Arjun Mehta', label: 'Dr. Arjun Mehta' },
                { value: 'Unassigned', label: 'Unassigned' },
              ]}
            />
            <TextArea
              label="Case notes (visible to authorized staff only)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add professional notes about this case..."
            />
            <div className="flex gap-3">
              <Button onClick={handleSave}>Save Changes</Button>
              <Button variant="outline">
                <Calendar size={14} /> Schedule Follow-up
              </Button>
            </div>
          </div>
        </Card>

        <Alert type="warning" className="mt-4 text-xs">
          <strong>Data Access Notice:</strong> You are viewing case information as an authorized support professional. This information is confidential. Do not share or disclose outside authorized channels.
        </Alert>
      </div>
    </div>
  );
}
