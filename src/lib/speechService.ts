/**
 * SafeSense AI — Real Speech-to-Text and Text-to-Speech
 * Uses Web Speech API (browser-native, no API key required).
 * Falls back gracefully on unsupported browsers.
 *
 * FIX: TTS voice loading race condition resolved.
 *   `getVoices()` returns [] before voices are loaded.
 *   We now wait for the `voiceschanged` event (with timeout fallback).
 */

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SpeechConfig {
  language: string;  // e.g. 'en', 'hi', 'mr'
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface VoiceMetadata {
  speaking_rate_wpm?: number | null;
  speech_duration_seconds?: number | null;
  pause_count?: number | null;
  avg_pause_duration_ms?: number | null;
}

// ─── Language code mapping ─────────────────────────────────────────────────

export const LANG_MAP: Record<string, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  mr: 'mr-IN',
};

// ─── Browser support check ─────────────────────────────────────────────────

export function isSpeechRecognitionSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// ─── Voice loading helper (fixes race condition) ───────────────────────────

/**
 * Returns a promise that resolves to the loaded voices list.
 * If voices are already available, resolves immediately.
 * Otherwise waits for the `voiceschanged` event (max 2 s timeout).
 */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported()) { resolve([]); return; }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) { resolve(voices); return; }

    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) { resolved = true; resolve(window.speechSynthesis.getVoices()); }
    }, 2000);

    window.speechSynthesis.addEventListener('voiceschanged', function handler() {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve(window.speechSynthesis.getVoices());
      }
    });
  });
}

/**
 * Pick the best available voice for a language code.
 * Preference order: exact match (hi-IN) → language prefix match (hi) → any voice.
 */
function pickVoice(voices: SpeechSynthesisVoice[], langCode: string): SpeechSynthesisVoice | null {
  const bcp47 = LANG_MAP[langCode] ?? 'en-US';
  const prefix = bcp47.slice(0, 2).toLowerCase();

  // 1. Exact BCP-47 match (e.g. hi-IN)
  let v = voices.find(v => v.lang.toLowerCase() === bcp47.toLowerCase());
  if (v) return v;

  // 2. Prefix match (e.g. hi-*)
  v = voices.find(v => v.lang.toLowerCase().startsWith(prefix));
  if (v) return v;

  // 3. Prefer a neutral, natural voice before falling back to English.
  v = voices.find(v => /natural|neural|samantha|zira|google/i.test(v.name));
  if (v) return v;
  v = voices.find(v => v.lang.startsWith('en'));
  return v ?? null;
}

// ─── Speech Recognition (STT) ─────────────────────────────────────────────

export class SpeechRecognizer {
  private recognition: any = null;
  private startTime: number = 0;
  private pauseCount: number = 0;
  private lastSpeechTime: number = 0;
  private pauseThresholdMs: number = 1000;
  private wordCount: number = 0;
  private pauseDurations: number[] = [];

  private config: SpeechConfig;

  constructor(config: SpeechConfig) { this.config = config; }

  start() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.config.onError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = LANG_MAP[this.config.language] ?? 'en-US';
    this.recognition.maxAlternatives = 1;

    this.startTime = Date.now();
    this.lastSpeechTime = Date.now();
    this.pauseCount = 0;
    this.wordCount = 0;
    this.pauseDurations = [];

    this.recognition.onstart = () => {
      this.config.onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      const now = Date.now();
      const gap = now - this.lastSpeechTime;
      if (gap > this.pauseThresholdMs && this.lastSpeechTime > this.startTime) {
        this.pauseCount++;
        this.pauseDurations.push(gap);
      }
      this.lastSpeechTime = now;

      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
          this.wordCount += t.trim().split(/\s+/).length;
        } else {
          interimTranscript += t;
        }
      }

      if (finalTranscript) {
        this.config.onResult(finalTranscript, true);
      } else if (interimTranscript) {
        this.config.onResult(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event: any) => {
      const errorMessages: Record<string, string> = {
        'no-speech': 'No speech detected. Please speak into your microphone.',
        'audio-capture': 'Microphone not found. Please check your audio device.',
        'not-allowed': 'Microphone permission denied. Please allow microphone access.',
        'network': 'Network error during speech recognition.',
        'aborted': 'Speech recognition was stopped.',
        'service-not-allowed': 'Speech recognition service not available.',
      };
      const msg = errorMessages[event.error] ?? `Speech recognition error: ${event.error}`;
      if (event.error !== 'aborted') {
        this.config.onError(msg);
      }
    };

    this.recognition.onend = () => {
      this.config.onEnd?.();
    };

    try {
      this.recognition.start();
    } catch {
      this.config.onError('Could not start speech recognition. Please try again.');
    }
  }

  stop() {
    if (this.recognition) {
      try { this.recognition.stop(); } catch { /* already stopped */ }
    }

    const durationSeconds = (Date.now() - this.startTime) / 1000;
    const speakingRate = durationSeconds > 0 ? (this.wordCount / durationSeconds) * 60 : null;
    const avgPause =
      this.pauseDurations.length > 0
        ? this.pauseDurations.reduce((a, b) => a + b, 0) / this.pauseDurations.length
        : null;

    return {
      speaking_rate_wpm: speakingRate ? Math.round(speakingRate) : null,
      speech_duration_seconds: Math.round(durationSeconds),
      pause_count: this.pauseCount,
      avg_pause_duration_ms: avgPause ? Math.round(avgPause) : null,
    };
  }

  abort() {
    if (this.recognition) {
      try { this.recognition.abort(); } catch { /* ignore */ }
    }
  }
}

// ─── Text-to-Speech (TTS) — async, waits for voices to load ──────────────

/**
 * Speak text in the given language.
 * Returns a cancel function.
 * Waits for voices to load before selecting a voice (fixes race condition).
 */
export function speak(
  text: string,
  language = 'en',
  onEnd?: () => void,
  onError?: (e: string) => void,
): () => void {
  if (!isSpeechSynthesisSupported()) {
    onError?.('Text-to-speech is not supported in this browser.');
    return () => {};
  }

  window.speechSynthesis.cancel();

  let cancelled = false;

  loadVoices().then((voices) => {
    if (cancelled) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_MAP[language] ?? 'en-US';
    utterance.rate = 0.88;
    utterance.pitch = 1.08;
    utterance.volume = 0.9;

    const voice = pickVoice(voices, language);
    if (voice) utterance.voice = voice;

    utterance.onend = () => onEnd?.();
    utterance.onerror = (e) => {
      if (!cancelled) onError?.(`TTS error: ${e.error}`);
    };

    if (!cancelled) {
      window.speechSynthesis.speak(utterance);
    }
  });

  return () => {
    cancelled = true;
    window.speechSynthesis.cancel();
  };
}

export function cancelSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}
