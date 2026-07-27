from __future__ import annotations
# pylint: disable=E1102

import logging
import math
import time
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import and_, case, cast, desc, asc, or_, select
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from ..models.company import Company
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
) -> Tuple[List[Job], Dict[str, Any]]:
    start_time = time.perf_counter()
    page = max(page, 1)
    page_size = max(min(page_size, 100), 1)
    offset = (page - 1) * page_size

    filters = []
    clean_keyword = keyword.strip().lower() if keyword and keyword.strip() else None

    if clean_keyword:
        pattern = f"%{clean_keyword}%"
        skills_text = cast(Job.skills, sa.String)
        filters.append(
            or_(
                sa.func.lower(Job.title).like(pattern),
                sa.func.lower(Job.description).like(pattern),
                sa.func.lower(Job.location).like(pattern),
                sa.func.lower(Company.name).like(pattern),
                sa.func.lower(skills_text).like(pattern),
            )
        )

    if company and company.strip():
        filters.append(sa.func.lower(Company.name).like(f"%{company.strip().lower()}%"))

    if location and location.strip():
        filters.append(sa.func.lower(Job.location).like(f"%{location.strip().lower()}%"))

    if remote is not None:
        filters.append(Job.remote.is_(remote))

    # 30-Day Freshness Filter
    from datetime import datetime, timezone, timedelta
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    filters.append(Job.published_at >= thirty_days_ago)

    query = select(Job).options(joinedload(Job.company))

    # Join company if needed for filters or keyword match
    needs_company_join = company is not None or clean_keyword is not None
    if needs_company_join:
        query = query.join(Job.company)

    if filters:
        query = query.where(and_(*filters))

    # Smart Priority Ranking Score Calculation
    india_score = case(
        (
            or_(
                sa.func.lower(Job.location).like("%india%"),
                sa.func.lower(Job.location).like("%bangalore%"),
                sa.func.lower(Job.location).like("%pune%"),
                sa.func.lower(Job.location).like("%hyderabad%"),
                sa.func.lower(Job.location).like("%mumbai%"),
                sa.func.lower(Job.location).like("%delhi%"),
                sa.func.lower(Job.location).like("%noida%"),
                sa.func.lower(Job.location).like("%gurgaon%"),
                sa.func.lower(Job.location).like("%chennai%"),
            ),
            40,
        ),
        else_=0,
    )
    remote_score = case((Job.remote.is_(True), 30), else_=0)
    intern_score = case(
        (
            or_(
                sa.func.lower(Job.title).like("%intern%"),
                sa.func.lower(Job.title).like("%fresher%"),
                sa.func.lower(Job.description).like("%internship%"),
            ),
            25,
        ),
        else_=0,
    )
    data_ai_score = case(
        (
            or_(
                sa.func.lower(Job.title).like("%data%"),
                sa.func.lower(Job.title).like("%analyst%"),
                sa.func.lower(Job.title).like("%ai %"),
                sa.func.lower(Job.title).like("%ml %"),
                sa.func.lower(Job.title).like("%intelligence%"),
            ),
            25,
        ),
        else_=0,
    )
    total_smart_score = (india_score + remote_score + intern_score + data_ai_score).label("priority_score")

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

    # Smart Priority Score as primary ranking factor
    order_clauses.append(desc(total_smart_score))

    if sort_by == "oldest":
        order_clauses.append(asc(Job.published_at))
    else:
        order_clauses.append(desc(Job.published_at))

    # Fetch candidate pool for round-robin company interleaving
    candidate_pool_size = max(page_size * 8, 200)
    query = query.order_by(*order_clauses).offset(offset).limit(candidate_pool_size)

    # Count query
    count_query = select(sa.func.count()).select_from(Job)
    if needs_company_join:
        count_query = count_query.join(Job.company)
    if filters:
        count_query = count_query.where(and_(*filters))

    result = await session.execute(query)
    all_jobs = result.scalars().all()

    # Round-Robin Company Interleaving to ensure multi-company diversity
    by_company: Dict[str, List[Job]] = {}
    for job in all_jobs:
        comp_name = job.company.name if job.company else "Unknown"
        if comp_name not in by_company:
            by_company[comp_name] = []
        by_company[comp_name].append(job)

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
        "Job query executed in %.2fms | filters=[keyword=%s, company=%s, location=%s, remote=%s, sort=%s] | page=%d/%d | returned=%d, total=%d",
        elapsed_ms,
        clean_keyword,
        company,
        location,
        remote,
        sort_by,
        page,
        total_pages,
        len(jobs),
        total,
    )

    pagination_meta = {
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
        "has_next": has_next,
        "has_previous": has_previous,
    }

    return jobs, pagination_meta


def _interleave_by_company(jobs: List[Job], limit: int = 12) -> List[Job]:
    by_company: Dict[str, List[Job]] = {}
    for job in jobs:
        comp_name = job.company.name if (hasattr(job, "company") and job.company) else "Unknown"
        if comp_name not in by_company:
            by_company[comp_name] = []
        by_company[comp_name].append(job)

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


async def query_home_jobs(session: AsyncSession) -> Dict[str, List[Job]]:
    from datetime import datetime, timezone, timedelta
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    base_filter = and_(Job.is_active == True, Job.published_at >= thirty_days_ago)

    # 1. India Jobs (country == 'India' or location contains India, Bengaluru, Pune, etc.)
    india_cities = ["india", "bengaluru", "bangalore", "pune", "mumbai", "hyderabad", "chennai", "delhi", "gurugram", "gurgaon", "noida", "kochi", "ahmedabad"]
    india_conditions = [sa.func.lower(Job.location).like(f"%{c}%") for c in india_cities]
    india_query = (
        select(Job)
        .options(joinedload(Job.company))
        .where(base_filter, or_(Job.country == "India", *india_conditions))
        .order_by(desc(Job.published_at))
        .limit(60)
    )
    india_res = await session.execute(india_query)
    india_raw = india_res.scalars().all()
    india_jobs = _interleave_by_company(india_raw, limit=12)

    # 2. Remote Jobs (remote == True or country == 'Remote' or location contains Remote, WFH, Anywhere)
    remote_keywords = ["remote", "wfh", "anywhere", "worldwide", "work from home"]
    remote_conditions = [sa.func.lower(Job.location).like(f"%{r}%") for r in remote_keywords]
    remote_query = (
        select(Job)
        .options(joinedload(Job.company))
        .where(base_filter, or_(Job.remote == True, Job.country == "Remote", *remote_conditions))
        .order_by(desc(Job.published_at))
        .limit(60)
    )
    remote_res = await session.execute(remote_query)
    remote_raw = remote_res.scalars().all()
    remote_jobs = _interleave_by_company(remote_raw, limit=12)

    # 3. Internships (is_internship == True or title contains intern)
    intern_keywords = ["intern", "internship", "sde intern", "software intern", "ai intern", "ml intern", "graduate intern"]
    intern_conditions = [sa.func.lower(Job.title).like(f"%{k}%") for k in intern_keywords]
    intern_query = (
        select(Job)
        .options(joinedload(Job.company))
        .where(base_filter, or_(Job.is_internship == True, *intern_conditions))
        .order_by(desc(Job.published_at))
        .limit(60)
    )
    intern_res = await session.execute(intern_query)
    intern_raw = intern_res.scalars().all()
    intern_jobs = _interleave_by_company(intern_raw, limit=12)

    # 4. Freshers (is_fresher == True or title contains fresher, graduate, associate, etc.)
    fresher_keywords = ["fresher", "graduate", "associate", "entry level", "junior", "trainee", "campus", "new grad"]
    fresher_conditions = [sa.func.lower(Job.title).like(f"%{k}%") for k in fresher_keywords]
    fresher_query = (
        select(Job)
        .options(joinedload(Job.company))
        .where(base_filter, or_(Job.is_fresher == True, *fresher_conditions))
        .order_by(desc(Job.published_at))
        .limit(60)
    )
    fresher_res = await session.execute(fresher_query)
    fresher_raw = fresher_res.scalars().all()
    fresher_jobs = _interleave_by_company(fresher_raw, limit=12)

    # 5. Latest Jobs
    latest_query = (
        select(Job)
        .options(joinedload(Job.company))
        .where(base_filter)
        .order_by(desc(Job.published_at))
        .limit(60)
    )
    latest_res = await session.execute(latest_query)
    latest_raw = latest_res.scalars().all()
    latest_jobs = _interleave_by_company(latest_raw, limit=12)

    return {
        "india_jobs": india_jobs,
        "remote_jobs": remote_jobs,
        "internships": intern_jobs,
        "freshers": fresher_jobs,
        "latest": latest_jobs,
    }
