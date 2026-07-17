from fastapi import APIRouter

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/", summary="List job summaries")
async def list_jobs() -> dict[str, str]:
    return {"message": "Job list endpoint placeholder"}
