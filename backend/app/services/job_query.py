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

    query = select(Job).options(joinedload(Job.company))

    # Join company if needed for filters or keyword match
    needs_company_join = company is not None or clean_keyword is not None
    if needs_company_join:
        query = query.join(Job.company)

    if filters:
        query = query.where(and_(*filters))

    # Smart Priority Ranking Score Calculation (India-first, Remote, Internship, Data/AI)
    # +40 India location, +30 Remote, +25 Internship, +25 Data/AI, +15 Fresher
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

    # Smart Priority Score as primary ranking factor for default sorting
    order_clauses.append(desc(total_smart_score))

    if sort_by == "oldest":
        order_clauses.append(asc(Job.published_at))
    else:
        order_clauses.append(desc(Job.published_at))

    query = query.order_by(*order_clauses).offset(offset).limit(page_size)

    # Count query
    count_query = select(sa.func.count()).select_from(Job)
    if needs_company_join:
        count_query = count_query.join(Job.company)
    if filters:
        count_query = count_query.where(and_(*filters))

    result = await session.execute(query)
    all_jobs = result.scalars().all()

    # Company Diversity Cap: Max 3 jobs per company per page to ensure balanced distribution
    diverse_jobs = []
    company_counts: Dict[str, int] = {}
    for job in all_jobs:
        comp_name = job.company.name if job.company else "Unknown"
        count = company_counts.get(comp_name, 0)
        if count < 3:
            diverse_jobs.append(job)
            company_counts[comp_name] = count + 1

    # If diverse_jobs has space, backfill with remaining jobs
    if len(diverse_jobs) < len(all_jobs) and len(diverse_jobs) < page_size:
        seen_ids = {j.id for j in diverse_jobs}
        for j in all_jobs:
            if j.id not in seen_ids:
                diverse_jobs.append(j)
                seen_ids.add(j.id)
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
