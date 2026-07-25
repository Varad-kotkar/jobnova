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

    # Sorting & Relevance Ranking Logic
    order_clauses = []
    if clean_keyword and sort_by in ("relevance", "newest"):
        pattern = f"%{clean_keyword}%"
        skills_text = cast(Job.skills, sa.String)
        # Weighted relevance rank:
        # 1. Exact title match -> rank 1
        # 2. Partial title match -> rank 2
        # 3. Company match -> rank 3
        # 4. Skills match -> rank 4
        # 5. Description match -> rank 5
        relevance_rank = case(
            (sa.func.lower(Job.title) == clean_keyword, 1),
            (sa.func.lower(Job.title).like(pattern), 2),
            (sa.func.lower(Company.name).like(pattern), 3),
            (sa.func.lower(skills_text).like(pattern), 4),
            (sa.func.lower(Job.description).like(pattern), 5),
            else_=6,
        )
        order_clauses.append(relevance_rank.asc())

    if sort_by == "oldest":
        order_clauses.append(asc(Job.published_at))
    else:
        # Default tie-breaker or explicit newest sort
        order_clauses.append(desc(Job.published_at))

    query = query.order_by(*order_clauses).offset(offset).limit(page_size)

    # Count query
    count_query = select(sa.func.count()).select_from(Job)
    if needs_company_join:
        count_query = count_query.join(Job.company)
    if filters:
        count_query = count_query.where(and_(*filters))

    result = await session.execute(query)
    jobs = result.scalars().all()

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
