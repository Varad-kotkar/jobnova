from __future__ import annotations

import logging
import math
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from ..models.category import Category
from ..models.company import Company
from ..models.job import Job
from ..models.job_category import JobCategory

logger = logging.getLogger("backend.app.category_service")


class CategoryService:
    @staticmethod
    async def get_categories(
        session: AsyncSession,
        search: Optional[str] = None,
        sort_by: str = "jobs",
    ) -> List[Dict[str, Any]]:
        query = (
            select(
                Category.id,
                Category.name,
                Category.slug,
                Category.icon,
                Category.description,
                func.count(JobCategory.job_id).label("active_jobs"),
            )
            .outerjoin(JobCategory, JobCategory.category_id == Category.id)
            .group_by(Category.id, Category.name, Category.slug, Category.icon, Category.description)
        )

        if search and search.strip():
            pattern = f"%{search.strip().lower()}%"
            query = query.where(func.lower(Category.name).like(pattern))

        if sort_by == "name":
            query = query.order_by(Category.name.asc())
        else:
            query = query.order_by(func.count(JobCategory.job_id).desc())

        result = await session.execute(query)
        rows = result.all()

        categories = []
        for row in rows:
            # Top skills sample
            skills_query = (
                select(Job.skills)
                .join(JobCategory, JobCategory.job_id == Job.id)
                .where(JobCategory.category_id == row.id)
                .limit(5)
            )
            skills_res = await session.execute(skills_query)
            skills_list = []
            for (sk_arr,) in skills_res.all():
                if isinstance(sk_arr, list):
                    skills_list.extend(sk_arr)

            unique_top_skills = list(dict.fromkeys(skills_list))[:4]

            categories.append(
                {
                    "id": row.id,
                    "name": row.name,
                    "slug": row.slug,
                    "icon": row.icon or "💼",
                    "description": row.description,
                    "active_jobs": row.active_jobs or 0,
                    "top_skills": unique_top_skills,
                }
            )

        return categories

    @staticmethod
    async def get_category_by_slug(
        session: AsyncSession,
        slug: str,
    ) -> Optional[Dict[str, Any]]:
        clean_slug = slug.lower().strip()
        query = select(Category).where(Category.slug == clean_slug)
        result = await session.execute(query)
        category = result.scalars().first()

        if not category:
            return None

        # Count active jobs
        count_query = (
            select(func.count(JobCategory.job_id))
            .where(JobCategory.category_id == category.id)
        )
        count_res = await session.execute(count_query)
        total_jobs = count_res.scalar_one()

        return {
            "id": category.id,
            "name": category.name,
            "slug": category.slug,
            "icon": category.icon or "💼",
            "description": category.description,
            "active_jobs": total_jobs,
        }

    @staticmethod
    async def get_category_jobs(
        session: AsyncSession,
        slug: str,
        page: int = 1,
        page_size: int = 25,
        sort_by: str = "newest",
    ) -> Optional[Dict[str, Any]]:
        category_meta = await CategoryService.get_category_by_slug(session, slug)
        if not category_meta:
            return None, [], {}

        page = max(page, 1)
        page_size = max(min(page_size, 100), 1)
        offset = (page - 1) * page_size

        jobs_query = (
            select(Job)
            .options(joinedload(Job.company))
            .join(JobCategory, JobCategory.job_id == Job.id)
            .where(JobCategory.category_id == category_meta["id"])
            .order_by(Job.published_at.desc())
            .offset(offset)
            .limit(page_size)
        )

        result = await session.execute(jobs_query)
        jobs = result.scalars().all()

        total = category_meta["active_jobs"]
        total_pages = max(1, math.ceil(total / page_size)) if total > 0 else 1

        pagination_meta = {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1,
        }

        return category_meta, jobs, pagination_meta
