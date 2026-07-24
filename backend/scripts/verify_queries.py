"""Quick verification that the database has been seeded and queries work."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database.connection import connect_to_database, disconnect_from_database
from app.config.settings import database_config
from app.services.job_query import query_jobs
from app.database.session import get_async_sessionmaker


async def main() -> None:
    await connect_to_database(database_config.database_url)
    sessionmaker = get_async_sessionmaker()

    async with sessionmaker() as session:
        # Test 1: Basic fetch
        jobs, total = await query_jobs(session, page=1, page_size=25)
        print(f"Total jobs in DB: {total}")
        for job in jobs[:3]:
            print(f"  - {job.title} @ {job.company.name} ({job.location})")

        # Test 2: Keyword search
        jobs, total = await query_jobs(session, keyword="react")
        print(f"\nKeyword 'react': {total} results")

        # Test 3: Remote filter
        jobs, total = await query_jobs(session, remote=True)
        print(f"Remote only: {total} results")

        # Test 4: Location filter
        jobs, total = await query_jobs(session, location="San Francisco")
        print(f"San Francisco: {total} results")

    await disconnect_from_database()
    print("\nAll queries passed!")


if __name__ == "__main__":
    asyncio.run(main())
