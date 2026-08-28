# SafeSense AI

> AI-assisted safety and wellbeing support platform  
> Smart India Hackathon 2026 — Full Functional Application

---

## ⚠ Disclaimer

SafeSense AI is a **support-screening tool only**. It does not provide a medical or psychiatric diagnosis. All assessment results are prototype indicators and are not clinically validated. All interactions should be reviewed by qualified human professionals.

---

## Architecture

```
React / Vite Frontend (TypeScript)
        ↓ HTTPS / REST
FastAPI Backend (Python)
        ↓
PostgreSQL Database
        +
Built-in NLP / AI/ML Service (Python — no external API required)
        +
Web Speech API (browser-native STT + TTS)
```

---

## Quick Start (Demo Mode — No Backend Required)

The frontend works fully in demo mode without the backend:

```bash
npm install
npm run dev
```

Open http://localhost:5173

**Demo credentials:**
| Role | Email | Password |
|------|-------|----------|
| User | `victim@demo.safesense` | `demo1234` |
| Counsellor | `counsellor@demo.safesense` | `demo1234` |
| Admin | `admin@demo.safesense` | `demo1234` |

In demo mode, all data is stored in browser localStorage. Registration requires the backend.

---

## Full Stack Setup (with Backend + PostgreSQL)

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+

### 1. Frontend

```bash
npm install
cp .env.example .env.local
# Edit .env.local: set VITE_API_URL=http://localhost:8000
npm run dev
```

### 2. Backend (Python)

```bash
python setup_backend.py
# Then:
cp .env.example .env
# Edit .env with your DATABASE_URL and SECRET_KEY
```

**Activate venv and start:**

Windows:
```cmd
venv\Scripts\activate
uvicorn backend.main:app --reload --port 8000
```

Linux/macOS:
```bash
source venv/bin/activate
uvicorn backend.main:app --reload --port 8000
```

API docs: http://localhost:8000/api/docs

### 3. Database

```bash
# Create database and user
createdb safesense_db
psql -c "CREATE USER safesense WITH PASSWORD 'your_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE safesense_db TO safesense;"
```

The backend auto-creates all tables on startup via SQLAlchemy.

---

## Docker Compose (Recommended)

```bash
cp .env.example .env
# Edit .env: set DB_PASSWORD, SECRET_KEY

docker-compose up --build
```

Services:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- PostgreSQL: localhost:5432

---

## Environment Variables

See `.env.example` for all variables with descriptions.

**Required for full stack:**
```
VITE_API_URL=http://localhost:8000
DATABASE_URL=postgresql://safesense:password@localhost:5432/safesense_db
SECRET_KEY=your-long-random-secret-key
```

**Optional (enhanced features):**
```
OPENAI_API_KEY=sk-...          # Enhanced NLP responses
SPEECH_API_KEY=...             # Cloud STT (browser Web Speech API used by default)
```

---

## Features

### ✅ Fully Functional

| Feature | Status | Notes |
|---------|--------|-------|
| AI Chat (real-time) | ✅ | Context-aware safety-first responses |
| Voice Assistant (STT + TTS) | ✅ | Web Speech API (Chrome/Edge) |
| Assessment with voice input | ✅ | Real microphone → transcript → analysis |
| NLP stress indicator detection | ✅ | Keyword + TextBlob sentiment analysis |
| Emotion signal extraction | ✅ | Model-derived signals (non-diagnostic) |
| SVI calculation | ✅ | Transparent weighted scoring engine |
| Risk classification | ✅ | LOW/MODERATE/HIGH/CRITICAL |
| Personalized recommendations | ✅ | Based on detected indicators |
| SVI scoring breakdown | ✅ | Full transparent audit trail |
| Daily check-in | ✅ | Prevents duplicate daily entries |
| Progress tracking (real data) | ✅ | SVI trend + mood trend charts |
| Support request / escalation | ✅ | Persisted to DB or localStorage |
| Follow-up scheduling | ✅ | Stored and trackable |
| User dashboard (real data) | ✅ | Loads from API with localStorage fallback |
| Registration | ✅ | Requires backend (bcrypt hashed passwords) |
| Login / Logout | ✅ | JWT auth + demo credentials without backend |
| Role-based access control | ✅ | user / moderator / admin |
| Moderator dashboard | ✅ | Cases, alerts, status updates |
| Admin dashboard | ✅ | Users, audit logs, stats |
| Audit logging | ✅ | All sensitive actions logged to DB |
| Safety alert creation | ✅ | Auto-created for HIGH/CRITICAL assessments |
| Emergency escalation (CRITICAL) | ✅ | Auto support request created |
| Support resources page | ✅ | Filterable by category |
| Mobile responsive | ✅ | Tailwind responsive design |
| TypeScript build | ✅ | Zero errors |
| Docker containerization | ✅ | `docker-compose up` |

### ⚙ Requires External Setup

| Feature | What's needed |
|---------|---------------|
| Real PostgreSQL persistence | DATABASE_URL in .env |
| User registration | Backend running |
| Backend API features | `uvicorn backend.main:app` |
| Enhanced NLP via LLM | OPENAI_API_KEY (optional) |
| Cloud STT | SPEECH_API_KEY (browser API is default) |

---

## AI/ML Architecture

The AI/ML service is implemented in [`backend/ai_service.py`](backend/ai_service.py).

### Pipeline

```
User text input
      ↓
Text cleaning + tokenization (NLTK)
      ↓
Stress/trauma indicator detection (keyword patterns)
      ↓
Sentiment analysis (TextBlob polarity + subjectivity)
      ↓
Emotion signal derivation (model-derived, non-diagnostic)
      ↓
Voice feature analysis (if voice metadata available)
      ↓
Protective factor detection
      ↓
SVI calculation (transparent weighted scoring)
      ↓
Risk classification (LOW / MODERATE / HIGH / CRITICAL)
      ↓
Personalized recommendation generation
```

### Scoring Model (baseline-v1.0)

```
SVI = text_indicator_score (0–70)
    + sentiment_penalty (0–10)
    - protective_factor_reduction (0–10)
    + voice_stress_contribution (0–15)
    + structured_data_contribution (0–15)
```

All scoring weights are documented in the source code. The architecture supports plugging in a trained ML model.

---

## Security

- Passwords: bcrypt hashed (12 rounds)
- Auth: JWT tokens (HS256, configurable expiry)
- RBAC: enforced on all backend endpoints
- CORS: configurable per environment
- Security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- Rate limiting: via slowapi
- Audit logs: all sensitive actions recorded
- No secrets in frontend code
- No API keys in git (use .env files)

---

## Project Structure

```
safe-sense-ai/
├── src/                        # React/TypeScript frontend
│   ├── pages/                  # All page components
│   ├── components/             # Shared UI components
│   ├── context/                # Auth context
│   └── lib/
│       ├── apiClient.ts        # Backend API calls
│       ├── speechService.ts    # Web Speech API (STT + TTS)
│       ├── localDb.ts          # localStorage persistence
│       └── mockAssessment.ts   # Local NLP fallback
├── backend/                    # Python FastAPI backend
│   ├── main.py                 # FastAPI app entry point
│   ├── models.py               # SQLAlchemy models
│   ├── auth.py                 # JWT + bcrypt auth
│   ├── ai_service.py           # NLP + SVI + ML pipeline
│   ├── config.py               # Settings (pydantic-settings)
│   ├── database.py             # DB session
│   └── routers/                # API route handlers
│       ├── auth.py
│       ├── assessments.py
│       ├── chat.py
│       ├── checkins.py
│       ├── progress.py
│       ├── support.py
│       ├── moderator.py
│       ├── resources.py
│       └── admin.py
├── Dockerfile.backend          # Backend Docker image
├── docker-compose.yml          # Full stack compose
├── setup_backend.py            # One-command backend setup
├── .env.example                # Environment variable template
└── schema.sql                  # Reference PostgreSQL schema
```

---

## Running the Complete Application

### Option A: Frontend only (demo mode)
```bash
npm run dev
```

### Option B: Full stack
Terminal 1:
```bash
# Start backend
source venv/bin/activate   # or: venv\Scripts\activate (Windows)
uvicorn backend.main:app --reload --port 8000
```
Terminal 2:
```bash
# Start frontend
npm run dev
```

### Option C: Docker
```bash
docker-compose up --build
```
