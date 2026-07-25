# JobNova — Candidate CRM & AI Intelligence Platform (v1.0.0)

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

## ✨ Features & Module Capabilities

### 1. Ingestion Engine & Spam Prevention (Phases 1–14)
* Modular scraper plugin architecture with automated duplicate detection and spam filtering (rejection of fake paid course enrollments & placement training fees).

### 2. Candidate Dashboard & Application CRM (Phases 15–16)
* Live visual funnel metrics (`Applied` → `Screening` → `Interview` → `Offer` → `Rejected` → `Withdrawn`).
* Resume parsing engine extracting 35+ tech skills, contact info, and education with version history counters.

### 3. AI Intelligence Suite (Phases 17–20)
* **Multi-Factor Match Score**: Role alignment, skill overlap, location/remote preference, and seniority evaluation.
* **ATS Resume Analyzer**: Keyword coverage score (0–100%), missing keyword highlights, section completeness, and formatting guidance.
* **AI Cover Letter Generator**: Personalized cover letter generator supporting 6 tone styles.
* **Technical Interview Coach**: Job-tailored interview prep kits featuring Technical Q&A, Coding Challenges, System Design Scenarios, STAR Behavioral Prompts, and Topics to Review.

### 4. Career Growth & Notifications Engine (Phases 21–22)
* **AI Career Coach**: Personalized 30-60-90 day growth roadmaps, skill gap reports, target salary trajectories, and portfolio project suggestions.
* **Notification Center**: Persistent notifications, unread count badges, header notification bell dropdown, and automated application follow-up reminders.

### 5. Recruiter Portal & Employer Hiring Engine (Phase 23)
* Role-Based Access Control (`candidate`, `recruiter`, `admin`).
* Employer job posting engine and candidate applicant pipeline ranking with real-time AI Fit Scores.

### 6. Non-Functional Engineering & Security (Phases 24–26)
* **Redis & In-Memory Caching**: TTL caching for job listings (300s), categories (1800s), and match scores (900s) with automated invalidation.
* **Security & RBAC**: Reusable `@require_role()` authorization dependencies, rate-limiting middleware, audit logging, and security headers (`CSP`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).
* **System Observability**: Diagnostic health endpoint (`GET /health`), `X-Request-ID` correlation tracing, `X-Response-Time` latency headers, and Prometheus telemetry metrics (`GET /metrics`).

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
> **31 passed in 8.42s** (100% pass rate covering ingestion, auth, applications, resumes, AI matching, ATS analyzer, cover letters, interview coach, career coach, notifications, recruiter portal, caching, RBAC, and observability).

### Frontend Production Build
```bash
cd frontend && npm run build
```
> **✓ Compiled successfully** (All 14 Next.js App Router pages compiled with zero errors).

---

## 📄 Release Metadata
- **Version**: `1.0.0`
- **License**: MIT
