import { Link } from 'react-router-dom';
import { Shield, Lock, Heart, MessageCircle, TrendingUp, Mic, Gauge } from 'lucide-react';
import { Navbar } from '../components/Layout';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { SakhaIllustration } from '../components/SakhaIllustration';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#eef7fc] text-[#123b68] border-b border-[#d9ebf5]">
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full border-[34px] border-[#d7edf7] opacity-70" aria-hidden="true" />
        <div className="absolute right-24 bottom-[-5rem] h-52 w-52 rounded-full bg-[#dff2fa] opacity-70" aria-hidden="true" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative grid lg:grid-cols-[1.05fr_.95fr] items-center gap-12">
          <div className="max-w-2xl">
            {user && <p className="text-sm font-semibold text-[#145da0] mb-3">Welcome back, {user.name.split(' ')[0]}.</p>}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c9e5f3] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#14648e] mb-6">
              <Shield size={14} /> Private, human-centred wellbeing support
            </div>
            <p className="text-sm font-semibold text-[#1689b0] mb-3">Meet Sakha, your AI Dost</p>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.08] tracking-tight mb-5">
              Sometimes you need
              <br />
              someone who <span className="text-[#1689b0]">listens.</span>
            </h1>
            <p className="text-lg text-[#4f6d85] mb-8 leading-relaxed max-w-xl">
              Sakha listens, helps you track your wellbeing over time,
              and connects you with the right support when you need it.
              No judgment. No pressure.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {user ? (
                <Link to="/dashboard">
                  <Button size="lg" variant="primary">
                    Start Today's Check-in
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/assessment">
                    <Button size="lg" variant="primary">
                      Check My Wellbeing
                    </Button>
                  </Link>
                  <Link to="/chat">
                    <Button size="lg" variant="outline">
                      Talk to Sakha
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hidden sm:flex justify-center lg:justify-end">
            <SakhaIllustration />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1689b0] mb-2">Support that meets you where you are</p>
            <h2 className="text-2xl font-bold text-[#123b68]">What SafeSense AI does</h2>
            <p className="text-slate-500 mt-2 max-w-xl mx-auto text-sm">
              Everything in one place — from a quick check-in to deeper conversations.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <MessageCircle size={24} />,
                title: 'Conversational Support',
                desc: 'Talk through whatever is on your mind. SafeSense listens and responds like a calm, supportive companion — not a chatbot.',
              },
              {
                icon: <TrendingUp size={24} />,
                title: 'Track Your Wellbeing',
                desc: 'Daily check-ins and progress charts help you see patterns in your mood, stress, energy, and sleep over time.',
              },
              {
                icon: <Gauge size={24} />,
                title: 'Stress Scale',
                desc: 'Quickly rate your stress level 0–10 and get a personalized response that meets you where you are.',
              },
              {
                icon: <Mic size={24} />,
                title: 'Voice-enabled chat',
                desc: 'Speak naturally or type to Sakha. Your conversation stays in one calm, private chat.',
              },
              {
                icon: <Shield size={24} />,
                title: 'Stress Assessment',
                desc: 'A structured assessment helps identify possible stress indicators and suggests appropriate next steps.',
              },
              {
                icon: <Heart size={24} />,
                title: 'Human Support',
                desc: 'When you need more than an AI, SafeSense helps you connect with real support professionals.',
              },
            ].map(item => (
              <div key={item.title} className="p-6 rounded-xl border border-slate-100 bg-white hover:border-[#b9dced] hover:shadow-[0_12px_28px_rgba(24,76,116,0.08)] transition-all">
                <div className="w-10 h-10 bg-[#e7f4fb] rounded-lg flex items-center justify-center text-[#145da0] mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-[#123b68] mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="flex items-center gap-2 text-cyan-600 text-sm mb-3">
                <Lock size={15} />
                <span>Privacy first</span>
              </div>
              <h2 className="text-2xl font-bold text-[#0f2547] mb-3">
                Your data belongs to you
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Your conversations and check-ins are private to your account.
                We don't sell your data or share it for advertising.
                You can delete your data at any time.
              </p>
              <Link to="/privacy" className="text-sm text-cyan-600 hover:underline">
                Read our full privacy notice →
              </Link>
            </div>
            <div className="space-y-3">
              {[
                'Each user account is completely separate',
                'Your conversations stay private',
                'You can clear your data whenever you want',
                'SafeSense is an AI companion, not a medical service',
                'Human professionals available when needed',
              ].map(item => (
                <div key={item} className="flex items-start gap-3 text-sm text-slate-600">
                  <div className="w-5 h-5 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#123b68] text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to get started?</h2>
          <p className="text-blue-200 mb-6 text-sm">
            Create a free account or just try the chat — no sign-up required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={user ? '/dashboard' : '/login'}>
              <Button size="lg" variant="secondary">
                {user ? 'Go to Dashboard' : 'Create Account'}
              </Button>
            </Link>
            <Link to="/chat">
              <Button size="lg" variant="outline">
                Try the Chat First
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d3155] text-blue-200 py-6 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Logo size="sm" variant="light" />
            <div className="text-xs text-blue-300 text-center">
              SafeSense AI — supportive guidance, not a medical service
            </div>
            <nav className="flex gap-4 text-sm">
              <Link to="/privacy" className="hover:text-white transition-colors text-xs">Privacy</Link>
              <Link to="/chat" className="hover:text-white transition-colors text-xs">Chat</Link>
              <Link to="/login" className="hover:text-white transition-colors text-xs">Sign In</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
