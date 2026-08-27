import { Link } from 'react-router-dom';
import {
  Shield, Users, Lock, Heart, Info,
  MessageCircle, TrendingUp, UserCheck, ArrowRight
} from 'lucide-react';
import { Navbar } from '../components/Layout';
import { Logo } from '../components/Logo';
import { Button, Alert } from '../components/ui';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0f2547] via-[#1a3a6b] to-[#0891b2] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
              <Shield size={14} className="text-cyan-300" />
              <span className="text-cyan-100">Smart India Hackathon 2026 — Prototype</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Early identification.
              <br />
              <span className="text-cyan-300">Better support.</span>
              <br />
              Human-centered care.
            </h1>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl leading-relaxed">
              SAFE-SENSE AI provides AI-assisted assessment of stress and vulnerability during
              support interactions and helps connect users with appropriate human assistance.
            </p>
            <Alert type="warning" className="mb-8 bg-white/10 border-white/20 text-white text-sm">
              <strong>Important:</strong> SAFE-SENSE AI provides screening and support guidance
              only. It does not provide a medical or psychiatric diagnosis and is not a replacement
              for a qualified professional.
            </Alert>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/assessment">
                <Button size="lg" variant="secondary" className="gap-2">
                  Start Assessment <ArrowRight size={18} />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10 hover:text-white"
                >
                  Learn How It Works
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0f2547]">How It Works</h2>
            <p className="text-slate-500 mt-2 max-w-xl mx-auto">
              A simple, private process designed with your comfort in mind.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                icon: <Lock size={24} />,
                title: 'Consent & Privacy',
                desc: 'Review how your information is used and give your informed consent before any assessment.',
              },
              {
                step: '02',
                icon: <MessageCircle size={24} />,
                title: 'Structured Conversation',
                desc: 'Respond to supportive questions at your own pace via text or voice interface.',
              },
              {
                step: '03',
                icon: <TrendingUp size={24} />,
                title: 'AI-Assisted Analysis',
                desc: 'A prototype AI engine identifies possible indicators of stress and vulnerability.',
              },
              {
                step: '04',
                icon: <UserCheck size={24} />,
                title: 'Human Support',
                desc: 'Results are reviewed by trained professionals who provide appropriate support.',
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="text-xs font-bold text-cyan-600 mb-3">{item.step}</div>
                <div className="w-10 h-10 bg-[#0f2547] rounded-lg flex items-center justify-center text-cyan-300 mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-[#0f2547] mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy & Safety */}
      <section id="privacy" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-cyan-50 text-cyan-700 rounded-full px-3 py-1 text-sm mb-4">
                <Lock size={14} />
                Privacy & Safety
              </div>
              <h2 className="text-3xl font-bold text-[#0f2547] mb-4">
                Your safety is the priority
              </h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                SAFE-SENSE AI is designed with data minimization principles. You are always in
                control of your interaction. You can exit at any point, and no unnecessary personal
                information is required.
              </p>
              <ul className="space-y-3">
                {[
                  'Consent required before any assessment',
                  'You can exit at any time',
                  'Minimum necessary information only',
                  'Human professional review',
                  'Audit logs for accountability',
                  'Role-based access — only authorized staff can view case data',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                    <div className="w-5 h-5 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-50 rounded-2xl p-8 space-y-4">
              <Alert type="disclaimer">
                <strong>Privacy Notice:</strong> Information submitted through SAFE-SENSE AI may
                be stored and reviewed by authorized support professionals. This platform is a
                prototype system. In production, full data handling policies governed by applicable
                law will apply.
              </Alert>
              <Alert type="info">
                <strong>AI Transparency:</strong> The assessment engine is a prototype and uses
                pattern matching — not a clinically validated AI. All assessments are reviewed by
                human professionals.
              </Alert>
              <Alert type="warning">
                <strong>Not a diagnosis:</strong> No psychiatric or medical diagnosis is made
                by this platform.
              </Alert>
            </div>
          </div>
        </div>
      </section>

      {/* Human Support */}
      <section id="support" className="py-20 bg-[#0f2547] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Heart size={40} className="mx-auto text-cyan-300 mb-4" />
          <h2 className="text-3xl font-bold mb-4">Human Support, Always</h2>
          <p className="text-blue-200 max-w-2xl mx-auto mb-8 leading-relaxed">
            AI assists in identifying possible indicators — but every assessment is reviewed by a
            trained support professional. You will never be left with only an automated response.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              { icon: <Users size={20} />, title: 'Trained Counsellors', desc: 'All high-risk assessments are reviewed by qualified support professionals.' },
              { icon: <Shield size={20} />, title: 'Victim-Centered', desc: 'Support pathways are designed around your needs, not just assessment scores.' },
              { icon: <Heart size={20} />, title: 'Ongoing Support', desc: 'Follow-up assessments and progress tracking to monitor wellbeing over time.' },
            ].map((item) => (
              <div key={item.title} className="bg-white/10 border border-white/20 rounded-xl p-6">
                <div className="w-9 h-9 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-300 mb-3">
                  {item.icon}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-blue-200 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 rounded-full px-3 py-1 text-sm mb-4">
            <Info size={14} />
            About the Platform
          </div>
          <h2 className="text-3xl font-bold text-[#0f2547] mb-4">About SAFE-SENSE AI</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            SAFE-SENSE AI is developed as a prototype for Smart India Hackathon 2026, responding to
            the problem statement:{' '}
            <em>
              "AI-Based Real-Time Stress and Trauma Assessment Module for Victims/Complainants
              Accessing NHAA (14566) and Integrated Portal."
            </em>
          </p>
          <p className="text-slate-600 leading-relaxed mb-8">
            It is designed to assist — not replace — qualified mental health, legal, and support
            professionals. The AI component provides indicative screening only. All results are
            meant to inform and support human decision-making, not to automate it.
          </p>
          <Alert type="disclaimer" className="text-left">
            <strong>Prototype Status:</strong> This is a demonstration system built for hackathon
            presentation. It has not been clinically validated. It must not be used as a real
            diagnostic or assessment tool without full clinical validation, regulatory clearance,
            and proper data protection compliance.
          </Alert>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-[#0f2547] mb-3">
            Ready to begin?
          </h2>
          <p className="text-slate-500 mb-6">
            Start an assessment or sign in to access your dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/assessment">
              <Button size="lg">Start Assessment</Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Professional Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f2547] text-blue-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Logo size="sm" variant="light" />
            <div className="text-xs text-blue-300 text-center">
              SAFE-SENSE AI — Smart India Hackathon 2026 Prototype
              <br />
              Not a clinically validated system. Not for real-world use without proper validation.
            </div>
            <nav className="flex gap-4 text-sm">
              <Link to="/resources" className="hover:text-white transition-colors">Resources</Link>
              <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
