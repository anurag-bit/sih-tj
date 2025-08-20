import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any

router = APIRouter(prefix="/docgen", tags=["docgen"])

DOCGEN_SERVICE_URL = "http://docgen-go:8080/v1/docgen"

# --- Pydantic Models ---

class DocGenRequest(BaseModel):
    title: str
    description: str
    constraints: List[str] = []
    model: str | None = None
    context: Dict[str, Any] = {}
    user_prompt: str | None = None

class SummaryResponse(BaseModel):
    summary_md: str

class PlanResponse(BaseModel):
    plan_md: str

class Diagram(BaseModel):
    id: str
    type: str
    language: str
    title: str | None = None
    code: str
    rendered_svg_url: str | None = None

class DesignResponse(BaseModel):
    design_md: str
    diagrams: List[Diagram]

# A more comprehensive model for the full response
class FullResponse(BaseModel):
    summary_md: str
    plan_md: str
    design_md: str
    diagrams: List[Diagram]
    risks_md: str
    acceptance_md: str
    testing_md: str
    api_md: str
    data_md: str
    capacity_md: str

class ExportRequest(BaseModel):
    bundle: Dict[str, Any]
    format: str

class ExportResponse(BaseModel):
    artifact_id: str
    filenames: List[str]


# --- Helper Function for Proxying ---

async def _proxy_request(client: httpx.AsyncClient, method: str, url: str, json: dict = None):
    try:
        resp = await client.request(method, url, json=json, timeout=45.0)
        resp.raise_for_status()
        return resp.json()
    except httpx.HTTPStatusError as e:
        # Forward the status code and detail from the Go service if possible
        detail = e.response.text
        try:
            detail = e.response.json()
        except:
            pass
        raise HTTPException(status_code=e.response.status_code, detail=detail)
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Docgen service unavailable: {e}")


# --- API Endpoints ---

@router.post("/summary", response_model=SummaryResponse)
async def generate_summary(request: DocGenRequest):
    async with httpx.AsyncClient() as client:
        return await _proxy_request(client, "POST", f"{DOCGEN_SERVICE_URL}/summary", json=request.dict())

@router.post("/plan", response_model=PlanResponse)
async def generate_plan(request: DocGenRequest):
    async with httpx.AsyncClient() as client:
        return await _proxy_request(client, "POST", f"{DOCGEN_SERVICE_URL}/plan", json=request.dict())

@router.post("/design", response_model=DesignResponse)
async def generate_design(request: DocGenRequest):
    async with httpx.AsyncClient() as client:
        return await _proxy_request(client, "POST", f"{DOCGEN_SERVICE_URL}/design", json=request.dict())

@router.post("/full", response_model=FullResponse)
async def generate_full(request: DocGenRequest):
    async with httpx.AsyncClient() as client:
        return await _proxy_request(client, "POST", f"{DOCGEN_SERVICE_URL}/full", json=request.dict())

@router.post("/export", response_model=ExportResponse)
async def export_document(request: ExportRequest):
    async with httpx.AsyncClient() as client:
        return await _proxy_request(client, "POST", f"{DOCGEN_SERVICE_URL}/export", json=request.dict())

@router.get("/download/{artifact_id}/{filename}")
async def download_artifact(artifact_id: str, filename: str):
    url = f"{DOCGEN_SERVICE_URL}/files/{artifact_id}/{filename}"

    async def stream_generator():
        try:
            async with httpx.AsyncClient() as client:
                async with client.stream("GET", url, timeout=30.0) as response:
                    response.raise_for_status()
                    async for chunk in response.aiter_bytes():
                        yield chunk
        except httpx.HTTPError as e:
            # This part is tricky because we can't raise HTTPException after starting the stream.
            # The client will see a broken connection. Logging is important here.
            print(f"Error streaming artifact from docgen service: {e}")

    return StreamingResponse(stream_generator())
