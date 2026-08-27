import type { SupportResource } from '../types';

// ─── IMPORTANT ────────────────────────────────────────────────────────────────
// Contact information, phone numbers, and website URLs below are PLACEHOLDER
// ONLY. They are NOT real services and must be replaced by verified, official
// resource information by an authorized administrator before any real-world use.
// ──────────────────────────────────────────────────────────────────────────────

export const MOCK_RESOURCES: SupportResource[] = [
  {
    id: 'r-001',
    name: 'NHAA Helpline — 14566',
    description:
      'National Human Rights and Allied Authorities helpline for complainants. Available for support, guidance, and case registration.',
    category: 'victim_support',
    contact: '14566',
    website: 'https://nhaa.gov.in', // PLACEHOLDER — verify official URL
    availability: '24/7',
    isVerified: false,
    isActive: true,
    addedBy: 'system',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'r-002',
    name: 'iCall — Psychological Counselling',
    description:
      'Psychosocial helpline run by TISS offering professional counselling support. (Verify current availability.)',
    category: 'counselling',
    contact: 'PLACEHOLDER — Add verified number',
    website: 'https://icallhelpline.org', // PLACEHOLDER — verify
    availability: 'Monday–Saturday',
    isVerified: false,
    isActive: true,
    addedBy: 'system',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'r-003',
    name: 'Vandrevala Foundation Helpline',
    description:
      'Mental health support helpline available across India. (Verify current availability.)',
    category: 'mental_health',
    contact: 'PLACEHOLDER — Add verified number',
    website: 'https://vandrevalafoundation.com', // PLACEHOLDER — verify
    availability: '24/7',
    isVerified: false,
    isActive: true,
    addedBy: 'system',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'r-004',
    name: 'Legal Aid Services',
    description:
      'National Legal Services Authority — free legal aid for eligible individuals including victims of crime.',
    category: 'legal',
    contact: 'PLACEHOLDER — Add verified NALSA number',
    website: 'https://nalsa.gov.in', // PLACEHOLDER — verify
    availability: 'Business hours',
    isVerified: false,
    isActive: true,
    addedBy: 'system',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'r-005',
    name: 'Women Helpline',
    description:
      'Ministry of Women and Child Development helpline for women in distress. (Verify current availability.)',
    category: 'victim_support',
    contact: '181',
    website: 'https://wcd.nic.in', // PLACEHOLDER — verify
    availability: '24/7',
    isVerified: false,
    isActive: true,
    addedBy: 'system',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'r-006',
    name: 'Understanding Trauma — Educational Resource',
    description:
      'Informational guide on understanding stress, trauma, and when to seek professional help. (Admin: link to verified source.)',
    category: 'educational',
    contact: undefined,
    website: 'PLACEHOLDER — Add verified educational link',
    availability: 'Always available',
    isVerified: false,
    isActive: true,
    addedBy: 'system',
    createdAt: '2025-01-01T00:00:00Z',
  },
];
