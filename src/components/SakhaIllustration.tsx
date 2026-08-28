import { HeartHandshake, Sparkles } from 'lucide-react';

interface SakhaIllustrationProps {
    compact?: boolean;
    className?: string;
}

export function SakhaIllustration({ compact = false, className = '' }: SakhaIllustrationProps) {
    return (
        <div className={`sakha-illustration ${compact ? 'sakha-illustration--compact' : ''} ${className}`} aria-hidden="true">
            <div className="sakha-sun" />
            <div className="sakha-cloud sakha-cloud--one" />
            <div className="sakha-cloud sakha-cloud--two" />
            <div className="sakha-ground" />
            <div className="sakha-person sakha-person--left">
                <div className="sakha-head"><span className="sakha-face" /></div>
                <div className="sakha-body" />
                <div className="sakha-arm sakha-arm--left" />
                <div className="sakha-arm sakha-arm--right" />
            </div>
            <div className="sakha-person sakha-person--right">
                <div className="sakha-head"><span className="sakha-face" /></div>
                <div className="sakha-body" />
                <div className="sakha-arm sakha-arm--left" />
                <div className="sakha-arm sakha-arm--right" />
            </div>
            <div className="sakha-heart"><HeartHandshake size={compact ? 18 : 24} /></div>
            {!compact && <div className="sakha-spark"><Sparkles size={16} /></div>}
        </div>
    );
}
