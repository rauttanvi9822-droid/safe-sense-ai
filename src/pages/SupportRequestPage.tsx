/**
 * SafeSense AI — Support Request & Escalation Page
 */
import { useState, useEffect } from 'react';
import { HeartHandshake, Phone, Users, Calendar, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Layout';
import { Card, Alert, Button } from '../components/ui';
import { apiCreateSupportRequest, apiGetMySupportRequests, apiRequestFollowUp, apiGetMyFollowUps } from '../lib/apiClient';
import { localDb } from '../lib/localDb';
import type { StoredSupportRequest, StoredFollowUp } from '../lib/localDb';
import clsx from 'clsx';

const REQUEST_TYPES = [
  { id: 'counsellor', label: 'Request a Counsellor', icon: <HeartHandshake size={20} />, color: 'bg-blue-50 border-blue-200 text-blue-700', desc: 'Connect with a trained support professional.' },
  { id: 'trusted_person', label: 'Contact Trusted Person', icon: <Users size={20} />, color: 'bg-green-50 border-green-200 text-green-700', desc: 'Reach out to someone you trust.' },
  { id: 'follow_up', label: 'Schedule Follow-Up', icon: <Calendar size={20} />, color: 'bg-purple-50 border-purple-200 text-purple-700', desc: 'Arrange a follow-up session.' },
  { id: 'emergency', label: 'Emergency Resources', icon: <Phone size={20} />, color: 'bg-red-50 border-red-200 text-red-700', desc: 'View emergency contacts and safety resources.' },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-amber-600 bg-amber-50' },
  assigned: { label: 'Assigned', color: 'text-blue-600 bg-blue-50' },
  contacted: { label: 'Contacted', color: 'text-cyan-600 bg-cyan-50' },
  resolved: { label: 'Resolved', color: 'text-green-600 bg-green-50' },
};

function uid() { return Math.random().toString(36).slice(2); }

export default function SupportRequestPage() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requests, setRequests] = useState<StoredSupportRequest[]>([]);
  const [followUps, setFollowUps] = useState<StoredFollowUp[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      if (API_URL && localStorage.getItem('safesense_token')) {
        const [reqs, fus] = await Promise.all([apiGetMySupportRequests(), apiGetMyFollowUps()]);
        setRequests(reqs.map(r => ({
          id: r.id, type: r.request_type, message: r.message,
          status: r.status, created_at: r.created_at, assessment_id: r.assessment_id,
        })));
        setFollowUps(fus.map(f => ({
          id: f.id, scheduled_date: f.scheduled_date, completed: f.completed,
          notes: f.notes, assessment_id: f.assessment_id,
        })));
        return;
      }
    } catch {}
    // Local fallback
    setRequests(localDb.getSupportRequests());
    setFollowUps(localDb.getFollowUps());
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async () => {
    if (!selectedType) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL;

      if (selectedType === 'emergency') {
        navigate('/resources');
        return;
      }

      if (selectedType === 'follow_up') {
        if (API_URL && localStorage.getItem('safesense_token')) {
          await apiRequestFollowUp(undefined, message || undefined);
        } else {
          localDb.addFollowUp({ id: uid(), scheduled_date: '', completed: false, notes: message });
        }
      } else {
        if (API_URL && localStorage.getItem('safesense_token')) {
          await apiCreateSupportRequest(selectedType, message || undefined);
        } else {
          const req: StoredSupportRequest = {
            id: uid(), type: selectedType, message,
            status: 'pending', created_at: new Date().toISOString(),
          };
          localDb.addSupportRequest(req);
        }
      }

      setSubmitted(true);
      setMessage('');
      setSelectedType(null);
      loadData();
    } catch (e: any) {
      setError(e.message ?? 'Could not submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0f2547] flex items-center gap-2">
            <HeartHandshake size={22} className="text-cyan-600" />
            Support & Escalation
          </h1>
          <p className="text-slate-500 text-sm mt-1">Request human support or schedule a follow-up.</p>
        </div>

        <Alert type="warning" className="mb-5 text-sm">
          <strong>If you are in immediate danger,</strong> please contact emergency services directly.
          This platform is not an emergency service and cannot dispatch assistance.
        </Alert>

        {submitted && (
          <Alert type="success" className="mb-4">
            <CheckCircle size={14} className="inline mr-1" />
            Your request has been submitted. A support professional will follow up.
          </Alert>
        )}
        {error && <Alert type="error" className="mb-4">{error}</Alert>}

        {/* Request type selection */}
        <Card className="p-5 mb-5">
          <h2 className="font-semibold text-[#0f2547] mb-3">What kind of support do you need?</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {REQUEST_TYPES.map(rt => (
              <button
                key={rt.id}
                onClick={() => setSelectedType(rt.id)}
                className={clsx(
                  'p-4 rounded-xl border-2 text-left transition-all',
                  selectedType === rt.id
                    ? 'border-[#0f2547] bg-[#0f2547]/5'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center mb-2 border', rt.color)}>
                  {rt.icon}
                </div>
                <p className="font-medium text-sm text-[#0f2547]">{rt.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{rt.desc}</p>
              </button>
            ))}
          </div>

          {selectedType && selectedType !== 'emergency' && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Additional message <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Tell us a bit about what you need…"
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0f2547] focus:border-transparent"
                />
              </div>
              <Button fullWidth onClick={handleSubmit} loading={isSubmitting}>
                Submit Request
              </Button>
            </div>
          )}
          {selectedType === 'emergency' && (
            <div className="mt-4">
              <Button variant="danger" fullWidth onClick={() => navigate('/resources')}>
                <Phone size={16} /> View Emergency Resources
              </Button>
            </div>
          )}
        </Card>

        {/* Previous requests */}
        {requests.length > 0 && (
          <Card className="mb-5">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-[#0f2547]">My Support Requests</h2>
              <button onClick={loadData} className="text-slate-400 hover:text-[#0f2547]"><RefreshCw size={14} /></button>
            </div>
            <div className="divide-y divide-slate-100">
              {requests.map(r => {
                const s = STATUS_LABELS[r.status] ?? STATUS_LABELS.pending;
                return (
                  <div key={r.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700 capitalize">{r.type.replace('_', ' ')}</p>
                      {r.message && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{r.message}</p>}
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(r.created_at).toLocaleString()}</p>
                    </div>
                    <span className={clsx('text-xs font-medium px-2.5 py-1 rounded-full', s.color)}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Follow-ups */}
        {followUps.length > 0 && (
          <Card>
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-[#0f2547]">Follow-Ups</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {followUps.map(f => (
                <div key={f.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {f.completed ? <CheckCircle size={14} className="text-green-500" /> : <Clock size={14} className="text-amber-500" />}
                    <div>
                      <p className="text-sm text-slate-700">
                        {f.scheduled_date || 'Scheduled'} · {f.completed ? 'Completed' : 'Pending'}
                      </p>
                      {f.notes && <p className="text-xs text-slate-400">{f.notes}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
