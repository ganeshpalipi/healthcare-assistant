# Healthcare Conversational Assistant — Backend

Python FastAPI backend with AI chat, RAG, Medical NLP, and symptom assessment.

## Windows Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Create .env File

```powershell
copy .env.example .env
```

Then edit `.env` with your values.

## Run

```powershell
python -m uvicorn app.main:app --reload
```

- API: http://127.0.0.1:8000
- Swagger Docs: http://127.0.0.1:8000/docs

## RAG Setup

```powershell
python scripts/build_rag.py
```

## Smoke Test

```powershell
python scripts/smoke_test.py
```
