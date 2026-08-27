/**
 * Assessment API Stub — Integration Contract
 *
 * In production, replace mockAnalyzeAssessment with a real API call to
 * a Python/FastAPI AI service at the endpoint below.
 *
 * POST /api/assessment/analyze
 *
 * Request body:
 *   {
 *     text: string;
 *     language: 'en' | 'hi' | 'mr';
 *     voiceMetadata?: { pitchVariance?: number; speechRate?: number };
 *   }
 *
 * Response:
 *   {
 *     svi: number;               // 0–100
 *     risk_category: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
 *     indicators: { label: string; category: string; detected: boolean; confidence: number }[];
 *     confidence: number;        // 0–1
 *     recommended_support: string;
 *   }
 *
 * The endpoint should be configured via environment variable:
 *   VITE_AI_SERVICE_URL=https://your-ai-service.example.com
 */

import type { AnalysisInput, AnalysisOutput } from './mockAssessment';
import { mockAnalyzeAssessment } from './mockAssessment';

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL as string | undefined;

export async function analyzeAssessment(input: AnalysisInput): Promise<AnalysisOutput> {
  if (AI_SERVICE_URL) {
    // Production path — connect to real AI service
    const res = await fetch(`${AI_SERVICE_URL}/api/assessment/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: input.text,
        language: input.language,
        voice_metadata: input.voiceMetadata,
      }),
    });
    if (!res.ok) throw new Error(`AI service error: ${res.status}`);
    const data = await res.json();
    return {
      score: data.svi,
      riskCategory: data.risk_category,
      indicators: data.indicators,
      confidence: data.confidence,
      recommendedSupport: data.recommended_support,
      timestamp: new Date().toISOString(),
      isPrototype: true, // keep true until clinically validated
    };
  }

  // Prototype path — mock engine
  return mockAnalyzeAssessment(input);
}
