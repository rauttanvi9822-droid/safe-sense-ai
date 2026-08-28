"""
SafeSense AI — AI/ML Service
NLP pipeline, emotion signals, stress features, SVI calculation, risk classification.

IMPORTANT DISCLAIMERS:
- This is a transparent baseline scoring system, NOT a clinically validated tool.
- It does NOT diagnose any medical or psychiatric condition.
- Thresholds and weights are prototype values only.
- The architecture is structured so a trained ML model can replace the baseline later.
- Model version is recorded with every result so scoring can be reproduced.
"""

import re
import math
from typing import Optional
from dataclasses import dataclass, field, asdict

import numpy as np

# ─── NLP Setup ────────────────────────────────────────────────────────────────
# NLTK data downloads happen once; guarded to avoid failures on cold start.
try:
    import nltk
    from nltk.tokenize import word_tokenize, sent_tokenize
    from nltk.corpus import stopwords
    for resource in ["punkt", "stopwords", "punkt_tab"]:
        try:
            nltk.data.find(f"tokenizers/{resource}")
        except LookupError:
            nltk.download(resource, quiet=True)
    _STOP_WORDS = set(stopwords.words("english"))
    _NLTK_OK = True
except Exception:
    _NLTK_OK = False
    _STOP_WORDS = set()

try:
    from textblob import TextBlob
    _TEXTBLOB_OK = True
except Exception:
    _TEXTBLOB_OK = False


MODEL_VERSION = "baseline-v1.0"

# ─── Keyword Indicator Patterns ────────────────────────────────────────────────
# Categories and example keywords. These are illustrative, not clinical instruments.

INDICATOR_PATTERNS = [
    {
        "id": "fear",
        "label": "Elevated fear indicators",
        "category": "fear",
        "weight": 18,
        "patterns": [
            "afraid", "scared", "fear", "terrified", "frightened", "horror",
            "dread", "panic", "phobia", "डर", "भय", "घाबरणे",
        ],
    },
    {
        "id": "distress",
        "label": "Distress-related language",
        "category": "distress",
        "weight": 16,
        "patterns": [
            "distressed", "upset", "crying", "hopeless", "helpless", "desperate",
            "worthless", "miserable", "shattered", "broken", "दुखी", "निराश",
        ],
    },
    {
        "id": "safety",
        "label": "Safety concern indicators",
        "category": "safety",
        "weight": 20,
        "patterns": [
            "unsafe", "not safe", "danger", "hurt", "harm", "violence",
            "attack", "weapon", "kill", "beat", "hit", "असुरक्षित", "खतरा",
        ],
    },
    {
        "id": "trauma",
        "label": "Trauma-related language",
        "category": "trauma",
        "weight": 17,
        "patterns": [
            "trauma", "nightmare", "flashback", "abuse", "assault", "rape",
            "torture", "witness", "accident", "आघात",
        ],
    },
    {
        "id": "isolation",
        "label": "Social isolation indicators",
        "category": "isolation",
        "weight": 12,
        "patterns": [
            "alone", "isolated", "no one", "nobody", "lonely", "abandoned",
            "ignored", "rejected", "अकेला", "एकटा",
        ],
    },
    {
        "id": "anxiety",
        "label": "Anxiety-related language",
        "category": "anxiety",
        "weight": 14,
        "patterns": [
            "anxious", "panic", "worry", "nervous", "overwhelmed",
            "can't sleep", "cannot sleep", "restless", "tense",
            "चिंता", "घबराहट",
        ],
    },
    {
        "id": "threat",
        "label": "Threat/intimidation indicators",
        "category": "threat",
        "weight": 19,
        "patterns": [
            "threatened", "threaten", "intimidated", "warned", "blackmail",
            "stalking", "following me", "watching me", "धमकी",
        ],
    },
    {
        "id": "overwhelm",
        "label": "Emotional overwhelm",
        "category": "distress",
        "weight": 13,
        "patterns": [
            "overwhelmed", "too much", "can't cope", "cannot cope",
            "breaking down", "falling apart", "losing control", "giving up",
        ],
    },
    {
        "id": "sleep",
        "label": "Sleep-related distress indicators",
        "category": "anxiety",
        "weight": 8,
        "patterns": [
            "can't sleep", "insomnia", "nightmares", "woke up", "night sweats",
            "afraid to sleep", "sleep problems",
        ],
    },
]

# ─── Protective Factor Patterns (reduce SVI) ──────────────────────────────────
PROTECTIVE_PATTERNS = [
    "support", "family", "friends", "helped", "counsellor", "therapy",
    "safe now", "doing better", "feel better", "recovering", "hope", "hopeful",
    "improving", "getting better",
]


# ─── Data Classes ─────────────────────────────────────────────────────────────

@dataclass
class DetectedIndicator:
    id: str
    label: str
    category: str
    detected: bool
    confidence: float
    pattern_matched: Optional[str] = None


@dataclass
class EmotionSignals:
    """
    Emotion-related signals derived from text.
    These are MODEL PREDICTIONS — not confirmed emotional states.
    """
    polarity: float = 0.0          # -1.0 (negative) to +1.0 (positive) — TextBlob
    subjectivity: float = 0.0      # 0.0 (objective) to 1.0 (subjective)
    distress_signal: float = 0.0   # 0–1 derived from polarity + keyword matching
    fear_signal: float = 0.0       # 0–1
    anger_signal: float = 0.0      # 0–1
    sadness_signal: float = 0.0    # 0–1
    neutral_signal: float = 0.0    # 0–1
    confidence: float = 0.0        # overall confidence in emotion model
    source: str = "textblob+keywords"  # track what drove the signal


@dataclass
class VoiceFeatures:
    """Non-diagnostic acoustic features derived from speech metadata."""
    available: bool = False
    speaking_rate_wpm: Optional[float] = None
    speech_duration_seconds: Optional[float] = None
    pause_count: Optional[int] = None
    avg_pause_duration_ms: Optional[float] = None
    stress_signal: float = 0.0  # 0–1 derived from voice features
    notes: str = ""


@dataclass
class SVIBreakdown:
    """Transparent breakdown of how SVI was calculated."""
    text_indicator_score: float = 0.0
    sentiment_penalty: float = 0.0
    protective_factor_reduction: float = 0.0
    voice_stress_contribution: float = 0.0
    structured_data_contribution: float = 0.0
    total_raw: float = 0.0
    final_score: int = 0
    model_version: str = MODEL_VERSION
    features_used: list = field(default_factory=list)


@dataclass
class AnalysisResult:
    """Complete multimodal analysis result."""
    score: int                                    # SVI 0–100
    risk_category: str                            # LOW | MODERATE | HIGH | CRITICAL
    indicators: list                              # List[DetectedIndicator as dict]
    confidence: float
    recommended_support: str
    timestamp: str
    is_prototype: bool = True
    emotion_signals: Optional[dict] = None
    voice_features: Optional[dict] = None
    breakdown: Optional[dict] = None
    modalities_analyzed: list = field(default_factory=list)
    recommendations: list = field(default_factory=list)
    model_version: str = MODEL_VERSION
    support_risk: str = "LOW_SUPPORT_NEED"
    trauma_indicator: bool = False


# ─── NLP Preprocessing ────────────────────────────────────────────────────────

def clean_text(text: str) -> str:
    """Basic text cleaning."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s\u0900-\u097f\u0600-\u06ff]", " ", text)  # keep Devanagari
    text = re.sub(r"\s+", " ", text)
    return text


def extract_tokens(text: str) -> list:
    """Tokenize text."""
    if _NLTK_OK:
        try:
            return word_tokenize(text)
        except Exception:
            pass
    return text.split()


def count_sentences(text: str) -> int:
    if _NLTK_OK:
        try:
            return len(sent_tokenize(text))
        except Exception:
            pass
    return max(1, text.count(".") + text.count("?") + text.count("!"))


# ─── Indicator Detection ──────────────────────────────────────────────────────

def detect_indicators(text: str) -> list[DetectedIndicator]:
    """Detect stress/trauma-related language indicators."""
    cleaned = clean_text(text)
    indicators = []
    for p in INDICATOR_PATTERNS:
        matched_pattern = None
        detected = False
        for kw in p["patterns"]:
            if kw in cleaned:
                detected = True
                matched_pattern = kw
                break
        # Confidence: keyword match → 0.65–0.85; no match → 0.05–0.20
        if detected:
            conf = 0.65 + min(0.20, len(matched_pattern) * 0.02)
        else:
            conf = 0.05 + 0.10 * (1 - len(p["patterns"]) / 20)
        indicators.append(DetectedIndicator(
            id=p["id"],
            label=p["label"],
            category=p["category"],
            detected=detected,
            confidence=round(conf, 3),
            pattern_matched=matched_pattern,
        ))
    return indicators


# ─── Sentiment / Emotion Signals ──────────────────────────────────────────────

def extract_emotion_signals(text: str, indicators: list[DetectedIndicator]) -> EmotionSignals:
    """
    Derive emotion-related signals.
    Source: TextBlob sentiment + keyword indicator weighting.
    IMPORTANT: These are model-derived SIGNALS, not confirmed emotional states.
    """
    signals = EmotionSignals()

    if _TEXTBLOB_OK:
        try:
            blob = TextBlob(text)
            signals.polarity = round(blob.sentiment.polarity, 3)
            signals.subjectivity = round(blob.sentiment.subjectivity, 3)
            signals.confidence = 0.60
        except Exception:
            signals.polarity = 0.0
            signals.confidence = 0.30

    # Derive signals from indicators
    fear_ind = next((i for i in indicators if i.id == "fear"), None)
    distress_ind = next((i for i in indicators if i.id == "distress"), None)
    threat_ind = next((i for i in indicators if i.id == "threat"), None)
    anxiety_ind = next((i for i in indicators if i.id == "anxiety"), None)

    signals.fear_signal = round(fear_ind.confidence if (fear_ind and fear_ind.detected) else 0.0, 3)
    signals.distress_signal = round(
        distress_ind.confidence if (distress_ind and distress_ind.detected) else
        max(0.0, -signals.polarity * 0.8), 3
    )
    signals.anger_signal = round(
        threat_ind.confidence * 0.6 if (threat_ind and threat_ind.detected) else 0.0, 3
    )
    signals.sadness_signal = round(
        (distress_ind.confidence + max(0.0, -signals.polarity)) / 2
        if (distress_ind and distress_ind.detected) else max(0.0, -signals.polarity * 0.5), 3
    )
    # Neutral signal: inverse of all other signals combined
    total_other = signals.fear_signal + signals.distress_signal + signals.anger_signal + signals.sadness_signal
    signals.neutral_signal = round(max(0.0, 1.0 - min(1.0, total_other)), 3)

    return signals


# ─── Voice Feature Stress Contribution ───────────────────────────────────────

def analyze_voice_features(voice_meta: Optional[dict]) -> VoiceFeatures:
    """
    Derive non-diagnostic stress signals from available speech metadata.
    These are indicators only — NOT diagnostic of any condition.
    """
    if not voice_meta:
        return VoiceFeatures(available=False, notes="No voice data available")

    vf = VoiceFeatures(available=True)
    vf.speaking_rate_wpm = voice_meta.get("speaking_rate_wpm")
    vf.speech_duration_seconds = voice_meta.get("speech_duration_seconds")
    vf.pause_count = voice_meta.get("pause_count")
    vf.avg_pause_duration_ms = voice_meta.get("avg_pause_duration_ms")

    stress_signals = []

    # Speaking rate: very fast (>200 wpm) or very slow (<80 wpm) may indicate stress
    if vf.speaking_rate_wpm is not None:
        if vf.speaking_rate_wpm > 200 or vf.speaking_rate_wpm < 80:
            stress_signals.append(0.35)
        else:
            stress_signals.append(0.05)

    # Many pauses may indicate emotional difficulty
    if vf.pause_count is not None and vf.pause_count > 5:
        stress_signals.append(min(0.40, vf.pause_count * 0.06))
    elif vf.pause_count is not None:
        stress_signals.append(0.05)

    if stress_signals:
        vf.stress_signal = round(min(1.0, sum(stress_signals) / len(stress_signals)), 3)
        vf.notes = "Voice-derived stress indicators (non-diagnostic)"
    else:
        vf.notes = "Insufficient voice features for signal extraction"

    return vf


# ─── SVI Calculation ──────────────────────────────────────────────────────────

def calculate_svi(
    text: str,
    indicators: list[DetectedIndicator],
    emotion: EmotionSignals,
    voice: VoiceFeatures,
    structured: Optional[dict] = None,
) -> tuple[int, SVIBreakdown]:
    """
    Transparent, reproducible SVI scoring.

    Architecture:
      text_indicator_score = sum of weights of detected indicators (max 100)
      sentiment_penalty = negative polarity adds up to 10 points
      protective_factor_reduction = presence of protective language reduces score
      voice_stress_contribution = voice signal adds up to 15 points
      structured_data_contribution = check-in data adds up to 15 points

    Model version: baseline-v1.0
    NOT clinically validated.
    """
    breakdown = SVIBreakdown()
    features_used = ["text_indicators", "sentiment"]

    # 1. Text indicator score (max ~100 from weights)
    max_possible_weight = sum(p["weight"] for p in INDICATOR_PATTERNS)
    detected_weight = sum(
        p["weight"] for p, ind in zip(INDICATOR_PATTERNS, indicators)
        if ind.detected
    )
    # Normalize to 0–70 range
    text_score = (detected_weight / max_possible_weight) * 70.0
    breakdown.text_indicator_score = round(text_score, 2)

    # 2. Sentiment penalty (negative sentiment → up to +10)
    if emotion.polarity < 0:
        sentiment_penalty = abs(emotion.polarity) * 10.0
    else:
        sentiment_penalty = 0.0
    breakdown.sentiment_penalty = round(sentiment_penalty, 2)
    features_used.append("sentiment_polarity")

    # 3. Protective factor reduction (up to -10)
    cleaned = clean_text(text)
    protective_count = sum(1 for kw in PROTECTIVE_PATTERNS if kw in cleaned)
    protective_reduction = min(10.0, protective_count * 2.5)
    breakdown.protective_factor_reduction = round(protective_reduction, 2)
    features_used.append("protective_factors")

    # 4. Voice stress contribution (up to +15)
    if voice.available:
        voice_contribution = voice.stress_signal * 15.0
        features_used.append("voice_features")
    else:
        voice_contribution = 0.0
    breakdown.voice_stress_contribution = round(voice_contribution, 2)

    # 5. Structured data contribution (check-in data, up to +15)
    structured_contribution = 0.0
    if structured:
        if any(key.startswith("q") for key in structured):
            # Conversational MCQs use 0–4, where 4 reflects more difficulty.
            question_values = [value for key, value in structured.items() if key.startswith("q")]
            structured_contribution = (sum(question_values) / max(1, len(question_values))) * 3.75
        else:
            # Daily check-in values: stress_level 1–5 contributes 0–15 pts.
            stress_level = structured.get("stress_level", 3)
            safety_level = structured.get("safety_level", 3)
            mood = structured.get("mood", 3)
            structured_contribution = (
                ((stress_level - 1) / 4.0) * 7.0 +
                ((5 - safety_level) / 4.0) * 5.0 +
                ((3 - mood) / 4.0) * 3.0
            )
        structured_contribution = max(0.0, min(15.0, structured_contribution))
        features_used.append("structured_checkin")
    breakdown.structured_data_contribution = round(structured_contribution, 2)

    # 6. Total raw score
    raw = text_score + sentiment_penalty - protective_reduction + voice_contribution + structured_contribution
    breakdown.total_raw = round(raw, 2)
    breakdown.features_used = features_used

    # 7. Clamp to 0–100
    final = max(0, min(100, round(raw)))
    breakdown.final_score = final

    return final, breakdown


# ─── Risk Classification ──────────────────────────────────────────────────────

def score_to_risk(score: int) -> str:
    """
    Prototype risk bands — NOT clinically validated.
    LOW: 0–24, MODERATE: 25–49, HIGH: 50–74, CRITICAL: 75–100
    """
    if score < 25:
        return "LOW"
    elif score < 50:
        return "MODERATE"
    elif score < 75:
        return "HIGH"
    else:
        return "CRITICAL"


# ─── Support Recommendation Engine ───────────────────────────────────────────

def generate_recommendations(
    risk: str,
    indicators: list[DetectedIndicator],
    emotion: EmotionSignals,
) -> tuple[str, list[dict]]:
    """Generate personalized support recommendations based on assessment results."""
    detected_categories = {i.category for i in indicators if i.detected}

    base_recommendations = {
        "LOW": "General wellbeing resources and self-help support recommended.",
        "MODERATE": "Counsellor consultation recommended. A follow-up assessment is advised.",
        "HIGH": "Prompt human support recommended. Priority counsellor review advised.",
        "CRITICAL": "Immediate human support recommended. Please contact available support services.",
    }
    recommended_support = base_recommendations[risk]

    recommendations = []

    if risk in ("HIGH", "CRITICAL"):
        recommendations.append({
            "type": "immediate",
            "title": "Request Human Support",
            "description": "Connect with a trained counsellor or support professional.",
            "action": "request_counsellor",
            "priority": 1,
        })

    if "safety" in detected_categories or "threat" in detected_categories:
        recommendations.append({
            "type": "safety",
            "title": "Safety Planning",
            "description": "Review your personal safety plan. If in immediate danger, contact emergency services.",
            "action": "view_safety_resources",
            "priority": 1,
        })

    if "trauma" in detected_categories:
        recommendations.append({
            "type": "counselling",
            "title": "Trauma-Informed Support",
            "description": "Consider speaking with a trained trauma support professional.",
            "action": "request_counsellor",
            "priority": 2,
        })

    if "isolation" in detected_categories:
        recommendations.append({
            "type": "social",
            "title": "Connect with Trusted Person",
            "description": "Reach out to someone you trust. Social connection can help.",
            "action": "contact_trusted_person",
            "priority": 2,
        })

    if "anxiety" in detected_categories or "fear" in detected_categories:
        recommendations.append({
            "type": "mental_health",
            "title": "Mental Wellbeing Support",
            "description": "Access mental wellbeing resources and breathing exercises.",
            "action": "view_mental_health_resources",
            "priority": 3,
        })

    if "distress" in detected_categories:
        recommendations.append({
            "type": "counselling",
            "title": "Emotional Support Session",
            "description": "A counselling session may help you process current feelings.",
            "action": "request_counsellor",
            "priority": 2,
        })

    recommendations.append({
        "type": "educational",
        "title": "Educational Resources",
        "description": "Learn more about stress, wellbeing, and available support.",
        "action": "view_resources",
        "priority": 4,
    })

    if risk in ("MODERATE", "HIGH", "CRITICAL"):
        recommendations.append({
            "type": "followup",
            "title": "Schedule Follow-Up",
            "description": "Schedule a follow-up check-in to track your progress.",
            "action": "request_followup",
            "priority": 3,
        })

    # Sort by priority
    recommendations.sort(key=lambda r: r["priority"])
    return recommended_support, recommendations


def classify_support_risk(risk: str, indicators: list[DetectedIndicator]) -> str:
    categories = {i.category for i in indicators if i.detected}
    if risk == "CRITICAL" or "safety" in categories or "threat" in categories:
        return "URGENT_SUPPORT"
    if risk == "HIGH":
        return "HIGH_SUPPORT_NEED"
    if risk == "MODERATE":
        return "MODERATE_SUPPORT_NEED"
    return "LOW_SUPPORT_NEED"


# ─── Confidence Calculation ───────────────────────────────────────────────────

def calculate_confidence(
    text_length: int,
    detected_count: int,
    voice_available: bool,
    structured_available: bool,
) -> float:
    """
    Estimate confidence in the assessment.
    More input data → higher confidence (up to 0.85 for prototype).
    Prototype ceiling: 0.85 (never claim 100% certainty).
    """
    base = 0.30
    if text_length > 100:
        base += 0.15
    if text_length > 300:
        base += 0.10
    if detected_count > 0:
        base += min(0.15, detected_count * 0.03)
    if voice_available:
        base += 0.10
    if structured_available:
        base += 0.05
    return round(min(0.85, base), 3)


# ─── Main Analysis Entry Point ────────────────────────────────────────────────

def analyze(
    text: str,
    language: str = "en",
    voice_metadata: Optional[dict] = None,
    structured_data: Optional[dict] = None,
) -> AnalysisResult:
    """
    Full multimodal analysis pipeline.

    Input modalities:
      text: User's assessment responses (required)
      voice_metadata: Speaking rate, pauses etc. (optional)
      structured_data: Daily check-in values etc. (optional)

    Output:
      AnalysisResult with SVI, risk category, indicators, emotion signals,
      recommendations, and a transparent scoring breakdown.
    """
    from datetime import datetime, timezone

    modalities = ["text"]
    if voice_metadata:
        modalities.append("voice")
    if structured_data:
        modalities.append("structured")

    # 1. Detect indicators
    indicators = detect_indicators(text)

    # 2. Extract emotion signals
    emotion = extract_emotion_signals(text, indicators)

    # 3. Analyze voice features
    voice = analyze_voice_features(voice_metadata)

    # 4. Calculate SVI
    score, breakdown = calculate_svi(text, indicators, emotion, voice, structured_data)

    # 5. Risk classification
    risk = score_to_risk(score)

    # 6. Support recommendations
    recommended_support, recommendations = generate_recommendations(risk, indicators, emotion)
    support_risk = classify_support_risk(risk, indicators)
    trauma_indicator = any(i.detected and i.category == "trauma" for i in indicators)

    # 7. Confidence
    detected_count = sum(1 for i in indicators if i.detected)
    confidence = calculate_confidence(len(text), detected_count, voice.available, structured_data is not None)

    return AnalysisResult(
        score=score,
        risk_category=risk,
        indicators=[asdict(i) for i in indicators],
        confidence=confidence,
        recommended_support=recommended_support,
        timestamp=datetime.now(timezone.utc).isoformat(),
        is_prototype=True,
        emotion_signals=asdict(emotion),
        voice_features=asdict(voice),
        breakdown=asdict(breakdown),
        modalities_analyzed=modalities,
        recommendations=recommendations,
        model_version=MODEL_VERSION,
        support_risk=support_risk,
        trauma_indicator=trauma_indicator,
    )


# ─── Chatbot Response Engine ───────────────────────────────────────────────────

# Multilingual response banks — EN / HI / MR
_CHAT_RESPONSES: dict = {
    "safety_critical": {
        "en": (
            "Hey. I'm really glad you told me. When you say this, are you thinking about hurting yourself right now, or are you feeling overwhelmed? "
            "Please move closer to someone you trust and contact local emergency or crisis support now. I can stay with you while you take that next step."
        ),
        "hi": (
            "मुझे खुशी है कि आपने यह बताया। क्या अभी आपको खुद को नुकसान पहुँचाने का विचार आ रहा है, या सब कुछ बहुत भारी लग रहा है? "
            "कृपया किसी भरोसेमंद व्यक्ति के पास जाएँ और local emergency या crisis support से अभी संपर्क करें। मैं आपके साथ हूँ।"
        ),
        "mr": (
            "तुम्ही हे सांगितलेत याचा मला आनंद आहे. आत्ता स्वतःला इजा करण्याचा विचार येतोय का, की सगळं खूप जड वाटतंय? "
            "कृपया विश्वासू व्यक्तीजवळ जा आणि local emergency किंवा crisis support शी लगेच संपर्क करा. मी इथेच आहे."
        ),
    },
    "immediate_danger": {
        "en": (
            "Your safety is the most important thing. If you are in immediate danger, "
            "please contact emergency services or move to a safe place. "
            "I'm here to listen — can you tell me more about your current situation?"
        ),
        "hi": (
            "अभी आपकी सुरक्षा सबसे ज़रूरी है। अगर आप तुरंत खतरे में हैं, "
            "तो कृपया इमरजेंसी सेवाओं से संपर्क करें या किसी सुरक्षित जगह चले जाएँ। "
            "मैं आपकी बात सुनना चाहता/चाहती हूँ — क्या आप मुझे अपनी अभी की स्थिति के बारे में बता सकते हैं?"
        ),
        "mr": (
            "आत्ता तुमची सुरक्षितता सर्वात महत्त्वाची आहे. जर तुम्हाला तात्काळ धोका असेल, "
            "तर कृपया आपत्कालीन सेवांशी संपर्क करा किंवा सुरक्षित ठिकाणी जा. "
            "मी तुमचे ऐकण्यासाठी इथे आहे — तुम्ही मला तुमच्या सध्याच्या परिस्थितीबद्दल सांगू शकता का?"
        ),
    },
    "safety_unclear": {
        "en": (
            "Hey… when you say you want to give up, do you mean on this situation, or are you thinking about hurting yourself? "
            "You don't have to carry this alone. If you might be in immediate danger, move near someone you trust and contact local emergency or crisis support now."
        ),
        "hi": (
            "जब आप कहते हैं कि आप हार मानना चाहते हैं, क्या आपका मतलब इस situation से है, या खुद को नुकसान पहुँचाने का विचार आ रहा है? "
            "अगर अभी खतरा हो सकता है, तो किसी भरोसेमंद व्यक्ति के पास जाएँ और local emergency या crisis support से संपर्क करें।"
        ),
        "mr": (
            "तुम्ही हार मानायची म्हणता तेव्हा, या परिस्थितीबद्दल म्हणत आहात का, की स्वतःला इजा करण्याचा विचार येतोय? "
            "तात्काळ धोका असेल तर विश्वासू व्यक्तीजवळ जा आणि local emergency किंवा crisis support शी संपर्क करा."
        ),
    },
    "advice": {
        "en": "I can help you think it through. What is pulling you toward that choice, and what is making you hesitate?",
        "hi": "मैं आपके साथ इसे सोच सकता/सकती हूँ। आपको इस choice की तरफ क्या खींच रहा है, और किस बात पर आप रुक रहे हैं?",
        "mr": "मी तुमच्यासोबत याचा विचार करू शकतो/शकते. या निर्णयाकडे तुम्हाला काय ओढत आहे, आणि कशामुळे तुम्ही थांबत आहात?",
    },
    "academic": {
        "en": "That kind of disappointment can sting, especially when you feel people are making fun of you instead of standing beside you. One exam does not decide your ability or your worth. What hurts more right now: the result, or how people are treating you?",
        "hi": "ऐसी निराशा बहुत चुभ सकती है, खासकर जब लोग साथ देने के बजाय मज़ाक उड़ाएँ। एक exam आपकी काबिलियत या आपकी कीमत तय नहीं करता। अभी ज़्यादा दर्द किस बात का है: result या लोगों का व्यवहार?",
        "mr": "अशी निराशा खूप बोचू शकते, विशेषतः लोक साथ देण्याऐवजी हसत असतील. एक exam तुमची क्षमता किंवा किंमत ठरवत नाही. आत्ता जास्त काय दुखतंय: result की लोकांची वागणूक?",
    },
    "isolation": {
        "en": "Feeling like nobody cares can make the world feel very small. I'm here with you. Did something happen today that brought this feeling up?",
        "hi": "किसी को परवाह नहीं है ऐसा लगना बहुत अकेला कर सकता है। मैं आपके साथ हूँ। क्या आज कुछ हुआ जिससे यह feeling और तेज़ हो गई?",
        "mr": "कोणालाच काळजी नाही असे वाटणे खूप एकटे पाडू शकते. मी तुमच्यासोबत आहे. आज असे काही घडले का ज्यामुळे ही भावना वाढली?",
    },
    "fear": {
        "en": (
            "That sounds frightening. You don't have to make it sound smaller than it feels. What happened?"
        ),
        "hi": (
            "ऐसा लग रहा है कि आप अभी बहुत डरे हुए हैं, और यह बिल्कुल स्वाभाविक है। "
            "ये भावनाएँ वैध हैं, और आप अकेले नहीं हैं। "
            "क्या आप मुझे थोड़ा और बता सकते हैं कि क्या हो रहा है? "
            "आपकी स्थिति समझने से मुझे सही सहायता खोजने में मदद मिलेगी।"
        ),
        "mr": (
            "असे वाटते की तुम्हाला आत्ता खूप भीती वाटत आहे, आणि हे पूर्णपणे स्वाभाविक आहे. "
            "तुमच्या भावना योग्य आहेत, आणि तुम्ही एकटे नाही आहात. "
            "तुम्ही मला थोडे आणखी सांगू शकता का की काय होत आहे? "
            "तुमची परिस्थिती समजल्यावर मला योग्य आधार शोधण्यात मदत होईल."
        ),
    },
    "distress": {
        "en": (
            "That is a heavy place to be in. You don't have to solve your whole life tonight. What feels hardest right now?"
        ),
        "hi": (
            "मुझे खेद है कि आप ऐसा महसूस कर रहे हैं। निराश महसूस करना थका देने वाला हो सकता है। "
            "ये भावनाएँ, चाहे कितनी भी दर्दनाक हों, सही सहायता से बेहतर हो सकती हैं। "
            "क्या मैं आपको किसी ऐसे व्यक्ति से जोड़ने में मदद करूँ जो इसमें आपका साथ दे सके?"
        ),
        "mr": (
            "मला माफ करा की तुम्हाला असे वाटत आहे. निराश वाटणे थकवणारे असू शकते. "
            "या भावना, कितीही वेदनादायक असल्या तरी, योग्य आधाराने सुधारू शकतात. "
            "मी तुम्हाला अशा कोणाशी जोडण्यात मदत करू का जे यात तुम्हाला साथ देऊ शकतात?"
        ),
    },
    "positive": {
        "en": (
            "I'm glad there is a little more room to breathe today. What would feel good to talk through?"
        ),
        "hi": (
            "यह जानकर अच्छा लगा कि आज चीज़ें थोड़ी बेहतर लग रही हैं। "
            "खुद की देखभाल करना ज़रूरी है। "
            "क्या आज कुछ विशेष है जिसके बारे में आप सहायता चाहते हैं, या कुछ मन में है?"
        ),
        "mr": (
            "हे ऐकून बरे वाटले की आज गोष्टी थोड्या सुलभ वाटत आहेत. "
            "स्वतःची काळजी घेणे महत्त्वाचे आहे. "
            "आज असे काही आहे का ज्यासाठी तुम्हाला आधार हवा आहे, किंवा काही मनात आहे?"
        ),
    },
    "general": {
        "en": [
            "I'm here. What part of this has been sitting heaviest with you?",
            "That sounds like a lot to hold at once. Do you want company with it, or would some practical thinking help?",
            "Take your time. What feels most important to say first?",
            "I'm listening. Has this been a recent thing, or has it been building for a while?",
        ],
        "hi": [
            "इसे मेरे साथ साझा करने के लिए धन्यवाद। मैं यह सुनिश्चित करना चाहता/चाहती हूँ कि आपके पास सही सहायता है। "
            "क्या आप मुझे थोड़ा और बता सकते हैं कि हाल ही में आपके लिए चीज़ें कैसी रही हैं?",
            "मैं आपकी बात सुन रहा/रही हूँ। ऐसा लगता है कि आपके मन में काफी कुछ है। "
            "क्या आप जो हो रहा है उसके बारे में बात करना चाहेंगे, या कुछ support resources देखना पसंद करेंगे?",
            "मैं आपका आभारी/आभारी हूँ कि आपने मुझ पर भरोसा किया। "
            "आपकी स्थिति के बारे में अधिक जानने से मुझे सही सहायता सुझाने में मदद मिलती है। "
            "क्या कुछ विशेष है जिसमें आपको अभी मदद चाहिए?",
            "यह जानना मददगार है। "
            "आप शारीरिक रूप से कैसा महसूस कर रहे हैं — जैसे नींद, खाना-पीना, और ऊर्जा का स्तर?",
        ],
        "mr": [
            "हे माझ्याशी सांगितल्याबद्दल धन्यवाद. मला खात्री करायची आहे की तुमच्याकडे योग्य आधार आहे. "
            "तुम्ही मला थोडे आणखी सांगू शकता का की अलीकडे तुमच्यासाठी गोष्टी कशा होत्या?",
            "मी तुमचे ऐकतो/ऐकते. असे वाटते की तुमच्या मनात खूप काही आहे. "
            "तुम्हाला काय होत आहे याबद्दल बोलायचे आहे का, किंवा काही support resources पाहायचे आहेत?",
            "तुम्ही माझ्यावर विश्वास ठेवल्याबद्दल मी आभारी आहे. "
            "तुमच्या परिस्थितीबद्दल अधिक जाणून घेतल्याने मला योग्य आधार सुचवण्यास मदत होते. "
            "आत्ता तुम्हाला कशात विशेष मदत हवी आहे?",
            "हे जाणून घेणे उपयुक्त आहे. "
            "तुम्हाला शारीरिकदृष्ट्या कसे वाटत आहे — झोप, खाणे-पिणे, आणि ऊर्जेची पातळी?",
        ],
    },
}

# Multilingual safety/emotion keyword patterns
_SAFETY_CRITICAL_KEYWORDS = [
    "kill myself", "end my life", "suicide", "want to die", "hurt myself",
    "feel like to die", "feel like dying", "i feel like dying", "i want die",
    "खुद को मार", "जीना नहीं", "आत्महत्या", "मर जाना", "स्वतःला मारणे", "जगणे नको",
]
_SAFETY_UNCLEAR_KEYWORDS = [
    "i want to give up", "i feel like giving up", "i'm giving up", "i am giving up",
    "हार मानना", "हार मानना चाहता", "हार मानना चाहती", "हार मानावी",
]
_DANGER_KEYWORDS = [
    "in danger", "not safe", "being hurt", "someone hurting", "he will hurt", "he hurt me",
    "threatened me", "will kill me", "hit me", "असुरक्षित", "खतरे में", "मार डालेगा", "मारतो",
]
_FEAR_KEYWORDS = ["afraid", "scared", "terrified", "fear", "डर", "भय", "घाबर"]
_DISTRESS_KEYWORDS = ["hopeless", "helpless", "can't go on", "no point", "nothing matters", "निराश", "दुखी"]
_POSITIVE_KEYWORDS = ["doing ok", "feeling better", "okay", "not bad", "good", "fine", "alright", "ठीक", "अच्छा", "बरे"]
_ADVICE_KEYWORDS = ["need advice", "what should i", "should i", "how do i decide", "help me decide", "क्या करना चाहिए", "सल्ला"]
_ACADEMIC_KEYWORDS = ["exam", "cet", "result", "failed", "course", "study", "college", "presentation"]
_ISOLATION_KEYWORDS = ["nobody cares", "no one cares", "everyone is against me", "ignored", "laughing at me", "nobody", "alone", "lonely"]

_ACADEMIC_CONTEXT = ["exam", "cet", "result", "failed", "course", "college", "study", "presentation"]
_REJECTION_CONTEXT = ["ignore", "ignored", "laugh", "joke", "compare", "nobody cares", "no one cares"]
_FAMILY_PRESSURE_CONTEXT = ["parents are angry", "my parents are angry", "parents angry", "family is angry"]
_WITHDRAWAL_CONTEXT = ["don't want to talk", "do not want to talk", "shut everyone out", "disappear", "leave me alone"]


def _history_mentions(history: list[dict], terms: list[str]) -> bool:
    return any(
        any(term in item.get("content", "").lower() for term in terms)
        for item in history
    )


def _contextual_chat_response(message: str, history: list[dict], language: str) -> Optional[str]:
    if language != "en":
        return None
    lower = message.lower()
    academic = any(term in lower for term in _ACADEMIC_CONTEXT)
    rejection = any(term in lower for term in _REJECTION_CONTEXT)

    if any(term in lower for term in _FAMILY_PRESSURE_CONTEXT) and _history_mentions(history, _ACADEMIC_CONTEXT):
        return "That probably makes the result feel even heavier. You are dealing with the disappointment and their anger at the same time."

    if "compar" in lower and _history_mentions(history, _ACADEMIC_CONTEXT):
        return "Yeah… being compared when you are already disappointed in yourself can make the hurt feel even sharper. You do not have to earn your worth by matching someone else."

    if academic and rejection and not _history_mentions(history, _REJECTION_CONTEXT):
        return (
            "That is a painful combination: being disappointed by the result and then feeling mocked or unsupported by people close to you. "
            "Their reaction does not turn you into a joke, and one exam cannot measure your ability."
        )
    if rejection and _history_mentions(history, _REJECTION_CONTEXT):
        return "Yeah… being compared or laughed at when you are already hurting can make the whole thing feel much heavier. You deserve a little gentleness here."
    if academic and _history_mentions(history, _ACADEMIC_CONTEXT):
        return "That result clearly still has some weight to it. You do not have to decide what it means for your future all at once."
    if any(term in lower for term in _WITHDRAWAL_CONTEXT):
        return "It sounds like you are running low on energy for people right now. You do not have to explain everything before you are ready."
    return None


def generate_chat_response(
    user_message: str,
    conversation_history: list[dict],
    language: str = "en",
    relevant_memories: Optional[list[str]] = None,
) -> str:
    """
    Context-aware, multilingual safety-aware chat response generator.
    Supports English (en), Hindi (hi), and Marathi (mr).
    Uses keyword analysis + conversation context.
    This is a rule-based response engine (not LLM).
    Structured to be replaceable with an LLM API call.
    """
    lang = language if language in ("en", "hi", "mr") else "en"
    msg_lower = user_message.lower()
    history_text = " ".join(m.get("content", "") for m in conversation_history[-5:] if m.get("role") == "user")
    combined = (msg_lower + " " + history_text).lower()

    def _r(key: str) -> str:
        """Get response for given key in active language."""
        responses = _CHAT_RESPONSES.get(key, {})
        return responses.get(lang, responses.get("en", ""))

    # Safety critical → always highest priority and never softened by memory.
    if any(kw in combined for kw in _SAFETY_CRITICAL_KEYWORDS):
        return _r("safety_critical")

    contextual = _contextual_chat_response(user_message, conversation_history, lang)
    if contextual:
        return contextual

    situational_context = any(kw in msg_lower for kw in _ACADEMIC_KEYWORDS + ["work", "project"])
    if any(kw in msg_lower for kw in _SAFETY_UNCLEAR_KEYWORDS) and not situational_context:
        return _r("safety_unclear")

    if any(kw in combined for kw in _DANGER_KEYWORDS):
        return _r("immediate_danger")

    academic_context = any(kw in msg_lower for kw in ["failed", "result", "laughing at me", "mock", "exam went", "cet"])
    if academic_context:
        return _r("academic")

    if any(kw in msg_lower for kw in _ISOLATION_KEYWORDS):
        return _r("isolation")

    if any(kw in msg_lower for kw in _FEAR_KEYWORDS):
        return _r("fear")

    if any(kw in msg_lower for kw in _DISTRESS_KEYWORDS):
        return _r("distress")

    if any(kw in msg_lower for kw in _ADVICE_KEYWORDS):
        return _r("advice")

    if any(kw in msg_lower for kw in _POSITIVE_KEYWORDS):
        return _r("positive")

    # General supportive response — cycle through a short, natural pool.
    pool = _CHAT_RESPONSES["general"].get(lang, _CHAT_RESPONSES["general"]["en"])
    idx = len(conversation_history) % len(pool)
    return pool[idx]
