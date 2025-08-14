# AI Agent Context for SIH Solver's Compass

## Project Identity & Mission

**Project Name**: SIH Solver's Compass  
**Codename**: Solver's Compass  
**Version**: 1.0  
**Mission**: Transform how engineering students discover and engage with Smart India Hackathon problem statements by solving "analysis paralysis" through intelligent AI-powered guidance.

## Core Problem Statement

**The Challenge**: Students face analysis paralysis when choosing from hundreds of SIH problem statements. They waste time sifting through irrelevant problems and often miss perfect matches for their skills and interests.

**Our Solution**: An intelligent guidance platform that provides personalized problem discovery through:
- Semantic search using natural language queries
- GitHub repository analysis for personalized recommendations  
- Interactive AI conversations about problem statements
- Data-driven insights into the SIH landscape

## Target User Persona: "The Aspiring Innovator"

**Demographics**: Second/third-year engineering students  
**Skills**: Technically proficient in 1-2 domains (web dev, basic ML, etc.)  
**Experience**: New to large-scale hackathons  
**Goals**: Find challenging but achievable problems that match their skills and genuinely excite them  
**Frustrations**: Don't know where to start, intimidated by jargon, unsure if skills are a good fit

## Design Philosophy & Principles

1. **Empowerment over Prescription**: Provide exploration tools, not just lists
2. **Clarity over Clutter**: Every feature must reduce complexity
3. **Interaction over Static Information**: Problems become conversations

## Technical Architecture

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  React Frontend │────│  FastAPI Backend │────│   ChromaDB      │
│  (TypeScript)   │    │   (Python 3.10) │    │ (Vector Store)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        │                        ├─── Google Gemini API  │
        │                        ├─── GitHub API         │
        │                        └─── sentence-transformers
        │
    Docker Compose Orchestration (sih-network)
```

### Technology Stack Deep Dive

#### Backend Services
- **Framework**: FastAPI with async/await patterns for high performance
- **AI/ML Engine**: sentence-transformers (all-MiniLM-L6-v2) for semantic embeddings
- **Chat AI**: Google Gemini API with carefully engineered prompts
- **Vector Database**: ChromaDB for cosine similarity search
- **Data Validation**: Pydantic models for type safety
- **HTTP Client**: httpx for external API integration
- **Logging**: Structured logging with contextual information

#### Frontend Application  
- **Framework**: React 18 with TypeScript for type safety
- **Build System**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React hooks with custom hook abstractions
- **Charts**: Recharts for dashboard visualizations
- **Icons**: Heroicons for consistent iconography
- **Routing**: React Router DOM with nested routes

#### Infrastructure & DevOps
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose with custom networking
- **Data Persistence**: Named volumes for ChromaDB data
- **Environment**: Centralized configuration via .env files
- **Deployment**: Single-command deployment (`docker-compose up`)

## Core Features & Implementation Details

### 1. Intelligent Semantic Search (`/api/search`)

**Purpose**: Enable natural language problem discovery  
**Implementation**: 
- Convert user queries to vector embeddings using sentence-transformers
- Perform cosine similarity search in ChromaDB
- Return ranked results with metadata and similarity scores
- Support queries like "machine learning for healthcare" or "blockchain supply chain"

**Key Components**:
```python
# Backend: SearchService with vector operations
async def search(query: str, limit: int) -> List[SearchResult]:
    embeddings = self.sentence_model.encode([query])
    results = self.collection.query(
        query_embeddings=[query_embedding],
        n_results=limit,
        include=["metadatas", "documents", "distances"]
    )
    return processed_results

# Frontend: SearchBar with real-time feedback
const handleSearch = async (query: string) => {
    const results = await fetch('/api/search', {
        method: 'POST',
        body: JSON.stringify({ query, limit: 20 })
    });
};
```

### 2. GitHub DNA Matching (`/api/recommend-github`)

**Purpose**: Provide hyper-personalized recommendations based on demonstrated skills  
**Implementation**:
- Analyze public GitHub repositories (name, description, topics, README)
- Generate "GitHub DNA" document representing coding profile
- Use DNA as semantic search query to find matching problems
- Cache results to handle API rate limits

**Key Components**:
```python
# Repository analysis and tech stack extraction
def generate_github_dna(profile: GitHubProfile) -> str:
    dna_parts = [
        f"Technologies: {', '.join(profile.tech_stack[:10])}",
        f"Projects: {'; '.join(repo_descriptions)}",
        f"Interests: {', '.join(unique_topics)}"
    ]
    return " | ".join(dna_parts)

# Frontend: GitHubModal for user input
<GitHubModal 
    onRecommendations={handleGitHubRecommendations}
    loading={githubLoading}
/>
```

### 3. Interactive Problem Conversations (`/api/chat`)

**Purpose**: Transform static problem descriptions into interactive dialogues  
**Implementation**:
- Use Google Gemini API with engineered system prompts
- Stream responses for real-time interaction
- Validate context to ensure responses stay relevant
- Provide suggested questions for better engagement

**System Prompt Template**:
```
You are 'Compass Guide,' an expert analyst for the Smart India Hackathon. 
Your sole purpose is to help a student understand the following problem statement. 
Based only on the provided context, answer the user's question clearly and concisely. 
Do not invent information or use external knowledge. 
If the answer is not in the context, state that the information is not available.

Problem Context: {problem_context}
```

**Key Components**:
```python
# Streaming chat response
async def generate_streaming_response(problem_context: str, user_question: str):
    full_prompt = self.system_prompt.format(problem_context=problem_context)
    full_prompt += f"\n\nQuestion: {user_question}"
    
    async for chunk in self._call_gemini_streaming_async(full_prompt):
        yield chunk

# Frontend: ChatInterface with message history
<ChatInterface 
    problemId={problemId}
    problemContext={problemContext}
/>
```

### 4. SIH Landscape Dashboard (`/api/stats`)

**Purpose**: Provide data-driven insights into the hackathon ecosystem  
**Implementation**:
- Aggregate problems by category, organization, and keywords
- Extract and normalize technology keywords
- Generate data for multiple visualization types
- Implement intelligent caching (15-minute TTL)

**Key Components**:
```python
# Dashboard data aggregation
async def get_dashboard_stats() -> DashboardStats:
    if self._is_cache_valid():
        return self._cache["stats"]
    
    problem_data = await self._fetch_all_problem_data()
    stats = self._generate_dashboard_stats(problem_data)
    self._cache["stats"] = stats
    return stats

# Frontend: Multiple chart components
<DashboardPage>
    <CategoryChart data={stats.categories} />
    <WordCloud keywords={stats.top_keywords} />
    <OrganizationChart data={stats.top_organizations} />
</DashboardPage>
```

## Data Models & Database Schema

### Problem Statement Structure
```python
class ProblemStatement(BaseModel):
    id: str                          # Unique identifier
    title: str                       # Problem statement title
    organization: str                # Sponsoring organization
    category: str                    # Problem category
    description: str                 # Detailed description
    technology_stack: List[str]      # Suggested technologies
    difficulty_level: str            # Easy/Medium/Hard
    created_at: Optional[datetime]   # Timestamp
```

### ChromaDB Vector Storage
```python
# Collection Configuration
collection_name = "problem_statements"
metadata_config = {"hnsw:space": "cosine"}  # Cosine similarity

# Document Structure
documents = [f"{title}\n{description}\nTech Stack: {tech_stack}"]
embeddings = sentence_transformer.encode(documents)
metadatas = [{
    "title": problem.title,
    "organization": problem.organization,
    "category": problem.category,
    "technology_stack": json.dumps(problem.technology_stack),
    "difficulty_level": problem.difficulty_level
}]
```

## Design System & UI Guidelines

### Color Palette (Tailwind CSS Classes)
```css
/* Primary Colors */
--dark-charcoal: #1A202C;     /* bg-gray-900, primary background */
--off-white: #F7FAFC;         /* text-gray-50, primary text */
--electric-blue: #2563EB;     /* bg-blue-600, accent color */
--lighter-charcoal: #2D3748;  /* bg-gray-800, secondary background */
--success-green: #38A169;     /* bg-green-500, confirmations */
```

### Typography System
```css
/* Font Family: Inter (imported from Google Fonts) */
font-family: 'Inter', system-ui, -apple-system, sans-serif;

/* Typography Scale */
.text-xs: 12px / 16px    /* Small labels, captions */
.text-sm: 14px / 20px    /* Body text, secondary information */
.text-base: 16px / 24px  /* Primary body text */
.text-lg: 18px / 28px    /* Emphasized text */
.text-xl: 20px / 28px    /* Section headers */
.text-2xl: 24px / 32px   /* Page titles */
.text-3xl: 30px / 36px   /* Hero headings */
.text-4xl: 36px / 40px   /* Landing page hero */
```

### Spacing System (4px Grid)
```css
/* Consistent spacing based on 4px increments */
.p-1: 4px     .m-1: 4px
.p-2: 8px     .m-2: 8px
.p-3: 12px    .m-3: 12px
.p-4: 16px    .m-4: 16px
.p-6: 24px    .m-6: 24px
.p-8: 32px    .m-8: 32px
```

### Component States & Animations
```css
/* Button States */
.btn-primary {
    @apply bg-electric-blue text-white px-6 py-3 rounded-lg;
    @apply hover:bg-blue-700 hover:shadow-lg;
    @apply active:bg-blue-800;
    @apply transition-all duration-150 ease-in-out;
}

/* Card Hover Effects */
.problem-card {
    @apply bg-gray-800 rounded-xl p-6;
    @apply hover:border-electric-blue hover:shadow-lg;
    @apply transition-all duration-150 ease-in-out;
}
```

## Error Handling & User Experience

### Backend Error Strategy
```python
# Service-Level Errors
class SearchServiceError(Exception): pass
class GitHubServiceError(Exception): pass
class ChatServiceError(Exception): pass

# Router-Level Error Handling
@router.post("/search")
async def search(query: SearchQuery):
    try:
        return await search_service.search(query.query)
    except SearchServiceError as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail="Invalid query format")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

### Frontend Error Boundaries
```typescript
// Error boundary for graceful degradation
<ErrorBoundary fallback={<ErrorFallback />}>
    <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        {/* Other routes */}
    </Routes>
</ErrorBoundary>

// Loading states with skeleton screens
{loading ? (
    <SkeletonCard />
) : error ? (
    <ErrorMessage message={error} onRetry={handleRetry} />
) : (
    <SearchResults results={results} />
)}
```

## Performance & Optimization Strategy

### Backend Performance
- **Async Operations**: All I/O operations use async/await
- **Caching**: Multi-level caching (GitHub API, dashboard stats)
- **Connection Pooling**: Efficient database connections
- **Vector Search Optimization**: Proper ChromaDB indexing
- **Rate Limiting**: Intelligent handling of external API limits

### Frontend Performance  
- **Code Splitting**: Route-based lazy loading
- **Memoization**: React.memo, useMemo, useCallback for expensive operations
- **Bundle Optimization**: Tree shaking, dependency analysis
- **Asset Optimization**: Image compression, CDN delivery
- **Responsive Loading**: Progressive enhancement for mobile

## Security & Privacy Considerations

### Data Security
- **API Keys**: Environment variable management, no hardcoded secrets
- **Input Validation**: Pydantic models for all API inputs
- **CORS Configuration**: Proper cross-origin resource sharing
- **Container Security**: Non-root users, minimal attack surface
- **Data Privacy**: No sensitive personal information in embeddings

### User Privacy
- **GitHub Data**: Only public repository information accessed
- **Chat Logs**: Optional history with user consent
- **Analytics**: Anonymous usage patterns only
- **Data Retention**: Clear policies for data lifecycle management

## Development & Testing Strategy

### Testing Philosophy
- **Unit Tests**: Individual function and component testing
- **Integration Tests**: API endpoint and service interaction testing
- **E2E Tests**: Complete user workflow validation
- **Performance Tests**: Load testing for vector operations
- **Visual Tests**: UI consistency and regression testing

### Test Implementation
```python
# Backend: pytest with async support
@pytest.mark.asyncio
async def test_semantic_search():
    query = SearchQuery(query="machine learning", limit=5)
    results = await search_service.search(query.query, query.limit)
    assert len(results) > 0
    assert all(result.similarity_score >= 0 for result in results)

# Frontend: React Testing Library
test('SearchBar submits query on enter key', () => {
    const mockOnSearch = jest.fn();
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText(/describe your skills/i);
    fireEvent.change(input, { target: { value: 'python django' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });
    
    expect(mockOnSearch).toHaveBeenCalledWith('python django');
});
```

## Deployment & Operations

### Container Architecture
```yaml
# docker-compose.yml structure
services:
  frontend:
    build: ./frontend
    ports: ["80:80"]
    depends_on: [backend]
    
  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    depends_on: [chroma-db]
    
  chroma-db:
    image: ghcr.io/chroma-core/chroma:0.4.15
    ports: ["8001:8000"]
    volumes: [chroma-data:/chroma/chroma]

volumes:
  chroma-data:

networks:
  sih-network:
```

### Environment Configuration
```bash
# Required Environment Variables
GEMINI_API_KEY=your_gemini_api_key_here        # Required for chat functionality
GITHUB_TOKEN=your_github_token_here            # Optional, for enhanced rate limits
CHROMA_HOST=chroma-db                          # ChromaDB connection
CHROMA_PORT=8000                               # ChromaDB port
ENVIRONMENT=production                         # Deployment environment
```

## Data Ingestion Pipeline

### HuggingFace Integration
```python
# Data source: prof-freakenstein/SIH2024 dataset
def ingest_data(dataset_url: str):
    # Download from HuggingFace Hub
    dataset = load_dataset("prof-freakenstein/SIH2024")
    
    # Validate and clean problem statements
    valid_problems = [validate_problem(item) for item in dataset]
    
    # Generate vector embeddings
    embeddings = sentence_model.encode([problem.text for problem in valid_problems])
    
    # Store in ChromaDB with metadata
    collection.add(
        ids=[p.id for p in valid_problems],
        embeddings=embeddings,
        metadatas=[p.metadata for p in valid_problems],
        documents=[p.document_text for p in valid_problems]
    )
```

## Project Status & Roadmap

### Completed Features ✅
1. Docker environment and project structure
2. Data ingestion from HuggingFace with vector embeddings
3. FastAPI backend with all core services
4. Semantic search with sentence-transformers
5. GitHub integration with repository analysis
6. Interactive chat with Google Gemini API
7. Dashboard analytics with data visualizations
8. React frontend with responsive design
9. Error handling and loading states
10. Component library and design system

### In Progress 🔄
1. Mobile optimization and responsive testing
2. Comprehensive test suite (backend + frontend + E2E)
3. Performance optimizations (caching, code splitting)
4. Production deployment configuration
5. Complete documentation and user guides

### Technical Debt & Future Enhancements
- Redis integration for advanced caching
- Elasticsearch for enhanced search capabilities  
- User authentication and personalization
- Advanced analytics and usage tracking
- A/B testing framework for feature optimization
- Internationalization (i18n) support

This AI agent context provides comprehensive understanding for intelligent assistance with the SIH Solver's Compass project. The platform represents a sophisticated blend of AI/ML technologies, modern web development practices, and user-centered design principles.
