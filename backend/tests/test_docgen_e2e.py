import os
import pytest
from fastapi.testclient import TestClient
from ..app.main import app

client = TestClient(app)


@pytest.mark.asyncio
async def test_docgen_full_minimal_smoke():
    # Skip if running without OpenRouter key
    if not os.environ.get('OPENROUTER_API_KEY'):
        pytest.skip('OPENROUTER_API_KEY not set; skipping live docgen test')

    payload = {
        "title": "Test",
        "description": "Make a tiny API",
        "constraints": [],
        "context": {},
        "prompts": ["exec_summary", "solution_plan"],
    }

    resp = client.post('/api/docgen/full', json=payload, timeout=90)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    # At least one field should be present
    assert any(k in data and data[k] for k in ("summary_md", "plan_md", "design_md")), data
