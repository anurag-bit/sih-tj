# Requirements Document

## Introduction

The "SIH Solver's Compass" is an AI-powered guidance platform designed to help engineering students discover and engage with Smart India Hackathon problem statements. The platform addresses the "analysis paralysis" problem where students waste time sifting through hundreds of irrelevant problems by providing intelligent search, personalized recommendations, and interactive problem exploration features. The system must be a fully containerized, production-grade web application deployable with a single Docker Compose command.

## Requirements

### Requirement 1: Intelligent Semantic Search

**User Story:** As an engineering student, I want to search for hackathon problems using natural language descriptions of my skills and interests, so that I can find relevant problem statements without keyword matching limitations.

#### Acceptance Criteria

1. WHEN a user enters a natural language query (e.g., "machine learning for healthcare") THEN the system SHALL return the top 20 most conceptually similar problem statements using semantic search
2. WHEN the search is performed THEN the system SHALL use sentence-transformers model (all-MiniLM-L6-v2) to convert queries into vector embeddings
3. WHEN vector similarity is calculated THEN the system SHALL use ChromaDB to find matches based on cosine similarity
4. WHEN search results are returned THEN the system SHALL include complete problem statement metadata (title, organization, description)

### Requirement 2: GitHub-Based Personalized Recommendations

**User Story:** As a student with existing coding projects, I want to get problem recommendations based on my GitHub repositories, so that I can find problems that match my demonstrated technical experience.

#### Acceptance Criteria

1. WHEN a user provides their GitHub username THEN the system SHALL analyze their public repositories to create a developer profile
2. WHEN analyzing repositories THEN the system SHALL aggregate repo name, description, topics, and README content into a "GitHub DNA" document
3. WHEN the GitHub DNA is created THEN the system SHALL use it as a search query to find matching problem statements
4. IF a user's repositories are private or inaccessible THEN the system SHALL provide appropriate error messaging
5. WHEN recommendations are generated THEN the system SHALL return problem statements ranked by relevance to the user's coding history

### Requirement 3: Interactive Problem Statement Chat

**User Story:** As a student exploring a problem statement, I want to have a conversation with an AI assistant about the problem details, so that I can better understand the requirements and scope before committing to work on it.

#### Acceptance Criteria

1. WHEN a user is viewing a problem statement detail page THEN the system SHALL provide a chat interface alongside the problem description
2. WHEN a user asks a question about the problem THEN the system SHALL respond using only information from the problem statement context
3. WHEN generating responses THEN the system SHALL use the Gemini API with a specific system prompt that limits responses to available context
4. WHEN the chat interface loads THEN the system SHALL provide pre-filled question suggestions like "What is the core problem here?" and "Suggest a possible tech stack"
5. IF information is not available in the problem context THEN the system SHALL explicitly state that the information is not available

### Requirement 4: Data Visualization Dashboard

**User Story:** As a student exploring the hackathon landscape, I want to see visual analytics of all problem statements, so that I can understand the distribution of problems across categories and organizations.

#### Acceptance Criteria

1. WHEN a user accesses the dashboard page THEN the system SHALL display a bar chart showing problem statements by category
2. WHEN the dashboard loads THEN the system SHALL show a word cloud of the most common keywords and technologies
3. WHEN viewing organization data THEN the system SHALL display a donut chart of the top 5 sponsoring organizations by problem count
4. WHEN charts are displayed THEN the system SHALL use the recharts library for all visualizations
5. WHEN data is aggregated THEN the system SHALL perform calculations on the complete problem statement dataset

### Requirement 5: Responsive User Interface

**User Story:** As a student using various devices, I want the platform to work seamlessly on mobile, tablet, and desktop, so that I can access it from any device.

#### Acceptance Criteria

1. WHEN the application loads on any screen size THEN the system SHALL provide a fully responsive experience
2. WHEN displaying the interface THEN the system SHALL use the specified dark theme color palette (Dark Charcoal #1A202C, Electric Blue #2563EB)
3. WHEN users interact with elements THEN the system SHALL provide smooth hover and click animations with 150ms duration
4. WHEN typography is rendered THEN the system SHALL use the Inter font family with appropriate weight hierarchy
5. WHEN spacing is applied THEN the system SHALL follow a consistent 4px grid system

### Requirement 6: Containerized Deployment

**User Story:** As a developer or administrator, I want to deploy the entire application with a single command, so that I can quickly set up the system in any environment.

#### Acceptance Criteria

1. WHEN deploying the application THEN the system SHALL start with a single `docker-compose up` command
2. WHEN the system starts THEN the system SHALL include separate containers for frontend, backend, and ChromaDB
3. WHEN data is stored THEN the system SHALL persist vector data using named Docker volumes
4. WHEN environment variables are needed THEN the system SHALL load them from a .env file
5. WHEN the application is running THEN the frontend SHALL be accessible on port 80 and backend on port 8000

### Requirement 7: Data Ingestion and Management

**User Story:** As a system administrator, I want to populate the vector database with hackathon problem statements, so that the search and recommendation features have data to work with.

#### Acceptance Criteria

1. WHEN the data ingestion script runs THEN the system SHALL download problem statements from HuggingFace Hub
2. WHEN processing problem statements THEN the system SHALL convert each statement into vector embeddings using sentence-transformers
3. WHEN storing data THEN the system SHALL save vectors and metadata to ChromaDB with proper indexing
4. WHEN ingestion completes THEN the system SHALL verify that all problem statements are searchable
5. IF ingestion fails THEN the system SHALL provide clear error messages and rollback capabilities