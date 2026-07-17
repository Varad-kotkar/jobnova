from __future__ import annotations
# pylint: disable=E1102

import logging
from typing import List, Optional, Tuple

from sqlalchemy import and_, desc, or_, select
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from ..models.company import Company
from ..models.job import Job

logger = logging.getLogger(__name__)


async def query_jobs(
    session: AsyncSession,
    page: int = 1,
    page_size: int = 25,
    keyword: Optional[str] = None,
    company: Optional[str] = None,
    location: Optional[str] = None,
    remote: Optional[bool] = None,
) -> Tuple[List[Job], int]:
    page = max(page, 1)
    page_size = max(min(page_size, 100), 1)
    offset = (page - 1) * page_size

    filters = []
    if keyword:
        keyword_pattern = f"%{keyword.lower()}%"
        filters.append(
            or_(
                sa.func.lower(Job.title).like(keyword_pattern),
                sa.func.lower(Job.description).like(keyword_pattern),
                sa.func.lower(Job.location).like(keyword_pattern),
            )
        )
    if company:
        filters.append(sa.func.lower(Company.name) == company.lower())
    if location:
        filters.append(sa.func.lower(Job.location).like(f"%{location.lower()}%"))
    if remote is not None:
        filters.append(Job.remote.is_(remote))

    query = select(Job).options(joinedload(Job.company)).order_by(desc(Job.published_at)).offset(offset).limit(page_size)
    if company:
        query = query.join(Job.company)
    if filters:
        query = query.where(and_(*filters))

    count_query = select(sa.func.count()).select_from(Job)
    if company:
        count_query = count_query.join(Job.company)
    if filters:
        count_query = count_query.where(and_(*filters))

    logger.debug(
        "Querying jobs page=%s page_size=%s keyword=%s company=%s location=%s remote=%s",
        page,
        page_size,
        keyword,
        company,
        location,
        remote,
    )

    result = await session.execute(query)
    jobs = result.scalars().all()

    count_result = await session.execute(count_query)
    total = count_result.scalar_one()

    return jobs, total
