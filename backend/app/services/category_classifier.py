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
        "keywords": ["ai", "machine learning", "ml", "deep learning", "llm", "pytorch", "tensorflow", "nlp", "computer vision", "generative"],
    },
    {
        "name": "Data Science & Analytics",
        "slug": "data-science-analytics",
        "icon": "📊",
        "description": "Data pipelines, quantitative analysis, business intelligence, and big data engineering.",
        "keywords": ["data science", "data engineer", "data analyst", "spark", "pandas", "dbt", "snowflake", "bigquery", "analytics"],
    },
    {
        "name": "Cloud & DevOps",
        "slug": "cloud-devops",
        "icon": "⚡",
        "description": "Cloud infrastructure, Kubernetes orchestration, CI/CD pipelines, and SRE operations.",
        "keywords": ["devops", "sre", "cloud", "aws", "kubernetes", "k8s", "docker", "terraform", "ci/cd", "infrastructure", "gcp", "azure"],
    },
    {
        "name": "Cybersecurity",
        "slug": "cybersecurity",
        "icon": "🔒",
        "description": "Information security, threat detection, penetration testing, and compliance.",
        "keywords": ["security", "cybersecurity", "infosec", "penetration testing", "compliance", "soc", "vulnerability"],
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
    "ml intern", "data analyst intern", "graduate intern", "co-op", "coop"
]

FRESHER_KEYWORDS = [
    "fresher", "graduate", "associate", "entry level", "entry-level", "junior",
    "trainee", "campus", "new grad", "0-1 year", "0-2 year", "recent graduate"
]

# India state detection
INDIA_CITIES = {
    "bengaluru": "Karnataka", "bangalore": "Karnataka",
    "pune": "Maharashtra", "mumbai": "Maharashtra", "nagpur": "Maharashtra",
    "hyderabad": "Telangana", "secunderabad": "Telangana",
    "chennai": "Tamil Nadu", "coimbatore": "Tamil Nadu",
    "delhi": "Delhi", "new delhi": "Delhi",
    "noida": "Uttar Pradesh", "ghaziabad": "Uttar Pradesh",
    "gurugram": "Haryana", "gurgaon": "Haryana", "faridabad": "Haryana",
    "kochi": "Kerala", "thiruvananthapuram": "Kerala",
    "ahmedabad": "Gujarat", "surat": "Gujarat",
    "jaipur": "Rajasthan", "kolkata": "West Bengal",
    "chandigarh": "Punjab", "lucknow": "Uttar Pradesh",
    "bhopal": "Madhya Pradesh", "indore": "Madhya Pradesh",
}

# City name normalization
CITY_ALIASES = {
    "bangalore": "Bengaluru",
    "gurgaon": "Gurugram",
}

HYBRID_KEYWORDS = ["hybrid", "hybrid work", "hybrid mode", "2-3 days", "3 days office", "flexible"]
ONSITE_KEYWORDS = ["on-site", "onsite", "in-office", "in office", "on site", "office only"]
REMOTE_KEYWORDS = ["remote", "wfh", "work from home", "work from anywhere", "fully remote"]

AI_TAG_RULES = {
    "India": lambda t, d, l: any(c in l for c in INDIA_CITIES) or "india" in l,
    "Remote": lambda t, d, l: "remote" in l or "remote" in t,
    "Internship": lambda t, d, l: any(kw in t or kw in d[:300] for kw in INTERNSHIP_KEYWORDS),
    "Fresher": lambda t, d, l: any(kw in t or kw in d[:300] for kw in FRESHER_KEYWORDS),
    "AI/ML": lambda t, d, l: any(kw in f"{t} {d}" for kw in ["machine learning", "ai ", "nlp", "deep learning", "llm"]),
    "Python": lambda t, d, l: "python" in f"{t} {d}",
    "Data": lambda t, d, l: any(kw in t for kw in ["data analyst", "data scientist", "data engineer"]),
    "Cloud": lambda t, d, l: any(kw in f"{t} {d}" for kw in ["aws", "gcp", "azure", "cloud"]),
    "Cybersecurity": lambda t, d, l: any(kw in f"{t} {d}" for kw in ["security", "cybersecurity", "infosec"]),
    "Senior": lambda t, d, l: any(kw in t for kw in ["senior", "staff", "lead", "principal", "director"]),
    "Entry Level": lambda t, d, l: any(kw in t or kw in d[:200] for kw in ["entry level", "junior", "associate", "fresher"]),
    "Hybrid": lambda t, d, l: any(kw in d[:500] for kw in HYBRID_KEYWORDS),
    "Full-Time": lambda t, d, l: "full-time" in d[:300] or "full time" in d[:300],
}


class CategoryClassifier:
    @staticmethod
    def classify_metadata(job: Job) -> None:
        title_lower = (job.title or "").lower()
        desc_lower = (job.description or "").lower()
        loc_lower = (job.location or "").lower()
        combined = f"{title_lower} {desc_lower}"

        # --- Internship / Fresher ---
        job.is_internship = any(kw in title_lower or kw in desc_lower[:300] for kw in INTERNSHIP_KEYWORDS)
        job.is_fresher = any(kw in title_lower or kw in desc_lower[:300] for kw in FRESHER_KEYWORDS)

        # --- Employment type ---
        if job.is_internship:
            job.employment_type = "Internship"
        elif "contract" in combined[:300]:
            job.employment_type = "Contract"
        elif "part-time" in combined[:300] or "part time" in combined[:300]:
            job.employment_type = "Part-Time"
        else:
            job.employment_type = "Full-Time"

        # --- Experience level ---
        if job.is_fresher:
            job.experience_level = "Fresher"
        elif job.is_internship:
            job.experience_level = "Internship"
        elif any(kw in title_lower for kw in ["senior", "staff", "lead", "principal", "director", "vp", "head of"]):
            job.experience_level = "Senior Level"
        elif any(kw in title_lower for kw in ["mid", "ii", "iii", "2", "3"]):
            job.experience_level = "Mid Level"
        else:
            job.experience_level = "Mid Level"

        # --- Work modality ---
        if any(kw in loc_lower or kw in desc_lower[:500] for kw in HYBRID_KEYWORDS):
            job.hybrid = True
            job.onsite = False
        elif any(kw in loc_lower or kw in desc_lower[:500] for kw in ONSITE_KEYWORDS):
            job.onsite = True
            job.hybrid = False
        elif job.remote or any(kw in loc_lower for kw in REMOTE_KEYWORDS):
            job.hybrid = False
            job.onsite = False

        # --- Country / State / City detection ---
        found_city = None
        found_state = None
        for city_key, state_name in INDIA_CITIES.items():
            if city_key in loc_lower:
                found_city = CITY_ALIASES.get(city_key, city_key.capitalize())
                found_state = state_name
                break

        if found_city or "india" in loc_lower:
            job.country = "India"
            job.state = found_state or "India"
            job.city = found_city or "India"
        elif job.remote or any(kw in loc_lower for kw in ["remote", "anywhere", "worldwide"]):
            job.country = "Remote"
            job.state = "Remote"
            job.city = "Remote"
        else:
            job.country = "Global"
            job.state = None
            if job.location:
                parts = job.location.split(",")
                job.city = parts[0].strip()[:100] if parts else "Global"
            else:
                job.city = "Global"

        # --- AI Tags ---
        tags: list[str] = []
        for tag_name, rule_fn in AI_TAG_RULES.items():
            try:
                if rule_fn(title_lower, desc_lower, loc_lower):
                    tags.append(tag_name)
            except Exception:
                pass
        job.ai_tags = tags

        # --- Primary job category (single label) ---
        for item in TAXONOMY:
            search_text = f"{title_lower} {desc_lower[:500]}"
            if any(kw in search_text for kw in item["keywords"]):
                job.job_category = item["name"]
                break
        else:
            job.job_category = "Software Engineering"

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

        if not matched_categories:
            se_cat = next((c for c in db_categories if c.slug == "software-engineering"), None)
            if se_cat:
                matched_categories.append(se_cat)

        assigned_names = []
        for cat in matched_categories:
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
