# JobNova — Candidate Intelligence & Recruiter Platform (v1.1 Commercial Release)

[![CI Pipeline](https://github.com/Varad-kotkar/JobNova/actions/workflows/ci.yml/badge.svg)](https://github.com/Varad-kotkar/JobNova/actions)
![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.2+-000000.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

JobNova is a production-grade, two-sided candidate intelligence and employer recruitment platform built with **FastAPI**, **Next.js 15 (App Router)**, **PostgreSQL**, **Redis**, and **Alembic**.

---

## 🏗️ Architecture Overview

```text
                                  ┌───────────────────────────┐
                                  │   Next.js 15 App Router   │
                                  │   Candidate & Recruiter   │
                                  └─────────────┬─────────────┘
                                                │ REST / JSON
                                  ┌─────────────▼─────────────┐
                                  │    FastAPI Gateway API    │
                                  │  RBAC, Headers, Rate Limit│
                                  └─────────────┬─────────────┘
                                                │
         ┌──────────────────────────────────────┼──────────────────────────────────────┐
         │                                      │                                      │
┌────────▼─────────┐                  ┌─────────▼─────────┐                  ┌─────────▼─────────┐
│ Candidate CRM    │                  │  AI Intelligence  │                  │ Recruiter Portal  │
│  - Resume Upload │                  │  - Match Score    │                  │  - Job Posting    │
│  - Applications  │                  │  - ATS Analyzer   │                  │  - Candidate Fit  │
│  - Notifications │                  │  - Cover Letters  │                  │  - Pipeline Mgmt  │
│  - Career Roadmap│                  │  - Interview Prep │                  │  - Status Updates │
└────────┬─────────┘                  └─────────┬─────────┘                  └─────────┬─────────┘
         │                                      │                                      │
         └──────────────────────────────────────┼──────────────────────────────────────┘
                                                │
                                  ┌─────────────▼─────────────┐
                                  │    CacheManager & DB      │
                                  │   Redis + PostgreSQL      │
                                  └───────────────────────────┘
```

---

## ✨ v1.1 Commercial Release Highlights

* **Design System Polish**: Minimalist Stripe/Linear aesthetic with Plus Jakarta Sans typography, clean neutrals (`#FFFFFF`, `#F8FAFC`, `#E5E7EB`), and `#2563EB` primary accents.
* **Zero Broken Routes & Query Hardening**: Fixed Companies Directory with SQL `outerjoin` and `COALESCE` aggregations.
* **Interactive Empty States**: Popular skill pills ("Frontend", "Python", "Full Stack") and employer search cards when filters return zero direct matches.
* **Dynamic SEO Integration**: Automated dynamic `sitemap.xml`, `robots.txt`, OpenGraph cards, Twitter cards, and canonical metadata tags.
* **Production Authentication**: Clean candidate and recruiter email/password login and registration with token persistence.

---

## 🔑 Environment Variables Reference

| Variable | Description | Example / Default |
| -------- | ----------- | ----------------- |
| `DATABASE_URL` | PostgreSQL or SQLite connection string | `postgresql+asyncpg://user:pass@localhost:5432/jobnova` |
| `REDIS_URL` | Redis caching connection string | `redis://localhost:6379/0` |
| `JWT_SECRET` | 64-character secret key for JWT tokens | `your-secure-random-64-char-string` |
| `ALLOWED_CORS_ORIGINS` | Comma-separated CORS allowed domains | `https://jobnova.vercel.app,http://localhost:3000` |
| `ENVIRONMENT` | Operating environment (`development` / `production`) | `production` |

---

## 🚀 Deployment Instructions

### Deploying Backend (Railway)
1. Fork or push the repository to GitHub.
2. In Railway Dashboard, select **New Project → Deploy from GitHub repo**.
3. Point to the `backend/` directory or root `backend/Dockerfile`.
4. Add environment variables (`DATABASE_URL`, `JWT_SECRET`, `ALLOWED_CORS_ORIGINS`).

### Deploying Frontend (Vercel)
1. In Vercel Dashboard, click **New Project** and import your GitHub repository.
2. Set Framework Preset to **Next.js**.
3. Set Root Directory to `frontend`.
4. Add environment variable `NEXT_PUBLIC_API_URL` pointing to your Railway backend URL.

---

## 🚀 One-Command Launch (Docker Compose)

### 1. Environment Setup
```bash
cp .env.example .env
```

### 2. Start Production Containers
```bash
docker-compose up --build
```
- **Next.js Frontend**: [http://localhost:3000](http://localhost:3000)
- **FastAPI REST API**: [http://localhost:8000](http://localhost:8000)
- **API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Diagnostics**: [http://localhost:8000/health](http://localhost:8000/health)
- **Prometheus Metrics**: [http://localhost:8000/metrics](http://localhost:8000/metrics)

---

## 🧪 Verification & Automated Testing

### Backend Pytest Suite
```bash
python -m pytest backend/tests/
```
> **31 passed in 7.97s** (100% pass rate covering ingestion, auth, applications, resumes, AI matching, ATS analyzer, cover letters, interview coach, career coach, notifications, recruiter portal, caching, RBAC, and observability).

### Frontend Production Build
```bash
cd frontend && npm run build
```
> **✓ Compiled successfully** (All 14 Next.js App Router pages compiled with zero errors).

---

## 📄 Release Metadata
- **Version**: `1.1.0`
- **License**: MIT
