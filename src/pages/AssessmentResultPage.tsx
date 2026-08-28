/**
 * SafeSense AI — Enhanced AssessmentResultPage with full personalized recommendations
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, AlertTriangle, Phone, ArrowRight, FileText,
  HeartHandshake, Calendar, Shield, BookOpen, Users, TrendingDown, Info
} from 'lucide-react';
import { Navbar } from '../components/Layout';
import { Button, Card, Alert, PrototypeDisclaimer } from '../components/ui';
import { SVIMeter } from '../components/SVIMeter';
import type { SVIResult } from '../types';
import { apiCreateSupportRequest } from '../lib/apiClient';
import { localDb } from '../lib/localDb';
import { SakhaIllustration } from '../components/SakhaIllustration';

interface ExtendedSVIResult extends SVIResult {
  recommendations?: any[];
  emotionSignals?: any;
  voiceFeatures?: any;
  breakdown?: any;
  modalitiesAnalyzed?: string[];
  supportRisk?: string;
  traumaIndicator?: boolean;
}

const REC_ICONS: Record<string, React.ReactNode> = {
  immediate: <HeartHandshake size={16} className="text-red-600" />,
  safety: <Shield size={16} className="text-red-500" />,
  counselling: <Users size={16} className="text-blue-600" />,
  social: <Users size={16} className="text-green-600" />,
  mental_health: <HeartHandshake size={16} className="text-purple-600" />,
  educational: <BookOpen size={16} className="text-slate-600" />,
  followup: <Calendar size={16} className="text-cyan-600" />,
};

export default function AssessmentResultPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<ExtendedSVIResult | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('assessment_result');
    if (!raw) { navigate('/assessment'); return; }
    const parsed = JSON.parse(raw) as ExtendedSVIResult;
    setResult(parsed);
  }, [navigate]);

  if (!result) return null;

  const isCritical = result.riskCategory === 'CRITICAL';
  const isHigh = result.riskCategory === 'HIGH';
  const detectedIndicators = result.indicators.filter((i: any) => i.detected);
  const recommendations = (result as any).recommendations ?? [];

  const handleRequestSupport = async () => {
    setRequesting(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      if (API_URL && localStorage.getItem('safesense_token')) {
        await apiCreateSupportRequest('counsellor', `Requested from assessment result. Risk: ${result.riskCategory}`);
      }
      // Always save locally
      localDb.addSupportRequest({
        id: `sr-${Date.now()}`,
        type: 'counsellor',
        message: `Requested from assessment result. Risk: ${result.riskCategory}`,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
      setRequestSent(true);
    } catch { setRequestSent(true); }
    finally { setRequesting(false); }
  };

  if (isCritical) {
    return <CriticalResultScreen result={result} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <SakhaIllustration compact className="mx-auto mb-4" />
          <div className="w-14 h-14 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#0f2547]">Your wellbeing snapshot is ready.</h1>
          <p className="text-slate-500 mt-2">Sakha has gathered a gentle, non-clinical view of how things may be feeling right now.</p>
        </div>

        <PrototypeDisclaimer />

        {/* SVI score */}
        <Card className="p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Stress Vulnerability Index (SVI)</h2>
              <p className="text-xs text-slate-400 mt-0.5">Prototype — not clinically validated</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Confidence</div>
              <div className="text-sm font-semibold text-slate-600">{Math.round(result.confidence * 100)}%</div>
            </div>
          </div>
          <SVIMeter score={result.score} risk={result.riskCategory} size="lg" />

          {/* Modalities analyzed */}
          {result.modalitiesAnalyzed && result.modalitiesAnalyzed.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="text-xs text-slate-400">Modalities analyzed:</span>
              {result.modalitiesAnalyzed.map(m => (
                <span key={m} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">{m}</span>
              ))}
            </div>
          )}
        </Card>

        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <Card className="p-5">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Support Risk Level</p>
            <p className="font-semibold text-[#0f2547]">{(result.supportRisk ?? (isHigh ? 'HIGH_SUPPORT_NEED' : 'LOW_SUPPORT_NEED')).replaceAll('_', ' ')}</p>
            <p className="text-xs text-slate-500 mt-2">This is a support-planning signal, not a medical diagnosis.</p>
          </Card>
          {result.traumaIndicator && (
            <Card className="p-5 border-l-4 border-l-amber-400">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Possible Trauma-Related Distress</p>
              <p className="text-sm text-slate-700">Your responses include possible indicators of distress after difficult experiences. This is an awareness signal, not a diagnosis.</p>
            </Card>
          )}
        </div>

        {/* Emotion signals */}
        {result.emotionSignals && (
          <Card className="p-5 mt-4">
            <h2 className="font-semibold text-[#0f2547] mb-1 flex items-center gap-2">
              <Info size={14} className="text-cyan-600" /> Emotion-Related Signals
            </h2>
            <p className="text-xs text-slate-400 italic mb-3">
              Model-derived signals — not confirmed emotional states. Confidence: {Math.round((result.emotionSignals.confidence ?? 0.5) * 100)}%
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Distress signal', val: result.emotionSignals.distress_signal },
                { label: 'Fear signal', val: result.emotionSignals.fear_signal },
                { label: 'Sadness signal', val: result.emotionSignals.sadness_signal },
                { label: 'Neutral signal', val: result.emotionSignals.neutral_signal },
              ].map(({ label, val }) => (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>{label}</span>
                    <span className="font-medium">{(val ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-1.5 bg-cyan-500 rounded-full" style={{ width: `${(val ?? 0) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Scoring breakdown */}
        {result.breakdown && (
          <Card className="p-5 mt-4">
            <h2 className="font-semibold text-[#0f2547] mb-3 flex items-center gap-2">
              <TrendingDown size={14} className="text-orange-500" /> SVI Scoring Breakdown
            </h2>
            <p className="text-xs text-slate-400 italic mb-3">Transparent calculation — model version: {result.breakdown.model_version}</p>
            <div className="space-y-1.5 text-sm">
              {[
                { label: 'Stress indicator score', val: result.breakdown.text_indicator_score, positive: true },
                { label: 'Sentiment contribution', val: result.breakdown.sentiment_penalty, positive: true },
                { label: 'Protective factor reduction', val: -result.breakdown.protective_factor_reduction, positive: false },
                { label: 'Voice stress contribution', val: result.breakdown.voice_stress_contribution, positive: true },
                { label: 'Check-in data contribution', val: result.breakdown.structured_data_contribution, positive: true },
              ].map(({ label, val, positive }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-slate-500">{label}</span>
                  <span className={`font-medium ${val > 0 && positive ? 'text-orange-600' : val < 0 ? 'text-green-600' : 'text-slate-500'}`}>
                    {val > 0 ? '+' : ''}{val?.toFixed(1)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between border-t border-slate-100 pt-2 mt-1 font-semibold">
                <span className="text-[#0f2547]">Final SVI Score</span>
                <span className="text-[#0f2547]">{result.score}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Possible indicators */}
        {detectedIndicators.length > 0 && (
          <Card className="p-6 mt-4">
            <h2 className="font-semibold text-[#0f2547] mb-3">Possible stress indicators detected</h2>
            <p className="text-xs text-slate-500 mb-4">
              These are possible indicators based on the language used — NOT a diagnosis.
            </p>
            <ul className="space-y-2">
              {detectedIndicators.map((ind: any) => (
                <li key={ind.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0" />
                  {ind.label}
                  <span className="ml-auto text-xs text-slate-400">{Math.round(ind.confidence * 100)}% conf.</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Personalized recommendations */}
        {recommendations.length > 0 && (
          <Card className="p-6 mt-4">
            <h2 className="font-semibold text-[#0f2547] mb-3">Personalized Support Recommendations</h2>
            <div className="space-y-3">
              {recommendations.slice(0, 5).map((rec: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="mt-0.5">{REC_ICONS[rec.type] ?? <HeartHandshake size={16} />}</div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-slate-800">{rec.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recommended next step */}
        <Card className="p-6 mt-4 border-l-4 border-l-cyan-500">
          <h2 className="font-semibold text-[#0f2547] mb-2">Recommended next step</h2>
          <p className="text-sm text-slate-600 mb-4">{result.recommendedSupport}</p>

          {(isHigh) && (
            <Alert type="warning" className="mb-4 text-sm">
              <strong>Human support is recommended.</strong> Based on possible indicators in this assessment, a counsellor review is advised.
            </Alert>
          )}

          {requestSent && (
            <Alert type="success" className="mb-4 text-sm">
              <CheckCircle size={14} className="inline mr-1" />
              Support request submitted. A counsellor will follow up.
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {!requestSent && (isHigh) && (
              <Button variant="primary" className="flex-1" onClick={handleRequestSupport} loading={requesting}>
                <HeartHandshake size={16} /> Request Human Support
              </Button>
            )}
            <Button variant={isHigh ? 'outline' : 'primary'} className="flex-1" onClick={() => navigate('/resources')}>
              <Shield size={16} /> View Support Resources
            </Button>
          </div>
        </Card>

        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <Button variant="primary" className="flex-1" onClick={() => navigate('/chat')}>
              <HeartHandshake size={16} /> Talk to Sakha
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => navigate('/checkin')}>
              <Calendar size={16} /> Daily Check-In
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => navigate('/dashboard')}>
              Dashboard <ArrowRight size={16} />
            </Button>
          </div>
          <Button variant="outline" fullWidth onClick={() => navigate('/assessment')}>
            <TrendingDown size={16} /> Check Again Later
          </Button>
          <p className="text-center text-xs text-slate-400">
            This assessment is not a medical diagnosis. If you are in immediate danger, contact emergency services.
          </p>
        </div>
      </div>
    </div>
  );
}

function CriticalResultScreen({ result }: { result: ExtendedSVIResult }) {
  const navigate = useNavigate();
  const handleEmergencyRequest = async () => {
    const API_URL = import.meta.env.VITE_API_URL;
    try {
      if (API_URL && localStorage.getItem('safesense_token')) {
        await apiCreateSupportRequest('emergency', 'CRITICAL risk — auto-escalated from assessment result.');
      }
    } catch { }
    localDb.addSupportRequest({
      id: `sr-${Date.now()}`,
      type: 'emergency',
      message: 'CRITICAL risk — auto-escalated.',
      status: 'pending',
      created_at: new Date().toISOString(),
    });
    navigate('/resources');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 mb-6 text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-red-800 mb-2">Immediate Human Support Recommended</h1>
          <p className="text-red-700 text-sm leading-relaxed">
            The assessment indicates that additional human support may be appropriate. Please consider contacting a qualified professional or appropriate support service.
          </p>
        </div>

        <PrototypeDisclaimer />
        <Card className="p-6 mt-4"><SVIMeter score={result.score} risk={result.riskCategory} size="lg" /></Card>

        <Alert type="warning" className="mt-4">
          <strong>Important:</strong> If you are in immediate danger, please contact your local emergency services. This platform is not an emergency service.
        </Alert>

        <Card className="p-6 mt-4">
          <h2 className="font-semibold text-[#0f2547] mb-4">Get support now</h2>
          <div className="flex flex-col gap-3">
            <Button variant="danger" fullWidth onClick={handleEmergencyRequest}>
              <Phone size={16} /> Emergency Support & Resources
            </Button>
            <Button variant="primary" fullWidth onClick={() => navigate('/support')}>
              <HeartHandshake size={16} /> Request Counsellor
            </Button>
            <Button variant="outline" fullWidth onClick={() => navigate('/resources')}>
              <FileText size={16} /> View All Support Resources
            </Button>
          </div>
        </Card>
        <p className="text-center text-xs text-slate-400 mt-4">
          SAFE-SENSE AI does not independently decide emergency intervention. All actions require human authorization.
        </p>
      </div>
    </div>
  );
}
