/**
 * SafeSense AI — User Dashboard
 * Clean, personalized welcome with stress scale access, daily check-in, and quick actions.
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageCircle, ArrowRight, BarChart2, Calendar,
  TrendingUp, CheckCircle, Activity, Gauge,
} from 'lucide-react';
import { Navbar } from '../components/Layout';
import { Card, Button } from '../components/ui';
import { SVIMeter } from '../components/SVIMeter';
import { useAuth } from '../context/AuthContext';
import { apiGetMyAssessments, apiGetProgress, apiGetTodayCheckIn } from '../lib/apiClient';
import { localDb } from '../lib/localDb';
import type { RiskCategory } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { COMMON_TEXT } from '../lib/translations';
import { useLanguage } from '../context/LanguageContext';
import { SakhaIllustration } from '../components/SakhaIllustration';

function getHourGreeting(name?: string) {
  const hour = new Date().getHours();
  const first = name?.split(' ')[0] ?? '';
  if (hour < 12) return `Good morning${first ? `, ${first}` : ''}`;
  if (hour < 17) return `Good afternoon${first ? `, ${first}` : ''}`;
  return `Good evening${first ? `, ${first}` : ''}`;
}

export default function UserDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const copy = COMMON_TEXT[language];
  const [assessments, setAssessments] = useState<any[]>([]);
  const [sviTrend, setSviTrend] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [todayCheckIn, setTodayCheckIn] = useState<any>(null);
  const [checkInHistory, setCheckInHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL;
        if (API_URL && localStorage.getItem('safesense_token')) {
          const [assmts, progress, todayCI] = await Promise.allSettled([
            apiGetMyAssessments(),
            apiGetProgress(),
            apiGetTodayCheckIn(),
          ]);

          if (assmts.status === 'fulfilled') setAssessments(assmts.value);
          if (progress.status === 'fulfilled') {
            setSviTrend(progress.value.svi_trend ?? []);
            setStats(progress.value.stats ?? {});
          }
          if (todayCI.status === 'fulfilled') {
            setCheckedInToday(todayCI.value.checked_in_today);
            if (todayCI.value.data) setTodayCheckIn(todayCI.value.data);
          }
          try {
            const { apiGetCheckInHistory } = await import('../lib/apiClient');
            setCheckInHistory(await apiGetCheckInHistory());
          } catch { setCheckInHistory([]); }
        } else {
          throw new Error('No API');
        }
      } catch {
        const local = localDb.getAssessments();
        setAssessments(local);
        const svi = local.map((a, i) => ({ name: `A${i + 1}`, date: a.date, svi: a.svi, risk: a.risk }));
        setSviTrend(svi);
        setStats({ total_assessments: local.length, total_checkins: localDb.getCheckInHistory().length });
        const ci = localDb.getTodayCheckIn();
        setCheckInHistory(localDb.getCheckInHistory());
        setCheckedInToday(!!ci);
        if (ci) setTodayCheckIn(ci);
      } finally {
        setIsLoading(false);
      }
    };
    loadAll();
  }, []);

  const latestAssessment = assessments[0];
  const latestConversation = localDb.getLatestConversationSnapshot();
  const currentStress = latestConversation?.score ?? latestAssessment?.svi ?? null;
  const chartData = [
    ...sviTrend.map((s, i) => ({ name: s.date ?? `A${i + 1}`, SVI: s.svi })),
    ...(latestConversation ? [{ name: 'Chat estimate', SVI: latestConversation.score }] : []),
  ];
  const moodHistory = checkInHistory.slice().reverse();
  const latestStress = currentStress ?? (todayCheckIn ? todayCheckIn.stress_level * 20 : null);
  const latestResult = latestAssessment?.result;
  const detectedEmotion = latestResult?.emotionSignals
    ? Object.entries(latestResult.emotionSignals)
      .filter(([key, value]) => key.endsWith('_signal') && Number(value) > 0.35)
      .map(([key]) => key.replace('_signal', '').replace('_', ' '))[0]
    : null;
  const insight = todayCheckIn?.stress_level >= 4
    ? 'Your stress feels higher today. A short pause or a conversation may help you feel less alone.'
    : checkInHistory.length >= 2 && checkInHistory[0].stress_level < checkInHistory[1].stress_level
      ? 'Your reported stress has been lower recently. That is a positive change worth noticing.'
      : 'A small check-in gives you a clearer picture of how your wellbeing is changing.';

  const RISK_COLORS: Record<RiskCategory, string> = {
    LOW: '#22c55e', MODERATE: '#eab308', HIGH: '#f97316', CRITICAL: '#ef4444',
  };

  const MOOD_EMOJIS = ['', '😔', '😟', '😐', '🙂', '😊'];
  const STRESS_LABELS = ['', 'Very Calm', 'Calm', 'Moderate', 'Stressed', 'Very Stressed'];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Personalized greeting */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0f2547]">
            {getHourGreeting(user?.name)} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {checkedInToday
              ? "You've already checked in today. Here's your overview."
              : "How are you feeling today? Take a moment to check in."}
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-[#d5eaf5] bg-white p-4 mb-5 shadow-sm">
          <SakhaIllustration compact />
          <div>
            <p className="font-semibold text-[#123b68]">Sakha is here for you.</p>
            <p className="text-sm text-slate-500 mt-1">Talk through today, check in again, or look back at your progress.</p>
          </div>
          <Button size="sm" className="ml-auto hidden sm:inline-flex" onClick={() => navigate('/chat')}>
            Talk to Sakha
          </Button>
        </div>

        {/* Check-in prompt or today's snapshot */}
        {!checkedInToday ? (
          <div className="bg-gradient-to-r from-[#0f2547] to-[#1a3a6b] rounded-2xl p-5 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-semibold text-white text-base mb-1">How are you feeling today?</p>
              <p className="text-blue-200 text-sm">A quick check-in takes under 2 minutes.</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button size="sm" variant="secondary" onClick={() => navigate('/checkin')}>
                <CheckCircle size={14} /> Check In
              </Button>
            </div>
          </div>
        ) : (
          todayCheckIn && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-green-800 font-semibold text-sm">Today's check-in complete</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Mood', val: MOOD_EMOJIS[todayCheckIn.mood] ?? '—' },
                  { label: 'Stress', val: STRESS_LABELS[todayCheckIn.stress_level] ?? '—' },
                  { label: 'Energy', val: todayCheckIn.energy ?? '—' },
                  { label: 'Sleep', val: todayCheckIn.sleep_quality ?? '—' },
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <div className="text-lg">{item.val}</div>
                    <div className="text-xs text-slate-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Quick actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { icon: <MessageCircle size={20} />, label: 'Chat', path: '/chat', color: 'bg-blue-600' },
                { icon: <MessageCircle size={20} />, label: 'Talk to Sakha', path: '/chat', color: 'bg-cyan-600' },
                { icon: <Gauge size={20} />, label: 'Stress Scale', path: '/stress-scale', color: 'bg-purple-600' },
                { icon: <TrendingUp size={20} />, label: 'Progress', path: '/progress', color: 'bg-orange-600' },
              ].map(item => (
                <button key={item.path} onClick={() => navigate(item.path)}
                  className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
                  <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center text-white`}>
                    {item.icon}
                  </div>
                  <span className="text-xs font-medium text-slate-700 text-center">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Assessments', value: stats.total_assessments ?? assessments.length, icon: <Activity size={15} />, color: 'bg-blue-50 text-blue-600' },
                { label: 'Check-ins', value: stats.total_checkins ?? 0, icon: <Calendar size={15} />, color: 'bg-green-50 text-green-600' },
                { label: 'Current stress', value: currentStress ?? '—', icon: <TrendingUp size={15} />, color: 'bg-orange-50 text-orange-600' },
                { label: 'Streak', value: `${stats.checkin_streak ?? 0}d`, icon: <CheckCircle size={15} />, color: 'bg-cyan-50 text-cyan-600' },
              ].map(item => (
                <Card key={item.label} className="p-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 ${item.color}`}>{item.icon}</div>
                  <div className="text-xl font-bold text-[#0f2547]">{item.value}</div>
                  <div className="text-xs text-slate-400">{item.label}</div>
                </Card>
              ))}
            </div>

            {/* Latest assessment */}
            {latestAssessment ? (
              <div className="grid sm:grid-cols-3 gap-4 mb-5">
                <button onClick={() => navigate('/progress')} className="text-left col-span-1">
                  <Card className="p-5 h-full hover:border-cyan-300 hover:shadow-md transition-all">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3">Current wellbeing indicator</p>
                    <SVIMeter score={currentStress ?? latestAssessment.svi} risk={(latestConversation?.risk ?? latestAssessment.risk ?? 'LOW') as RiskCategory} />
                    {latestConversation && <p className="text-[11px] text-slate-400 mt-2">Conversation-based estimate</p>}
                  </Card>
                </button>
                <Card className="p-5 sm:col-span-2">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Latest Assessment</p>
                  <p className="text-xs text-slate-300 mb-3">{latestAssessment.date}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Risk level</span>
                      <span className="font-semibold" style={{ color: RISK_COLORS[(latestConversation?.risk ?? latestAssessment.risk) as RiskCategory] }}>
                        {(latestConversation?.risk ?? latestAssessment.risk) === 'LOW' ? 'Low — things seem manageable'
                          : (latestConversation?.risk ?? latestAssessment.risk) === 'MODERATE' ? 'Moderate — some stress indicators'
                            : (latestConversation?.risk ?? latestAssessment.risk) === 'HIGH' ? 'High — significant stress detected'
                              : 'Critical — please seek support'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {detectedEmotion && <span className="rounded-full bg-[#f3f2fb] px-3 py-1 text-xs text-slate-700">Possible feeling: {detectedEmotion}</span>}
                      {latestResult?.supportRisk && <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs text-cyan-800">{latestResult.supportRisk.replaceAll('_', ' ')}</span>}
                      {latestResult?.traumaIndicator && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-800">Possible trauma-related distress indicator</span>}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Link to="/support" className="inline-flex items-center gap-1 text-sm text-[#0f2547] hover:text-cyan-600">
                      Get Support <ArrowRight size={14} />
                    </Link>
                    <button onClick={() => navigate('/assessment')} className="ml-auto text-xs text-slate-400 hover:text-slate-600">
                      Retake Assessment
                    </button>
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="p-8 mb-5 text-center">
                <Activity size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 mb-3 text-sm">No assessments yet. Start your first assessment to see your wellbeing overview.</p>
                <Button onClick={() => navigate('/assessment')} size="sm">Start Assessment</Button>
              </Card>
            )}

            {latestConversation && (
              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                <Card className="p-5 border-l-4 border-l-cyan-500">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Sakha&apos;s note</p>
                  <p className="text-sm leading-relaxed text-slate-700">{latestConversation.note}</p>
                  <p className="text-xs text-slate-400 mt-3">Latest chat estimate: {latestConversation.previousScore} → {latestConversation.score}. This is not a medical measurement.</p>
                </Card>
                <Card className="p-5 bg-[#f4fbfe] border-[#cfe8f2]">
                  <p className="text-xs text-[#1689b0] uppercase tracking-wider mb-2">A thought from Sakha</p>
                  <p className="text-sm leading-relaxed text-[#315873]">{latestConversation.thought}</p>
                </Card>
              </div>
            )}

            {assessments.length > 0 && (
              <Card className="p-5 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-semibold text-[#0f2547]">Assessment history</h2>
                    <p className="text-xs text-slate-400 mt-1">Your wellbeing indicators over time</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate('/assessment')}>Check Again</Button>
                </div>
                <div className="space-y-2">
                  {assessments.slice(0, 5).map((assessment: any) => (
                    <div key={assessment.id ?? assessment.date} className="flex items-center justify-between border-t border-slate-100 pt-2 text-sm">
                      <span className="text-slate-500">{assessment.date}</span>
                      <span className="font-semibold text-[#123b68]">Stress {assessment.svi}</span>
                      <span className="text-xs text-slate-500">{assessment.risk}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* SVI Trend */}
            {chartData.length > 1 ? (
              <Card className="p-5 mb-5">
                <h2 className="font-semibold text-[#0f2547] flex items-center gap-2 mb-1 text-sm">
                  <BarChart2 size={16} className="text-cyan-600" /> Stress Trend
                </h2>
                <p className="text-xs text-slate-400 mb-4">Assessment scores and conversation-based estimates. Lower is better.</p>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                      <Tooltip formatter={(v: any) => [`SVI: ${v}`]} />
                      <Line type="monotone" dataKey="SVI" stroke="#1689b0" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            ) : (
              <Card className="p-6 mb-5 text-center border-dashed">
                <TrendingUp size={28} className="mx-auto text-cyan-500 mb-2" />
                <h2 className="font-semibold text-[#0f2547]">{copy.noDataTitle}</h2>
                <p className="text-sm text-slate-500 mt-1 mb-4">{copy.noDataBody}</p>
                <Button size="sm" onClick={() => navigate('/checkin')}>
                  <CheckCircle size={14} /> {copy.startCheckIn}
                </Button>
              </Card>
            )}

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <button onClick={() => navigate('/checkin')} className="text-left">
                <Card className="p-5 h-full hover:border-cyan-300 hover:shadow-md transition-all">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Mood Trend</p>
                  {moodHistory.length ? (
                    <div className="flex items-center gap-2 text-2xl">
                      {moodHistory.slice(-7).map((entry, i) => (
                        <span key={`${entry.date}-${i}`} title={entry.date}>{MOOD_EMOJIS[entry.mood] ?? '—'}</span>
                      ))}
                    </div>
                  ) : <p className="text-sm text-slate-500">Complete a check-in to see your mood over time.</p>}
                </Card>
              </button>
              <Card className="p-5">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Today&apos;s Insight</p>
                <p className="text-sm leading-relaxed text-slate-700">{insight}</p>
                <p className="text-xs text-cyan-700 mt-3">
                  Something you could try: {latestStress !== null && latestStress >= 50
                    ? 'take a short break and talk with someone you trust.'
                    : 'keep noticing your sleep, energy, and mood.'}
                </p>
              </Card>
            </div>

            {/* Talk to Sakha CTA */}
            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <button onClick={() => navigate('/chat')}
                className="flex items-center gap-4 p-5 bg-[#0f2547] text-white rounded-xl hover:bg-[#1a3a6b] transition-colors text-left">
                <MessageCircle size={24} className="text-cyan-300 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Talk to Sakha</p>
                  <p className="text-blue-200 text-xs mt-0.5">Text-based conversation</p>
                </div>
              </button>
              <button onClick={() => navigate('/chat')}
                className="flex items-center gap-4 p-5 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors text-left">
                <MessageCircle size={24} className="text-white flex-shrink-0" />
                <div>
                  <p className="font-semibold">Talk with voice or text</p>
                  <p className="text-cyan-100 text-xs mt-0.5">Sakha listens either way</p>
                </div>
              </button>
            </div>
          </>
        )}

        <p className="text-center text-xs text-slate-400 mt-4">
          SafeSense AI — supportive guidance, not a medical service
        </p>
      </div>
    </div>
  );
}
