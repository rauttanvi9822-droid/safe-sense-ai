/**
 * MOCK ASSESSMENT ENGINE — PROTOTYPE ONLY
 *
 * This module simulates AI assessment for demonstration purposes.
 * It uses keyword pattern matching and deterministic weighted scoring.
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
  structuredData?: Record<string, number>;
  demoScenario?: DemoScenario;
}

export interface AnalysisOutput extends SVIResult { }

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
      confidence: detected ? 0.78 : 0.12,
    };
  });

  const detectedCount = indicators.filter((i) => i.detected).length;

  const structuredScore = input.structuredData
    ? Object.values(input.structuredData).reduce((sum, value) => sum + value, 0) * 2.5
    : 0;
  let rawScore = detectedCount * 12 + structuredScore;

  // Demo mode override
  if (input.demoScenario) {
    rawScore = DEMO_SCORES[input.demoScenario];
  }

  const score = Math.min(100, Math.max(0, Math.round(rawScore)));
  const riskCategory = scoreToRisk(score);
  const traumaIndicator = ['trauma', 'nightmare', 'flashback', 'abuse', 'आघात'].some(keyword => lowerText.includes(keyword));
  const supportRisk = riskCategory === 'CRITICAL' || lowerText.includes('unsafe')
    ? 'URGENT_SUPPORT'
    : riskCategory === 'HIGH' ? 'HIGH_SUPPORT_NEED'
      : riskCategory === 'MODERATE' ? 'MODERATE_SUPPORT_NEED' : 'LOW_SUPPORT_NEED';

  return {
    score,
    riskCategory,
    indicators,
    confidence: Math.min(0.85, 0.55 + Math.min(0.25, detectedCount * 0.03)),
    recommendedSupport: supportForRisk(riskCategory),
    timestamp: new Date().toISOString(),
    isPrototype: true,
    supportRisk,
    traumaIndicator,
  };
}

// ─── Structured question set ───────────────────────────────────────────────────
export interface AssessmentQuestion {
  id: string;
  text: Record<Language, string>;
  options?: AssessmentOption[];
  followUpTrigger?: string[]; // keywords that trigger follow-ups
  followUpQuestion?: Record<Language, string>;
}

export interface AssessmentOption {
  value: number;
  label: Record<Language, string>;
}

const FREQUENCY_OPTIONS: AssessmentOption[] = [
  { value: 0, label: { en: 'Never', hi: 'कभी नहीं', mr: 'कधीच नाही' } },
  { value: 1, label: { en: 'Rarely', hi: 'बहुत कम', mr: 'क्वचित' } },
  { value: 2, label: { en: 'Sometimes', hi: 'कभी-कभी', mr: 'कधीकधी' } },
  { value: 3, label: { en: 'Often', hi: 'अक्सर', mr: 'अनेकदा' } },
  { value: 4, label: { en: 'Almost always', hi: 'लगभग हमेशा', mr: 'जवळजवळ नेहमी' } },
];

const QUALITY_OPTIONS: AssessmentOption[] = [
  { value: 0, label: { en: 'Very good', hi: 'बहुत अच्छी', mr: 'खूप चांगली' } },
  { value: 1, label: { en: 'Mostly good', hi: 'अधिकतर अच्छी', mr: 'बहुतेक चांगली' } },
  { value: 2, label: { en: 'Up and down', hi: 'कभी अच्छी, कभी खराब', mr: 'कधी चांगली, कधी खराब' } },
  { value: 3, label: { en: 'Mostly difficult', hi: 'अधिकतर मुश्किल', mr: 'बहुतेक कठीण' } },
  { value: 4, label: { en: 'Very difficult', hi: 'बहुत मुश्किल', mr: 'खूप कठीण' } },
];

const ENERGY_OPTIONS: AssessmentOption[] = [
  { value: 0, label: { en: 'Full of energy', hi: 'ऊर्जा से भरपूर', mr: 'ऊर्जेने भरलेले' } },
  { value: 1, label: { en: 'Mostly okay', hi: 'अधिकतर ठीक', mr: 'बहुतेक ठीक' } },
  { value: 2, label: { en: 'Up and down', hi: 'कभी अच्छी, कभी कम', mr: 'कधी चांगली, कधी कमी' } },
  { value: 3, label: { en: 'Often low', hi: 'अक्सर कम', mr: 'अनेकदा कमी' } },
  { value: 4, label: { en: 'Exhausted', hi: 'बहुत थका हुआ', mr: 'खूप थकलेले' } },
];

const WELLBEING_OPTIONS: AssessmentOption[] = [
  { value: 0, label: { en: 'Quite okay', hi: 'काफी ठीक', mr: 'बऱ्यापैकी ठीक' } },
  { value: 1, label: { en: 'Mostly okay', hi: 'अधिकतर ठीक', mr: 'बहुतेक ठीक' } },
  { value: 2, label: { en: 'Up and down', hi: 'कभी ठीक, कभी मुश्किल', mr: 'कधी ठीक, कधी कठीण' } },
  { value: 3, label: { en: 'Having a hard time', hi: 'मुश्किल समय चल रहा है', mr: 'कठीण काळातून जात आहे' } },
  { value: 4, label: { en: 'Very difficult', hi: 'बहुत मुश्किल', mr: 'खूप कठीण' } },
];

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'q1',
    options: WELLBEING_OPTIONS,
    text: {
      en: 'Before we get started, I\'d like to understand how you\'ve been feeling lately. There are no right or wrong answers. How have you been feeling emotionally over the last few days?',
      hi: 'शुरू करने से पहले, मैं समझना चाहता हूँ कि आप हाल में कैसा महसूस कर रहे हैं। कोई सही या गलत जवाब नहीं है। पिछले कुछ दिनों में आप भावनात्मक रूप से कैसा महसूस कर रहे हैं?',
      mr: 'सुरुवात करण्यापूर्वी, तुम्हाला अलीकडे कसे वाटत आहे हे मला समजून घ्यायचे आहे. येथे योग्य किंवा अयोग्य उत्तरे नाहीत. गेल्या काही दिवसांत तुम्हाला भावनिकदृष्ट्या कसे वाटले?',
    },
  },
  {
    id: 'q2',
    options: QUALITY_OPTIONS,
    text: {
      en: 'How has your sleep been recently? Has anything about your sleep changed?',
      hi: 'हाल में आपकी नींद कैसी रही है? क्या आपकी नींद में कोई बदलाव आया है?',
      mr: 'अलीकडे तुमची झोप कशी झाली आहे? तुमच्या झोपेत काही बदल झाला आहे का?',
    },
  },
  {
    id: 'q3',
    options: ENERGY_OPTIONS,
    text: {
      en: 'How has your energy been during the day?',
      hi: 'दिन में आपकी ऊर्जा कैसी रही है?',
      mr: 'दिवसभर तुमची ऊर्जा कशी राहिली आहे?',
    },
  },
  {
    id: 'q4',
    options: FREQUENCY_OPTIONS,
    text: {
      en: 'When you study, work, or do usual activities, have you found it difficult to concentrate?',
      hi: 'पढ़ाई, काम या रोज़मर्रा के कामों में ध्यान लगाना आपके लिए कितना मुश्किल रहा है?',
      mr: 'अभ्यास, काम किंवा नेहमीच्या गोष्टी करताना लक्ष केंद्रित करणे कठीण झाले आहे का?',
    },
  },
  {
    id: 'q5',
    options: FREQUENCY_OPTIONS,
    text: {
      en: 'How often have you found yourself worrying or overthinking things?',
      hi: 'आप खुद को कितनी बार चिंता करते या किसी बात को बार-बार सोचते हुए पाते हैं?',
      mr: 'तुम्ही किती वेळा काळजी करताना किंवा एखाद्या गोष्टीचा सतत विचार करताना स्वतःला पाहता?',
    },
  },
  {
    id: 'q6',
    options: FREQUENCY_OPTIONS,
    text: {
      en: 'Has anything been weighing on your mind recently?',
      hi: 'क्या हाल में कोई बात आपके मन पर बोझ बनी हुई है?',
      mr: 'अलीकडे तुमच्या मनावर एखादी गोष्ट भार बनून राहिली आहे का?',
    },
  },
  {
    id: 'q7',
    options: FREQUENCY_OPTIONS,
    text: {
      en: 'Have you felt like talking to people, or have you wanted to stay by yourself?',
      hi: 'क्या आपका लोगों से बात करने का मन हुआ है, या आप अकेले रहना चाहते हैं?',
      mr: 'तुम्हाला लोकांशी बोलावेसे वाटले की एकटे राहावेसे वाटले?',
    },
  },
  {
    id: 'q8',
    options: FREQUENCY_OPTIONS,
    text: {
      en: 'Have you noticed restlessness, tension, headaches, racing thoughts, or difficulty relaxing?',
      hi: 'क्या आपने बेचैनी, तनाव, सिरदर्द, तेज़ विचार या आराम करने में कठिनाई देखी है?',
      mr: 'तुम्हाला अस्वस्थता, ताण, डोकेदुखी, वेगवान विचार किंवा आराम करण्यात अडचण जाणवली आहे का?',
    },
  },
  {
    id: 'q9',
    options: WELLBEING_OPTIONS,
    text: {
      en: 'If you had to describe the last few days in your own words, what would you say?',
      hi: 'अगर आप पिछले कुछ दिनों का वर्णन अपने शब्दों में करें, तो आप क्या कहेंगे?',
      mr: 'गेल्या काही दिवसांचे तुमच्या स्वतःच्या शब्दांत वर्णन करायचे झाल्यास तुम्ही काय सांगाल?',
    },
  },
];

export const REASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'r1',
    text: {
      en: 'Since your last check-in, how have you been feeling overall?',
      hi: 'आपके पिछले चेक-इन के बाद से आप कुल मिलाकर कैसा महसूस कर रहे हैं?',
      mr: 'तुमच्या मागील चेक-इनपासून तुम्हाला एकूण कसे वाटत आहे?',
    },
    options: WELLBEING_OPTIONS,
  },
  {
    id: 'r2',
    text: {
      en: 'Compared with before, how does your stress feel now?',
      hi: 'पहले की तुलना में अब आपका तनाव कैसा महसूस होता है?',
      mr: 'आधीच्या तुलनेत आता तुमचा ताण कसा वाटतो?',
    },
    options: [
      { value: 0, label: { en: 'Much lower', hi: 'बहुत कम', mr: 'खूप कमी' } },
      { value: 1, label: { en: 'A little lower', hi: 'थोड़ा कम', mr: 'थोडा कमी' } },
      { value: 2, label: { en: 'About the same', hi: 'लगभग समान', mr: 'जवळपास तसाच' } },
      { value: 3, label: { en: 'A little higher', hi: 'थोड़ा अधिक', mr: 'थोडा जास्त' } },
      { value: 4, label: { en: 'Much higher', hi: 'बहुत अधिक', mr: 'खूप जास्त' } },
    ],
  },
  {
    id: 'r3',
    text: {
      en: 'How has your sleep been recently?',
      hi: 'हाल में आपकी नींद कैसी रही है?',
      mr: 'अलीकडे तुमची झोप कशी झाली आहे?',
    },
    options: QUALITY_OPTIONS,
  },
  {
    id: 'r4',
    text: {
      en: 'How manageable have your usual daily activities felt?',
      hi: 'आपके रोज़मर्रा के काम कितने संभालने योग्य लगे?',
      mr: 'तुमची नेहमीची दैनंदिन कामे किती सहज करता आली?',
    },
    options: QUALITY_OPTIONS,
  },
  {
    id: 'r5',
    text: {
      en: 'Is there anything new you would like to talk about today?',
      hi: 'क्या आज कोई नई बात है जिसके बारे में आप बात करना चाहेंगे?',
      mr: 'आज तुम्हाला कोणत्या नवीन गोष्टीबद्दल बोलायचे आहे का?',
    },
  },
];

const REASSESSMENT_QUESTION_BANK: AssessmentQuestion[] = [
  ...REASSESSMENT_QUESTIONS,
  {
    id: 'b1',
    text: { en: 'How overwhelmed have you felt by things recently?', hi: 'हाल में चीज़ों से आप कितना अभिभूत महसूस कर रहे हैं?', mr: 'अलीकडे गोष्टींमुळे तुम्हाला किती भारावून गेल्यासारखे वाटले?' },
    options: FREQUENCY_OPTIONS,
  },
  {
    id: 'b2',
    text: { en: 'How supported do you feel by the people around you?', hi: 'आपके आसपास के लोगों से आपको कितना सहारा मिलता है?', mr: 'तुमच्या आजूबाजूच्या लोकांकडून तुम्हाला किती आधार मिळतो?' },
    options: [
      { value: 0, label: { en: 'Very supported', hi: 'बहुत सहारा मिलता है', mr: 'खूप आधार मिळतो' } },
      { value: 1, label: { en: 'Somewhat supported', hi: 'कुछ सहारा मिलता है', mr: 'काहीसा आधार मिळतो' } },
      { value: 3, label: { en: 'Not very supported', hi: 'बहुत कम सहारा', mr: 'फारसा आधार नाही' } },
      { value: 4, label: { en: 'I feel completely alone', hi: 'मैं बिल्कुल अकेला महसूस करता/करती हूँ', mr: 'मला पूर्णपणे एकटे वाटते' } },
    ],
  },
  {
    id: 'b3',
    text: { en: 'How much interest or motivation have you had for things that matter to you?', hi: 'आपके लिए महत्वपूर्ण चीज़ों में आपकी रुचि या motivation कैसी रही?', mr: 'तुमच्यासाठी महत्त्वाच्या गोष्टींमध्ये तुमची आवड किंवा प्रेरणा कशी राहिली?' },
    options: QUALITY_OPTIONS,
  },
  {
    id: 'b4',
    text: { en: 'How easy has it been to handle your usual responsibilities?', hi: 'अपनी रोज़मर्रा की ज़िम्मेदारियाँ संभालना कितना आसान रहा?', mr: 'तुमच्या नेहमीच्या जबाबदाऱ्या सांभाळणे किती सोपे राहिले?' },
    options: QUALITY_OPTIONS,
  },
  {
    id: 'b5',
    text: { en: 'How often have your thoughts kept circling when you wanted to rest?', hi: 'आराम करना चाहने पर आपके विचार कितनी बार घूमते रहते हैं?', mr: 'विश्रांती घ्यायची असताना तुमचे विचार किती वेळा फिरत राहिले?' },
    options: FREQUENCY_OPTIONS,
  },
  {
    id: 'b6',
    text: { en: 'How connected have you felt to people or activities you care about?', hi: 'जिन लोगों या गतिविधियों की आपको परवाह है, उनसे आप कितना जुड़ा महसूस करते हैं?', mr: 'ज्या लोकांची किंवा गोष्टींची तुम्हाला काळजी आहे त्यांच्याशी तुम्ही किती जोडलेले वाटले?' },
    options: QUALITY_OPTIONS,
  },
];

export function getReassessmentQuestions(previousCount: number): AssessmentQuestion[] {
  const size = 5;
  const start = (previousCount * 3) % REASSESSMENT_QUESTION_BANK.length;
  return Array.from({ length: size }, (_, index) =>
    REASSESSMENT_QUESTION_BANK[(start + index) % REASSESSMENT_QUESTION_BANK.length],
  );
}

// ─── Re-exported chat response helper for VoiceAssistantPage ─────────────────
export function generateChatResponse(userMsg: string, history: any[]): string {
  const lower = userMsg.toLowerCase();
  const critical = ['kill myself', 'end my life', 'suicide', 'want to die'];
  if (critical.some(k => lower.includes(k))) {
    return "I hear that you're going through something very difficult. Your life matters. Please reach out to a trained support professional immediately or contact emergency services. You don't have to face this alone.";
  }
  if (lower.match(/afraid|scared|danger|unsafe|threatened/)) {
    return "It sounds like you're in a difficult situation. I'm here to listen. Can you tell me more about what's been happening? Your safety matters.";
  }
  if (lower.match(/sad|hopeless|helpless|crying|alone|lonely/)) {
    return "I hear that you're going through a hard time. Those feelings are valid. Would you like help finding the right kind of support for what you're experiencing?";
  }
  const responses = [
    "Thank you for sharing that. Can you tell me more about how things have been for you recently?",
    "I hear you. How long have you been feeling this way?",
    "I appreciate you talking with me. Is there anything specific you need help with right now?",
    "That's helpful to know. How are you feeling physically — things like sleep and energy?",
  ];
  return responses[history.length % responses.length];
}

