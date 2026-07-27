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


INTERNSHIP_KEYWORDS = [
    "intern", "internship", "sde intern", "software intern", "ai intern",
    "ml intern", "data analyst intern", "graduate intern"
]

FRESHER_KEYWORDS = [
    "fresher", "graduate", "associate", "entry level", "junior",
    "trainee", "campus", "new grad"
]

INDIA_CITIES = [
    "bengaluru", "bangalore", "pune", "mumbai", "hyderabad", "chennai",
    "delhi", "gurugram", "gurgaon", "noida", "kochi", "ahmedabad"
]


class CategoryClassifier:
    @staticmethod
    def classify_metadata(job: Job) -> None:
        title_lower = (job.title or "").lower()
        desc_lower = (job.description or "").lower()
        loc_lower = (job.location or "").lower()

        # Internship classification
        is_intern = any(kw in title_lower or kw in desc_lower[:300] for kw in INTERNSHIP_KEYWORDS)
        job.is_internship = is_intern

        # Fresher classification
        is_fresh = any(kw in title_lower or kw in desc_lower[:300] for kw in FRESHER_KEYWORDS)
        job.is_fresher = is_fresh

        # Employment type
        if is_intern:
            job.employment_type = "Internship"
        elif "contract" in title_lower or "contract" in desc_lower[:200]:
            job.employment_type = "Contract"
        else:
            job.employment_type = "Full-Time"

        # Experience level
        if is_fresh:
            job.experience_level = "Fresher"
        elif is_intern:
            job.experience_level = "Internship"
        elif "senior" in title_lower or "staff" in title_lower or "lead" in title_lower or "principal" in title_lower:
            job.experience_level = "Senior Level"
        else:
            job.experience_level = "Mid Level"

        # Country and City classification
        if any(city in loc_lower for city in INDIA_CITIES) or "india" in loc_lower:
            job.country = "India"
            found_city = next((city.capitalize() for city in INDIA_CITIES if city in loc_lower), "India")
            if found_city == "Bangalore":
                found_city = "Bengaluru"
            job.city = found_city
        elif job.remote or "remote" in loc_lower:
            job.country = "Remote"
            job.city = "Remote"
        else:
            job.country = "Global"
            job.city = job.location.split(",")[0].strip() if job.location else "Global"

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
        # Populate DB metadata attributes
        cls.classify_metadata(job)

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
