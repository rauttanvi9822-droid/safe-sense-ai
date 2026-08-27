import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Phone, ArrowRight, FileText, HeartHandshake } from 'lucide-react';
import { Navbar } from '../components/Layout';
import { Button, Card, Alert, PrototypeDisclaimer } from '../components/ui';
import { SVIMeter } from '../components/SVIMeter';
import type { SVIResult } from '../types';

export default function AssessmentResultPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<SVIResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('assessment_result');
    if (!raw) {
      navigate('/assessment');
      return;
    }
    setResult(JSON.parse(raw) as SVIResult);
  }, [navigate]);

  if (!result) return null;

  const isCritical = result.riskCategory === 'CRITICAL';
  const detectedIndicators = result.indicators.filter((i) => i.detected);

  if (isCritical) {
    return <CriticalResultScreen result={result} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#0f2547]">Your assessment is complete.</h1>
          <p className="text-slate-500 mt-2">
            A support recommendation has been prepared below.
          </p>
        </div>

        <PrototypeDisclaimer />

        {/* SVI score */}
        <Card className="p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Stress Vulnerability Index (SVI)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Prototype — not clinically validated</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Confidence</div>
              <div className="text-sm font-semibold text-slate-600">
                {Math.round(result.confidence * 100)}%
              </div>
            </div>
          </div>
          <SVIMeter score={result.score} risk={result.riskCategory} size="lg" />
        </Card>

        {/* Possible indicators */}
        {detectedIndicators.length > 0 && (
          <Card className="p-6 mt-4">
            <h2 className="font-semibold text-[#0f2547] mb-3">
              Possible indicators detected
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              These are possible indicators based on the language used in this assessment.
              They are NOT a diagnosis.
            </p>
            <ul className="space-y-2">
              {detectedIndicators.map((ind) => (
                <li key={ind.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0" />
                  {ind.label}
                  <span className="ml-auto text-xs text-slate-400">
                    {Math.round(ind.confidence * 100)}% conf.
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-400 mt-3 italic">
              "Possible indicators detected" — not a confirmed finding.
            </p>
          </Card>
        )}

        {/* Recommended next step */}
        <Card className="p-6 mt-4 border-l-4 border-l-cyan-500">
          <h2 className="font-semibold text-[#0f2547] mb-2">Recommended next step</h2>
          <p className="text-sm text-slate-600 mb-4">{result.recommendedSupport}</p>
          {(result.riskCategory === 'HIGH' || result.riskCategory === 'CRITICAL') && (
            <Alert type="warning" className="mb-4 text-sm">
              <strong>Human support is recommended.</strong> Based on possible indicators in this assessment, a counsellor review is advised.
            </Alert>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="primary" className="flex-1" onClick={() => navigate('/resources')}>
              <HeartHandshake size={16} />
              View Support Resources
            </Button>
            <Button variant="outline" onClick={() => navigate('/resources#emergency')}>
              <Phone size={16} />
              Request Human Assistance
            </Button>
          </div>
        </Card>

        <div className="mt-4 space-y-3">
          <Button variant="ghost" fullWidth onClick={() => navigate('/resources')}>
            Continue to Safety Resources <ArrowRight size={16} />
          </Button>
          <p className="text-center text-xs text-slate-400">
            This assessment is not a medical diagnosis. If you are in immediate danger, contact emergency services.
          </p>
        </div>
      </div>
    </div>
  );
}

function CriticalResultScreen({ result }: { result: SVIResult }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Critical header */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 mb-6 text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-red-800 mb-2">
            Immediate Human Support Recommended
          </h1>
          <p className="text-red-700 text-sm leading-relaxed">
            The assessment indicates that additional human support may be appropriate.
            Please consider contacting a qualified professional or appropriate support service.
          </p>
        </div>

        <PrototypeDisclaimer />

        <Card className="p-6 mt-4">
          <SVIMeter score={result.score} risk={result.riskCategory} size="lg" />
        </Card>

        <Alert type="warning" className="mt-4">
          <strong>Important:</strong> If you are in immediate danger, please contact your local emergency services. This platform is not an emergency service and cannot dispatch assistance.
        </Alert>

        <Card className="p-6 mt-4">
          <h2 className="font-semibold text-[#0f2547] mb-4">Get support now</h2>
          <p className="text-sm text-slate-600 mb-4">
            Please explore the available support resources below. Authorized administrators have
            configured verified contacts that can assist you.
          </p>
          <div className="flex flex-col gap-3">
            <Button variant="primary" fullWidth onClick={() => navigate('/resources')}>
              <HeartHandshake size={16} />
              Request Counsellor / View Support Resources
            </Button>
            <Button variant="outline" fullWidth onClick={() => navigate('/resources#emergency')}>
              <Phone size={16} />
              View Emergency Resources
            </Button>
            <Button variant="ghost" fullWidth onClick={() => navigate('/resources')}>
              <FileText size={16} />
              Contact Available Support
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
