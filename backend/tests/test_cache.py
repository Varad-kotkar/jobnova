import asyncio
import pytest

from app.core.cache import CacheManager


@pytest.mark.anyio
async def test_cache_manager_operations():
    # 1. Set & Get
    await CacheManager.set("test:key1", {"data": "hello"}, ttl_seconds=10)
    val = await CacheManager.get("test:key1")
    assert val == {"data": "hello"}

    # 2. Delete Pattern
    await CacheManager.set("jobs:list:1", [1, 2, 3], ttl_seconds=10)
    await CacheManager.set("jobs:list:2", [4, 5, 6], ttl_seconds=10)
    await CacheManager.set("companies:list", [7, 8], ttl_seconds=10)

    await CacheManager.delete_pattern("jobs:list:")
    assert await CacheManager.get("jobs:list:1") is None
    assert await CacheManager.get("jobs:list:2") is None
    assert await CacheManager.get("companies:list") is not None

    # 3. Clear All
    await CacheManager.clear()
    assert await CacheManager.get("companies:list") is None
