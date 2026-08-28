import type { Language } from '../types';

export const LANGUAGE_LABELS: Record<Language, string> = {
    en: 'English',
    hi: 'हिन्दी',
    mr: 'मराठी',
};

export const LANGUAGE_CODES: Language[] = ['en', 'hi', 'mr'];

export const COMMON_TEXT: Record<Language, {
    language: string;
    dashboard: string;
    checkIn: string;
    progress: string;
    chat: string;
    voice: string;
    startCheckIn: string;
    startAssessment: string;
    noDataTitle: string;
    noDataBody: string;
    notMedical: string;
}> = {
    en: {
        language: 'Language', dashboard: 'Dashboard', checkIn: 'Daily Check-In', progress: 'Progress',
        chat: 'Chat', voice: 'Voice', startCheckIn: "Start today's check-in", startAssessment: 'Start assessment',
        noDataTitle: 'Your progress will appear here',
        noDataBody: 'Complete a few daily check-ins and SafeSense will start showing your wellbeing trends.',
        notMedical: 'SafeSense provides supportive guidance, not a medical diagnosis.',
    },
    hi: {
        language: 'भाषा', dashboard: 'डैशबोर्ड', checkIn: 'दैनिक चेक-इन', progress: 'प्रगति',
        chat: 'चैट', voice: 'आवाज़', startCheckIn: 'आज का चेक-इन शुरू करें', startAssessment: 'आकलन शुरू करें',
        noDataTitle: 'आपकी प्रगति यहाँ दिखाई देगी',
        noDataBody: 'कुछ दैनिक चेक-इन पूरे करें और SafeSense आपकी wellbeing की प्रगति दिखाना शुरू करेगा।',
        notMedical: 'SafeSense सहायक मार्गदर्शन देता है, चिकित्सीय निदान नहीं।',
    },
    mr: {
        language: 'भाषा', dashboard: 'डॅशबोर्ड', checkIn: 'दैनिक चेक-इन', progress: 'प्रगती',
        chat: 'चॅट', voice: 'आवाज', startCheckIn: 'आजचे चेक-इन सुरू करा', startAssessment: 'मूल्यांकन सुरू करा',
        noDataTitle: 'तुमची प्रगती येथे दिसेल',
        noDataBody: 'काही दैनिक चेक-इन पूर्ण करा आणि SafeSense तुमची wellbeing प्रगती दाखवण्यास सुरुवात करेल.',
        notMedical: 'SafeSense सहाय्यक मार्गदर्शन देते, वैद्यकीय निदान नाही.',
    },
};
