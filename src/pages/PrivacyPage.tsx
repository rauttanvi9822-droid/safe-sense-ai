/**
 * SafeSense AI — Privacy & Security Page
 */
import { Shield, Lock, Eye, Trash2, UserCheck, Database, AlertCircle } from 'lucide-react';
import { Navbar } from '../components/Layout';
import { Card } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Section({ icon, title, children }: SectionProps) {
  return (
    <div className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-[#0f2547]">
          {icon}
        </div>
        <h2 className="font-semibold text-[#0f2547] text-base">{title}</h2>
      </div>
      <div className="ml-12 text-sm text-slate-600 leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={24} className="text-[#0f2547]" />
            <h1 className="text-2xl font-bold text-[#0f2547]">Privacy & Security</h1>
          </div>
          <p className="text-slate-500 text-sm">
            How SafeSense AI handles your information — in plain language.
          </p>
        </div>

        <Card className="p-6 space-y-6">

          <Section icon={<Database size={18} />} title="What information is stored">
            <p>When you use SafeSense AI, the following may be stored:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-500">
              <li>Your name and email address (when signed in)</li>
              <li>Daily check-in responses (mood, stress, energy, sleep, notes)</li>
              <li>Assessment responses and results</li>
              <li>Chat conversation history (for your session)</li>
              <li>Your language and preference settings</li>
            </ul>
            <p className="text-slate-500 text-xs mt-2">
              When the backend is unavailable, data is stored in your browser's local storage only — it does not leave your device.
            </p>
          </Section>

          <Section icon={<Eye size={18} />} title="Why this information is collected">
            <p>
              SafeSense AI collects information so that your experience is personal and continuous.
              Your stress history, check-ins, and conversations are stored so you can track your
              wellbeing over time. This information is <strong>not</strong> used for advertising,
              sold to third parties, or shared without your consent.
            </p>
          </Section>

          <Section icon={<Lock size={18} />} title="How your data is protected">
            <p>
              Each user account is separate. Your data is accessible only through your authenticated
              account. Other users cannot see your information.
            </p>
            <p>
              In demo/offline mode, all data stays in your browser's localStorage and is not
              transmitted to any server.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 mt-2">
              <strong>Note:</strong> SafeSense AI is a prototype. It does not currently claim to be
              HIPAA-compliant, GDPR-compliant, or medically certified. Do not store highly sensitive
              personal information until a production-grade implementation is in place.
            </div>
          </Section>

          <Section icon={<UserCheck size={18} />} title="Who can see your data">
            <p>
              In the current prototype, authorized support professionals (counsellors)
              can review assessment results for cases flagged as moderate or higher risk.
              Your daily check-in data and chat history are private to your account unless
              you choose to share them.
            </p>
            <p>
              No one else — including other regular users — can access your information.
            </p>
          </Section>

          <Section icon={<AlertCircle size={18} />} title="AI disclaimer">
            <p>
              SafeSense AI uses a rule-based conversational engine — not a medical AI or
              large language model. It cannot diagnose any condition. Responses are meant to
              be supportive and to help you reflect, not to replace professional care.
            </p>
            <p>
              If you are in a mental health crisis or feel unsafe, please contact a qualified
              professional or emergency services.
            </p>
          </Section>

          <Section icon={<Trash2 size={18} />} title="Deleting your data">
            <p>You can clear your local data at any time:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-500">
              <li>Clear browser localStorage to remove all locally-stored data</li>
              <li>Use the "Clear conversation" button in Chat or Voice to remove conversation history</li>
            </ul>
            {user && (
              <p>
                To fully delete your account and all associated data, please contact the
                SafeSense support team or use the account management section when available.
              </p>
            )}
            {!user && (
              <p className="text-slate-500 text-xs">
                Sign in to manage your account data settings.
              </p>
            )}
          </Section>

        </Card>

        <div className="mt-6 text-center text-xs text-slate-400">
          <p>SafeSense AI — Prototype System</p>
          <p className="mt-1">
            Questions? <Link to="/chat" className="text-cyan-600 hover:underline">Chat with SafeSense</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
