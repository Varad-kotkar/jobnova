from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from ..models.company import Company
from ..models.job import Job

logger = logging.getLogger("backend.app.company_service")


class CompanyService:
    @staticmethod
    async def get_companies(
        session: AsyncSession,
        search: Optional[str] = None,
        sort_by: str = "jobs",
    ) -> List[Dict[str, Any]]:
        # Aggregated query with OUTER JOIN for active_jobs, remote_jobs, latest_job_posted
        query = (
            select(
                Company.id,
                Company.name,
                Company.slug,
                Company.website,
                Company.industry,
                Company.size,
                Company.headquarters,
                Company.description,
                Company.logo_url,
                func.coalesce(func.count(Job.id), 0).label("active_jobs"),
                func.coalesce(func.sum(case((Job.remote.is_(True), 1), else_=0)), 0).label("remote_jobs"),
                func.max(Job.published_at).label("latest_job_posted"),
            )
            .outerjoin(Job, Job.company_id == Company.id)
            .group_by(
                Company.id,
                Company.name,
                Company.slug,
                Company.website,
                Company.industry,
                Company.size,
                Company.headquarters,
                Company.description,
                Company.logo_url,
            )
        )

        if search and search.strip():
            pattern = f"%{search.strip().lower()}%"
            query = query.where(func.lower(Company.name).like(pattern))

        if sort_by == "name":
            query = query.order_by(Company.name.asc())
        elif sort_by == "recent":
            query = query.order_by(func.max(Job.published_at).desc())
        else:
            # Default sort by job count descending
            query = query.order_by(func.count(Job.id).desc(), Company.name.asc())

        result = await session.execute(query)
        rows = result.all()

        companies = []
        for row in rows:
            companies.append(
                {
                    "id": row.id,
                    "name": row.name,
                    "slug": row.slug,
                    "website": row.website or f"https://{row.slug}.com",
                    "industry": row.industry or "Software & Technology",
                    "size": row.size or "100-1,000 employees",
                    "headquarters": row.headquarters or "San Francisco, CA",
                    "description": row.description or f"{row.name} is a leading technology company hiring engineering and product talent.",
                    "logo_url": row.logo_url,
                    "active_jobs": int(row.active_jobs or 0),
                    "remote_jobs": int(row.remote_jobs or 0),
                    "latest_job_posted": row.latest_job_posted.isoformat() if row.latest_job_posted else None,
                }
            )

        return companies

    @staticmethod
    async def get_company_by_slug(
        session: AsyncSession,
        slug: str,
    ) -> Optional[Dict[str, Any]]:
        clean_slug = slug.lower().strip()

        # Direct indexed database lookup on Company.slug column
        company_query = select(Company).where(Company.slug == clean_slug)
        result = await session.execute(company_query)
        company = result.scalars().first()

        if not company:
            # Fallback exact name search if slug mismatch
            fallback_query = select(Company).where(func.lower(Company.name) == clean_slug.replace("-", " "))
            fallback_res = await session.execute(fallback_query)
            company = fallback_res.scalars().first()

        if not company:
            return None

        # Fetch active jobs for company in a single indexed query
        jobs_query = (
            select(Job)
            .where(Job.company_id == company.id)
            .order_by(Job.published_at.desc())
        )
        jobs_res = await session.execute(jobs_query)
        jobs = jobs_res.scalars().all()

        locations = list({job.location for job in jobs if job.location})
        remote_count = sum(1 for job in jobs if job.remote)

        return {
            "id": company.id,
            "name": company.name,
            "slug": company.slug,
            "website": company.website or f"https://{company.slug}.com",
            "industry": company.industry or "Software & Technology",
            "size": company.size or "100-1,000 employees",
            "headquarters": company.headquarters or (locations[0] if locations else "Remote"),
            "description": company.description or f"{company.name} is a high-growth tech organization hiring engineering and product talent globally.",
            "logo_url": company.logo_url,
            "active_jobs": len(jobs),
            "remote_jobs": remote_count,
            "locations": locations[:5],
            "latest_job_posted": jobs[0].published_at.isoformat() if jobs else None,
            "jobs": [
                {
                    "id": str(job.id),
                    "slug": job.slug,
                    "title": job.title,
                    "description": job.description,
                    "location": job.location,
                    "company": company.name,
                    "apply_url": job.apply_url,
                    "skills": job.skills,
                    "remote": job.remote,
                    "published_at": job.published_at.isoformat(),
                }
                for job in jobs
            ],
        }
