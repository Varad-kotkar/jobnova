from __future__ import annotations
# pylint: disable=E1102

import logging
import math
import time
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import and_, case, cast, desc, asc, func, or_, select
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from ..models.company import Company
from ..models.homepage_section import HomepageSection
from ..models.job import Job

logger = logging.getLogger("backend.app.job_query")


async def query_jobs(
    session: AsyncSession,
    page: int = 1,
    page_size: int = 25,
    keyword: Optional[str] = None,
    company: Optional[str] = None,
    location: Optional[str] = None,
    remote: Optional[bool] = None,
    sort_by: str = "newest",
    # New structured filters
    employment_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    is_internship: Optional[bool] = None,
    is_fresher: Optional[bool] = None,
    country: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    category: Optional[str] = None,
) -> Tuple[List[Job], Dict[str, Any]]:
    start_time = time.perf_counter()
    page = max(page, 1)
    page_size = max(min(page_size, 100), 1)
    offset = (page - 1) * page_size

    filters = [Job.is_active == True]
    clean_keyword = keyword.strip().lower() if keyword and keyword.strip() else None

    # Keyword search across title, description, location, company, skills
    if clean_keyword:
        pattern = f"%{clean_keyword}%"
        skills_text = cast(Job.skills, sa.String)
        ai_tags_text = cast(Job.ai_tags, sa.String)
        filters.append(
            or_(
                sa.func.lower(Job.title).like(pattern),
                sa.func.lower(Job.description).like(pattern),
                sa.func.lower(Job.location).like(pattern),
                sa.func.lower(Company.name).like(pattern),
                sa.func.lower(skills_text).like(pattern),
                sa.func.lower(ai_tags_text).like(pattern),
                sa.func.lower(Job.job_category).like(pattern),
            )
        )

    if isinstance(company, str) and company.strip():
        filters.append(sa.func.lower(Company.name).like(f"%{company.strip().lower()}%"))

    if isinstance(location, str) and location.strip():
        filters.append(sa.func.lower(Job.location).like(f"%{location.strip().lower()}%"))

    if isinstance(remote, bool):
        filters.append(Job.remote.is_(remote))

    # Structured DB field filters
    if isinstance(employment_type, str) and employment_type.strip():
        filters.append(sa.func.lower(Job.employment_type) == employment_type.strip().lower())
    if isinstance(experience_level, str) and experience_level.strip():
        filters.append(sa.func.lower(Job.experience_level) == experience_level.strip().lower())
    if isinstance(is_internship, bool):
        filters.append(Job.is_internship.is_(is_internship))
    if isinstance(is_fresher, bool):
        filters.append(Job.is_fresher.is_(is_fresher))
    if isinstance(country, str) and country.strip():
        filters.append(sa.func.lower(Job.country) == country.strip().lower())
    if isinstance(city, str) and city.strip():
        filters.append(sa.func.lower(Job.city).like(f"%{city.strip().lower()}%"))
    if isinstance(state, str) and state.strip():
        filters.append(sa.func.lower(Job.state) == state.strip().lower())
    if isinstance(category, str) and category.strip():
        filters.append(sa.func.lower(Job.job_category).like(f"%{category.strip().lower()}%"))

    # 30-Day Freshness Filter
    from datetime import datetime, timezone, timedelta
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    filters.append(Job.published_at >= thirty_days_ago)

    query = select(Job).options(joinedload(Job.company))

    needs_company_join = company is not None or clean_keyword is not None
    if needs_company_join:
        query = query.join(Job.company)

    if filters:
        query = query.where(and_(*filters))

    # Smart Priority Score
    india_score = case(
        (
            or_(
                sa.func.lower(Job.location).like("%india%"),
                sa.func.lower(Job.location).like("%bangalore%"),
                sa.func.lower(Job.location).like("%bengaluru%"),
                sa.func.lower(Job.location).like("%pune%"),
                sa.func.lower(Job.location).like("%hyderabad%"),
                sa.func.lower(Job.location).like("%mumbai%"),
                sa.func.lower(Job.location).like("%delhi%"),
                sa.func.lower(Job.location).like("%noida%"),
                sa.func.lower(Job.location).like("%gurgaon%"),
                sa.func.lower(Job.location).like("%gurugram%"),
                sa.func.lower(Job.location).like("%chennai%"),
                Job.country == "India",
            ),
            40,
        ),
        else_=0,
    )
    remote_score = case((Job.remote.is_(True), 30), else_=0)
    intern_score = case((Job.is_internship.is_(True), 25), else_=0)
    fresher_score = case((Job.is_fresher.is_(True), 20), else_=0)
    data_ai_score = case(
        (
            or_(
                sa.func.lower(Job.title).like("%data%"),
                sa.func.lower(Job.title).like("%ai %"),
                sa.func.lower(Job.title).like("%machine learning%"),
                sa.func.lower(Job.title).like("% ml %"),
                sa.func.lower(Job.title).like("%intelligence%"),
            ),
            25,
        ),
        else_=0,
    )
    total_smart_score = (india_score + remote_score + intern_score + fresher_score + data_ai_score).label("priority_score")

    order_clauses = []
    if clean_keyword and sort_by in ("relevance", "newest"):
        pattern = f"%{clean_keyword}%"
        skills_text = cast(Job.skills, sa.String)
        relevance_rank = case(
            (sa.func.lower(Job.title) == clean_keyword, 1),
            (sa.func.lower(Job.title).like(pattern), 2),
            (sa.func.lower(Company.name).like(pattern), 3),
            (sa.func.lower(skills_text).like(pattern), 4),
            (sa.func.lower(Job.description).like(pattern), 5),
            else_=6,
        )
        order_clauses.append(relevance_rank.asc())

    order_clauses.append(desc(total_smart_score))
    if sort_by == "oldest":
        order_clauses.append(asc(Job.published_at))
    else:
        order_clauses.append(desc(Job.published_at))

    candidate_pool_size = max(page_size * 8, 200)
    query = query.order_by(*order_clauses).offset(offset).limit(candidate_pool_size)

    count_query = select(sa.func.count()).select_from(Job)
    if needs_company_join:
        count_query = count_query.join(Job.company)
    if filters:
        count_query = count_query.where(and_(*filters))

    result = await session.execute(query)
    all_jobs = result.scalars().all()

    # Round-Robin Company Interleaving
    by_company: Dict[str, List[Job]] = {}
    for job in all_jobs:
        comp_name = job.company.name if job.company else "Unknown"
        by_company.setdefault(comp_name, []).append(job)

    diverse_jobs: List[Job] = []
    company_keys = list(by_company.keys())
    max_len = max((len(jobs_list) for jobs_list in by_company.values()), default=0)

    for i in range(max_len):
        for comp in company_keys:
            if i < len(by_company[comp]):
                diverse_jobs.append(by_company[comp][i])
                if len(diverse_jobs) >= page_size:
                    break
        if len(diverse_jobs) >= page_size:
            break

    jobs = diverse_jobs[:page_size]

    count_result = await session.execute(count_query)
    total = count_result.scalar_one()

    total_pages = max(1, math.ceil(total / page_size)) if total > 0 else 1
    has_next = page < total_pages
    has_previous = page > 1

    elapsed_ms = (time.perf_counter() - start_time) * 1000
    logger.info(
        "Job query executed in %.2fms | keyword=%s, company=%s, location=%s, remote=%s, sort=%s, country=%s | page=%d/%d | returned=%d, total=%d",
        elapsed_ms, clean_keyword, company, location, remote, sort_by, country,
        page, total_pages, len(jobs), total,
    )

    return jobs, {
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
        "has_next": has_next,
        "has_previous": has_previous,
    }


def _interleave_by_company(jobs: List[Job], limit: int = 12) -> List[Job]:
    by_company: Dict[str, List[Job]] = {}
    for job in jobs:
        comp_name = job.company.name if (hasattr(job, "company") and job.company) else "Unknown"
        by_company.setdefault(comp_name, []).append(job)

    interleaved: List[Job] = []
    company_keys = list(by_company.keys())
    max_len = max((len(l) for l in by_company.values()), default=0)

    for i in range(max_len):
        for comp in company_keys:
            if i < len(by_company[comp]):
                interleaved.append(by_company[comp][i])
                if len(interleaved) >= limit:
                    break
        if len(interleaved) >= limit:
            break

    return interleaved[:limit]


async def query_trending_companies(session: AsyncSession, limit: int = 10) -> List[Dict[str, Any]]:
    """Return top companies by number of active jobs posted in the last 30 days."""
    from datetime import datetime, timezone, timedelta
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)

    stmt = (
        select(Company, func.count(Job.id).label("job_count"))
        .join(Job, Job.company_id == Company.id)
        .where(Job.is_active == True, Job.published_at >= thirty_days_ago)
        .group_by(Company.id)
        .order_by(desc("job_count"))
        .limit(limit)
    )
    result = await session.execute(stmt)
    rows = result.all()

    return [
        {
            "id": str(company.id),
            "name": company.name,
            "slug": company.slug,
            "logo_url": company.logo_url,
            "industry": company.industry,
            "size": company.size,
            "verified": company.verified,
            "remote_policy": company.remote_policy,
            "job_count": job_count,
        }
        for company, job_count in rows
    ]


async def query_home_jobs(session: AsyncSession) -> Dict[str, Any]:
    """
    DB-driven homepage sections. Reads HomepageSection config to build each
    section dynamically, using structured DB fields rather than title matching.
    Falls back to hardcoded defaults if the table has no data.
    """
    from datetime import datetime, timezone, timedelta
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    base_filter = and_(Job.is_active == True, Job.published_at >= thirty_days_ago)

    # Load section config from DB
    section_stmt = (
        select(HomepageSection)
        .where(HomepageSection.enabled == True)
        .order_by(HomepageSection.order)
    )
    section_res = await session.execute(section_stmt)
    sections = section_res.scalars().all()

    result: Dict[str, Any] = {}

    for section in sections:
        key = section.key
        limit = section.limit or 12
        qf = section.query_filter or {}

        # Skip non-job sections (e.g. developer_corner, trending_companies)
        if key in ("developer_corner", "trending_companies"):
            continue

        section_filters = [base_filter]

        # Apply structured filters from query_filter JSON
        if qf.get("country"):
            india_cities = ["india", "bengaluru", "bangalore", "pune", "mumbai",
                            "hyderabad", "chennai", "delhi", "gurugram", "gurgaon",
                            "noida", "kochi", "ahmedabad"]
            if qf["country"] == "India":
                city_conditions = [sa.func.lower(Job.location).like(f"%{c}%") for c in india_cities]
                section_filters.append(or_(Job.country == "India", *city_conditions))
            else:
                section_filters.append(Job.country == qf["country"])

        if qf.get("remote") is True:
            remote_kw = ["remote", "wfh", "anywhere", "worldwide", "work from home"]
            remote_conds = [sa.func.lower(Job.location).like(f"%{r}%") for r in remote_kw]
            section_filters.append(or_(Job.remote == True, *remote_conds))

        if qf.get("is_internship") is True:
            section_filters.append(Job.is_internship == True)

        if qf.get("is_fresher") is True:
            section_filters.append(Job.is_fresher == True)

        job_query = (
            select(Job)
            .options(joinedload(Job.company))
            .where(*section_filters)
            .order_by(desc(Job.published_at))
            .limit(limit * 5)  # fetch pool for interleaving
        )
        job_res = await session.execute(job_query)
        raw_jobs = job_res.scalars().all()
        result[key] = _interleave_by_company(raw_jobs, limit=limit)

    # Always include latest (all active jobs, newest first)
    if "latest" not in result:
        latest_query = (
            select(Job)
            .options(joinedload(Job.company))
            .where(base_filter)
            .order_by(desc(Job.published_at))
            .limit(60)
        )
        latest_res = await session.execute(latest_query)
        result["latest"] = _interleave_by_company(latest_res.scalars().all(), limit=12)

    # Trending companies
    result["trending_companies"] = await query_trending_companies(session, limit=10)

    # Section config metadata for frontend rendering
    result["sections"] = [
        {
            "key": s.key,
            "title": s.title,
            "subtitle": s.subtitle,
            "icon": s.icon,
            "enabled": s.enabled,
            "order": s.order,
            "view_all_href": s.view_all_href,
            "view_all_label": s.view_all_label,
            "limit": s.limit,
        }
        for s in sections
    ]

    return result
