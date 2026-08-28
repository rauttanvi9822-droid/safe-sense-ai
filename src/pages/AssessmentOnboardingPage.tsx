/**
 * SafeSense AI — Assessment Onboarding
 * Simplified 3-step flow: Privacy → Language → Mode
 * Saves choices to LanguageContext (persisted) + sessionStorage (for assessment).
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Languages, MessageCircle, Mic, ChevronRight, X, Check } from 'lucide-react';
import { Navbar } from '../components/Layout';
import { Button, Card, Alert } from '../components/ui';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import type { Language, OnboardingState } from '../types';
import { localDb } from '../lib/localDb';
import clsx from 'clsx';
import { SakhaIllustration } from '../components/SakhaIllustration';

const LANGUAGES: { code: Language; label: string; nativeLabel: string; hint: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', hint: 'Continue in English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', hint: 'हिंदी में जारी रखें' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी', hint: 'मराठीत पुढे जा' },
];

const PRIVACY_TEXT = {
  en: {
    title: 'Privacy & Consent',
    subtitle: 'Please read before continuing',
    why: 'Why information is collected',
    whyBody: 'The questions asked during this assessment help identify possible indicators of stress, distress, or vulnerability so that appropriate support can be arranged.',
    how: 'How AI analysis is used',
    howBody: 'An AI engine analyses your responses to produce an indicative Stress Vulnerability Index (SVI). This is a support-screening tool only — not a medical assessment.',
    stored: 'What may be stored',
    storedBody: 'Your responses and results may be stored and reviewed by authorized support professionals. No third-party advertising access.',
    human: 'Human review',
    humanBody: 'Assessments at Moderate risk or above will be reviewed by a trained counsellor. AI results alone do not determine any action.',
    control: 'Your control',
    controlBody: 'You may exit at any time. You are not required to answer any question you are not comfortable with.',
    disclaimer: 'This is not a medical or psychiatric assessment. SAFE-SENSE AI provides support-screening guidance only.',
    consent: 'I understand how my information may be used and I consent to proceed.',
    exit: 'Exit',
    continue: 'Continue',
  },
  hi: {
    title: 'गोपनीयता और सहमति',
    subtitle: 'जारी रखने से पहले कृपया पढ़ें',
    why: 'जानकारी क्यों एकत्र की जाती है',
    whyBody: 'इस assessment के दौरान पूछे जाने वाले प्रश्न तनाव, संकट या भेद्यता के संभावित संकेतकों की पहचान करने में मदद करते हैं ताकि उचित सहायता की व्यवस्था की जा सके।',
    how: 'AI विश्लेषण का उपयोग कैसे किया जाता है',
    howBody: 'एक AI इंजन आपकी प्रतिक्रियाओं का विश्लेषण करके एक Stress Vulnerability Index (SVI) तैयार करता है। यह केवल एक सहायता-screening उपकरण है — चिकित्सीय मूल्यांकन नहीं।',
    stored: 'क्या संग्रहीत किया जा सकता है',
    storedBody: 'आपकी प्रतिक्रियाएँ और परिणाम अधिकृत सहायता पेशेवरों द्वारा संग्रहीत और समीक्षित किए जा सकते हैं।',
    human: 'मानव समीक्षा',
    humanBody: 'Moderate या उससे अधिक जोखिम वाले assessments की एक प्रशिक्षित counsellor द्वारा समीक्षा की जाएगी।',
    control: 'आपका नियंत्रण',
    controlBody: 'आप किसी भी समय बाहर निकल सकते हैं। आपको कोई भी प्रश्न उत्तर देने की ज़रूरत नहीं जिससे आप असहज महसूस करें।',
    disclaimer: 'यह कोई चिकित्सीय या मनोरोग assessment नहीं है। SAFE-SENSE AI केवल सहायता-screening मार्गदर्शन प्रदान करता है।',
    consent: 'मैं समझता/समझती हूँ कि मेरी जानकारी का उपयोग कैसे किया जा सकता है और मैं आगे बढ़ने की सहमति देता/देती हूँ।',
    exit: 'बाहर निकलें',
    continue: 'जारी रखें',
  },
  mr: {
    title: 'गोपनीयता आणि संमती',
    subtitle: 'पुढे जाण्यापूर्वी कृपया वाचा',
    why: 'माहिती का गोळा केली जाते',
    whyBody: 'या assessment दरम्यान विचारले जाणारे प्रश्न ताण, त्रास किंवा असुरक्षिततेचे संभाव्य संकेतक ओळखण्यास मदत करतात जेणेकरून योग्य आधाराची व्यवस्था केली जाऊ शकते।',
    how: 'AI विश्लेषण कसे वापरले जाते',
    howBody: 'एक AI इंजिन तुमच्या प्रतिसादांचे विश्लेषण करून Stress Vulnerability Index (SVI) तयार करतो. हे केवळ आधार-screening साधन आहे — वैद्यकीय मूल्यांकन नाही.',
    stored: 'काय साठवले जाऊ शकते',
    storedBody: 'तुमचे प्रतिसाद आणि निकाल अधिकृत आधार व्यावसायिकांकडून साठवले आणि तपासले जाऊ शकतात.',
    human: 'मानवी पुनरावलोकन',
    humanBody: 'Moderate किंवा त्यापेक्षा जास्त जोखीम असलेल्या assessments चे प्रशिक्षित counsellor कडून पुनरावलोकन केले जाईल.',
    control: 'तुमचे नियंत्रण',
    controlBody: 'तुम्ही कधीही बाहेर पडू शकता. तुम्हाला कोणत्याही प्रश्नाचे उत्तर देण्याची आवश्यकता नाही ज्याबद्दल तुम्हाला असुविधा वाटते.',
    disclaimer: 'हे वैद्यकीय किंवा मनोरोग assessment नाही. SAFE-SENSE AI केवळ आधार-screening मार्गदर्शन प्रदान करतो.',
    consent: 'मला समजते की माझी माहिती कशी वापरली जाऊ शकते आणि मी पुढे जाण्यास संमती देतो/देते.',
    exit: 'बाहेर पडा',
    continue: 'पुढे जा',
  },
};

const MODE_TEXT = {
  en: {
    title: 'How would you like to communicate?',
    subtitle: 'Choose the method most comfortable for you',
    textTitle: 'Text / Chat',
    textDesc: 'Type your responses in a private chat interface.',
    voiceTitle: 'Voice',
    voiceDesc: 'Speak your responses using your microphone. Your speech is converted to text.',
    begin: 'Begin Assessment',
    back: '← Back',
  },
  hi: {
    title: 'आप कैसे संवाद करना चाहेंगे?',
    subtitle: 'आपको जो तरीका सबसे आरामदायक लगे वह चुनें',
    textTitle: 'टेक्स्ट / चैट',
    textDesc: 'एक निजी चैट इंटरफ़ेस में अपने जवाब टाइप करें।',
    voiceTitle: 'आवाज़',
    voiceDesc: 'अपने माइक्रोफ़ोन का उपयोग करके बोलें। आपकी आवाज़ को टेक्स्ट में बदला जाएगा।',
    begin: 'Assessment शुरू करें',
    back: '← वापस',
  },
  mr: {
    title: 'तुम्हाला कसे संवाद करायचे आहे?',
    subtitle: 'तुम्हाला सर्वात आरामदायक वाटणारी पद्धत निवडा',
    textTitle: 'मजकूर / चॅट',
    textDesc: 'एका खाजगी चॅट इंटरफेसमध्ये तुमचे प्रतिसाद टाइप करा.',
    voiceTitle: 'आवाज',
    voiceDesc: 'तुमच्या मायक्रोफोन वापरून बोला. तुमचे भाषण मजकुरात रूपांतरित केले जाईल.',
    begin: 'Assessment सुरू करा',
    back: '← मागे',
  },
};

type Step = 'consent' | 'language' | 'mode';

export default function AssessmentOnboardingPage() {
  const navigate = useNavigate();
  const { language, setLanguage, setMode: setGlobalMode } = useLanguage();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('consent');
  const [consentChecked, setConsentChecked] = useState(false);
  const [selectedLang, setSelectedLang] = useState<Language>(language);
  const [selectedMode, setSelectedMode] = useState<OnboardingState['interactionMode']>('text');

  const pt = PRIVACY_TEXT[selectedLang];
  const mt = MODE_TEXT[selectedLang];

  const stepNum = { consent: 1, language: 2, mode: 3 }[step];

  const handleBeginAssessment = () => {
    // Persist language globally
    setLanguage(selectedLang);
    setGlobalMode(selectedMode);

    // Save for assessment flow
    const state: OnboardingState = {
      consentGiven: true,
      language: selectedLang,
      interactionMode: selectedMode,
      step: 'assessment',
      assessmentType: user && localDb.getAssessments().length > 0 ? 'reassessment' : 'initial',
    };
    sessionStorage.setItem('assessment_onboarding', JSON.stringify(state));
    if (!user) {
      sessionStorage.setItem('assessment_return_path', '/assessment/chat');
      navigate('/login');
      return;
    }
    navigate('/assessment/chat');
  };

  const STEPS = ['Privacy & Consent', 'Language', 'Mode'];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">

        <div className="flex items-center gap-3 mb-6 rounded-xl border border-[#d5eaf5] bg-white/80 p-3">
          <SakhaIllustration compact />
          <div>
            <p className="text-sm font-semibold text-[#123b68]">Sakha is here to listen.</p>
            <p className="text-xs text-slate-500">A gentle wellbeing check, with no right or wrong answers.</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <div className="flex items-center gap-2">
                <div className={clsx(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                  i + 1 < stepNum ? 'bg-green-500 text-white'
                    : i + 1 === stepNum ? 'bg-[#0f2547] text-white'
                      : 'bg-slate-200 text-slate-400'
                )}>
                  {i + 1 < stepNum ? <Check size={14} /> : i + 1}
                </div>
                <span className={clsx('text-xs hidden sm:block', i + 1 === stepNum ? 'text-[#0f2547] font-semibold' : 'text-slate-400')}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={clsx('flex-1 h-0.5 transition-colors', i + 1 < stepNum ? 'bg-green-400' : 'bg-slate-200')} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Consent */}
        {step === 'consent' && (
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#0f2547] rounded-lg flex items-center justify-center">
                <Lock size={20} className="text-cyan-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0f2547]">{pt.title}</h1>
                <p className="text-sm text-slate-500">{pt.subtitle}</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-600 leading-relaxed mb-6">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                {([
                  [pt.why, pt.whyBody],
                  [pt.how, pt.howBody],
                  [pt.stored, pt.storedBody],
                  [pt.human, pt.humanBody],
                  [pt.control, pt.controlBody],
                ] as [string, string][]).map(([title, body]) => (
                  <div key={title}>
                    <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
                    <p>{body}</p>
                  </div>
                ))}
              </div>
              <Alert type="disclaimer">
                <strong>{pt.disclaimer}</strong>
              </Alert>
            </div>

            <label className="flex items-start gap-3 cursor-pointer mb-6">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={e => setConsentChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">{pt.consent}</span>
            </label>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/')}>
                <X size={16} /> {pt.exit}
              </Button>
              <Button disabled={!consentChecked} onClick={() => setStep('language')} className="flex-1">
                {pt.continue} <ChevronRight size={16} />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Language */}
        {step === 'language' && (
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#0f2547] rounded-lg flex items-center justify-center">
                <Languages size={20} className="text-cyan-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0f2547]">
                  {selectedLang === 'en' ? 'Choose your preferred language'
                    : selectedLang === 'hi' ? 'अपनी पसंदीदा भाषा चुनें'
                      : 'तुमची पसंतीची भाषा निवडा'}
                </h1>
                <p className="text-sm text-slate-500">
                  {selectedLang === 'en' ? 'The entire experience will be in your chosen language'
                    : selectedLang === 'hi' ? 'पूरा अनुभव आपकी चुनी हुई भाषा में होगा'
                      : 'संपूर्ण अनुभव तुमच्या निवडलेल्या भाषेत असेल'}
                </p>
              </div>
            </div>

            <div className="grid gap-3 mb-8">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLang(lang.code)}
                  className={clsx(
                    'flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all',
                    selectedLang === lang.code
                      ? 'border-[#0f2547] bg-[#0f2547]/5'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <div>
                    <div className="font-semibold text-[#0f2547] text-lg">{lang.nativeLabel}</div>
                    <div className="text-sm text-slate-500">{lang.label} · {lang.hint}</div>
                  </div>
                  {selectedLang === lang.code && (
                    <div className="w-6 h-6 bg-[#0f2547] rounded-full flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('consent')}>
                {selectedLang === 'en' ? '← Back' : selectedLang === 'hi' ? '← वापस' : '← मागे'}
              </Button>
              <Button onClick={() => setStep('mode')} className="flex-1">
                {selectedLang === 'en' ? 'Continue' : selectedLang === 'hi' ? 'जारी रखें' : 'पुढे जा'}
                <ChevronRight size={16} />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Mode */}
        {step === 'mode' && (
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#0f2547] rounded-lg flex items-center justify-center">
                <MessageCircle size={20} className="text-cyan-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0f2547]">{mt.title}</h1>
                <p className="text-sm text-slate-500">{mt.subtitle}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => setSelectedMode('text')}
                className={clsx(
                  'p-6 rounded-xl border-2 text-left transition-all',
                  selectedMode === 'text' ? 'border-[#0f2547] bg-[#0f2547]/5' : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <MessageCircle size={32} className="text-cyan-600 mb-3" />
                <h3 className="font-bold text-[#0f2547] mb-1">{mt.textTitle}</h3>
                <p className="text-sm text-slate-500">{mt.textDesc}</p>
              </button>
              <button
                onClick={() => setSelectedMode('voice')}
                className={clsx(
                  'p-6 rounded-xl border-2 text-left transition-all',
                  selectedMode === 'voice' ? 'border-[#0f2547] bg-[#0f2547]/5' : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <Mic size={32} className="text-cyan-600 mb-3" />
                <h3 className="font-bold text-[#0f2547] mb-1">{mt.voiceTitle}</h3>
                <p className="text-sm text-slate-500">{mt.voiceDesc}</p>
              </button>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('language')}>{mt.back}</Button>
              <Button onClick={handleBeginAssessment} className="flex-1">
                {mt.begin} <ChevronRight size={16} />
              </Button>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}
