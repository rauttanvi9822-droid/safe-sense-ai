-- =============================================================================
-- SAFE-SENSE AI — Database Schema
-- PostgreSQL / Supabase
-- 
-- IMPORTANT: This is a prototype schema.
-- Before any real-world deployment:
--   1. Complete a full data protection impact assessment (DPIA)
--   2. Implement appropriate encryption at rest and in transit
--   3. Apply row-level security (RLS) policies in Supabase
--   4. Establish data retention and deletion policies per applicable law
--   5. Get legal and privacy review
--
-- All sensitive data is minimised. PII is separated where possible.
-- =============================================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Roles ───────────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('victim', 'counsellor', 'admin');

-- ─── Users ───────────────────────────────────────────────────────────────────
-- Minimal user record. Personal details are minimised.
-- Email is stored only for professional users (counsellors, admins).
-- Victim users may be anonymous or pseudonymous.
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email       TEXT UNIQUE,                       -- NULL for anonymous victim users
    name        TEXT,                              -- pseudonym or display name
    role        user_role NOT NULL DEFAULT 'victim',
    language    TEXT NOT NULL DEFAULT 'en',        -- preferred language code
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Minimal user records. PII minimised per data protection principles.';

-- ─── Roles (extended RBAC) ────────────────────────────────────────────────────
CREATE TABLE user_permissions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission  TEXT NOT NULL,
    granted_by  UUID REFERENCES users(id),
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Consents ─────────────────────────────────────────────────────────────────
-- Records informed consent for each assessment session.
CREATE TABLE consents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    session_token   TEXT,                          -- for anonymous sessions
    consent_version TEXT NOT NULL DEFAULT '1.0',
    consented       BOOLEAN NOT NULL DEFAULT FALSE,
    ip_hash         TEXT,                          -- hashed, not raw IP
    user_agent_hash TEXT,                          -- hashed
    consented_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    withdrawn_at    TIMESTAMPTZ
);

COMMENT ON TABLE consents IS 'Audit trail of user consent. Required before any assessment.';

-- ─── Cases ────────────────────────────────────────────────────────────────────
CREATE TYPE case_status AS ENUM ('open', 'under_review', 'closed', 'follow_up');

CREATE TABLE cases (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_ref        TEXT NOT NULL UNIQUE,          -- human-readable reference e.g. SSA-2025-0001
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    counsellor_id   UUID REFERENCES users(id),
    status          case_status NOT NULL DEFAULT 'open',
    follow_up_date  DATE,
    notes           TEXT,                          -- authorized staff only
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Assessments ─────────────────────────────────────────────────────────────
CREATE TYPE interaction_mode AS ENUM ('text', 'voice');
CREATE TYPE assessment_status AS ENUM ('in_progress', 'completed', 'reviewed');

CREATE TABLE assessments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    language        TEXT NOT NULL DEFAULT 'en',
    interaction_mode interaction_mode NOT NULL DEFAULT 'text',
    status          assessment_status NOT NULL DEFAULT 'in_progress',
    is_demo         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

-- ─── Assessment Messages ──────────────────────────────────────────────────────
-- Stores individual chat messages for each assessment.
-- Consider carefully whether message content needs to be stored in production.
CREATE TABLE assessment_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id   UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK (role IN ('ai', 'user')),
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE assessment_messages IS 
'Chat transcript. In production, apply field-level encryption and strict retention limits.';

-- ─── Assessment Indicators ───────────────────────────────────────────────────
CREATE TABLE assessment_indicators (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id   UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    indicator_label TEXT NOT NULL,
    category        TEXT NOT NULL,
    detected        BOOLEAN NOT NULL DEFAULT FALSE,
    confidence      NUMERIC(4,3) CHECK (confidence >= 0 AND confidence <= 1),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SVI Results ─────────────────────────────────────────────────────────────
CREATE TYPE risk_category AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

CREATE TABLE svi_results (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id       UUID NOT NULL UNIQUE REFERENCES assessments(id) ON DELETE CASCADE,
    score               INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    risk_category       risk_category NOT NULL,
    confidence          NUMERIC(4,3),
    recommended_support TEXT,
    is_prototype        BOOLEAN NOT NULL DEFAULT TRUE,  -- must remain TRUE until clinically validated
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN svi_results.is_prototype IS 
'Must remain TRUE. This system is NOT clinically validated. Set to FALSE only after full clinical validation and regulatory clearance.';

-- ─── Support Resources ───────────────────────────────────────────────────────
CREATE TYPE resource_category AS ENUM (
    'mental_health', 'counselling', 'legal', 'victim_support', 'emergency', 'educational'
);

CREATE TABLE support_resources (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    description TEXT NOT NULL,
    category    resource_category NOT NULL,
    contact     TEXT,                              -- verified phone/contact only
    website     TEXT,
    availability TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active   BOOLEAN NOT NULL DEFAULT FALSE,   -- default inactive until verified
    added_by    UUID REFERENCES users(id),
    verified_by UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE support_resources IS 
'Support resources. is_active defaults to FALSE. Admins must verify before activating.';

-- ─── Counsellors ─────────────────────────────────────────────────────────────
CREATE TYPE counsellor_availability AS ENUM ('available', 'busy', 'offline');

CREATE TABLE counsellors (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    specialization  TEXT,
    availability    counsellor_availability NOT NULL DEFAULT 'offline',
    active_cases    INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Follow-ups ───────────────────────────────────────────────────────────────
CREATE TABLE follow_ups (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    counsellor_id   UUID REFERENCES users(id),
    scheduled_date  DATE NOT NULL,
    completed       BOOLEAN NOT NULL DEFAULT FALSE,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Audit Logs ───────────────────────────────────────────────────────────────
-- Append-only audit trail. Never delete records.
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,
    entity_type TEXT,
    entity_id   UUID,
    ip_hash     TEXT,
    metadata    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 
'Append-only audit log. Do not add DELETE or UPDATE privileges on this table.';

-- ─── Row-Level Security (RLS) — Supabase ─────────────────────────────────────
-- Enable RLS on all sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE svi_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (expand for production):
-- Victims can only access their own cases
CREATE POLICY victims_own_cases ON cases
    FOR SELECT USING (user_id = auth.uid());

-- Counsellors can access assigned cases
CREATE POLICY counsellors_assigned_cases ON cases
    FOR SELECT USING (counsellor_id = auth.uid());

-- Admins have full access (via service role key only — never expose to client)
-- Use Supabase service_role in server-side functions only.

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_cases_user_id ON cases(user_id);
CREATE INDEX idx_cases_counsellor_id ON cases(counsellor_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_assessments_case_id ON assessments(case_id);
CREATE INDEX idx_svi_results_risk ON svi_results(risk_category);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
