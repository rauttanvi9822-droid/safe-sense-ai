/**
 * SafeSense AI — Upgrade to AssessmentChatPage with real Web Speech API
 */
import { useState, useEffect, useRef, useMemo, useCallback, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Mic, MicOff, X, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { Navbar } from '../components/Layout';
import { Button, Card, Alert } from '../components/ui';
import { Logo } from '../components/Logo';
import type { ChatMessage, OnboardingState, Language } from '../types';
import { ASSESSMENT_QUESTIONS, getReassessmentQuestions, type AssessmentOption } from '../lib/mockAssessment';
import { analyzeAssessment } from '../lib/assessmentApi';
import { useAuth } from '../context/AuthContext';
import { SpeechRecognizer, speak, cancelSpeech, isSpeechRecognitionSupported, isSpeechSynthesisSupported } from '../lib/speechService';
import type { VoiceMetadata } from '../lib/speechService';
import { localDb } from '../lib/localDb';
import { apiStartAssessment, apiCompleteAssessment } from '../lib/apiClient';
import clsx from 'clsx';

function generateId() {
  return Math.random().toString(36).slice(2);
}

function getInitialMessage(lang: Language): string {
  const msgs: Record<Language, string> = {
    en: "Hello. I'm SafeSense AI. Before we get started, I'd like to understand how you've been feeling lately. There are no right or wrong answers, and you can share as much or as little as you'd like. This is a private space, and you can stop at any time.",
    hi: "नमस्ते। मैं SafeSense AI हूँ। शुरू करने से पहले, मैं समझना चाहता हूँ कि आप हाल में कैसा महसूस कर रहे हैं। कोई सही या गलत जवाब नहीं है और आप जितना चाहें उतना साझा कर सकते हैं। यह एक निजी स्थान है और आप किसी भी समय रुक सकते हैं।",
    mr: "नमस्ते. मी SafeSense AI आहे. सुरुवात करण्यापूर्वी, तुम्हाला अलीकडे कसे वाटत आहे हे मला समजून घ्यायचे आहे. येथे योग्य किंवा अयोग्य उत्तर नाही आणि तुम्हाला हवे तितके सांगू शकता. हे एक खाजगी ठिकाण आहे आणि तुम्ही कधीही थांबू शकता.",
  };
  return msgs[lang];
}

function getFollowUpForQuestion(questionIdx: number, response: string, lang: Language): string | null {
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
      7: safetyWords.some(w => lowerResp.includes(w))
        ? "I understand. If you feel you are in immediate danger, please contact emergency services. Is there anyone nearby who can help you right now?"
        : null!,
      5: threatWords.some(w => lowerResp.includes(w))
        ? "Thank you for sharing that. Has this threat or intimidation been recent, or has it been happening over a period of time?"
        : null!,
    },
    hi: {
      0: fearWords.some(w => lowerResp.includes(w)) ? "मैं समझता हूँ कि आप डरा हुआ महसूस कर रहे हैं। क्या आप थोड़ा और बता सकते हैं?" : null!,
      7: safetyWords.some(w => lowerResp.includes(w)) ? "मैं समझता हूँ। अगर आपको लगता है कि आप तत्काल खतरे में हैं, तो कृपया आपातकालीन सेवाओं से संपर्क करें।" : null!,
      5: threatWords.some(w => lowerResp.includes(w)) ? "इसे साझा करने के लिए धन्यवाद। क्या यह बात हाल ही में हुई है?" : null!,
    },
    mr: {
      0: fearWords.some(w => lowerResp.includes(w)) ? "मला समजते की तुम्हाला भीती वाटत आहे. जे घडत आहे त्याबद्दल थोडे अधिक सांगू शकता का?" : null!,
      7: safetyWords.some(w => lowerResp.includes(w)) ? "मला समजते. तुम्हाला तात्काळ धोका वाटत असेल तर आपत्कालीन सेवांशी संपर्क करा." : null!,
      5: threatWords.some(w => lowerResp.includes(w)) ? "हे सांगण्याबद्दल आभारी आहे. ही गोष्ट अलीकडे घडली का?" : null!,
    },
  };
  return followUps[lang]?.[questionIdx] ?? null;
}

export default function AssessmentChatPage() {
  const navigate = useNavigate();
  const { demoMode } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [allResponses, setAllResponses] = useState<string[]>([]);
  const [structuredData, setStructuredData] = useState<Record<string, number>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceMetadata, setVoiceMetadata] = useState<VoiceMetadata | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const speechSupportedRef = useRef(isSpeechRecognitionSupported());
  const ttsSupportedRef = useRef(isSpeechSynthesisSupported());

  const onboarding: OnboardingState = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('assessment_onboarding');
      if (raw) return JSON.parse(raw) as OnboardingState;
    } catch { }
    return { consentGiven: true, language: 'en', interactionMode: 'text', step: 'assessment' };
  }, []);

  const lang = onboarding.language;
  const questions = onboarding.assessmentType === 'reassessment'
    ? getReassessmentQuestions(localDb.getAssessments().length)
    : ASSESSMENT_QUESTIONS;

  // Start assessment session
  useEffect(() => {
    const previous = onboarding.assessmentType === 'reassessment' ? localDb.getLatestAssessment() : null;
    const returningNote: Record<Language, string> = {
      en: previous ? ` Since your last check-in, we can take a shorter look at how things are going now. Your previous score was ${previous.svi}/100.` : '',
      hi: previous ? ` आपके पिछले चेक-इन के बाद, आज हम एक छोटा सा अपडेट देखेंगे। आपका पिछला स्कोर ${previous.svi}/100 था।` : '',
      mr: previous ? ` तुमच्या मागील चेक-इननंतर, आज आपण एक छोटा अपडेट पाहू. तुमचा मागील स्कोअर ${previous.svi}/100 होता.` : '',
    };
    const greeting: ChatMessage = {
      id: generateId(),
      role: 'ai',
      content: getInitialMessage(lang) + returningNote[lang],
      timestamp: new Date().toISOString(),
    };
    setMessages([greeting]);
    const voiceMode = onboarding.interactionMode === 'voice';
    setIsVoiceMode(voiceMode);

    // Try to start a backend assessment session
    const API_URL = import.meta.env.VITE_API_URL;
    if (API_URL) {
      apiStartAssessment(lang, onboarding.interactionMode)
        .then(d => setAssessmentId(d.id))
        .catch(() => setAssessmentId(`local-${generateId()}`));
    } else {
      setAssessmentId(`local-${generateId()}`);
    }

    // Auto-speak first message
    if (voiceMode && ttsSupportedRef.current) {
      speakMessage(getInitialMessage(lang));
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const speakMessage = useCallback((text: string) => {
    if (!ttsEnabled || !ttsSupportedRef.current) return;
    setIsSpeaking(true);
    speak(text, lang, () => setIsSpeaking(false), (e) => {
      setVoiceError(e);
      setIsSpeaking(false);
    });
  }, [ttsEnabled, lang]);

  const addAIMessage = useCallback((content: string) => {
    const msg: ChatMessage = {
      id: generateId(),
      role: 'ai',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
    if (isVoiceMode) speakMessage(content);
  }, [isVoiceMode, speakMessage]);

  const handleSend = async (textOverride?: string, option?: AssessmentOption) => {
    const text = (textOverride ?? input).trim();
    if (!text || isTyping || isComplete) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setInterimTranscript('');
    setAllResponses((prev) => [...prev, text]);
    const nextStructuredData = option
      ? { ...structuredData, [questions[questionIdx].id]: option.value }
      : structuredData;
    if (option) setStructuredData(nextStructuredData);
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 600 + Math.random() * 500));

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
      const closeMsg: Record<Language, string> = {
        en: "Thank you for sharing. I have noted your responses. Please give me a moment while I prepare a support recommendation.",
        hi: "साझा करने के लिए धन्यवाद। मैंने आपकी प्रतिक्रियाएं नोट कर ली हैं। कृपया एक क्षण दें।",
        mr: "सांगण्याबद्दल आभारी आहे. मी तुमचे प्रतिसाद नोंदवले आहेत. एक क्षण थांबा.",
      };
      addAIMessage(closeMsg[lang]);
      setIsTyping(false);
      setIsComplete(true);
      setIsAnalyzing(true);

      const combined = allResponses.concat(text).join(' ');

      // Try API-based analysis first
      const API_URL = import.meta.env.VITE_API_URL;
      if (API_URL && assessmentId && !assessmentId.startsWith('local-')) {
        try {
          const allMsgs = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
          const apiResult = await apiCompleteAssessment(assessmentId, {
            messages: allMsgs,
            combined_text: combined,
            voice_metadata: voiceMetadata as any,
            structured_data: nextStructuredData,
            is_demo: demoMode.active,
            demo_scenario: demoMode.active ? demoMode.scenario : undefined,
          });
          const sviResult = {
            score: apiResult.score,
            riskCategory: apiResult.risk_category,
            indicators: apiResult.indicators,
            confidence: apiResult.confidence,
            recommendedSupport: apiResult.recommended_support,
            timestamp: apiResult.timestamp,
            isPrototype: true as const,
            recommendations: apiResult.recommendations,
            emotionSignals: apiResult.emotion_signals,
            voiceFeatures: apiResult.voice_features,
            breakdown: apiResult.breakdown,
            modalitiesAnalyzed: apiResult.modalities_analyzed,
            supportRisk: apiResult.support_risk,
            traumaIndicator: apiResult.trauma_indicator,
          };
          sessionStorage.setItem('assessment_result', JSON.stringify(sviResult));
          localDb.saveAssessment({
            id: assessmentId,
            case_ref: apiResult.case_ref ?? assessmentId,
            date: new Date().toISOString().slice(0, 10),
            language: lang,
            interaction_mode: onboarding.interactionMode,
            svi: apiResult.score,
            risk: apiResult.risk_category,
            status: 'completed',
            result: sviResult,
            indicators: apiResult.indicators,
            recommendations: apiResult.recommendations,
          });
          setIsAnalyzing(false);
          navigate('/assessment/result');
          return;
        } catch {
          // Fall back to mock
        }
      }

      // Fallback: local analysis
      setTimeout(async () => {
        const result = await analyzeAssessment({
          text: combined,
          language: lang,
          structuredData: nextStructuredData,
          demoScenario: demoMode.active ? demoMode.scenario : undefined,
        });
        sessionStorage.setItem('assessment_result', JSON.stringify(result));
        if (assessmentId) {
          localDb.saveAssessment({
            id: assessmentId,
            case_ref: assessmentId,
            date: new Date().toISOString().slice(0, 10),
            language: lang,
            interaction_mode: onboarding.interactionMode,
            svi: result.score,
            risk: result.riskCategory,
            status: 'completed',
            result,
          });
        }
        setIsAnalyzing(false);
        navigate('/assessment/result');
      }, 1500);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Real voice recording ──────────────────────────────────────────────────
  const startListening = () => {
    if (!speechSupportedRef.current) {
      setVoiceError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    setVoiceError(null);
    cancelSpeech(); // Stop TTS if speaking

    recognizerRef.current = new SpeechRecognizer({
      language: lang,
      onResult: (transcript, isFinal) => {
        if (isFinal) {
          setInput(prev => (prev ? prev + ' ' + transcript : transcript));
          setInterimTranscript('');
        } else {
          setInterimTranscript(transcript);
        }
      },
      onError: (err) => {
        setVoiceError(err);
        setIsListening(false);
      },
      onStart: () => setIsListening(true),
      onEnd: () => setIsListening(false),
    });
    recognizerRef.current.start();
  };

  const stopListening = () => {
    if (recognizerRef.current) {
      const meta = recognizerRef.current.stop();
      setVoiceMetadata(meta);
      recognizerRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  const toggleVoiceRecording = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const progressPct = Math.min(100, Math.round((questionIdx / questions.length) * 100));
  const currentQuestion = questions[questionIdx];

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
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-1.5 bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="text-xs text-slate-400">{progressPct}%</span>
            </div>
            {/* TTS toggle */}
            {ttsSupportedRef.current && (
              <button
                onClick={() => { setTtsEnabled(v => !v); if (isSpeaking) cancelSpeech(); }}
                title={ttsEnabled ? 'Disable voice responses' : 'Enable voice responses'}
                className="text-slate-400 hover:text-cyan-600 transition-colors"
              >
                {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            )}
            <button onClick={() => setShowExitConfirm(true)} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors">
              <X size={14} /> Exit
            </button>
          </div>
        </div>
      </div>

      {demoMode.active && (
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-700">
          DEMO MODE — Scenario: {demoMode.scenario} — Synthetic test data only
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <Alert type="disclaimer" className="text-xs">
            This is a support assessment, not a medical consultation. You can exit at any time. If you are in immediate danger, please contact emergency services.
          </Alert>

          {voiceError && (
            <Alert type="warning" className="text-xs">
              {voiceError}
              {!speechSupportedRef.current && ' Please type your responses instead.'}
            </Alert>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'ai' && (
                <div className="w-8 h-8 bg-[#0f2547] rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                  <span className="text-cyan-300 text-xs font-bold">AI</span>
                </div>
              )}
              <div className={clsx(
                'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                msg.role === 'ai'
                  ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                  : 'bg-[#0f2547] text-white rounded-tr-sm'
              )}>
                {msg.content}
              </div>
            </div>
          ))}

          {/* Interim transcript */}
          {interimTranscript && (
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm bg-slate-100 text-slate-500 italic">
                {interimTranscript}…
              </div>
            </div>
          )}

          {isTyping && (
            <div className="flex justify-start">
              <div className="w-8 h-8 bg-[#0f2547] rounded-full flex items-center justify-center flex-shrink-0 mr-2">
                <span className="text-cyan-300 text-xs font-bold">AI</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {!isTyping && !isComplete && currentQuestion.options && (
            <div className="ml-10 grid gap-2 max-w-md">
              {currentQuestion.options.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleSend(option.label[lang], option)}
                  className="rounded-xl border border-cyan-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition hover:border-cyan-500 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                >
                  {option.label[lang]}
                </button>
              ))}
            </div>
          )}

          {isSpeaking && (
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 text-xs text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full">
                <Volume2 size={12} className="animate-pulse" /> AI is speaking…
              </span>
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 bg-cyan-50 border border-cyan-200 rounded-full px-4 py-2 text-sm text-cyan-700">
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                Analyzing your responses…
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
              {/* Voice button (always show if in voice mode or STT supported) */}
              {(isVoiceMode || speechSupportedRef.current) && (
                <button
                  onClick={toggleVoiceRecording}
                  disabled={isTyping || isComplete}
                  className={clsx(
                    'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all',
                    isListening
                      ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200'
                      : 'bg-[#0f2547] text-cyan-300 hover:bg-[#1a3a6b]'
                  )}
                  title={isListening ? 'Stop recording' : 'Start voice input'}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              )}
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? 'Listening… speak now' : 'Type your response here…'}
                  rows={2}
                  className={clsx(
                    "w-full rounded-xl border bg-white px-4 py-3 pr-12 text-sm text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#0f2547] focus:border-transparent",
                    isListening ? 'border-red-300 bg-red-50' : 'border-slate-300'
                  )}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-3 bottom-3 w-8 h-8 bg-[#0f2547] disabled:bg-slate-300 text-white rounded-lg flex items-center justify-center transition-colors hover:bg-[#1a3a6b]"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              {isVoiceMode
                ? 'Click the microphone to speak. Press Enter or send to submit your response.'
                : "You don't have to answer any question you're not comfortable with. Press Enter to reply."}
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
                <p className="text-sm text-slate-600">Your current responses will not be saved. You can return to start a new assessment at any time.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowExitConfirm(false)} className="flex-1">Continue</Button>
              <Button variant="danger" onClick={() => navigate('/')} className="flex-1">Exit</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
