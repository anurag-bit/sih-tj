# GitHub Copilot Instructions for SIH Solver's Compass

## Project Overview
SIH Solver's Compass is an AI-powered guidance platform that helps engineering students discover and engage with Smart India Hackathon problem statements. The platform solves "analysis paralysis" by providing intelligent search, personalized recommendations, and interactive problem exploration.

## Architecture & Tech Stack

### Backend (FastAPI + Python 3.10)
- **Framework**: FastAPI with async/await patterns
- **AI/ML**: sentence-transformers (all-MiniLM-L6-v2), Google Gemini API
- **Database**: ChromaDB vector database for semantic search
- **Key Libraries**: pydantic, httpx, chromadb, google-generativeai
- **Structure**: Clean architecture with routers, services, and models

### Frontend (React 18 + TypeScript)
- **Framework**: React 18 with TypeScript, Vite build tool
- **Styling**: Tailwind CSS with custom design system
- **Components**: Functional components with hooks
- **State Management**: React hooks (useState, useEffect, custom hooks)
- **Routing**: React Router DOM

### Infrastructure
- **Containerization**: Docker Compose with custom sih-network
- **Services**: frontend (Nginx), backend (FastAPI), chroma-db
- **Environment**: .env configuration management

## Code Style Guidelines

### Backend Python Code
```python
# Use async/await for all I/O operations
async def search_problems(query: str) -> List[SearchResult]:
    if not self._initialized:
        await self.initialize()
    
    try:
        # Business logic here
        pass
    except Exception as e:
        logger.error(f"Error in search: {str(e)}")
        raise ServiceError(f"Search failed: {str(e)}")

# Use Pydantic models for all data structures
class ProblemStatement(BaseModel):
    id: str = Field(..., description="Unique identifier")
    title: str = Field(..., description="Problem title")
    # ... other fields
```

### Frontend TypeScript Code
```typescript
// Use functional components with proper TypeScript typing
interface ComponentProps {
  onSearch: (query: string) => void;
  loading?: boolean;
}

const SearchComponent: React.FC<ComponentProps> = ({ onSearch, loading = false }) => {
  const [query, setQuery] = useState('');
  
  // Use proper error handling
  const handleSearch = useCallback(async (searchQuery: string) => {
    try {
      await onSearch(searchQuery);
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, [onSearch]);

  return (
    // JSX with Tailwind classes
  );
};
```

## Design System

### Color Palette
- Primary Background: `bg-dark-charcoal` (#1A202C)
- Primary Text: `text-off-white` (#F7FAFC)
- Accent: `bg-electric-blue` (#2563EB)
- Secondary Background: `bg-gray-800` (#2D3748)
- Success: `bg-green-500` (#38A169)

### Typography & Spacing
- Font: Inter font family
- Spacing: 4px grid system (p-4 = 16px, m-2 = 8px)
- Responsive: Mobile-first approach with sm:, md:, lg: breakpoints

### Component Patterns
```typescript
// Button component example
<Button 
  variant="primary" 
  size="md" 
  loading={isLoading}
  className="transition-all duration-150 hover:shadow-lg"
>
  Search
</Button>

// Card component example
<div className="bg-gray-800 rounded-xl p-6 hover:border-electric-blue hover:shadow-lg transition-all duration-150">
  {/* Card content */}
</div>
```

## Key Features & Implementation Patterns

### 1. Semantic Search
```python
# Backend pattern
@router.post("/search")
async def semantic_search(query: SearchQuery) -> List[SearchResult]:
    results = await search_service.search(query.query, query.limit)
    return results

# Frontend pattern
const handleSearch = async (query: string) => {
  setLoading(true);
  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit: 20 })
    });
    const results = await response.json();
    // Handle results
  } catch (error) {
    // Error handling
  } finally {
    setLoading(false);
  }
};
```

### 2. GitHub Integration
```python
# GitHub service pattern
async def get_github_profile(self, username: str) -> GitHubProfile:
    # Fetch repos, analyze tech stack, generate DNA
    github_dna = self.generate_github_dna(profile)
    return await search_service.search(github_dna)
```

### 3. Chat Interface
```python
# Streaming response pattern
@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    async def generate():
        async for chunk in chat_service.generate_streaming_response(
            request.problem_context, 
            request.user_question
        ):
            yield f"data: {chunk}\n\n"
    
    return StreamingResponse(generate(), media_type="text/plain")
```

### 4. Dashboard Analytics
```python
# Caching pattern
@router.get("/stats")
async def get_dashboard_stats():
    # Check cache first, return cached data if valid
    if dashboard_service._is_cache_valid():
        return dashboard_service._cache["stats"]
    
    # Generate fresh data
    stats = await dashboard_service.get_dashboard_stats()
    return stats
```

## Error Handling Patterns

### Backend Error Handling
```python
# Service layer errors
class SearchServiceError(Exception):
    pass

# Router error handling
try:
    results = await search_service.search(query)
    return results
except SearchServiceError as e:
    raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
except Exception as e:
    raise HTTPException(status_code=500, detail="Unexpected error")
```

### Frontend Error Handling
```typescript
// Error boundary pattern
<ErrorBoundary>
  <Routes>
    {/* Route components */}
  </Routes>
</ErrorBoundary>

// Async error handling
const [error, setError] = useState<string | null>(null);

try {
  const result = await apiCall();
} catch (err) {
  setError(err instanceof Error ? err.message : 'Unknown error');
}
```

## Testing Patterns

### Backend Tests (pytest)
```python
@pytest.fixture
async def test_client():
    return TestClient(app)

@pytest.mark.asyncio
async def test_search_endpoint(test_client):
    response = test_client.post("/api/search", json={"query": "test"})
    assert response.status_code == 200
    assert len(response.json()) > 0
```

### Frontend Tests (React Testing Library)
```typescript
import { render, screen, fireEvent } from '@testing-library/react';

test('SearchBar handles user input', () => {
  const mockOnSearch = jest.fn();
  render(<SearchBar onSearch={mockOnSearch} />);
  
  const input = screen.getByPlaceholderText(/describe your skills/i);
  fireEvent.change(input, { target: { value: 'machine learning' } });
  fireEvent.click(screen.getByText(/search/i));
  
  expect(mockOnSearch).toHaveBeenCalledWith('machine learning');
});
```

## Development Workflow

### Local Development
```bash
# Backend development
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend development
cd frontend
npm run dev

# Full stack with Docker
docker-compose up --build
```

### Code Organization
- **Backend**: Separate concerns (routers, services, models)
- **Frontend**: Component-based architecture with custom hooks
- **Configuration**: Environment variables via .env files
- **Documentation**: Inline comments for complex logic

## Performance Considerations

### Backend Optimizations
- Use async/await for I/O operations
- Implement caching for expensive operations
- Connection pooling for database operations
- Proper error handling and logging

### Frontend Optimizations
- Code splitting with React.lazy()
- Memoization with useMemo/useCallback
- Proper loading states and error boundaries
- Responsive design with mobile-first approach

## Security Best Practices

### Backend Security
- Environment variables for API keys
- Input validation with Pydantic models
- CORS configuration for cross-origin requests
- Proper error messages (no sensitive data exposure)

### Frontend Security
- Input sanitization for user data
- Proper error handling (no sensitive data in logs)
- HTTPS in production environments

Remember: This is an AI-powered guidance platform focused on helping students. Always prioritize user experience, performance, and clear error messages. The goal is to reduce complexity and provide intelligent, helpful interactions.
