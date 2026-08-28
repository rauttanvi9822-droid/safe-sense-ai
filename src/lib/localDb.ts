/**
 * SafeSense AI — Application-wide persistent storage
 * Uses the backend API when available, with localStorage fallback for offline/demo.
 */

import type { SVIResult } from '../types';
import { getStoredUser } from './mockAuth';

const STORAGE_KEY_PREFIX = 'safesense_app_data:';

function storageKey(): string {
  try {
    const user = getStoredUser();
    return `${STORAGE_KEY_PREFIX}${user?.id ?? 'guest'}`;
  } catch {
    return `${STORAGE_KEY_PREFIX}guest`;
  }
}

interface AppData {
  assessments: StoredAssessment[];
  checkIns: StoredCheckIn[];
  supportRequests: StoredSupportRequest[];
  followUps: StoredFollowUp[];
  chatSessions: Record<string, StoredMessage[]>;
  conversationSnapshots: StoredConversationSnapshot[];
  memoryHighlights: string[];
}

export interface StoredAssessment {
  id: string;
  case_ref: string;
  date: string;
  language: string;
  interaction_mode: string;
  svi: number;
  risk: string;
  status: string;
  result: SVIResult;
  indicators?: any[];
  recommendations?: any[];
}

export interface StoredCheckIn {
  id: string;
  date: string;
  mood: number;
  stress_level: number;
  safety_level: number;
  emotional_wellbeing: number;
  support_needed: boolean;
  notes?: string;
}

export interface StoredSupportRequest {
  id: string;
  type: string;
  message?: string;
  status: 'pending' | 'assigned' | 'contacted' | 'resolved';
  created_at: string;
  assessment_id?: string;
}

export interface StoredFollowUp {
  id: string;
  scheduled_date: string;
  completed: boolean;
  notes?: string;
  assessment_id?: string;
}

export interface StoredMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export interface StoredConversationSnapshot {
  id: string;
  date: string;
  score: number;
  previousScore: number;
  risk: string;
  note: string;
  thought: string;
}

function messageTokens(value: string): Set<string> {
  return new Set((value.toLowerCase().match(/[a-z]{3,}/g) ?? [])
    .filter(token => !['the', 'and', 'that', 'with', 'this', 'from'].includes(token)));
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(storageKey());
    if (raw) return JSON.parse(raw) as AppData;
  } catch {
    // ignore
  }
  return { assessments: [], checkIns: [], supportRequests: [], followUps: [], chatSessions: {}, conversationSnapshots: [], memoryHighlights: [] };
}

function save(data: AppData): void {
  localStorage.setItem(storageKey(), JSON.stringify(data));
}

export const localDb = {
  saveAssessment(a: StoredAssessment): void {
    const data = load();
    const idx = data.assessments.findIndex(x => x.id === a.id);
    if (idx >= 0) data.assessments[idx] = a;
    else data.assessments.unshift(a);
    save(data);
  },

  getAssessments(): StoredAssessment[] {
    return load().assessments;
  },

  getLatestAssessment(): StoredAssessment | null {
    const list = load().assessments;
    return list[0] ?? null;
  },

  saveConversationSnapshot(message: string): StoredConversationSnapshot | null {
    const latest = this.getLatestAssessment();
    if (!latest) return null;
    const lower = message.toLowerCase();
    const isImproving = /better|calmer|okay|fine|improving|हल्का|ठीक|बरं/.test(lower);
    const isHeavy = /stress|overwhelmed|anxious|afraid|lonely|alone|failed|pressure|दबाव|चिंता|ताण/.test(lower);
    const shift = isImproving ? -6 : isHeavy ? 4 : 0;
    const score = Math.max(0, Math.min(100, latest.svi + shift));
    const risk = score <= 25 ? 'LOW' : score <= 50 ? 'MODERATE' : score <= 75 ? 'HIGH' : 'CRITICAL';
    const note = isImproving
      ? 'You made space to notice what is feeling a little better today.'
      : isHeavy
        ? 'You have been carrying quite a lot. You do not have to handle everything at once.'
        : 'You took a moment to check in with yourself today. That matters.';
    const thought = isImproving
      ? 'Small signs of easing count, even when progress feels quiet.'
      : isHeavy
        ? 'You do not have to fix your whole life today. One honest moment is enough for now.'
        : 'You are allowed to take this one conversation, and one day, at a time.';
    const snapshot: StoredConversationSnapshot = {
      id: `conversation-${Date.now()}`,
      date: new Date().toISOString(),
      score,
      previousScore: latest.svi,
      risk,
      note,
      thought,
    };
    const data = load();
    data.conversationSnapshots = [snapshot, ...(data.conversationSnapshots ?? [])].slice(0, 30);
    save(data);
    return snapshot;
  },

  getLatestConversationSnapshot(): StoredConversationSnapshot | null {
    return load().conversationSnapshots?.[0] ?? null;
  },

  saveTodayCheckIn(c: StoredCheckIn): void {
    const data = load();
    const today = new Date().toISOString().slice(0, 10);
    const idx = data.checkIns.findIndex(x => x.date === today);
    if (idx >= 0) data.checkIns[idx] = c;
    else data.checkIns.unshift(c);
    save(data);
  },

  getTodayCheckIn(): StoredCheckIn | null {
    const today = new Date().toISOString().slice(0, 10);
    return load().checkIns.find(c => c.date === today) ?? null;
  },

  getCheckInHistory(): StoredCheckIn[] {
    return load().checkIns.slice(0, 30);
  },

  addSupportRequest(r: StoredSupportRequest): void {
    const data = load();
    data.supportRequests.unshift(r);
    save(data);
  },

  getSupportRequests(): StoredSupportRequest[] {
    return load().supportRequests;
  },

  updateSupportRequestStatus(id: string, status: StoredSupportRequest['status']): void {
    const data = load();
    const idx = data.supportRequests.findIndex(r => r.id === id);
    if (idx >= 0) data.supportRequests[idx].status = status;
    save(data);
  },

  addFollowUp(f: StoredFollowUp): void {
    const data = load();
    data.followUps.unshift(f);
    save(data);
  },

  getFollowUps(): StoredFollowUp[] {
    return load().followUps;
  },

  getChatMessages(sessionId: string): StoredMessage[] {
    return load().chatSessions[sessionId] ?? [];
  },

  getRelevantChatMemories(query: string, _sessionId?: string): string[] {
    const data = load();
    const queryTokens = messageTokens(query);
    if (!queryTokens.size) return [];
    const messages = (data.memoryHighlights ?? []).map(content => ({ content, timestamp: '' }));
    return messages
      .map(message => ({
        content: message.content,
        score: [...messageTokens(message.content)].filter(token => queryTokens.has(token)).length,
        timestamp: message.timestamp,
      }))
      .filter(message => message.score > 0 && message.content.length <= 240)
      .sort((a, b) => b.score - a.score || b.timestamp.localeCompare(a.timestamp))
      .slice(0, 2)
      .map(message => message.content);
  },

  getStoredConversationHighlights(): string[] {
    const data = load();
    return (data.memoryHighlights ?? []).slice().reverse();
  },

  clearConversationHighlights(): void {
    const data = load();
    data.memoryHighlights = [];
    save(data);
  },

  addChatMessage(sessionId: string, msg: StoredMessage): void {
    const data = load();
    if (!data.chatSessions[sessionId]) data.chatSessions[sessionId] = [];
    data.chatSessions[sessionId].push(msg);
    if (msg.role === 'user' && msg.content.length >= 12 && msg.content.length <= 240 && !/(suicide|kill myself|hurt myself|self harm|password|address)/i.test(msg.content)) {
      data.memoryHighlights = [...(data.memoryHighlights ?? []), msg.content]
        .filter((value, index, values) => values.indexOf(value) === index)
        .slice(-30);
    }
    save(data);
  },

  clearChatSession(sessionId: string): void {
    const data = load();
    delete data.chatSessions[sessionId];
    save(data);
  },

  clearAll(): void {
    localStorage.removeItem(storageKey());
  },
};
