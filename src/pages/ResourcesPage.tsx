import { useState } from 'react';
import { ExternalLink, Phone, Globe, CheckCircle, AlertCircle } from 'lucide-react';
import { Navbar } from '../components/Layout';
import { Card, Alert } from '../components/ui';
import { MOCK_RESOURCES } from '../lib/mockData';
import type { ResourceCategory, SupportResource } from '../types';
import clsx from 'clsx';

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  mental_health: 'Mental Health Support',
  counselling: 'Counselling',
  legal: 'Legal Assistance',
  victim_support: 'Victim Support',
  emergency: 'Emergency Support',
  educational: 'Educational Resources',
};

const CATEGORY_COLORS: Record<ResourceCategory, string> = {
  mental_health: 'bg-purple-100 text-purple-700',
  counselling: 'bg-blue-100 text-blue-700',
  legal: 'bg-slate-100 text-slate-700',
  victim_support: 'bg-cyan-100 text-cyan-700',
  emergency: 'bg-red-100 text-red-700',
  educational: 'bg-green-100 text-green-700',
};

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as ResourceCategory[];

export default function ResourcesPage() {
  const [filter, setFilter] = useState<ResourceCategory | 'all'>('all');

  const filtered = MOCK_RESOURCES.filter(
    (r) => r.isActive && (filter === 'all' || r.category === filter)
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0f2547]">Support Resources</h1>
          <p className="text-slate-500 mt-1">
            Find support services and resources relevant to your situation.
          </p>
        </div>

        <Alert type="warning" className="mb-6">
          <strong>Important:</strong> Contact details shown below are{' '}
          <strong>placeholder only</strong> in this prototype. All resource information must be
          verified and updated by an authorized administrator before real-world use. Do not use
          these as real contact numbers.
        </Alert>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={clsx(
              'px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
              filter === 'all'
                ? 'bg-[#0f2547] text-white border-[#0f2547]'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            )}
          >
            All Resources
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={clsx(
                'px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
                filter === cat
                  ? 'bg-[#0f2547] text-white border-[#0f2547]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              )}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Emergency section anchor */}
        <div id="emergency" />

        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-12 text-slate-400">
              No resources found for this category.
            </div>
          )}
        </div>

        {/* Admin note */}
        <Alert type="info" className="mt-8">
          <strong>Administrators:</strong> Support resources can be managed, verified, and updated
          via the Admin Dashboard → Support Resources section. Contact details and availability
          should be verified before publication.
        </Alert>
      </div>
    </div>
  );
}

function ResourceCard({ resource }: { resource: SupportResource }) {
  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-semibold text-[#0f2547] leading-tight">{resource.name}</h3>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', CATEGORY_COLORS[resource.category])}>
            {CATEGORY_LABELS[resource.category]}
          </span>
          {resource.isVerified ? (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle size={11} /> Verified
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle size={11} /> Needs verification
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-600 mb-3 leading-relaxed">{resource.description}</p>

      <div className="space-y-1.5 text-sm">
        {resource.contact && (
          <div className="flex items-center gap-2 text-slate-600">
            <Phone size={14} className="text-cyan-600 flex-shrink-0" />
            <span className="font-medium">{resource.contact}</span>
          </div>
        )}
        {resource.availability && (
          <div className="text-xs text-slate-400">Available: {resource.availability}</div>
        )}
        {resource.website && resource.website !== 'PLACEHOLDER — Add verified educational link' && (
          <a
            href={resource.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-800 mt-1"
          >
            <Globe size={12} />
            {resource.website}
            <ExternalLink size={11} />
          </a>
        )}
      </div>
    </Card>
  );
}
