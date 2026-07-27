"""Seed the database with realistic job listings for development/demo purposes."""
import asyncio
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Ensure the backend package is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database.connection import connect_to_database, disconnect_from_database
from app.config.settings import database_config
from app.services.ingestion import ingest_job_listings
from app.models.job_listing import JobListing


SEED_JOBS = [
    JobListing(
        company="Stripe",
        title="Senior Frontend Engineer",
        location="San Francisco, CA",
        description="Join Stripe's frontend platform team to build the next generation of payment interfaces. You'll work on React-based dashboards used by millions of businesses worldwide. We're looking for engineers who care deeply about developer experience, performance, and accessibility.",
        apply_url="https://stripe.com/jobs/search?q=senior+frontend+engineer",
        skills=["React", "TypeScript", "CSS", "GraphQL", "Node.js"],
        remote=True,
        published_at=datetime.now(timezone.utc) - timedelta(hours=2),
    ),
    JobListing(
        company="Vercel",
        title="Full Stack Engineer — Next.js",
        location="Remote",
        description="Work on the Next.js framework and Vercel's deployment platform. You'll contribute to open-source tooling that powers millions of websites, build internal services, and collaborate with a global team of engineers passionate about the web.",
        apply_url="https://vercel.com/careers?q=full+stack+engineer",
        skills=["Next.js", "React", "TypeScript", "Go", "Postgres"],
        remote=True,
        published_at=datetime.now(timezone.utc) - timedelta(hours=4),
    ),
    JobListing(
        company="Linear",
        title="Product Engineer",
        location="Remote (US/EU)",
        description="Help build the best project management tool for software teams. As a product engineer at Linear, you'll own features end-to-end — from design collaboration to shipping polished user experiences. We value craft, speed, and attention to detail.",
        apply_url="https://linear.app/careers?q=product+engineer",
        skills=["React", "TypeScript", "PostgreSQL", "Redis", "Figma"],
        remote=True,
        published_at=datetime.now(timezone.utc) - timedelta(hours=6),
    ),
    JobListing(
        company="Figma",
        title="Backend Engineer — Collaboration",
        location="San Francisco, CA",
        description="Build the real-time collaboration engine that powers Figma. You'll work on distributed systems challenges including CRDTs, operational transforms, and low-latency communication at scale.",
        apply_url="https://figma.com/careers?q=backend+engineer+collaboration",
        skills=["Rust", "C++", "TypeScript", "WebSockets", "Distributed Systems"],
        remote=False,
        published_at=datetime.now(timezone.utc) - timedelta(hours=8),
    ),
    JobListing(
        company="Notion",
        title="Senior Software Engineer — Platform",
        location="New York, NY",
        description="Join Notion's platform team to build the infrastructure that powers blocks, databases, and connected workspaces. You'll tackle challenges in data modeling, search indexing, and API design at massive scale.",
        apply_url="https://notion.so/careers?q=senior+software+engineer+platform",
        skills=["Python", "Java", "PostgreSQL", "Elasticsearch", "Kubernetes"],
        remote=True,
        published_at=datetime.now(timezone.utc) - timedelta(hours=10),
    ),
    JobListing(
        company="Supabase",
        title="Developer Advocate",
        location="Remote",
        description="Help developers succeed with Supabase. Write tutorials, create demo apps, speak at conferences, and work directly with the engineering team to improve the developer experience. You'll be the bridge between our community and our product.",
        apply_url="https://supabase.com/careers?q=developer+advocate",
        skills=["PostgreSQL", "TypeScript", "Technical Writing", "React", "APIs"],
        remote=True,
        published_at=datetime.now(timezone.utc) - timedelta(hours=12),
    ),
    JobListing(
        company="Datadog",
        title="Software Engineer — Observability",
        location="New York, NY",
        description="Build the observability platform used by thousands of engineering teams. You'll work on high-throughput data pipelines, real-time analytics, and visualization systems that process trillions of data points daily.",
        apply_url="https://datadoghq.com/careers?q=software+engineer+observability",
        skills=["Go", "Python", "Kafka", "Elasticsearch", "Kubernetes"],
        remote=False,
        published_at=datetime.now(timezone.utc) - timedelta(hours=14),
    ),
    JobListing(
        company="Cloudflare",
        title="Systems Engineer — Workers Runtime",
        location="Austin, TX",
        description="Work on Cloudflare Workers, the serverless platform running on 300+ data centers globally. You'll optimize V8 isolate performance, build runtime APIs, and push the boundaries of edge computing.",
        apply_url="https://cloudflare.com/careers?q=systems+engineer+workers",
        skills=["Rust", "C++", "V8", "WebAssembly", "Linux"],
        remote=True,
        published_at=datetime.now(timezone.utc) - timedelta(hours=16),
    ),
    JobListing(
        company="Shopify",
        title="Senior Data Engineer",
        location="Toronto, ON",
        description="Design and build data pipelines that power Shopify's merchant analytics. You'll work with petabyte-scale datasets, build real-time streaming architectures, and enable data-driven decisions for millions of merchants.",
        apply_url="https://shopify.com/careers?q=senior+data+engineer",
        skills=["Python", "Spark", "SQL", "Airflow", "dbt"],
        remote=True,
        published_at=datetime.now(timezone.utc) - timedelta(hours=18),
    ),
    JobListing(
        company="GitHub",
        title="Staff Engineer — Copilot",
        location="Remote (US)",
        description="Shape the future of AI-assisted development on GitHub Copilot. You'll work at the intersection of large language models and developer tooling, building features that help millions of developers write better code faster.",
        apply_url="https://github.com/about/careers?q=staff+engineer+copilot",
        skills=["Python", "TypeScript", "Machine Learning", "LLMs", "VS Code"],
        remote=True,
        published_at=datetime.now(timezone.utc) - timedelta(hours=20),
    ),
    JobListing(
        company="Anthropic",
        title="Research Engineer",
        location="San Francisco, CA",
        description="Work on AI safety research and build the next generation of large language models. You'll contribute to fundamental research in alignment, interpretability, and capability evaluation while shipping production systems.",
        apply_url="https://anthropic.com/careers?q=research+engineer",
        skills=["Python", "PyTorch", "JAX", "Machine Learning", "Distributed Computing"],
        remote=False,
        published_at=datetime.now(timezone.utc) - timedelta(hours=22),
    ),
    JobListing(
        company="Tailwind Labs",
        title="UI Engineer",
        location="Remote",
        description="Work on Tailwind CSS, Headless UI, and Heroicons. You'll design and implement component APIs, build documentation sites, and shape the tools used by millions of web developers worldwide.",
        apply_url="https://tailwindcss.com/careers?q=ui+engineer",
        skills=["CSS", "React", "TypeScript", "Design Systems", "Accessibility"],
        remote=True,
        published_at=datetime.now(timezone.utc) - timedelta(hours=24),
    ),
    JobListing(
        company="PlanetScale",
        title="Database Engineer",
        location="Remote (US/EU)",
        description="Build the serverless MySQL platform used by thousands of companies. You'll work on Vitess-based database orchestration, query optimization, and developer tooling for modern database workflows.",
        apply_url="https://planetscale.com/careers?q=database+engineer",
        skills=["Go", "MySQL", "Vitess", "Kubernetes", "Terraform"],
        remote=True,
        published_at=datetime.now(timezone.utc) - timedelta(hours=26),
    ),
    JobListing(
        company="Resend",
        title="Founding Engineer",
        location="San Francisco, CA",
        description="Join Resend as a founding engineer and help build the best email API for developers. You'll work across the stack — from React email templates to high-throughput delivery infrastructure.",
        apply_url="https://resend.com/careers?q=founding+engineer",
        skills=["React", "TypeScript", "Node.js", "AWS", "PostgreSQL"],
        remote=True,
        published_at=datetime.now(timezone.utc) - timedelta(hours=28),
    ),
    JobListing(
        company="Netflix",
        title="Senior Software Engineer — Studio Engineering",
        location="Los Gatos, CA",
        description="Build the tools that power Netflix's content production pipeline. You'll work on applications used by thousands of creatives and production staff worldwide, tackling challenges in media processing, workflow orchestration, and real-time collaboration.",
        apply_url="https://netflix.com/jobs?q=senior+software+engineer+studio",
        skills=["Java", "React", "GraphQL", "AWS", "Microservices"],
        remote=False,
        published_at=datetime.now(timezone.utc) - timedelta(hours=30),
    ),

]


async def main() -> None:
    print(f"Connecting to database: {database_config.database_url}")
    await connect_to_database(database_config.database_url)

    print(f"Seeding {len(SEED_JOBS)} job listings...")
    ingested = await ingest_job_listings(SEED_JOBS, source_name="seed")
    print(f"Successfully ingested {len(ingested)} new jobs (duplicates skipped)")

    await disconnect_from_database()
    print("Done!")


if __name__ == "__main__":
    asyncio.run(main())
