# FastAPI main application entry point
from fastapi import FastAPI

app = FastAPI(title="SIH Solver's Compass API", version="1.0.0")

@app.get("/")
async def root():
    return {"message": "SIH Solver's Compass API"}