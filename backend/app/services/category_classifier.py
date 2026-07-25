from __future__ import annotations

import logging
import re
from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.category import Category
from ..models.job import Job
from ..models.job_category import JobCategory

logger = logging.getLogger("backend.app.category_classifier")

TAXONOMY = [
    {
        "name": "Software Engineering",
        "slug": "software-engineering",
        "icon": "💻",
        "description": "Core software development roles including systems, infrastructure, and application development.",
        "keywords": ["software engineer", "developer", "engineer", "full stack", "backend", "frontend", "systems"],
    },
    {
        "name": "Frontend Development",
        "slug": "frontend-development",
        "icon": "🎨",
        "description": "User interface, web applications, and frontend framework engineering.",
        "keywords": ["frontend", "front-end", "react", "next.js", "vue", "angular", "typescript", "css", "ui engineer"],
    },
    {
        "name": "Backend Development",
        "slug": "backend-development",
        "icon": "⚙️",
        "description": "Server-side logic, API design, database systems, and microservices architecture.",
        "keywords": ["backend", "back-end", "python", "fastapi", "django", "node", "go", "golang", "java", "rust", "postgresql", "sql"],
    },
    {
        "name": "AI & Machine Learning",
        "slug": "ai-machine-learning",
        "icon": "🤖",
        "description": "Artificial intelligence, deep learning models, LLMs, and machine learning infrastructure.",
        "keywords": ["ai", "machine learning", "ml", "deep learning", "llm", "pytorch", "tensorflow", "nlp", "computer vision"],
    },
    {
        "name": "Data Science & Analytics",
        "slug": "data-science-analytics",
        "icon": "📊",
        "description": "Data pipelines, quantitative analysis, business intelligence, and big data engineering.",
        "keywords": ["data science", "data engineer", "data analyst", "spark", "pandas", "dbt", "snowflake", "bigquery"],
    },
    {
        "name": "Cloud & DevOps",
        "slug": "cloud-devops",
        "icon": "⚡",
        "description": "Cloud infrastructure, Kubernetes orchestration, CI/CD pipelines, and SRE operations.",
        "keywords": ["devops", "sre", "cloud", "aws", "kubernetes", "k8s", "docker", "terraform", "ci/cd", "infrastructure"],
    },
    {
        "name": "Cybersecurity",
        "slug": "cybersecurity",
        "icon": "🔒",
        "description": "Information security, threat detection, penetration testing, and compliance.",
        "keywords": ["security", "cybersecurity", "infosec", "penetration testing", "compliance", "soc"],
    },
    {
        "name": "Product & Design",
        "slug": "product-design",
        "icon": "🚀",
        "description": "Product management, UX research, interaction design, and visual brand identity.",
        "keywords": ["product manager", "product design", "ux", "ui/ux", "figma", "designer"],
    },
]


class CategoryClassifier:
    @staticmethod
    async def ensure_categories_exist(session: AsyncSession) -> List[Category]:
        categories = []
        for item in TAXONOMY:
            res = await session.execute(select(Category).where(Category.slug == item["slug"]))
            cat = res.scalars().first()
            if not cat:
                cat = Category(
                    name=item["name"],
                    slug=item["slug"],
                    icon=item["icon"],
                    description=item["description"],
                )
                session.add(cat)
                await session.flush()
            categories.append(cat)
        return categories

    @classmethod
    async def classify_and_assign(cls, session: AsyncSession, job: Job) -> List[str]:
        db_categories = await cls.ensure_categories_exist(session)
        
        search_text = f"{job.title} {job.description} {' '.join(job.skills or [])}".lower()
        matched_categories = []

        for item in TAXONOMY:
            for kw in item["keywords"]:
                if kw in search_text:
                    cat = next((c for c in db_categories if c.slug == item["slug"]), None)
                    if cat and cat not in matched_categories:
                        matched_categories.append(cat)
                    break

        # Fallback to Software Engineering if no category matched
        if not matched_categories:
            se_cat = next((c for c in db_categories if c.slug == "software-engineering"), None)
            if se_cat:
                matched_categories.append(se_cat)

        assigned_names = []
        for cat in matched_categories:
            # Check existing link
            check_query = select(JobCategory).where(
                (JobCategory.job_id == job.id) & (JobCategory.category_id == cat.id)
            )
            res = await session.execute(check_query)
            if not res.scalars().first():
                link = JobCategory(job_id=job.id, category_id=cat.id)
                session.add(link)
                assigned_names.append(cat.name)

        await session.flush()
        return assigned_names
