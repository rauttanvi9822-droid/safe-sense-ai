import { useMemo } from 'react';
import { Brain, Calendar, MessageCircle, ShieldCheck, Trash2 } from 'lucide-react';
import { Navbar } from '../components/Layout';
import { Button, Card } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { localDb } from '../lib/localDb';

export default function ProfilePage() {
    const { user } = useAuth();
    const assessments = localDb.getAssessments();
    const latest = assessments[0];
    const latestConversation = localDb.getLatestConversationSnapshot();
    const storedConversations = useMemo(() => localDb.getStoredConversationHighlights(), []);
    const observations = useMemo(() => {
        const highlights = storedConversations.map(message => {
            if (/exam|course|study|college|work|job|presentation|CET/i.test(message)) return 'Recent conversations mention study, work, or performance pressure.';
            if (/alone|lonely|ignored|nobody|friends|family/i.test(message)) return 'Recent conversations mention feeling disconnected from people close to you.';
            if (/sleep|tired|exhausted/i.test(message)) return 'Sleep and energy have appeared as topics in recent conversations.';
            return null;
        }).filter(Boolean) as string[];
        return [...new Set(highlights)];
    }, [storedConversations]);

    const clearLocalMemory = () => {
        localDb.clearConversationHighlights();
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-3xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-600 mb-2">Your private space</p>
                    <h1 className="text-2xl font-bold text-[#123b68]">What Sakha knows about you</h1>
                    <p className="text-sm text-slate-500 mt-1">Only context you have shared is shown here. Observations are suggestions, not facts or diagnoses.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <Card className="p-5">
                        <div className="flex items-center gap-2 mb-3"><ShieldCheck size={17} className="text-cyan-600" /><h2 className="font-semibold text-[#123b68]">My details</h2></div>
                        <p className="text-sm text-slate-700">{user?.name || 'Your profile'}</p>
                        <p className="text-xs text-slate-400 mt-1">Preferred language: {user?.language || 'English'}</p>
                    </Card>
                    <Card className="p-5">
                        <div className="flex items-center gap-2 mb-3"><Brain size={17} className="text-cyan-600" /><h2 className="font-semibold text-[#123b68]">My wellbeing</h2></div>
                        {latest ? <><p className="text-sm text-slate-700">Latest stress indicator: <strong>{latestConversation?.score ?? latest.svi}/100</strong></p><p className="text-xs text-slate-400 mt-1">Latest risk: {latestConversation?.risk ?? latest.risk}</p></> : <p className="text-sm text-slate-500">Complete a check-in to see your snapshot.</p>}
                    </Card>
                </div>

                <Card className="p-5 mb-4">
                    <div className="flex items-center gap-2 mb-3"><MessageCircle size={17} className="text-cyan-600" /><h2 className="font-semibold text-[#123b68]">Things I told Sakha</h2></div>
                    {storedConversations.length ? <ul className="space-y-2">{storedConversations.slice(0, 8).map(message => <li key={message} className="text-sm text-slate-600 border-l-2 border-cyan-200 pl-3">{message}</li>)}</ul> : <p className="text-sm text-slate-500">Sakha has not saved any conversation highlights yet.</p>}
                    {storedConversations.length > 0 && <Button variant="ghost" size="sm" className="mt-3 text-red-600" onClick={clearLocalMemory}><Trash2 size={14} /> Remove conversation highlights</Button>}
                </Card>

                <Card className="p-5 mb-4">
                    <div className="flex items-center gap-2 mb-3"><Calendar size={17} className="text-cyan-600" /><h2 className="font-semibold text-[#123b68]">Assessment history</h2></div>
                    {assessments.length ? <div className="space-y-2">{assessments.slice(0, 10).map(assessment => <div key={assessment.id} className="flex justify-between border-t border-slate-100 pt-2 text-sm"><span className="text-slate-500">{assessment.date}</span><span className="text-[#123b68]">Stress {assessment.svi}</span><span className="text-xs text-slate-500">{assessment.risk}</span></div>)}</div> : <p className="text-sm text-slate-500">No assessment history yet.</p>}
                </Card>

                <Card className="p-5">
                    <div className="flex items-center gap-2 mb-3"><Brain size={17} className="text-cyan-600" /><h2 className="font-semibold text-[#123b68]">Sakha understands</h2></div>
                    {observations.length ? <ul className="space-y-2">{observations.map(observation => <li key={observation} className="text-sm text-slate-600">Observation: {observation}</li>)}</ul> : <p className="text-sm text-slate-500">As you talk, genuinely recurring themes may appear here as observations.</p>}
                </Card>
            </main>
        </div>
    );
}
