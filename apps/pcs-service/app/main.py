from fastapi import FastAPI
from app.routers import races

app = FastAPI(
    title="BCF PCS Service",
    description="Microservice procyclingstats pour BetCyclingFriends",
    version="1.0.0",
)

app.include_router(races.router, prefix="/internal/races", tags=["races"])

@app.get("/health")
async def health():
    return {"status": "ok"}