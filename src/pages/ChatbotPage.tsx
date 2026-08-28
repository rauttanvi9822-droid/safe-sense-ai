/**
 * SafeSense AI — Chatbot Page
 * Real-time chat with AI, multilingual, context-aware adaptive responses.
 * Uses LanguageContext for language + mode preference.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff, Trash2, Volume2, VolumeX, MessageCircle, Languages } from 'lucide-react';
import { Navbar } from '../components/Layout';
import { Card, Alert } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiCreateChatSession, apiSendChatMessage, apiClearChatSession } from '../lib/apiClient';
import { localDb } from '../lib/localDb';
import { SpeechRecognizer, speak, cancelSpeech, isSpeechRecognitionSupported, isSpeechSynthesisSupported } from '../lib/speechService';
import { generateResponse, getGreeting, type ConvMessage } from '../lib/conversationalAI';
import type { Language } from '../types';
import clsx from 'clsx';
import { SakhaIllustration } from '../components/SakhaIllustration';

type Msg = { id: string; role: 'user' | 'ai'; content: string; timestamp: string };
function uid() { return Math.random().toString(36).slice(2); }

const LANG_LABELS: Record<Language, string> = { en: 'EN', hi: 'हि', mr: 'म' };

const UI_TEXT: Record<Language, {
  title: string; subtitle: string; placeholder: string; clearTitle: string;
  listening: string; sending: string; disclaimer: string;
}> = {
  en: {
    title: 'Chat with SafeSense',
    subtitle: 'I\'m here to listen',
    placeholder: 'What\'s on your mind?',
    clearTitle: 'Clear conversation',
    listening: 'Listening…',
    sending: 'Sending…',
    disclaimer: 'Not a medical service. If you\'re in immediate danger, contact emergency services.',
  },
  hi: {
    title: 'SafeSense से बात करें',
    subtitle: 'मैं सुनने के लिए यहाँ हूँ',
    placeholder: 'आपके मन में क्या है?',
    clearTitle: 'बातचीत साफ करें',
    listening: 'सुन रहा है…',
    sending: 'भेज रहा है…',
    disclaimer: 'चिकित्सा सेवा नहीं। तत्काल खतरे में हों तो आपातकालीन सेवाओं से संपर्क करें।',
  },
  mr: {
    title: 'SafeSense शी बोला',
    subtitle: 'मी ऐकण्यासाठी इथे आहे',
    placeholder: 'तुमच्या मनात काय आहे?',
    clearTitle: 'संभाषण साफ करा',
    listening: 'ऐकत आहे…',
    sending: 'पाठवत आहे…',
    disclaimer: 'वैद्यकीय सेवा नाही. तात्काळ धोक्यात असाल तर आपत्कालीन सेवांशी संपर्क करा.',
  },
};

const QUICK_PROMPTS: Record<Language, string[]> = {
  en: [
    "How am I doing?",
    "I need someone to talk to",
    "Help me understand my stress",
    "Give me a thought for today",
  ],
  hi: [
    "मैं कैसा/कैसी हूँ?",
    "मुझे बात करनी है",
    "मेरा तनाव समझने में मदद करें",
    "आज के लिए एक अच्छा विचार दें",
  ],
  mr: [
    "मला कसे वाटत आहे?",
    "मला कोणाशी बोलायचे आहे",
    "माझा ताण समजून घेण्यास मदत करा",
    "आजचा एक चांगला विचार सांगा",
  ],
};

export default function ChatbotPage() {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sttSupported = isSpeechRecognitionSupported();
  const ttsSupported = isSpeechSynthesisSupported();

  // Use language from context (or user profile if logged in)
  const activeLang: Language = (user?.language ?? language) as Language;
  const t = UI_TEXT[activeLang];

  const GREETING = getGreeting(activeLang);

  // Rebuild greeting when language changes
  const greetingRef = useRef(GREETING);
  greetingRef.current = getGreeting(activeLang);

  useEffect(() => {
    (async () => {
      const API_URL = import.meta.env.VITE_API_URL;
      let sid: string;
      try {
        if (API_URL) {
          const { session_id } = await apiCreateChatSession();
          sid = session_id;
        } else {
          sid = `chat-${uid()}`;
        }
      } catch {
        sid = `chat-${uid()}`;
      }
      setSessionId(sid);

      const stored = localDb.getChatMessages(sid);
      if (stored.length > 0) {
        setMessages(stored.map(m => ({ id: m.id, role: m.role, content: m.content, timestamp: m.timestamp })));
      } else {
        const g = greetingRef.current;
        const greeting: Msg = { id: uid(), role: 'ai', content: g, timestamp: new Date().toISOString() };
        setMessages([greeting]);
        localDb.addChatMessage(sid, { id: greeting.id, role: 'ai', content: g, timestamp: greeting.timestamp });
      }
    })();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Convert stored messages to ConvMessage[] for context
  const toConvHistory = (msgs: Msg[]): ConvMessage[] =>
    msgs.map(m => ({ role: m.role, content: m.content }));

  const send = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || isLoading) return;
    setInput('');
    setInterimText('');
    setError(null);

    const userMsg: Msg = { id: uid(), role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(prev => {
      const updated = [...prev, userMsg];
      if (sessionId) {
        localDb.addChatMessage(sessionId, { id: userMsg.id, role: 'user', content: text, timestamp: userMsg.timestamp });
      }
      return updated;
    });

    setIsLoading(true);
    try {
      let aiText = '';
      const API_URL = import.meta.env.VITE_API_URL;
      if (API_URL && sessionId && !sessionId.startsWith('chat-')) {
        const { ai_message } = await apiSendChatMessage(sessionId, text, activeLang);
        aiText = ai_message.content;
      } else {
        // Local conversational AI with context
        await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
        const latest = localDb.getLatestAssessment();
        const context: ConvMessage[] = latest
          ? [{ role: 'ai', content: `The user's latest wellbeing snapshot is ${latest.svi}/100 (${latest.risk}). Use this only as context and respond to what they say now.` }]
          : [];
        const history = [...context, ...toConvHistory([...messages, userMsg])];
        const result = generateResponse(text, history, activeLang);
        aiText = result.text;
      }

      const aiMsg: Msg = { id: uid(), role: 'ai', content: aiText, timestamp: new Date().toISOString() };
      setMessages(prev => {
        const updated = [...prev, aiMsg];
        if (sessionId) {
          localDb.addChatMessage(sessionId, { id: aiMsg.id, role: 'ai', content: aiText, timestamp: aiMsg.timestamp });
        }
        return updated;
      });

      localDb.saveConversationSnapshot(text);

      if (ttsEnabled && ttsSupported) {
        speak(aiText, activeLang);
      }
    } catch (e: any) {
      setError(e.message ?? 'Could not get a response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, sessionId, messages, ttsEnabled, ttsSupported, activeLang]);

  const clearChat = () => {
    cancelSpeech();
    if (recognizerRef.current) { recognizerRef.current.abort(); recognizerRef.current = null; }
    setMessages([]);
    setInput('');
    setError(null);
    if (sessionId) {
      apiClearChatSession(sessionId).catch(() => { });
      localDb.clearChatSession(sessionId);
    }
    const newId = `chat-${uid()}`;
    setSessionId(newId);
    const g = getGreeting(activeLang);
    const greeting: Msg = { id: uid(), role: 'ai', content: g, timestamp: new Date().toISOString() };
    setMessages([greeting]);
    localDb.addChatMessage(newId, { id: greeting.id, role: 'ai', content: g, timestamp: greeting.timestamp });
  };

  const toggleVoice = () => {
    if (isListening) {
      if (recognizerRef.current) { recognizerRef.current.stop(); recognizerRef.current = null; }
      setIsListening(false);
      setInterimText('');
    } else {
      if (!sttSupported) { setError('Speech recognition not supported. Use Chrome or Edge.'); return; }
      setError(null);
      recognizerRef.current = new SpeechRecognizer({
        language: activeLang,
        onResult: (t, isFinal) => {
          if (isFinal) { setInput(prev => (prev ? prev + ' ' + t : t)); setInterimText(''); }
          else setInterimText(t);
        },
        onError: e => { setError(e); setIsListening(false); },
        onStart: () => setIsListening(true),
        onEnd: () => { setIsListening(false); setInterimText(''); },
      });
      recognizerRef.current.start();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="max-w-2xl mx-auto w-full px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#e7f4fb] rounded-full flex items-center justify-center">
              <MessageCircle size={18} className="text-[#145da0]" />
            </div>
            <div>
              <h1 className="font-bold text-[#123b68]">Talk to Sakha</h1>
              <p className="text-xs text-slate-400">Your AI Dost is here to listen</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Language switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLangPicker(v => !v)}
                className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-[#0f2547] transition-colors"
                title="Change language"
              >
                <Languages size={13} /> {LANG_LABELS[activeLang]}
              </button>
              {showLangPicker && (
                <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 min-w-[120px]">
                  {(['en', 'hi', 'mr'] as Language[]).map(l => (
                    <button
                      key={l}
                      onClick={() => { setLanguage(l); setShowLangPicker(false); }}
                      className={clsx(
                        'w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors',
                        l === activeLang ? 'text-[#0f2547] font-semibold' : 'text-slate-600'
                      )}
                    >
                      {l === 'en' ? 'English' : l === 'hi' ? 'हिन्दी' : 'मराठी'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {ttsSupported && (
              <button onClick={() => setTtsEnabled(v => !v)} title={ttsEnabled ? 'Mute AI' : 'Unmute AI'}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#0f2547] transition-colors">
                {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            )}
            <button onClick={clearChat} title={t.clearTitle}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400 text-center mb-3">{t.disclaimer}</div>

        {/* Messages */}
        <Card className="flex-1 flex flex-col p-3 mb-3 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {messages.length <= 1 && (
              <div className="flex flex-col items-center text-center py-5">
                <SakhaIllustration compact className="mb-3" />
                <p className="text-sm font-semibold text-[#123b68]">Sakha is here for you.</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">You can talk about your day, ask for advice, or simply sit with what you are feeling.</p>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 bg-[#0f2547] rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                    <span className="text-cyan-300 text-[10px] font-bold">AI</span>
                  </div>
                )}
                <div className={clsx(
                  'max-w-[80%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed',
                  msg.role === 'ai'
                    ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                    : 'bg-[#0f2547] text-white rounded-tr-sm'
                )}>
                  {msg.content}
                  <div className={clsx('text-[10px] mt-1', msg.role === 'ai' ? 'text-slate-400' : 'text-blue-200')}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {interimText && (
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-slate-100 text-slate-500 italic border border-slate-200">
                  {interimText}…
                </div>
              </div>
            )}

            {isLoading && (
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

        {error && <Alert type="warning" className="text-xs mb-2">{error}</Alert>}

        {/* Input */}
        <div className="flex gap-2 items-end">
          {sttSupported && (
            <button
              onClick={toggleVoice}
              className={clsx(
                'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all',
                isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-[#0f2547] text-cyan-300 hover:bg-[#1a3a6b]'
              )}
              title={isListening ? 'Stop recording' : 'Voice input'}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          )}
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={isListening ? t.listening : t.placeholder}
              rows={2}
              className={clsx(
                'w-full rounded-xl border bg-white px-4 py-2.5 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0f2547] focus:border-transparent',
                isListening ? 'border-red-300 bg-red-50' : 'border-slate-300'
              )}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 w-8 h-8 bg-[#0f2547] disabled:bg-slate-300 text-white rounded-lg flex items-center justify-center hover:bg-[#1a3a6b] transition-colors"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
        {/* Quick prompts — shown when no user messages yet */}
        {messages.filter(m => m.role === 'user').length === 0 && !isLoading && (
          <div className="mt-2 flex flex-wrap gap-2 justify-center">
            {(QUICK_PROMPTS[activeLang] ?? QUICK_PROMPTS.en).map(prompt => (
              <button
                key={prompt}
                onClick={() => send(prompt)}
                className="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-500 hover:bg-[#0f2547] hover:text-white hover:border-[#0f2547] transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
