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
    clean_keyword = keyword.strip().lower() if keyword and isinstance(keyword, str) and keyword.strip() else None

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


from datetime import datetime

def _interleave_by_company(jobs: List[Job], limit: int = 12, max_per_company: int = 2) -> List[Job]:
    by_company: Dict[str, List[Job]] = {}
    for job in jobs:
        comp_name = job.company.name if (hasattr(job, "company") and job.company) else "Unknown"
        comp_jobs = by_company.setdefault(comp_name, [])
        if len(comp_jobs) < max_per_company:
            comp_jobs.append(job)

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

    # Sort strictly by published_at descending
    interleaved.sort(key=lambda j: getattr(j, "published_at", None) or datetime.min, reverse=True)
    return interleaved[:limit]


async def query_trending_companies(session: AsyncSession, limit: int = 10) -> List[Dict[str, Any]]:
    """Return top companies by number of active jobs posted."""
    stmt = (
        select(Company, func.count(Job.id).label("job_count"))
        .join(Job, Job.company_id == Company.id)
        .where(Job.is_active == True)
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
    DB-driven homepage sections with smart fallback so every section is rich
    with active job cards.
    """
    base_filter = Job.is_active == True

    # Load section config from DB
    section_stmt = (
        select(HomepageSection)
        .where(HomepageSection.enabled == True)
        .order_by(HomepageSection.order)
    )
    section_res = await session.execute(section_stmt)
    sections = section_res.scalars().all()

    # Load all active jobs ordered by published_at
    all_active_query = (
        select(Job)
        .options(joinedload(Job.company))
        .where(base_filter)
        .order_by(desc(Job.published_at))
        .limit(100)
    )
    all_active_res = await session.execute(all_active_query)
    all_active_jobs = all_active_res.scalars().all()

    result: Dict[str, Any] = {}

    for section in sections:
        key = section.key
        limit = section.limit or 12
        qf = section.query_filter or {}

        # Skip non-job sections
        if key in ("developer_corner", "trending_companies"):
            continue

        section_filters = [base_filter]

        if qf.get("country"):
            india_cities = ["india", "bengaluru", "bangalore", "pune", "mumbai",
                            "hyderabad", "chennai", "delhi", "gurugram", "gurgaon",
                            "noida", "kochi", "ahmedabad", "karnataka", "maharashtra"]
            if qf["country"] == "India":
                city_conds = [sa.func.lower(Job.location).like(f"%{c}%") for c in india_cities]
                title_conds = [sa.func.lower(Job.title).like(f"%{c}%") for c in ["india", "bengaluru", "pune", "mumbai", "hyderabad", "delhi"]]
                section_filters.append(or_(Job.country == "India", *city_conds, *title_conds))
            else:
                section_filters.append(Job.country == qf["country"])

        if qf.get("remote") is True:
            remote_kw = ["remote", "wfh", "anywhere", "worldwide", "work from home", "global"]
            remote_conds = [sa.func.lower(Job.location).like(f"%{r}%") for r in remote_kw]
            section_filters.append(or_(Job.remote == True, Job.country == "Remote", *remote_conds))

        if qf.get("is_internship") is True:
            intern_kw = ["intern", "internship", "trainee", "co-op", "student"]
            title_conds = [sa.func.lower(Job.title).like(f"%{k}%") for k in intern_kw]
            desc_conds = [sa.func.lower(Job.description).like(f"%{k}%") for k in ["intern", "internship"]]
            section_filters.append(or_(Job.is_internship == True, Job.employment_type == "Internship", *title_conds, *desc_conds))

        if qf.get("is_fresher") is True:
            fresher_kw = ["fresher", "graduate", "entry", "associate", "junior", "trainee", "campus", "0-1"]
            title_conds = [sa.func.lower(Job.title).like(f"%{k}%") for k in fresher_kw]
            section_filters.append(or_(Job.is_fresher == True, Job.experience_level == "Fresher", *title_conds))

        job_query = (
            select(Job)
            .options(joinedload(Job.company))
            .where(*section_filters)
            .order_by(desc(Job.published_at))
            .limit(limit * 3)
        )
        job_res = await session.execute(job_query)
        matched_jobs = list(job_res.scalars().all())

        # If matched jobs are fewer than limit, supplement with all active jobs (deduped)
        if len(matched_jobs) < limit:
            seen_ids = {j.id for j in matched_jobs}
            for j in all_active_jobs:
                if j.id not in seen_ids:
                    matched_jobs.append(j)
                    seen_ids.add(j.id)
                if len(matched_jobs) >= limit * 2:
                    break

        result[key] = _interleave_by_company(matched_jobs, limit=limit, max_per_company=2)

    # Always include latest
    if "latest" not in result:
        result["latest"] = _interleave_by_company(all_active_jobs, limit=12, max_per_company=2)

    # Trending companies
    result["trending_companies"] = await query_trending_companies(session, limit=10)

    # Section config metadata for frontend rendering (excluding developer_corner)
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
        if s.key != "developer_corner"
    ]

    return result
