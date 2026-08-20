# Healthcare Conversational Assistant Using Generative AI, Medical NLP and RAG

> B.Tech CSE/AIML Academic Project
> AI-powered healthcare conversational web application with RAG, Medical NLP, and symptom assessment.

---

## 1. Project Introduction

HealthAssist AI is an intelligent healthcare conversational assistant that leverages Generative AI, Medical NLP, and Retrieval-Augmented Generation (RAG) to provide preliminary health information. Users can ask health questions in natural language, receive AI-generated responses, perform symptom assessments, analyze medical reports, and manage appointments and medication reminders.

**⚠️ DISCLAIMER: This system is NOT a replacement for a doctor. It provides general educational information only and does not diagnose, prescribe, or replace professional medical advice.**

---

## 2. Features

1. **User Authentication** — Register, login, JWT-based session management
2. **AI Healthcare Chatbot** — Natural language conversations with AI, emergency detection, risk assessment
3. **Medical NLP** — Extracts symptoms, diseases, medicines, body parts, severity, duration using BioBERT/keyword fallback
4. **RAG Pipeline** — FAISS-based retrieval from medical knowledge base, grounded responses with citations
5. **Symptom Assessment** — Preliminary symptom analysis with risk levels and possible causes
6. **Emergency Detection** — Identifies urgent symptoms and directs to emergency services
7. **Medical Report Analysis** — Upload PDF/text reports for AI-powered summaries
8. **Medicine Information** — General educational information about medications
9. **Doctor Appointments** — Browse doctors, book, cancel, and manage appointments
10. **Medication Reminders** — Create, edit, delete, and toggle medication reminders
11. **Chat History** — View and delete past conversations
12. **Professional Dashboard** — Overview of all features with quick actions
13. **Dark Mode** — Light/dark theme support
14. **Responsive Design** — Mobile-friendly, works on all screen sizes

---

## 3. AI Architecture

```
User Query
    ↓
┌─────────────────────────────┐
│    Emergency Detection      │ → If urgent: Direct to emergency services
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│    Medical NLP (BioBERT)    │ → Extract symptoms, diseases, medicines,
│    with Keyword Fallback     │   body parts, severity, duration
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│    RAG Retrieval (FAISS)    │ → Search medical knowledge base for
│                             │   relevant context
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│    LLM (OpenAI GPT)         │ → Generate grounded, safe response
│    with Healthcare Prompt   │   with disclaimers
└─────────────────────────────┘
    ↓
Response + Sources + Risk Level + Disclaimer
```

---

## 4. System Architecture

```
┌──────────────────────────────────────────┐
│              Frontend (Next.js)          │
│   React + TypeScript + Tailwind + shadcn │
│        Runs on http://localhost:3000      │
└──────────────────┬───────────────────────┘
                   │ HTTP/JSON
┌──────────────────▼───────────────────────┐
│           Backend (Python FastAPI)        │
│   + AI Services + RAG + NLP + Safety     │
│      Runs on http://127.0.0.1:8000      │
└──────┬───────────┬───────────┬───────────┘
       │           │           │
  ┌────▼────┐ ┌───▼────┐ ┌───▼──────┐
  │ MongoDB │ │ FAISS  │ │ OpenAI  │
  │  Atlas  │ │ Index  │ │  GPT    │
  └─────────┘ └────────┘ └──────────┘
```

---

## 5. Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend Framework | Next.js 16 (React 19, TypeScript) |
| Styling | Tailwind CSS 4, shadcn/ui |
| State Management | Zustand |
| Backend Framework | Python FastAPI |
| ASGI Server | Uvicorn |
| AI/LLM | OpenAI GPT-4o-mini (configurable) |
| NLP | HuggingFace Transformers (BioBERT) |
| RAG | FAISS, LangChain, Sentence Transformers |
| Database | MongoDB Atlas (with in-memory fallback) |
| Authentication | JWT (python-jose), bcrypt (passlib) |
| Validation | Pydantic v2 |

---

## 6. Folder Structure

```
Healthcare-Conversational-Assistant/
│
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── core/                 # Config, security, dependencies
│   │   │   ├── config.py         # Settings (env vars, pathlib)
│   │   │   ├── security.py       # JWT + password hashing
│   │   │   └── deps.py           # Dependency injection
│   │   ├── db/                   # Database layer
│   │   │   └── database.py       # MongoDB with graceful failure
│   │   ├── models/               # Data models
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── routers/              # API route handlers
│   │   │   ├── auth.py           # /api/auth/*
│   │   │   ├── chat.py           # /api/chat
│   │   │   ├── symptoms.py       # /api/symptom-check
│   │   │   ├── appointments.py   # /api/appointments, /api/doctors
│   │   │   ├── reminders.py      # /api/reminders
│   │   │   ├── reports.py        # /api/reports/upload
│   │   │   ├── medicines.py      # /api/medicines
│   │   │   └── chat_history.py   # /api/chat-history
│   │   ├── services/             # Business logic
│   │   │   ├── chat_service.py   # LLM + RAG + NLP orchestration
│   │   │   ├── symptom_service.py# Symptom analysis
│   │   │   ├── appointment_service.py
│   │   │   ├── reminder_service.py
│   │   │   ├── report_service.py # PDF extraction + AI summary
│   │   │   ├── medicine_service.py
│   │   │   └── auth_service.py
│   │   ├── rag/                  # RAG pipeline
│   │   │   ├── pipeline.py       # Document chunking + embedding
│   │   │   └── retriever.py      # FAISS search
│   │   ├── nlp/                  # Medical NLP
│   │   │   └── medical_nlp.py    # BioBERT + keyword fallback
│   │   └── safety/               # Safety layer
│   │       └── emergency.py      # Emergency detection
│   ├── scripts/
│   │   ├── build_rag.py          # Build FAISS index from docs
│   │   └── smoke_test.py         # Automated API tests
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── medical_documents/           # Medical knowledge base (text files)
│   ├── common_colds_and_flu.txt
│   ├── headache_types.txt
│   ├── fever_management.txt
│   ├── diabetes_overview.txt
│   └── hypertension_overview.txt
│
├── vector_database/             # Generated by build_rag.py
│   ├── medical.faiss
│   └── medical_chunks.json
│
├── src/                         # Next.js frontend
│   ├── app/                      # App Router pages + API routes
│   ├── components/               # UI components
│   ├── stores/                   # Zustand state
│   ├── types/                    # TypeScript types
│   └── lib/                      # Utilities, API service
│
├── .gitignore
└── README.md
```

---

## 7. Windows Requirements

- **Windows 10/11**
- **Python 3.11.x** — [Download](https://www.python.org/downloads/)
- **Node.js 18+ or 20+** — [Download](https://nodejs.org/)
- **VS Code** — [Download](https://code.visualstudio.com/)
- **Git** — [Download](https://git-scm.com/)
- **PowerShell** (built into Windows)

> ⚠️ No Docker, WSL, or Linux required. Runs natively on Windows.

---

## 8. Python Installation (Windows)

1. Download Python 3.11 from https://www.python.org/downloads/
2. Run the installer
3. **IMPORTANT:** Check "Add Python to PATH"
4. Click "Install Now"
5. Verify in PowerShell:
   ```powershell
   python --version
   pip --version
   ```

---

## 9. Node.js Installation (Windows)

1. Download Node.js LTS from https://nodejs.org/
2. Run the installer
3. Verify in PowerShell:
   ```powershell
   node --version
   npm --version
   ```

---

## 10. Backend Setup

```powershell
# Navigate to backend
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Create environment file
copy .env.example .env
```

Edit `backend\.env` with your configuration values (see Section 13-14 below).

---

## 11. Frontend Setup

The frontend is built with Next.js and requires Node.js.

```powershell
# From the project root
cd src
npm install
npm run dev
```

Frontend: http://localhost:3000

---

## 12. Running the Project

### Option A: Frontend Only (with built-in API)

The Next.js frontend includes built-in API routes that work without the Python backend:

```powershell
cd src
npm install
npm run dev
```

Open http://localhost:3000 — the app works with AI chat powered by built-in routes.

### Option B: Full Stack (Frontend + Python Backend)

**Terminal 1 — Backend:**
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload
```

**Terminal 2 — Frontend:**
```powershell
cd src
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://127.0.0.1:8000
- Swagger Docs: http://127.0.0.1:8000/docs

---

## 13. MongoDB Atlas Setup

1. Create a free account at https://www.mongodb.com/atlas
2. Create a cluster (free tier M0)
3. Create a database user (username + password)
4. Whitelist your IP address (or allow all for development: `0.0.0.0/0`)
5. Get your connection string from "Connect" → "Connect your application"
6. Copy the connection string to `backend\.env` as `MONGODB_URL`

Example:
```
MONGODB_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net
```

**Note:** If MongoDB is not configured, the app runs in demo mode with in-memory storage. All features work without MongoDB.

---

## 14. OpenAI API Configuration

1. Create an account at https://platform.openai.com/
2. Generate an API key at https://platform.openai.com/api-keys
3. Add to `backend\.env`:
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

**Note:** If OpenAI is not configured, the backend uses rule-based fallback responses. The frontend's built-in API routes use the z-ai-web-dev-sdk which has AI built in.

---

## 15. RAG Setup

1. Place `.txt` medical documents in the `medical_documents/` folder
2. Run the RAG build script:
   ```powershell
   cd backend
   .\.venv\Scripts\Activate.ps1
   python scripts/build_rag.py
   ```
3. This creates:
   - `vector_database/medical.faiss` — FAISS index
   - `vector_database/medical_chunks.json` — Chunk metadata

The RAG pipeline:
- Reads `.txt` files from `medical_documents/`
- Splits into overlapping chunks
- Generates embeddings using Sentence Transformers (all-MiniLM-L6-v2)
- Builds and saves a FAISS index

---

## 16. API Documentation

When the backend is running, visit http://127.0.0.1:8000/docs for interactive Swagger UI.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| POST | /api/chat | AI chat |
| POST | /api/symptom-check | Symptom assessment |
| POST | /api/reports/upload | Upload medical report |
| GET | /api/medicines?query= | Medicine information |
| GET | /api/doctors | List doctors |
| GET/POST/PUT/DELETE | /api/appointments | Appointment CRUD |
| GET/POST/PUT/DELETE | /api/reminders | Reminder CRUD |
| GET/DELETE | /api/chat-history/{id} | Chat history |

---

## 17. Troubleshooting

### Backend won't start
- Ensure Python 3.11+ is installed and in PATH
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt` again
- Check `.env` file exists

### MongoDB connection fails
- The app continues without MongoDB (demo mode)
- Check your connection string format
- Ensure your IP is whitelisted in Atlas

### OpenAI not working
- The app continues without OpenAI (rule-based fallback)
- Check your API key is correct
- Check your account has credits

### RAG index not found
- Run `python scripts/build_rag.py` to build the index
- Ensure `medical_documents/` contains `.txt` files

### Frontend errors
- Run `npm install` to ensure all packages are installed
- Clear `.next` folder: `Remove-Item -Recurse -Force .next`
- Restart: `npm run dev`

---

## 18. Security

- Passwords hashed with bcrypt (never stored in plain text)
- JWT tokens for authentication
- API keys never exposed to frontend or logs
- CORS configured for specific origins
- Input validation with Pydantic
- Healthcare disclaimers on all medical responses
- Emergency detection redirects to emergency services
- Graceful failure — no crashes for missing services

---

## 19. Healthcare Safety

This system includes multiple safety layers:

1. **Emergency Detection** — Detects life-threatening symptoms (chest pain, difficulty breathing, stroke signs, etc.) and directs users to emergency services immediately
2. **Never Diagnoses** — All responses use language like "Possible causes may include..." and explicitly state "This is not a diagnosis"
3. **Never Prescribes** — Never recommends specific medications or dosages for treatment
4. **Always Recommends Doctor** — Every AI response includes a recommendation to consult a qualified healthcare provider
5. **Disclaimers** — Healthcare disclaimers shown on every medical response
6. **Risk Levels** — Every chat response includes a risk level indicator (low/moderate/high/urgent)
7. **Educational Only** — All medicine information is labeled as educational

---

## 20. Future Scope

- Real-time doctor consultations (video/audio)
- Integration with actual healthcare provider APIs
- Mobile app (React Native)
- More medical NLP models (clinical NER, relation extraction)
- User feedback and response rating
- Multi-language support
- Wearable device data integration
- Advanced RAG with re-ranking
- Fine-tuned medical LLM
- HIPAA compliance features
- Electronic Health Record (EHR) integration
