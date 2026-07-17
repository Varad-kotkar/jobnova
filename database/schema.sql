-- ===========================
-- JobNova Database Schema
-- PostgreSQL
-- ===========================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    website TEXT,
    logo_url TEXT,
    industry TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Job Sources
CREATE TABLE job_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    source_type TEXT,
    base_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Jobs
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    company_id UUID REFERENCES companies(id),

    source_id UUID REFERENCES job_sources(id),

    title TEXT NOT NULL,

    slug TEXT UNIQUE,

    location TEXT,

    employment_type TEXT,

    experience_level TEXT,

    salary TEXT,

    description TEXT,

    apply_url TEXT UNIQUE,

    skills TEXT[],

    tags TEXT[],

    remote BOOLEAN DEFAULT FALSE,

    published_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jobs_title
ON jobs(title);

CREATE INDEX idx_jobs_location
ON jobs(location);

CREATE INDEX idx_jobs_remote
ON jobs(remote);

CREATE INDEX idx_jobs_slug
ON jobs(slug);

CREATE INDEX idx_jobs_company
ON jobs(company_id);