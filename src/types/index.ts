// ─── Roles ────────────────────────────────────────────────────────────────────
export type UserRole = 'victim' | 'counsellor' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  language: Language;
  createdAt: string;
}

// ─── Language ─────────────────────────────────────────────────────────────────
export type Language = 'en' | 'hi' | 'mr';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
}

// ─── Interaction Mode ─────────────────────────────────────────────────────────
export type InteractionMode = 'text' | 'voice';

// ─── Assessment ───────────────────────────────────────────────────────────────
export type RiskCategory = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface AssessmentIndicator {
  id: string;
  label: string;
  category: 'fear' | 'distress' | 'safety' | 'trauma' | 'isolation' | 'anxiety' | 'threat';
  detected: boolean;
  confidence: number;
}

export interface SVIResult {
  score: number;
  riskCategory: RiskCategory;
  indicators: AssessmentIndicator[];
  confidence: number;
  recommendedSupport: string;
  timestamp: string;
  isPrototype: true;
  supportRisk?: string;
  traumaIndicator?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: string;
}

export interface Assessment {
  id: string;
  caseId: string;
  userId?: string;
  language: Language;
  interactionMode: InteractionMode;
  messages: ChatMessage[];
  sviResult?: SVIResult;
  status: 'in_progress' | 'completed' | 'reviewed';
  createdAt: string;
  completedAt?: string;
}

// ─── Case ─────────────────────────────────────────────────────────────────────
export interface Case {
  id: string;
  caseRef: string;
  assessments: Assessment[];
  counsellorId?: string;
  status: 'open' | 'under_review' | 'closed' | 'follow_up';
  lastAssessmentDate?: string;
  latestSVI?: SVIResult;
  followUpDate?: string;
  notes?: string;
}

// ─── Support Resource ─────────────────────────────────────────────────────────
export type ResourceCategory =
  | 'mental_health'
  | 'counselling'
  | 'legal'
  | 'victim_support'
  | 'emergency'
  | 'educational';

export interface SupportResource {
  id: string;
  name: string;
  description: string;
  category: ResourceCategory;
  contact?: string;
  website?: string;
  availability?: string;
  isVerified: boolean;
  isActive: boolean;
  addedBy: string;
  createdAt: string;
}

// ─── Counsellor ───────────────────────────────────────────────────────────────
export interface Counsellor {
  id: string;
  userId: string;
  name: string;
  specialization: string;
  activeCases: number;
  availability: 'available' | 'busy' | 'offline';
}

// ─── Demo Mode ────────────────────────────────────────────────────────────────
export type DemoScenario = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface DemoModeState {
  active: boolean;
  scenario: DemoScenario;
}

// ─── Onboarding State ─────────────────────────────────────────────────────────
export interface OnboardingState {
  consentGiven: boolean;
  language: Language;
  interactionMode: InteractionMode;
  step: 'consent' | 'language' | 'mode' | 'assessment';
  assessmentType?: 'initial' | 'reassessment';
}
