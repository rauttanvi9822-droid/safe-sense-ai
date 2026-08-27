/**
 * MOCK ASSESSMENT ENGINE — PROTOTYPE ONLY
 *
 * This module simulates AI assessment for demonstration purposes.
 * It uses keyword pattern matching and random weighted scoring.
 *
 * IMPORTANT DISCLAIMERS:
 * - This is NOT a clinically validated tool.
 * - This does NOT provide a medical or psychiatric diagnosis.
 * - Thresholds are prototype decision-support values only.
 * - A real implementation must connect to a validated AI/ML service
 *   via POST /api/assessment/analyze
 *
 * See: src/lib/assessmentApiStub.ts for the API contract.
 */

import type { AssessmentIndicator, RiskCategory, SVIResult, Language, DemoScenario } from '../types';

// ─── Keyword patterns for indicator detection ─────────────────────────────────
// These are illustrative only and NOT clinically derived.

const INDICATOR_PATTERNS: {
  category: AssessmentIndicator['category'];
  label: string;
  patterns: string[];
}[] = [
  {
    category: 'fear',
    label: 'Elevated fear indicators',
    patterns: ['afraid', 'scared', 'fear', 'terrified', 'frightened', 'डर', 'भय', 'घाबरणे'],
  },
  {
    category: 'distress',
    label: 'Distress-related language',
    patterns: ['distressed', 'upset', 'crying', 'hopeless', 'helpless', 'desperate', 'दुखी', 'निराश'],
  },
  {
    category: 'safety',
    label: 'Safety concern indicators',
    patterns: ['unsafe', 'not safe', 'danger', 'hurt', 'harm', 'violence', 'असुरक्षित', 'खतरा'],
  },
  {
    category: 'trauma',
    label: 'Trauma-related language',
    patterns: ['trauma', 'nightmare', 'flashback', 'attack', 'abuse', 'assault', 'आघात'],
  },
  {
    category: 'isolation',
    label: 'Social isolation indicators',
    patterns: ['alone', 'isolated', 'no one', 'nobody', 'lonely', 'अकेला', 'एकटा'],
  },
  {
    category: 'anxiety',
    label: 'Anxiety-related language',
    patterns: ['anxious', 'panic', 'worry', 'nervous', 'overwhelmed', 'can\'t sleep', 'चिंता', 'घबराहट'],
  },
  {
    category: 'threat',
    label: 'Threat/intimidation indicators',
    patterns: ['threatened', 'threatened me', 'intimidated', 'warned', 'blackmail', 'धमकी'],
  },
];

// ─── Risk band mapping ─────────────────────────────────────────────────────────
// NOTE: Prototype thresholds — not clinically validated.
function scoreToRisk(score: number): RiskCategory {
  if (score <= 25) return 'LOW';
  if (score <= 50) return 'MODERATE';
  if (score <= 75) return 'HIGH';
  return 'CRITICAL';
}

function supportForRisk(risk: RiskCategory): string {
  const map: Record<RiskCategory, string> = {
    LOW: 'General information and self-help resources recommended.',
    MODERATE: 'Counsellor consultation recommended. Follow-up assessment advised.',
    HIGH: 'Prompt human support recommended. Priority counsellor review advised.',
    CRITICAL: 'Immediate human support recommended. Please contact available support services.',
  };
  return map[risk];
}

// ─── Demo scenario overrides ───────────────────────────────────────────────────
const DEMO_SCORES: Record<DemoScenario, number> = {
  LOW: 18,
  MODERATE: 42,
  HIGH: 67,
  CRITICAL: 84,
};

// ─── Main analysis function ────────────────────────────────────────────────────
export interface AnalysisInput {
  text: string;
  language: Language;
  voiceMetadata?: { pitchVariance?: number; speechRate?: number };
  demoScenario?: DemoScenario;
}

export interface AnalysisOutput extends SVIResult {}

export function mockAnalyzeAssessment(input: AnalysisInput): AnalysisOutput {
  const lowerText = input.text.toLowerCase();

  // Detect indicators
  const indicators: AssessmentIndicator[] = INDICATOR_PATTERNS.map((p, i) => {
    const detected = p.patterns.some((kw) => lowerText.includes(kw));
    return {
      id: `ind-${i}`,
      label: p.label,
      category: p.category,
      detected,
      confidence: detected ? 0.6 + Math.random() * 0.35 : 0.1 + Math.random() * 0.2,
    };
  });

  const detectedCount = indicators.filter((i) => i.detected).length;

  // Base SVI from detected indicators (each contributes ~10-14 points)
  let rawScore = detectedCount * 12 + Math.random() * 10;

  // Demo mode override
  if (input.demoScenario) {
    rawScore = DEMO_SCORES[input.demoScenario] + (Math.random() * 6 - 3);
  }

  const score = Math.min(100, Math.max(0, Math.round(rawScore)));
  const riskCategory = scoreToRisk(score);

  return {
    score,
    riskCategory,
    indicators,
    confidence: 0.55 + Math.random() * 0.3, // Intentionally low to signal prototype status
    recommendedSupport: supportForRisk(riskCategory),
    timestamp: new Date().toISOString(),
    isPrototype: true,
  };
}

// ─── Structured question set ───────────────────────────────────────────────────
export interface AssessmentQuestion {
  id: string;
  text: Record<Language, string>;
  followUpTrigger?: string[]; // keywords that trigger follow-ups
  followUpQuestion?: Record<Language, string>;
}

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'q1',
    text: {
      en: 'Thank you for being here. How are you feeling right now? You can share as much or as little as you\'d like.',
      hi: 'यहाँ आने के लिए धन्यवाद। आप अभी कैसा महसूस कर रहे हैं? आप जितना चाहें उतना या कम साझा कर सकते हैं।',
      mr: 'इथे येण्याबद्दल आभारी आहोत. तुम्हाला आत्ता कसे वाटत आहे? तुम्हाला हवे तितके किंवा कमी सांगू शकता.',
    },
  },
  {
    id: 'q2',
    text: {
      en: 'Are there things that have been worrying or concerning you lately?',
      hi: 'क्या हाल ही में कुछ ऐसा हुआ है जो आपको चिंतित या परेशान कर रहा है?',
      mr: 'अलीकडे असे काही आहे का जे तुम्हाला काळजी किंवा चिंता वाटत आहे?',
    },
  },
  {
    id: 'q3',
    text: {
      en: 'Do you feel safe where you are right now? You don\'t need to share your location.',
      hi: 'क्या आप अभी जहाँ हैं वहाँ सुरक्षित महसूस कर रहे हैं? आपको अपना स्थान साझा करने की ज़रूरत नहीं है।',
      mr: 'तुम्ही आत्ता जिथे आहात तिथे सुरक्षित वाटत आहे का? तुम्हाला तुमचे ठिकाण सांगण्याची गरज नाही.',
    },
  },
  {
    id: 'q4',
    text: {
      en: 'Is there someone you trust who you can talk to or who can support you right now?',
      hi: 'क्या कोई ऐसा व्यक्ति है जिस पर आप विश्वास करते हैं, जिससे आप बात कर सकते हैं या जो अभी आपका साथ दे सके?',
      mr: 'असे कोणी आहे का ज्यावर तुम्ही विश्वास ठेवता, ज्यांच्याशी तुम्ही बोलू शकता किंवा जे आत्ता तुम्हाला आधार देऊ शकतात?',
    },
  },
  {
    id: 'q5',
    text: {
      en: 'Have you experienced anything recently that was frightening or difficult for you?',
      hi: 'क्या हाल ही में आपके साथ कुछ ऐसा हुआ है जो डरावना या कठिन था?',
      mr: 'अलीकडे तुमच्यासोबत असे काही घडले आहे का जे भयावह किंवा कठीण होते?',
    },
  },
  {
    id: 'q6',
    text: {
      en: 'How have you been sleeping and eating lately?',
      hi: 'हाल ही में आपकी नींद और खाने-पीने की स्थिति कैसी रही है?',
      mr: 'अलीकडे तुमची झोप आणि खाणे-पिणे कसे आहे?',
    },
  },
  {
    id: 'q7',
    text: {
      en: 'Is there anything specific you would like help or support with today?',
      hi: 'क्या आज कुछ विशेष है जिसके बारे में आप सहायता या समर्थन चाहते हैं?',
      mr: 'आज असे काही विशेष आहे का ज्यासाठी तुम्हाला मदत किंवा आधार हवा आहे?',
    },
  },
];
