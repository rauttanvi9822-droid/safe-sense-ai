import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Languages, MessageCircle, Mic, ChevronRight, X, Check } from 'lucide-react';
import { Navbar } from '../components/Layout';
import { Button, Card, Alert } from '../components/ui';
import type { Language, OnboardingState } from '../types';
import clsx from 'clsx';

const LANGUAGES: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
];

export default function AssessmentOnboardingPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<OnboardingState>({
    consentGiven: false,
    language: 'en',
    interactionMode: 'text',
    step: 'consent',
  });
  const [consentChecked, setConsentChecked] = useState(false);

  const goNext = () => {
    const steps: OnboardingState['step'][] = ['consent', 'language', 'mode', 'assessment'];
    const idx = steps.indexOf(state.step);
    if (idx < steps.length - 1) {
      setState((s) => ({ ...s, step: steps[idx + 1] }));
    } else {
      // Start assessment
      sessionStorage.setItem('assessment_onboarding', JSON.stringify(state));
      navigate('/assessment/chat');
    }
  };

  const stepNumber = { consent: 1, language: 2, mode: 3, assessment: 4 }[state.step];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {['Privacy & Consent', 'Language', 'Communication Mode'].map((label, i) => (
            <React.Fragment key={label}>
              <div className="flex items-center gap-2">
                <div
                  className={clsx(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                    i + 1 < stepNumber
                      ? 'bg-green-500 text-white'
                      : i + 1 === stepNumber
                      ? 'bg-[#0f2547] text-white'
                      : 'bg-slate-200 text-slate-400'
                  )}
                >
                  {i + 1 < stepNumber ? <Check size={14} /> : i + 1}
                </div>
                <span className={clsx('text-xs hidden sm:block', i + 1 === stepNumber ? 'text-[#0f2547] font-semibold' : 'text-slate-400')}>
                  {label}
                </span>
              </div>
              {i < 2 && <div className={clsx('flex-1 h-0.5', i + 1 < stepNumber ? 'bg-green-400' : 'bg-slate-200')} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step: Consent */}
        {state.step === 'consent' && (
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#0f2547] rounded-lg flex items-center justify-center">
                <Lock size={20} className="text-cyan-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0f2547]">Privacy & Consent</h1>
                <p className="text-sm text-slate-500">Please read before continuing</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-600 leading-relaxed mb-6">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">Why information is collected</h3>
                  <p>The questions asked during this assessment help identify possible indicators of stress, distress, or vulnerability so that appropriate human support can be arranged.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">How AI analysis is used</h3>
                  <p>A prototype AI engine analyses the text of your responses to produce an indicative Stress Vulnerability Index (SVI). This is a screening tool only — not a medical assessment.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">What information may be stored</h3>
                  <p>Your responses and assessment results may be stored and reviewed by authorized support professionals. This prototype does not guarantee complete data privacy — only authorized personnel should have access in a production system.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">Human review</h3>
                  <p>All assessments at Moderate risk or above will be reviewed by a trained counsellor or support professional. AI results alone do not determine any action.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">Your control</h3>
                  <p>You may exit this assessment at any time using the Exit button. You are not required to answer any question you are not comfortable with.</p>
                </div>
              </div>

              <Alert type="disclaimer">
                <strong>This is not a medical or psychiatric assessment.</strong> SAFE-SENSE AI provides support-screening guidance only. It does not diagnose any condition.
              </Alert>
            </div>

            <label className="flex items-start gap-3 cursor-pointer mb-6">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#0f2547] focus:ring-[#0f2547]"
              />
              <span className="text-sm text-slate-700">
                I understand how my information may be used for this assessment, and I consent to proceed.
              </span>
            </label>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/')}>
                <X size={16} /> Exit
              </Button>
              <Button disabled={!consentChecked} onClick={goNext} className="flex-1">
                Continue <ChevronRight size={16} />
              </Button>
            </div>
          </Card>
        )}

        {/* Step: Language */}
        {state.step === 'language' && (
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#0f2547] rounded-lg flex items-center justify-center">
                <Languages size={20} className="text-cyan-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0f2547]">Choose your preferred language</h1>
                <p className="text-sm text-slate-500">Select the language you are most comfortable with</p>
              </div>
            </div>
            <div className="grid gap-3 mb-8">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setState((s) => ({ ...s, language: lang.code }))}
                  className={clsx(
                    'flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all',
                    state.language === lang.code
                      ? 'border-[#0f2547] bg-[#0f2547]/5'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <div>
                    <div className="font-semibold text-[#0f2547]">{lang.nativeLabel}</div>
                    <div className="text-sm text-slate-500">{lang.label}</div>
                  </div>
                  {state.language === lang.code && (
                    <div className="w-6 h-6 bg-[#0f2547] rounded-full flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <Alert type="info" className="mb-6 text-xs">
              Additional Indian language options will be available in future versions.
            </Alert>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setState((s) => ({ ...s, step: 'consent' }))}>← Back</Button>
              <Button onClick={goNext} className="flex-1">Continue <ChevronRight size={16} /></Button>
            </div>
          </Card>
        )}

        {/* Step: Mode */}
        {state.step === 'mode' && (
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#0f2547] rounded-lg flex items-center justify-center">
                <MessageCircle size={20} className="text-cyan-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0f2547]">How would you like to communicate?</h1>
                <p className="text-sm text-slate-500">Choose the method most comfortable for you</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => setState((s) => ({ ...s, interactionMode: 'text' }))}
                className={clsx(
                  'p-6 rounded-xl border-2 text-left transition-all',
                  state.interactionMode === 'text'
                    ? 'border-[#0f2547] bg-[#0f2547]/5'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <MessageCircle size={32} className="text-cyan-600 mb-3" />
                <h3 className="font-bold text-[#0f2547] mb-1">Text / Chat</h3>
                <p className="text-sm text-slate-500">Type your responses in a private chat interface.</p>
              </button>
              <button
                onClick={() => setState((s) => ({ ...s, interactionMode: 'voice' }))}
                className={clsx(
                  'p-6 rounded-xl border-2 text-left transition-all',
                  state.interactionMode === 'voice'
                    ? 'border-[#0f2547] bg-[#0f2547]/5'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <Mic size={32} className="text-cyan-600 mb-3" />
                <h3 className="font-bold text-[#0f2547] mb-1">Voice</h3>
                <p className="text-sm text-slate-500">Speak your responses using your microphone.</p>
                <span className="inline-block mt-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Prototype — transcription only</span>
              </button>
            </div>
            {state.interactionMode === 'voice' && (
              <Alert type="warning" className="mb-6 text-xs">
                Voice emotion analysis is not clinically accurate in this prototype. Voice input will be transcribed to text for assessment.
              </Alert>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setState((s) => ({ ...s, step: 'language' }))}>← Back</Button>
              <Button onClick={goNext} className="flex-1">Begin Assessment <ChevronRight size={16} /></Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
