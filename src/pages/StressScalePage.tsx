/**
 * SafeSense AI — Stress Scale Page
 * Simple 0-10 stress scale with natural conversational AI responses
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { Navbar } from '../components/Layout';
import { Card, Button } from '../components/ui';
import { useLanguage } from '../context/LanguageContext';
import { getStressScaleResponse } from '../lib/conversationalAI';
import type { Language } from '../types';
import clsx from 'clsx';

const SCALE_LABELS: Record<Language, Record<string, string>> = {
  en: {
    title: 'How stressed are you feeling right now?',
    subtitle: 'Tap a number to let us know. This takes less than a minute.',
    very_calm: 'Very Calm',
    low: 'Low',
    mild: 'Mild',
    moderate: 'Moderate',
    high: 'High',
    very_high: 'Very High',
    talkPrompt: 'Want to talk about it?',
    chatBtn: 'Chat with SafeSense',
    dashBtn: 'Go to Dashboard',
    checkInBtn: 'Daily Check-In',
  },
  hi: {
    title: 'अभी आप कितना तनाव महसूस कर रहे हैं?',
    subtitle: 'एक नंबर टैप करें। इसमें एक मिनट से कम लगेगा।',
    very_calm: 'बहुत शांत',
    low: 'कम',
    mild: 'हल्का',
    moderate: 'मध्यम',
    high: 'अधिक',
    very_high: 'बहुत अधिक',
    talkPrompt: 'इस बारे में बात करना चाहेंगे?',
    chatBtn: 'SafeSense से बात करें',
    dashBtn: 'Dashboard पर जाएँ',
    checkInBtn: 'Daily Check-In',
  },
  mr: {
    title: 'तुम्हाला आत्ता किती ताण जाणवत आहे?',
    subtitle: 'एक नंबर टॅप करा. यासाठी एक मिनिटापेक्षा कमी वेळ लागेल.',
    very_calm: 'खूप शांत',
    low: 'कमी',
    mild: 'सौम्य',
    moderate: 'मध्यम',
    high: 'जास्त',
    very_high: 'खूप जास्त',
    talkPrompt: 'याबद्दल बोलायचे आहे का?',
    chatBtn: 'SafeSense शी बोला',
    dashBtn: 'Dashboard वर जा',
    checkInBtn: 'Daily Check-In',
  },
};

function getScaleLabelKey(level: number): string {
  if (level <= 1) return 'very_calm';
  if (level <= 3) return 'low';
  if (level <= 4) return 'mild';
  if (level <= 6) return 'moderate';
  if (level <= 8) return 'high';
  return 'very_high';
}

function getScaleColor(level: number): string {
  if (level <= 2) return 'bg-emerald-500';
  if (level <= 4) return 'bg-teal-500';
  if (level <= 6) return 'bg-amber-500';
  if (level <= 8) return 'bg-orange-500';
  return 'bg-red-500';
}

function getScaleBgColor(level: number): string {
  if (level <= 2) return 'bg-emerald-50 border-emerald-200';
  if (level <= 4) return 'bg-teal-50 border-teal-200';
  if (level <= 6) return 'bg-amber-50 border-amber-200';
  if (level <= 8) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
}

export default function StressScalePage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [selected, setSelected] = useState<number | null>(null);
  const lang = language as Language;
  const t = SCALE_LABELS[lang] ?? SCALE_LABELS.en;

  const aiResponse = selected !== null ? getStressScaleResponse(selected, language) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#0f2547] mb-2">{t.title}</h1>
          <p className="text-slate-500 text-sm">{t.subtitle}</p>
        </div>

        {/* Scale */}
        <Card className="p-6 mb-5">
          {/* Scale labels */}
          <div className="flex justify-between text-xs text-slate-400 mb-2 px-1">
            <span>{t.very_calm}</span>
            <span>{t.moderate}</span>
            <span>{t.very_high}</span>
          </div>

          {/* Number buttons */}
          <div className="flex gap-1.5 justify-between mb-4">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <button
                key={n}
                onClick={() => setSelected(n)}
                className={clsx(
                  'flex-1 h-12 rounded-lg text-sm font-bold transition-all',
                  selected === n
                    ? `${getScaleColor(n)} text-white scale-110 shadow-md`
                    : n <= 2 ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    : n <= 4 ? 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200'
                    : n <= 6 ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                    : n <= 8 ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                )}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Selected label */}
          {selected !== null && (
            <div className="text-center">
              <span className={clsx(
                'inline-block px-4 py-1.5 rounded-full text-sm font-semibold border',
                getScaleBgColor(selected)
              )}>
                {selected}/10 · {t[getScaleLabelKey(selected) as keyof typeof t]}
              </span>
            </div>
          )}
        </Card>

        {/* AI Response */}
        {aiResponse && (
          <div className="mb-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-[#0f2547] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-cyan-300 text-xs font-bold">AI</span>
              </div>
              <div className={clsx(
                'flex-1 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed border',
                getScaleBgColor(selected!)
              )}>
                {aiResponse}
              </div>
            </div>
          </div>
        )}

        {/* Actions after selection */}
        {selected !== null && (
          <div className="space-y-3">
            <p className="text-center text-sm text-slate-500">{t.talkPrompt}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                fullWidth
                onClick={() => navigate('/chat')}
                className="flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} />
                {t.chatBtn}
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => navigate('/checkin')}
                className="flex items-center justify-center gap-2"
              >
                {t.checkInBtn}
              </Button>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full text-sm text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 py-2"
            >
              {t.dashBtn} <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
