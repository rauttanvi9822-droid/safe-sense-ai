/**
 * SafeSense AI — Voice Assistant Page
 * Full conversational voice assistant with real STT + TTS.
 * Uses LanguageContext — language affects both recognition and speech synthesis.
 * TTS voice loading race condition is fixed in speechService.ts.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, RefreshCw, AlertTriangle, Languages } from 'lucide-react';
import { Navbar } from '../components/Layout';
import { Card, Alert } from '../components/ui';
import { useLanguage } from '../context/LanguageContext';
import {
  SpeechRecognizer, speak, cancelSpeech,
  isSpeechRecognitionSupported, isSpeechSynthesisSupported,
} from '../lib/speechService';
import { generateResponse, getGreeting, type ConvMessage } from '../lib/conversationalAI';
import { apiCreateChatSession, apiSendChatMessage } from '../lib/apiClient';
import { localDb } from '../lib/localDb';
import type { Language } from '../types';
import clsx from 'clsx';

type ConvoMessage = { id: string; role: 'user' | 'ai'; text: string; timestamp: string };
type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

function uid() { return Math.random().toString(36).slice(2); }

const LANG_LABELS: Record<Language, string> = { en: 'EN', hi: 'हि', mr: 'म' };

const UI_TEXT: Record<Language, {
  title: string; subtitle: string; disclaimer: string; privacy: string;
  ready: string; listening: string; processing: string; speaking: string; errorState: string;
  voiceOn: string; voiceOff: string; clear: string; nonDiagnostic: string;
}> = {
  en: {
    title: 'Talk to Sakha',
    subtitle: 'Your AI Dost will listen and respond.',
    disclaimer: 'This voice assistant provides supportive conversation only. It does not provide medical advice. If you are in immediate danger, contact emergency services.',
    privacy: 'Your conversation is processed locally. No audio is stored permanently.',
    ready: 'Ready — tap the microphone to speak',
    listening: 'Listening…',
    processing: 'Understanding…',
    speaking: 'Speaking…',
    errorState: "I couldn't hear that clearly. Please try again.",
    voiceOn: 'Voice On',
    voiceOff: 'Voice Off',
    clear: 'Clear',
    nonDiagnostic: 'Voice-derived indicators (non-diagnostic):',
  },
  hi: {
    title: 'सखा से बात करें',
    subtitle: 'आपका AI Dost सुनेगा और जवाब देगा।',
    disclaimer: 'यह वॉइस असिस्टेंट केवल सहायक बातचीत प्रदान करता है। यह चिकित्सीय सलाह नहीं देता। यदि आप तत्काल खतरे में हैं, तो आपातकालीन सेवाओं से संपर्क करें।',
    privacy: 'आपकी बातचीत स्थानीय रूप से प्रोसेस की जाती है। कोई ऑडियो स्थायी रूप से संग्रहीत नहीं होती।',
    ready: 'तैयार — बोलने के लिए माइक्रोफ़ोन टैप करें',
    listening: 'सुन रहा है…',
    processing: 'समझ रहा है…',
    speaking: 'बोल रहा है…',
    errorState: 'आवाज़ साफ़ नहीं सुनाई दी। कृपया फिर कोशिश करें।',
    voiceOn: 'आवाज़ चालू',
    voiceOff: 'आवाज़ बंद',
    clear: 'साफ करें',
    nonDiagnostic: 'आवाज़-derived संकेतक (non-diagnostic):',
  },
  mr: {
    title: 'सखाशी बोला',
    subtitle: 'तुमचा AI Dost ऐकेल आणि प्रतिसाद देईल.',
    disclaimer: 'हा व्हॉइस असिस्टंट केवळ सहाय्यक संभाषण प्रदान करतो. हे वैद्यकीय सल्ला देत नाही. तुम्ही तात्काळ धोक्यात असाल तर आपत्कालीन सेवांशी संपर्क करा.',
    privacy: 'तुमचे संभाषण स्थानीय स्तरावर प्रक्रिया केले जाते. कोणतेही ऑडिओ कायमस्वरूपी साठवले जात नाही.',
    ready: 'तयार — बोलण्यासाठी मायक्रोफोन टॅप करा',
    listening: 'ऐकत आहे…',
    processing: 'समजून घेत आहे…',
    speaking: 'बोलत आहे…',
    errorState: 'आवाज स्पष्ट ऐकू आला नाही. कृपया पुन्हा प्रयत्न करा.',
    voiceOn: 'आवाज चालू',
    voiceOff: 'आवाज बंद',
    clear: 'साफ करा',
    nonDiagnostic: 'आवाज-derived संकेतक (non-diagnostic):',
  },
};

export default function VoiceAssistantPage() {
  const { language, setLanguage } = useLanguage();
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [messages, setMessages] = useState<ConvoMessage[]>([]);
  const [interimText, setInterimText] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [voiceMeta, setVoiceMeta] = useState<any>(null);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const cancelTTSRef = useRef<(() => void) | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const finalTranscriptRef = useRef('');
  const sttSupported = isSpeechRecognitionSupported();
  const ttsSupported = isSpeechSynthesisSupported();

  const t = UI_TEXT[language];

  const AI_GREETING = getGreeting(language);

  useEffect(() => {
    const initSession = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL;
        if (API_URL) {
          const { session_id } = await apiCreateChatSession();
          setSessionId(session_id);
        } else {
          setSessionId(`voice-${uid()}`);
        }
      } catch {
        setSessionId(`voice-${uid()}`);
      }
    };
    initSession();

    const greeting: ConvoMessage = {
      id: uid(), role: 'ai', text: AI_GREETING, timestamp: new Date().toISOString(),
    };
    setMessages([greeting]);

    // Keep playback user-controlled. The first response is visible, and the user taps to speak.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role: ConvoMessage['role'], text: string): ConvoMessage => {
    const msg: ConvoMessage = { id: uid(), role, text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, msg]);
    return msg;
  };

  const sendToAI = useCallback(async (transcript: string, _meta: any) => {
    setVoiceState('processing');
    setInterimText('');

    const userMsg = addMessage('user', transcript);
    if (sessionId) {
      localDb.addChatMessage(sessionId, {
        id: userMsg.id, role: 'user', content: transcript, timestamp: userMsg.timestamp,
      });
    }

    try {
      let aiText = '';
      const API_URL = import.meta.env.VITE_API_URL;
      if (API_URL && sessionId && !sessionId.startsWith('voice-')) {
        const { ai_message } = await apiSendChatMessage(sessionId, transcript, language);
        aiText = ai_message.content;
      } else {
        await new Promise(r => setTimeout(r, 350 + Math.random() * 250));
        // Build history from current messages state
        const latest = localDb.getLatestAssessment();
        const context: ConvMessage[] = latest
          ? [{ role: 'ai', content: `The user's latest wellbeing snapshot is ${latest.svi}/100 (${latest.risk}). Use this only as context and respond to what they say now.` }]
          : [];
        const history: ConvMessage[] = [...context, ...messages.map(m => ({ role: m.role, content: m.text }))];
        const result = generateResponse(transcript, history, language);
        aiText = result.text;
      }

      const aiMsg = addMessage('ai', aiText);
      if (sessionId) {
        localDb.addChatMessage(sessionId, {
          id: aiMsg.id, role: 'ai', content: aiText, timestamp: aiMsg.timestamp,
        });
      }

      // Speak AI response — uses async voice loading, correct language
      if (ttsEnabled && ttsSupported) {
        setVoiceState('speaking');
        cancelTTSRef.current = speak(
          aiText,
          language,
          () => setVoiceState('idle'),
          (e) => { setErrorMsg(e); setVoiceState('idle'); },
        );
      } else {
        setVoiceState('idle');
      }
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Could not get AI response. Please try again.');
      setVoiceState('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, messages, ttsEnabled, ttsSupported, language]);

  const startListening = () => {
    if (!sttSupported) {
      setErrorMsg('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      setVoiceState('error');
      return;
    }
    // Stop any ongoing TTS
    if (voiceState === 'speaking') {
      cancelTTSRef.current?.();
      cancelTTSRef.current = null;
    }
    setErrorMsg(null);
    setVoiceState('listening');
    setInterimText('');

    finalTranscriptRef.current = '';

    recognizerRef.current = new SpeechRecognizer({
      language: language,         // ← uses context language, not hardcoded 'en'
      onResult: (t, isFinal) => {
        if (isFinal) { finalTranscriptRef.current += ' ' + t; setInterimText(''); }
        else setInterimText(t);
      },
      onError: (e) => { setErrorMsg(e); setVoiceState(e.includes('aborted') ? 'idle' : 'error'); },
      onStart: () => setVoiceState('listening'),
      onEnd: () => {
        const transcript = finalTranscriptRef.current.trim();
        finalTranscriptRef.current = '';
        recognizerRef.current = null;
        if (transcript) {
          sendToAI(transcript, voiceMeta);
        } else {
          setVoiceState('idle');
        }
      },
    });
    recognizerRef.current.start();
  };

  const stopListening = () => {
    if (recognizerRef.current) {
      const voiceMetaResult = recognizerRef.current.stop();
      setVoiceMeta(voiceMetaResult);
    }
    setInterimText('');
    setVoiceState('idle');
  };

  const toggleListening = () => {
    if (voiceState === 'listening') stopListening();
    else if (voiceState === 'idle' || voiceState === 'error') startListening();
  };

  const clearConversation = () => {
    cancelTTSRef.current?.();
    cancelTTSRef.current = null;
    cancelSpeech();
    if (recognizerRef.current) { recognizerRef.current.abort(); recognizerRef.current = null; }
    if (sessionId) localDb.clearChatSession(sessionId);
    setInterimText('');
    setErrorMsg(null);
    setVoiceState('idle');
    const newGreeting = getGreeting(language);
    const greeting: ConvoMessage = { id: uid(), role: 'ai', text: newGreeting, timestamp: new Date().toISOString() };
    setMessages([greeting]);
  };

  const stateLabel: Record<VoiceState, string> = {
    idle: t.ready,
    listening: t.listening,
    processing: t.processing,
    speaking: t.speaking,
    error: t.errorState,
  };

  const stateColor: Record<VoiceState, string> = {
    idle: 'text-slate-500',
    listening: 'text-red-500',
    processing: 'text-cyan-600',
    speaking: 'text-blue-600',
    error: 'text-red-600',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="max-w-2xl mx-auto w-full px-4 py-8 flex flex-col flex-1">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f2547]">{t.title}</h1>
            <p className="text-slate-500 text-sm mt-1">{t.subtitle}</p>
          </div>
          {/* Language picker */}
          <div className="relative">
            <button
              onClick={() => setShowLangPicker(v => !v)}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-[#0f2547] transition-colors"
              title="Change language"
            >
              <Languages size={13} /> {LANG_LABELS[language]}
            </button>
            {showLangPicker && (
              <div className="absolute right-0 top-9 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 min-w-[120px]">
                {(['en', 'hi', 'mr'] as Language[]).map(l => (
                  <button
                    key={l}
                    onClick={() => { setLanguage(l); setShowLangPicker(false); }}
                    className={clsx(
                      'w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors',
                      l === language ? 'text-[#0f2547] font-semibold' : 'text-slate-600'
                    )}
                  >
                    {l === 'en' ? 'English' : l === 'hi' ? 'हिन्दी' : 'मराठी'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Alert type="disclaimer" className="text-xs mb-4">{t.disclaimer}</Alert>

        {!sttSupported && (
          <Alert type="warning" className="mb-4">
            <AlertTriangle size={14} className="inline mr-1" />
            Speech recognition is not supported in this browser. Please use Chrome or Edge for voice input.
            You can still read AI responses as text.
          </Alert>
        )}

        {/* Conversation */}
        <Card className="flex-1 flex flex-col p-4 mb-4 min-h-64">
          <div className="flex-1 overflow-y-auto space-y-3 mb-2">
            {messages.map(msg => (
              <div key={msg.id} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 bg-[#0f2547] rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                    <span className="text-cyan-300 text-[10px] font-bold">AI</span>
                  </div>
                )}
                <div className={clsx(
                  'max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                  msg.role === 'ai' ? 'bg-white border border-slate-200 text-slate-700' : 'bg-[#0f2547] text-white'
                )}>
                  {msg.text}
                  <div className={clsx('text-[10px] mt-1 opacity-60', msg.role === 'ai' ? 'text-slate-400' : 'text-blue-200')}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {interimText && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm bg-red-50 text-red-500 italic border border-red-200">
                  {interimText}…
                </div>
              </div>
            )}
            {voiceState === 'processing' && (
              <div className="flex justify-start">
                <div className="w-7 h-7 bg-[#0f2547] rounded-full flex items-center justify-center flex-shrink-0 mr-2">
                  <span className="text-cyan-300 text-[10px] font-bold">AI</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </Card>

        {/* Error */}
        {errorMsg && voiceState === 'error' && (
          <Alert type="warning" className="text-xs mb-3">{errorMsg}</Alert>
        )}

        {/* Voice controls */}
        <div className="flex flex-col items-center gap-4">
          <p className={clsx('text-sm font-medium', stateColor[voiceState])}>
            {stateLabel[voiceState]}
          </p>

          {/* Main microphone button */}
          <button
            onClick={toggleListening}
            disabled={voiceState === 'processing' || voiceState === 'speaking'}
            className={clsx(
              'w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg focus:outline-none focus:ring-4',
              voiceState === 'listening'
                ? 'bg-red-500 text-white animate-pulse shadow-red-200 focus:ring-red-300'
                : voiceState === 'processing' || voiceState === 'speaking'
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-[#0f2547] text-cyan-300 hover:bg-[#1a3a6b] focus:ring-[#0f2547]/30'
            )}
          >
            {voiceState === 'listening' ? <MicOff size={32} /> : <Mic size={32} />}
          </button>

          {/* Wave animation when listening */}
          {voiceState === 'listening' && (
            <div className="flex items-end gap-1 h-8">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-red-400 rounded-full animate-bounce"
                  style={{ height: `${8 + (i * 4)}px`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          )}

          {/* Speaking animation */}
          {voiceState === 'speaking' && (
            <div className="flex items-center gap-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-blue-400 rounded-full animate-bounce"
                  style={{ height: `${6 + (i % 2) * 10}px`, animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            {ttsSupported && (
              <button
                onClick={() => {
                  setTtsEnabled(v => !v);
                  if (voiceState === 'speaking') {
                    cancelTTSRef.current?.();
                    setVoiceState('idle');
                  }
                }}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#0f2547] transition-colors px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300"
              >
                {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                {ttsEnabled ? t.voiceOn : t.voiceOff}
              </button>
            )}
            <button
              onClick={clearConversation}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#0f2547] transition-colors px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300"
            >
              <RefreshCw size={14} /> {t.clear}
            </button>
          </div>

          {/* Voice metadata display */}
          {voiceMeta && voiceMeta.speaking_rate_wpm && (
            <div className="text-xs text-slate-400 text-center space-y-0.5">
              <p>{t.nonDiagnostic}</p>
              <p>
                Speaking rate: ~{voiceMeta.speaking_rate_wpm} wpm
                {voiceMeta.pause_count !== null ? ` · Pauses detected: ${voiceMeta.pause_count}` : ''}
              </p>
            </div>
          )}

          <p className="text-xs text-slate-400 text-center max-w-xs">{t.privacy}</p>
        </div>
      </div>
    </div>
  );
}
