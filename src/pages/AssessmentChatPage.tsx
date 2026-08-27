import { useState, useEffect, useRef, useMemo, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Mic, MicOff, X, AlertCircle } from 'lucide-react';
import { Navbar } from '../components/Layout';
import { Button, Card, Alert } from '../components/ui';
import { Logo } from '../components/Logo';
import type { ChatMessage, OnboardingState, Language } from '../types';
import { ASSESSMENT_QUESTIONS } from '../lib/mockAssessment';
import { analyzeAssessment } from '../lib/assessmentApi';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

function generateId() {
  return Math.random().toString(36).slice(2);
}

function getInitialMessage(lang: Language): string {
  const msgs: Record<Language, string> = {
    en: "Hello. I'm SAFE-SENSE AI. I'm here to listen and help connect you with appropriate support. This is a private, confidential space. Please take your time. You can stop at any moment. To begin — how are you feeling right now?",
    hi: "नमस्ते। मैं SAFE-SENSE AI हूँ। मैं यहाँ सुनने और आपको उचित सहायता से जोड़ने के लिए हूँ। यह एक निजी और गोपनीय स्थान है। कृपया अपना समय लें। आप किसी भी समय रुक सकते हैं। शुरुआत करने के लिए — आप अभी कैसा महसूस कर रहे हैं?",
    mr: "नमस्ते. मी SAFE-SENSE AI आहे. मी ऐकण्यासाठी आणि तुम्हाला योग्य आधार मिळवण्यासाठी येथे आहे. हे एक खाजगी, गोपनीय ठिकाण आहे. कृपया तुमचा वेळ घ्या. तुम्ही कधीही थांबू शकता. सुरुवातीला — तुम्हाला आत्ता कसे वाटत आहे?",
  };
  return msgs[lang];
}

function getFollowUpForQuestion(
  questionIdx: number,
  response: string,
  lang: Language
): string | null {
  const lowerResp = response.toLowerCase();
  const fearWords = ['afraid', 'scared', 'fear', 'डर', 'घाबरणे'];
  const distressWords = ['sad', 'crying', 'hopeless', 'helpless', 'दुखी', 'निराश'];
  const safetyWords = ['unsafe', 'danger', 'hurt', 'असुरक्षित'];
  const threatWords = ['threatened', 'warning', 'blackmail', 'धमकी'];

  const followUps: Record<Language, Record<number, string>> = {
    en: {
      0: fearWords.some(w => lowerResp.includes(w))
        ? "I hear that you're feeling afraid. Can you tell me a little more about what's been happening?"
        : distressWords.some(w => lowerResp.includes(w))
        ? "I'm sorry to hear you're feeling this way. Is there something specific that has been difficult?"
        : null!,
      2: safetyWords.some(w => lowerResp.includes(w))
        ? "I understand. If you feel you are in immediate danger, please contact emergency services. Is there anyone nearby who can help you right now?"
        : null!,
      4: threatWords.some(w => lowerResp.includes(w))
        ? "Thank you for sharing that. Has this threat or intimidation been recent, or has it been happening over a period of time?"
        : null!,
    },
    hi: {
      0: fearWords.some(w => lowerResp.includes(w))
        ? "मैं समझता हूँ कि आप डरा हुआ महसूस कर रहे हैं। क्या आप थोड़ा और बता सकते हैं कि क्या हो रहा है?"
        : null!,
      2: safetyWords.some(w => lowerResp.includes(w))
        ? "मैं समझता हूँ। अगर आपको लगता है कि आप तत्काल खतरे में हैं, तो कृपया आपातकालीन सेवाओं से संपर्क करें।"
        : null!,
      4: threatWords.some(w => lowerResp.includes(w))
        ? "इसे साझा करने के लिए धन्यवाद। क्या यह धमकी हाल ही में मिली है?"
        : null!,
    },
    mr: {
      0: fearWords.some(w => lowerResp.includes(w))
        ? "मला समजते की तुम्हाला भीती वाटत आहे. जे घडत आहे त्याबद्दल थोडे अधिक सांगू शकता का?"
        : null!,
      2: safetyWords.some(w => lowerResp.includes(w))
        ? "मला समजते. तुम्हाला तात्काळ धोका वाटत असेल तर आपत्कालीन सेवांशी संपर्क करा."
        : null!,
      4: threatWords.some(w => lowerResp.includes(w))
        ? "हे सांगण्याबद्दल आभारी आहे. ही धमकी अलीकडे मिळाली का?"
        : null!,
    },
  };

  return followUps[lang]?.[questionIdx] ?? null;
}

export default function AssessmentChatPage() {
  const navigate = useNavigate();
  const { demoMode } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [allResponses, setAllResponses] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load onboarding state
  const onboarding: OnboardingState = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('assessment_onboarding');
      if (raw) return JSON.parse(raw) as OnboardingState;
    } catch {}
    return { consentGiven: true, language: 'en', interactionMode: 'text', step: 'assessment' };
  }, []);

  const lang = onboarding.language;
  const questions = ASSESSMENT_QUESTIONS;

  // Initial greeting
  useEffect(() => {
    const greeting: ChatMessage = {
      id: generateId(),
      role: 'ai',
      content: getInitialMessage(lang),
      timestamp: new Date().toISOString(),
    };
    setMessages([greeting]);
    setIsVoiceMode(onboarding.interactionMode === 'voice');
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const addAIMessage = (content: string) => {
    const msg: ChatMessage = {
      id: generateId(),
      role: 'ai',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping || isComplete) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setAllResponses((prev) => [...prev, text]);
    setIsTyping(true);

    // Simulate AI response delay
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));

    // Check for dynamic follow-up
    const followUp = getFollowUpForQuestion(questionIdx, text, lang);
    if (followUp) {
      addAIMessage(followUp);
      setIsTyping(false);
      return;
    }

    const nextIdx = questionIdx + 1;
    if (nextIdx < questions.length) {
      setQuestionIdx(nextIdx);
      addAIMessage(questions[nextIdx].text[lang]);
      setIsTyping(false);
    } else {
      // Final message + trigger analysis
      const closeMsg: Record<Language, string> = {
        en: "Thank you for sharing. I have noted your responses. Please give me a moment while I summarise the information to prepare a support recommendation.",
        hi: "साझा करने के लिए धन्यवाद। मैंने आपकी प्रतिक्रियाएं नोट कर ली हैं। कृपया एक क्षण दें जबकि मैं सहायता सिफारिश तैयार करता हूँ।",
        mr: "सांगण्याबद्दल आभारी आहे. मी तुमचे प्रतिसाद नोंदवले आहेत. आधार शिफारस तयार करत असताना एक क्षण थांबा.",
      };
      addAIMessage(closeMsg[lang]);
      setIsTyping(false);
      setIsComplete(true);
      setIsAnalyzing(true);

      // Run analysis
      const combined = allResponses.concat(text).join(' ');
      setTimeout(async () => {
        const result = await analyzeAssessment({
          text: combined,
          language: lang,
          demoScenario: demoMode.active ? demoMode.scenario : undefined,
        });
        sessionStorage.setItem('assessment_result', JSON.stringify(result));
        setIsAnalyzing(false);
        navigate('/assessment/result');
      }, 2000);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Voice mode (placeholder — just toggles)
  const toggleVoice = () => {
    setIsListening((v) => !v);
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false);
        setInput((prev) => prev + (prev ? ' ' : '') + '[Voice input — transcription placeholder]');
      }, 3000);
    }
  };

  const progressPct = Math.min(100, Math.round((questionIdx / questions.length) * 100));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Chat header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0f2547] rounded-full flex items-center justify-center">
              <Logo size="sm" variant="light" />
            </div>
            <div>
              <p className="font-semibold text-[#0f2547] text-sm">SAFE-SENSE AI</p>
              <p className="text-xs text-slate-400">Assessment in progress</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Progress */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-1.5 bg-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs text-slate-400">{progressPct}%</span>
            </div>
            <button
              onClick={() => setShowExitConfirm(true)}
              className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
            >
              <X size={14} /> Exit
            </button>
          </div>
        </div>
      </div>

      {/* Demo mode warning */}
      {demoMode.active && (
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-700">
          DEMO MODE — Scenario: {demoMode.scenario} — Synthetic test data only
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Disclaimer */}
          <Alert type="disclaimer" className="text-xs">
            This is a support assessment, not a medical consultation. You can exit at any time. If you are in immediate danger, please contact emergency services.
          </Alert>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'ai' && (
                <div className="w-8 h-8 bg-[#0f2547] rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                  <span className="text-cyan-300 text-xs font-bold">AI</span>
                </div>
              )}
              <div
                className={clsx(
                  'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'ai'
                    ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                    : 'bg-[#0f2547] text-white rounded-tr-sm'
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="w-8 h-8 bg-[#0f2547] rounded-full flex items-center justify-center flex-shrink-0 mr-2">
                <span className="text-cyan-300 text-xs font-bold">AI</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 bg-cyan-50 border border-cyan-200 rounded-full px-4 py-2 text-sm text-cyan-700">
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                Preparing assessment summary…
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      {!isComplete && (
        <div className="bg-white border-t border-slate-200 px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2 items-end">
              {isVoiceMode ? (
                <button
                  onClick={toggleVoice}
                  className={clsx(
                    'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all',
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-[#0f2547] text-cyan-300 hover:bg-[#1a3a6b]'
                  )}
                  title={isListening ? 'Stop recording' : 'Start recording'}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              ) : null}
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your response here..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#0f2547] focus:border-transparent"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-3 bottom-3 w-8 h-8 bg-[#0f2547] disabled:bg-slate-300 text-white rounded-lg flex items-center justify-center transition-colors hover:bg-[#1a3a6b]"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              You don't have to answer any question you're not comfortable with. Press Enter or the send button to reply.
            </p>
          </div>
        </div>
      )}

      {/* Exit confirmation modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="max-w-sm w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Exit assessment?</h3>
                <p className="text-sm text-slate-600">
                  Your current responses will not be saved. You can return to start a new assessment at any time.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowExitConfirm(false)} className="flex-1">
                Continue
              </Button>
              <Button variant="danger" onClick={() => navigate('/')} className="flex-1">
                Exit
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
