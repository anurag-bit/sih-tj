# Development Instructions & Guidelines

## Project Overview
This document provides essential development guidelines for the SIH Solver's Compass project - an AI-powered platform for Smart India Hackathon problem discovery and exploration.

## Quick Start for Developers

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.10+ (for local backend development)
- Git

### Initial Setup
```bash
# Clone and setup
git clone [repository-url]
cd sih-tj

# Configure environment
cp .env.template .env
# Edit .env with your API keys (GEMINI_API_KEY required)

# Start full application
docker-compose up --build

# Access services
# Frontend: http://localhost:80
# Backend API: http://localhost:8000
# ChromaDB: http://localhost:8001
```

## Development Modes

### Full Stack Development (Recommended)
```bash
# Start all services with Docker
docker-compose up

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Local Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Start ChromaDB first
docker-compose up chroma-db

# Run backend locally
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Local Frontend Development
```bash
cd frontend
npm install

# Ensure backend is running (Docker or local)
npm run dev

# Frontend will be available at http://localhost:5173
```

## Project Architecture

### Backend Structure (`backend/`)
```
app/
├── routers/          # API endpoints
│   ├── search.py     # Semantic search endpoints
│   ├── github.py     # GitHub integration
│   ├── chat.py       # AI chat functionality
│   └── dashboard.py  # Analytics endpoints
├── services/         # Business logic
│   ├── search_service.py
│   ├── github_service.py
│   ├── chat_service.py
│   └── dashboard_service.py
├── models.py         # Pydantic data models
├── config.py         # Application configuration
└── main.py          # FastAPI application entry
```

### Frontend Structure (`frontend/src/`)
```
components/
├── layout/          # App layout components
├── ui/             # Reusable UI components
pages/              # Route-based page components
hooks/              # Custom React hooks
App.tsx             # Main application component
main.tsx            # React entry point
```

## Development Guidelines

### Code Style & Patterns

#### Backend (Python)
- Use async/await for all I/O operations
- Implement proper error handling with custom exceptions
- Use Pydantic models for all data validation
- Follow FastAPI best practices
- Include comprehensive logging

```python
# Example service method
async def search_problems(self, query: str) -> List[SearchResult]:
    if not self._initialized:
        await self.initialize()
    
    try:
        # Implementation
        results = await self._perform_search(query)
        logger.info(f"Search completed: {len(results)} results")
        return results
    except Exception as e:
        logger.error(f"Search failed: {str(e)}")
        raise SearchServiceError(f"Search operation failed: {str(e)}")
```

#### Frontend (TypeScript/React)
- Use functional components with TypeScript
- Implement proper error boundaries
- Handle loading states for all async operations
- Use custom hooks for complex logic
- Follow the established design system

```typescript
// Example component with proper error handling
const SearchPage: React.FC = () => {
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = useCallback(async (query: string) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await searchAPI(query);
            setResults(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Search failed');
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <ErrorBoundary>
            {/* Component JSX */}
        </ErrorBoundary>
    );
};
```

### Design System Usage

#### Colors (Tailwind CSS)
```css
/* Primary palette */
bg-gray-900     /* Dark charcoal background (#1A202C) */
text-gray-50    /* Off-white text (#F7FAFC) */
bg-blue-600     /* Electric blue accent (#2563EB) */
bg-gray-800     /* Secondary background (#2D3748) */
bg-green-500    /* Success color (#38A169) */
```

#### Component Patterns
```tsx
// Button with proper styling
<Button 
    variant="primary" 
    size="md" 
    loading={isLoading}
    className="hover:shadow-lg transition-all duration-150"
>
    Search Problems
</Button>

// Card with hover effects
<div className="bg-gray-800 rounded-xl p-6 hover:border-blue-600 hover:shadow-lg transition-all duration-150">
    {/* Card content */}
</div>
```

### API Integration Patterns

#### Backend API Endpoints
```python
# Router pattern
@router.post("/search", response_model=List[SearchResult])
async def semantic_search(query: SearchQuery) -> List[SearchResult]:
    try:
        results = await search_service.search(query.query, query.limit)
        return results
    except SearchServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))

# Service pattern with caching
class SearchService:
    async def search(self, query: str, limit: int = 20) -> List[SearchResult]:
        # Check cache first
        cache_key = f"search:{hash(query)}"
        if cached := self._get_cached(cache_key):
            return cached
            
        # Perform search
        results = await self._vector_search(query, limit)
        
        # Cache results
        self._cache_results(cache_key, results)
        return results
```

#### Frontend API Calls
```typescript
// API service pattern
class SearchAPI {
    static async searchProblems(query: string): Promise<SearchResult[]> {
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, limit: 20 })
        });
        
        if (!response.ok) {
            throw new Error(`Search failed: ${response.statusText}`);
        }
        
        return response.json();
    }
}

// React hook for API integration
const useSearch = () => {
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    
    const search = useCallback(async (query: string) => {
        setLoading(true);
        try {
            const data = await SearchAPI.searchProblems(query);
            setResults(data);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    }, []);
    
    return { results, loading, search };
};
```

## Testing Guidelines

### Backend Testing (pytest)
```bash
# Run all tests
cd backend
pytest

# Run specific test file
pytest tests/test_search_service.py

# Run with coverage
pytest --cov=app tests/
```

```python
# Test example
@pytest.mark.asyncio
async def test_search_service():
    service = SearchService()
    await service.initialize()
    
    results = await service.search("machine learning", limit=5)
    
    assert len(results) <= 5
    assert all(isinstance(r, SearchResult) for r in results)
    assert all(0 <= r.similarity_score <= 1 for r in results)
```

### Frontend Testing (Jest + React Testing Library)
```bash
# Run tests
cd frontend
npm test

# Run with coverage
npm run test:coverage
```

```typescript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from './SearchBar';

test('SearchBar handles user input and submission', () => {
    const mockOnSearch = jest.fn();
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText(/describe your skills/i);
    const button = screen.getByRole('button', { name: /search/i });
    
    fireEvent.change(input, { target: { value: 'react typescript' } });
    fireEvent.click(button);
    
    expect(mockOnSearch).toHaveBeenCalledWith('react typescript');
});
```

## Environment Configuration

### Required Environment Variables
```bash
# .env file
GEMINI_API_KEY=your_gemini_api_key_here          # Required for chat
GITHUB_TOKEN=your_github_token_here              # Optional, for rate limits
CHROMA_HOST=chroma-db                            # ChromaDB connection
CHROMA_PORT=8000                                 # ChromaDB port
ENVIRONMENT=development                          # Environment
LOG_LEVEL=INFO                                   # Logging level
```

### Development vs Production
- **Development**: Hot reloading, debug logs, test data
- **Production**: Optimized builds, structured logs, real data, health checks

## Debugging & Troubleshooting

### Common Issues

#### Backend Issues
```bash
# ChromaDB connection issues
docker-compose logs chroma-db
docker-compose restart chroma-db

# Python dependency issues
cd backend
pip install -r requirements.txt

# API key issues
# Ensure GEMINI_API_KEY is set in .env file
```

#### Frontend Issues
```bash
# Node modules issues
cd frontend
rm -rf node_modules package-lock.json
npm install

# Build issues
npm run build
# Check for TypeScript errors
```

### Logging & Monitoring
```python
# Backend logging
import logging
logger = logging.getLogger(__name__)

logger.info(f"Search query: {query}")
logger.error(f"Service error: {str(e)}")
```

```typescript
// Frontend error tracking
console.error('API Error:', error);
// In production, send to error tracking service
```

## Data Management

### Data Ingestion
```bash
# Run data ingestion script
python scripts/ingest_data.py

# Check ChromaDB status
curl http://localhost:8001/api/v1/heartbeat
```

### Database Operations
```python
# Access ChromaDB collection
collection = client.get_collection("problem_statements")

# Check collection stats
count = collection.count()
print(f"Total problems: {count}")
```

## Performance Guidelines

### Backend Performance
- Use async/await for I/O operations
- Implement caching for expensive operations
- Monitor ChromaDB query performance
- Use connection pooling for external APIs

### Frontend Performance
- Implement code splitting for routes
- Use React.memo for expensive components
- Optimize bundle size with tree shaking
- Implement proper loading states

## Security Considerations

### API Security
- Never commit API keys to version control
- Use environment variables for sensitive configuration
- Implement proper error handling (don't expose internal details)
- Validate all user inputs with Pydantic models

### Frontend Security
- Sanitize user inputs before display
- Use HTTPS in production
- Implement proper CORS configuration
- Handle authentication tokens securely

## Deployment

### Docker Deployment
```bash
# Production build
docker-compose -f docker-compose.yml up --build -d

# Health checks
curl http://localhost:8000/health
curl http://localhost:80
```

### Environment Setup
- Ensure all required environment variables are set
- Configure proper logging levels
- Set up monitoring and health checks
- Configure backup strategies for ChromaDB data

## Contributing Guidelines

### Code Review Process
1. Create feature branch from `main`
2. Implement changes following coding standards
3. Add comprehensive tests
4. Update documentation if needed
5. Submit pull request with detailed description
6. Address review feedback
7. Merge after approval

### Commit Message Format
```
feat: add semantic search functionality
fix: resolve ChromaDB connection issue  
docs: update API documentation
test: add search service tests
refactor: improve error handling patterns
```

### Branch Naming
- `feature/search-optimization`
- `fix/github-api-rate-limit`
- `docs/api-documentation`

## Support & Resources

### Documentation
- FastAPI: https://fastapi.tiangolo.com/
- React: https://reactjs.org/docs/
- ChromaDB: https://docs.trychroma.com/
- Tailwind CSS: https://tailwindcss.com/docs

### Internal Resources
- API Documentation: http://localhost:8000/docs (when running)
- Project Context: `.ai/gemini-context.md`
- GitHub Copilot Instructions: `.github/copilot-instructions.md`

This document serves as the comprehensive guide for developers working on the SIH Solver's Compass project. Follow these guidelines to maintain code quality, consistency, and project standards.
