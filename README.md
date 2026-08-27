# SAFE-SENSE AI

**AI-assisted Stress and Trauma Assessment and Victim Support Platform**

> *AI-assisted assessment. Human-centered support.*

---

## ⚠️ Important Disclaimers

- **This is a prototype** built for Smart India Hackathon 2026 demonstration purposes.
- **Not clinically validated.** SVI scores and risk bands are prototype indicators only.
- **Not a medical or psychiatric diagnosis system.**
- **Not a replacement** for qualified mental health professionals, counsellors, legal professionals, or emergency services.
- **Do not deploy with real victim data** without full clinical validation, regulatory clearance, data protection compliance, and proper security hardening.

---

## Problem Statement

*"AI-Based Real-Time Stress and Trauma Assessment Module for Victims/Complainants Accessing NHAA (14566) and Integrated Portal."*

Smart India Hackathon 2026

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS v4 |
| Routing | React Router DOM v7 |
| Charts | Recharts |
| Icons | Lucide React |
| Build | Vite |
| Database (production) | Supabase / PostgreSQL |
| Auth (production) | Supabase Auth |
| AI Service (production) | Python / FastAPI (stub provided) |

---

## Quick Start

```bash
cd safe-sense-ai
npm install
npm run dev
```

Open http://localhost:5173

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Victim / User | victim@demo.safesense | demo1234 |
| Counsellor | counsellor@demo.safesense | demo1234 |
| Admin | admin@demo.safesense | demo1234 |

> **Note:** These are hardcoded prototype credentials. Replace with Supabase Auth in production.

---

## Pages

| Page | Route | Access |
|------|-------|--------|
| Landing | `/` | Public |
| Login | `/login` | Public |
| Support Resources | `/resources` | Public |
| Assessment — Consent | `/assessment` | Public |
| Assessment — Chat | `/assessment/chat` | Public |
| Assessment — Result | `/assessment/result` | Public |
| User Dashboard | `/dashboard` | Victim + Admin |
| Counsellor Dashboard | `/counsellor` | Counsellor + Admin |
| Case Detail | `/counsellor/case/:id` | Counsellor + Admin |
| Admin Dashboard | `/admin` | Admin only |
| Unauthorized | `/unauthorized` | Public |

---

## Database Tables (schema.sql)

| Table | Purpose |
|-------|---------|
| `users` | Minimal user records — PII minimised |
| `user_permissions` | Extended RBAC permissions |
| `consents` | Informed consent audit trail |
| `cases` | Case management |
| `assessments` | Individual assessment sessions |
| `assessment_messages` | Chat transcript (encrypted in production) |
| `assessment_indicators` | Detected stress/vulnerability indicators |
| `svi_results` | SVI scores and risk bands |
| `support_resources` | Verified support resource directory |
| `counsellors` | Counsellor profiles and availability |
| `follow_ups` | Scheduled follow-up tracking |
| `audit_logs` | Append-only action audit trail |

---

## AI Assessment API Contract

```
POST /api/assessment/analyze

Request:
{
  "text": "string",
  "language": "en" | "hi" | "mr",
  "voice_metadata": { "pitchVariance": number, "speechRate": number }
}

Response:
{
  "svi": number,           // 0–100
  "risk_category": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
  "indicators": [...],
  "confidence": number,    // 0–1
  "recommended_support": "string"
}
```

Set `VITE_AI_SERVICE_URL` environment variable to connect a real AI service.
Without it, the prototype mock engine is used automatically.

---

## SVI Risk Bands (Prototype)

| Band | Score | Description |
|------|-------|-------------|
| LOW | 0–25 | General information recommended |
| MODERATE | 26–50 | Counsellor consultation recommended |
| HIGH | 51–75 | Prompt human support recommended |
| CRITICAL | 76–100 | Immediate human support recommended |

> **Prototype decision-support thresholds — not clinically validated.**

---

## Demo Mode

Enable Demo Mode from the Admin Dashboard → Demo Mode tab.

Demo Mode:
- Shows a prominent banner on all pages
- Overrides AI assessment to produce a score in the selected risk band (LOW/MODERATE/HIGH/CRITICAL)
- Uses synthetic test data only
- Intended for SIH presentation purposes

---

## AI Integration Points (Remaining)

1. **NLP Analysis** — Connect `src/lib/assessmentApi.ts` to a real NLP service
2. **Speech Analysis** — Implement real voice transcription (Web Speech API or backend)
3. **Voice Emotion Analysis** — Integrate validated speech emotion recognition (NOT included in prototype)
4. **Clinical Validation** — Full validation of indicator patterns, scoring algorithm, and risk thresholds
5. **Language Models** — Test and validate question sets for Hindi and Marathi
6. **Additional Languages** — Add translations via the Language Management admin panel

---

## Security Considerations

- [ ] Replace localStorage auth with Supabase Auth sessions
- [ ] Enable Row-Level Security (RLS) on all Supabase tables
- [ ] Implement field-level encryption for `assessment_messages`
- [ ] Add HTTPS enforcement
- [ ] Conduct DPIA (Data Protection Impact Assessment)
- [ ] Implement data retention and deletion policies
- [ ] Add rate limiting on assessment endpoints
- [ ] Regular security audits
- [ ] Verify all support resource contact information before publishing
- [ ] Implement proper session timeout
- [ ] Add CSRF protection for form submissions

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_AI_SERVICE_URL=https://your-ai-service.example.com  # Optional
```

Copy `.env.example` to `.env.local` and fill in values.

---

## Project Structure

```
src/
├── components/
│   ├── Layout.tsx          # Navbar, PageHeader, StatCard
│   ├── Logo.tsx            # Brand logo component
│   ├── ProtectedRoute.tsx  # RBAC route guard
│   ├── SVIMeter.tsx        # SVI score visualisation
│   └── ui.tsx              # Shared UI primitives
├── context/
│   └── AuthContext.tsx     # Auth + demo mode state
├── lib/
│   ├── assessmentApi.ts    # API stub (connects real/mock AI)
│   ├── mockAssessment.ts   # Prototype mock AI engine
│   ├── mockAuth.ts         # Demo authentication
│   └── mockData.ts         # Placeholder support resources
├── pages/
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── AssessmentOnboardingPage.tsx
│   ├── AssessmentChatPage.tsx
│   ├── AssessmentResultPage.tsx
│   ├── ResourcesPage.tsx
│   ├── UserDashboardPage.tsx
│   ├── CounsellorDashboardPage.tsx
│   ├── CaseDetailPage.tsx
│   └── AdminDashboardPage.tsx
├── types/
│   └── index.ts            # All TypeScript types
├── App.tsx                 # Router + route definitions
└── main.tsx
schema.sql                  # PostgreSQL/Supabase schema
.env.example                # Environment variable template
```

---

*SAFE-SENSE AI — Smart India Hackathon 2026 Prototype*
