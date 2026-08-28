/**
 * SafeSense AI — Daily Check-In Page
 * Records mood, stress, energy, sleep and optional notes each day.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, Sun, Moon, Battery, BedDouble } from 'lucide-react';
import { Navbar } from '../components/Layout';
import { Card, Alert, Button } from '../components/ui';
import { apiSubmitCheckIn, apiGetTodayCheckIn } from '../lib/apiClient';
import { localDb } from '../lib/localDb';
import type { StoredCheckIn } from '../lib/localDb';
import clsx from 'clsx';

interface CheckInForm {
  mood: number;
  stress_level: number;
  energy: string;
  sleep_quality: string;
  support_needed: boolean;
  notes: string;
}

const DEFAULT_FORM: CheckInForm = {
  mood: 3,
  stress_level: 3,
  energy: 'okay',
  sleep_quality: 'okay',
  support_needed: false,
  notes: '',
};

const MOOD_LABELS = ['', '😔 Very Low', '😟 Low', '😐 Okay', '🙂 Good', '😊 Great'];
const STRESS_LABELS = ['', 'Very Calm', 'Calm', 'Moderate', 'Stressed', 'Very Stressed'];
const MOOD_EMOJIS = ['', '😔', '😟', '😐', '🙂', '😊'];

const ENERGY_OPTIONS = [
  { value: 'low', label: 'Low', emoji: '🪫' },
  { value: 'okay', label: 'Okay', emoji: '🔋' },
  { value: 'good', label: 'Good', emoji: '⚡' },
  { value: 'high', label: 'High', emoji: '🌟' },
];

const SLEEP_OPTIONS = [
  { value: 'poor', label: 'Poor', emoji: '😴' },
  { value: 'okay', label: 'Okay', emoji: '🛌' },
  { value: 'good', label: 'Good', emoji: '😴✓' },
  { value: 'excellent', label: 'Excellent', emoji: '🌙✨' },
];

function ScaleSelector({
  label, icon, value, onChange, labels,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  labels: string[];
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        {icon}
        <span>{label}</span>
        <span className="ml-auto text-slate-400 font-normal">{labels[value]}</span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(v => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={clsx(
              'flex-1 h-10 rounded-lg border-2 text-sm font-semibold transition-all flex items-center justify-center',
              value === v
                ? 'border-[#0f2547] bg-[#0f2547] text-white'
                : 'border-slate-200 hover:border-slate-300 text-slate-600'
            )}
          >
            {MOOD_EMOJIS[v]}
          </button>
        ))}
      </div>
    </div>
  );
}

function OptionSelector({
  label, icon, value, onChange, options,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; emoji: string }[];
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={clsx(
              'flex-1 py-2 rounded-lg border-2 text-xs font-medium transition-all flex flex-col items-center gap-1',
              value === opt.value
                ? 'border-[#0f2547] bg-[#0f2547] text-white'
                : 'border-slate-200 hover:border-slate-300 text-slate-600'
            )}
          >
            <span>{opt.emoji}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DailyCheckInPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<CheckInForm>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    const checkToday = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL;
        if (API_URL && localStorage.getItem('safesense_token')) {
          const res = await apiGetTodayCheckIn();
          if (res.checked_in_today && res.data) {
            setAlreadyCheckedIn(true);
            setForm({
              mood: res.data.mood ?? 3,
              stress_level: res.data.stress_level ?? 3,
              energy: res.data.energy ?? 'okay',
              sleep_quality: res.data.sleep_quality ?? 'okay',
              support_needed: res.data.support_needed ?? false,
              notes: res.data.notes ?? '',
            });
            return;
          }
        }
      } catch {}
      const local = localDb.getTodayCheckIn();
      if (local) {
        setAlreadyCheckedIn(true);
        setForm({
          mood: local.mood ?? 3,
          stress_level: local.stress_level ?? 3,
          energy: (local as any).energy ?? 'okay',
          sleep_quality: (local as any).sleep_quality ?? 'okay',
          support_needed: local.support_needed ?? false,
          notes: local.notes ?? '',
        });
      }
    };
    checkToday();
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      if (API_URL && localStorage.getItem('safesense_token')) {
        await apiSubmitCheckIn({
          mood: form.mood,
          stress_level: form.stress_level,
          safety_level: 3,
          emotional_wellbeing: 3,
          support_needed: form.support_needed,
          notes: form.notes || undefined,
        });
      }
      const local: StoredCheckIn = {
        id: `ci-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        mood: form.mood,
        stress_level: form.stress_level,
        safety_level: 3,
        emotional_wellbeing: 3,
        support_needed: form.support_needed,
        notes: form.notes || undefined,
        ...(form.energy ? { energy: form.energy } : {}),
        ...(form.sleep_quality ? { sleep_quality: form.sleep_quality } : {}),
      } as any;
      localDb.saveTodayCheckIn(local);
      setSubmitted(true);
      setAlreadyCheckedIn(true);
    } catch (e: any) {
      setError(e.message ?? 'Could not save check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#0f2547] mb-2">Check-in saved!</h1>
          <p className="text-slate-500 mb-6">Good — taking a moment to check in is a small but meaningful thing.</p>

          <Card className="p-5 mb-5 text-left">
            <h3 className="font-semibold text-[#0f2547] mb-3">Today's snapshot</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl mb-1">{MOOD_EMOJIS[form.mood]}</div>
                <div className="text-xs text-slate-500">Mood</div>
                <div className="text-xs font-medium text-slate-700">{MOOD_LABELS[form.mood]?.replace(/^[^\s]+ /, '')}</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl mb-1">{form.stress_level <= 2 ? '😌' : form.stress_level <= 3 ? '😐' : form.stress_level <= 4 ? '😟' : '😣'}</div>
                <div className="text-xs text-slate-500">Stress</div>
                <div className="text-xs font-medium text-slate-700">{STRESS_LABELS[form.stress_level]}</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl mb-1">{ENERGY_OPTIONS.find(e => e.value === form.energy)?.emoji}</div>
                <div className="text-xs text-slate-500">Energy</div>
                <div className="text-xs font-medium text-slate-700 capitalize">{form.energy}</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl mb-1">{SLEEP_OPTIONS.find(s => s.value === form.sleep_quality)?.emoji}</div>
                <div className="text-xs text-slate-500">Sleep</div>
                <div className="text-xs font-medium text-slate-700 capitalize">{form.sleep_quality}</div>
              </div>
            </div>
          </Card>

          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
            <Button variant="outline" onClick={() => navigate('/chat')}>Talk to SafeSense</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-1">
            <Calendar size={20} className="text-cyan-600" />
            <h1 className="text-2xl font-bold text-[#0f2547]">Daily Check-In</h1>
          </div>
          <p className="text-slate-500 text-sm">{today}</p>
          {alreadyCheckedIn && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full border border-blue-100">
              <CheckCircle size={11} /> Already checked in today — you can update.
            </div>
          )}
        </div>

        {error && <Alert type="error" className="mb-4">{error}</Alert>}

        <Card className="p-6 space-y-6">
          <ScaleSelector
            label="How is your mood today?"
            icon={<Sun size={16} className="text-yellow-500" />}
            value={form.mood}
            onChange={v => setForm(f => ({ ...f, mood: v }))}
            labels={MOOD_LABELS}
          />

          <ScaleSelector
            label="How stressed are you feeling?"
            icon={<Moon size={16} className="text-purple-500" />}
            value={form.stress_level}
            onChange={v => setForm(f => ({ ...f, stress_level: v }))}
            labels={STRESS_LABELS}
          />

          <OptionSelector
            label="Energy level"
            icon={<Battery size={16} className="text-green-500" />}
            value={form.energy}
            onChange={v => setForm(f => ({ ...f, energy: v }))}
            options={ENERGY_OPTIONS}
          />

          <OptionSelector
            label="How did you sleep?"
            icon={<BedDouble size={16} className="text-indigo-500" />}
            value={form.sleep_quality}
            onChange={v => setForm(f => ({ ...f, sleep_quality: v }))}
            options={SLEEP_OPTIONS}
          />

          {/* Optional notes */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Anything on your mind? <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="You don't have to write anything — but it can help to get it out."
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0f2547] focus:border-transparent"
            />
            <p className="text-xs text-slate-400 text-right">{form.notes.length}/500</p>
          </div>

          <Button fullWidth onClick={handleSubmit} loading={isSubmitting} size="lg">
            <CheckCircle size={16} />
            {alreadyCheckedIn ? 'Update Check-In' : 'Save Check-In'}
          </Button>
        </Card>

        <p className="text-xs text-slate-400 text-center mt-4">
          Your responses are stored securely and used only to track your personal progress.
        </p>
      </div>
    </div>
  );
}
