import asyncio
import logging
from sqlalchemy import select
from app.database.connection import connect_to_database
from app.database.session import get_async_sessionmaker
from app.models.job import Job
from app.services.category_classifier import CategoryClassifier

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("classify_jobs")

async def main():
    await connect_to_database("sqlite+aiosqlite:///./jobnova.db")
    sessionmaker = get_async_sessionmaker()
    async with sessionmaker() as session:
        result = await session.execute(select(Job))
        jobs = result.scalars().all()
        logger.info(f"Found {len(jobs)} jobs to classify...")
        
        count = 0
        for job in jobs:
            CategoryClassifier.classify_metadata(job)
            await CategoryClassifier.classify_and_assign(session, job)
            count += 1
        
        await session.commit()
        logger.info(f"Successfully classified and assigned metadata to {count} jobs!")

if __name__ == "__main__":
    asyncio.run(main())
