Master Project Prompt: The "SIH Solver's Compass" AI-Powered Guidance Platform
Project Codename: Solver's Compass

Document Version: 1.0

Objective: You are commissioned to architect, design, and build a complete, production-grade, and scalable web application named "SIH Solver's Compass." This is not merely a data-viewer; it is an intelligent guidance platform designed to fundamentally change how students discover and engage with problem statements for the Smart India Hackathon. The final deliverable must be a fully containerized system orchestrated by Docker Compose, capable of being deployed with a single command.

Part 1: The Core Philosophy & Vision (The "Why")
Before writing a single line of code, you must internalize the project's soul.

The Problem We Solve: The Smart India Hackathon presents a vast ocean of hundreds of problem statements. For students, this creates "analysis paralysis." They waste countless hours sifting through irrelevant problems, often missing the ones that perfectly match their skills and passions. The process is inefficient, demotivating, and stifles creativity.

Our Solution & Guiding Principles: "Solver's Compass" is the antidote. It is not a search engine; it is a personalized guide. Our core principles are:

Empowerment over Prescription: We don't just give students a list. We give them tools to explore, understand, and connect with problems on a deeper level.

Clarity over Clutter: Every pixel and every feature must serve the purpose of reducing complexity. If it doesn't make the user's journey simpler, it doesn't belong.

Interaction over Static Information: A problem statement is not just text; it's the start of a conversation. We will bring these problems to life, allowing students to "talk" to them, dissect them, and truly grasp their essence.

Target Audience Persona - "The Aspiring Innovator":

Who: A second or third-year engineering student. They are technically skilled in one or two domains (e.g., web development, basic ML) but are new to large-scale hackathons.

Their Goal: To find a problem statement that is both challenging and achievable, where their existing skills can shine, and that genuinely excites them.

Their Frustration: They don't know where to start. They are intimidated by the jargon in some problem statements and unsure if their skills are a good fit.

Part 2: The User Experience & Design System (The "Look & Feel")
The UI must be an extension of our "Clarity over Clutter" philosophy. It should feel like a premium, intelligent tool—think Figma or Notion, but for hackathons.

Aesthetic: Minimalist, modern, spacious, and focused.

Color Palette:

Primary Background: Dark Charcoal (#1A202C) - Creates focus and reduces eye strain.

Primary Text/Icons: Off-White (#F7FAFC) - High contrast for readability.

Accent/Interactive Elements: Electric Blue (#2563EB) - Used for buttons, links, selected states, and highlights. It signals action.

Secondary Background/Cards: A slightly lighter charcoal (#2D3748) - To create subtle depth and separation.

Success/Confirmation: A muted Green (#38A169).

Typography:

Primary Font: Inter. It's clean, highly legible at all sizes, and modern. Use a variety of weights (Regular, Medium, SemiBold) to establish a clear visual hierarchy.

Layout & Spacing:

Responsive & Mobile-First: This is non-negotiable. The experience must be seamless on all screen sizes.

Spacing System: Use a 4px grid system for all padding, margins, and spacing to ensure consistency. (e.g., p-4 = 16px, m-2 = 8px).

Layout: Employ generous whitespace. Avoid cramped layouts. Use Flexbox and Grid for all layouts.

Component States & Interactivity:

Buttons/Links:

Default: Solid Electric Blue background with white text.

Hover: Slightly brighter blue with a subtle "lift" (box-shadow).

Active/Click: Slightly darker blue.

Cards:

Default: Lighter charcoal background.

Hover: A thin, 1px Electric Blue border appears, and the card lifts slightly.

Animations: All transitions (hover, focus, etc.) must be subtle and fast (duration-150, ease-in-out). The UI should feel responsive and alive, not sluggish or distracting.

Part 3: Functional Architecture & Feature Deep Dive (The "How")
This section details the application's core functionality.

Feature 1: The Intelligent Search Core
This is the heart of the application. It uses semantic search, not simple keyword matching.

Functionality: A user enters natural language queries describing their skills, interests, or project ideas (e.g., "machine learning for healthcare," "a react-based app to help farmers," "blockchain supply chain"). The system understands the intent behind the query and finds the most conceptually similar problem statements.

Implementation:

Frontend: A prominent search bar on the home page.

Backend (/search endpoint):

Receives the query string.

Uses the sentence-transformers model (all-MiniLM-L6-v2) to convert the query into a vector embedding.

Queries the ChromaDB vector database to find the top N (e.g., 20) most similar vectors based on cosine similarity.

Retrieves the full metadata (title, org, text, etc.) associated with the matched vectors.

Returns a JSON array of these complete problem statement objects.

Feature 2: The "GitHub DNA Match"
This provides hyper-personalized recommendations by analyzing a user's real-world work.

Functionality: A user provides their GitHub username. The system analyzes their public repositories to create a "developer fingerprint" and uses this fingerprint to recommend problem statements.

Implementation:

Frontend: A modal prompts the user for their GitHub username.

Backend (/recommend-github endpoint):

Receives the username.

Makes an API call to api.github.com/users/{username}/repos.

For each repository, it aggregates the following text into a single large document: repo name, description, topics, and the content of the README.md file (if it exists).

This aggregated text block is the user's "GitHub DNA."

This "DNA" is then used as the query for an internal call to the /search service.

The results are returned to the user, providing a list of problem statements that match their demonstrated experience.

Feature 3: The "Problem Statement Conversation"
This is the killer feature. It transforms a static problem description into an interactive expert.

Functionality: On the details page for any problem statement, the user can engage in a chat conversation to understand it better.

Implementation:

Frontend: A two-pane view on the detail page. The left shows the problem text; the right is a chat interface.

Backend (/chat endpoint):

Receives the full problem_context and the user_question.

Crucially, it uses a carefully engineered prompt for the Gemini API. The system prompt must be:

"You are 'Compass Guide,' an expert analyst for the Smart India Hackathon. Your sole purpose is to help a student understand the following problem statement. Based only on the provided context, answer the user's question clearly and concisely. Do not invent information or use external knowledge. If the answer is not in the context, state that the information is not available in the problem description.
Problem Context: {problem_context}"

The backend sends this structured prompt along with the user's question to the Gemini API and streams the response back to the frontend.

Pre-filled suggestions should be available in the chat UI, such as: "What is the core problem here?", "Suggest a possible tech stack.", "Who are the end-users for this solution?".

Feature 4: The "SIH Landscape Dashboard"
This provides a high-level, data-driven overview of the hackathon.

Functionality: A dedicated dashboard page with visualizations of the entire problem statement dataset.

Implementation:

Frontend: A page with several chart components.

Backend (/stats endpoint): This endpoint will perform aggregations on the dataset (loaded into memory or queried from a simple DB like SQLite) and provide data ready for charting.

Required Charts:

Bar Chart: "Problem Statements by Category" (e.g., Software, Hardware, Blockchain).

Word Cloud: "Most Common Keywords/Technologies" extracted from all problem descriptions.

Donut Chart: "Top 5 Sponsoring Organizations" by the number of problem statements.

Part 4: The Technical Blueprint & Deployment (The "What")
This is the specific, non-negotiable technical implementation.

Project Structure:

/solver-compass
|-- /backend
|   |-- /app
|   |   |-- main.py
|   |   |-- ... (routers, services)
|   |-- Dockerfile
|   |-- requirements.txt
|-- /frontend
|   |-- /src
|   |-- Dockerfile
|   |-- package.json
|-- /scripts
|   |-- ingest_data.py
|-- docker-compose.yml
|-- .env
|-- README.md
Backend (Python 3.10 / FastAPI):

Use sentence-transformers==2.2.2 with the all-MiniLM-L6-v2 model.

Use chromadb-client==0.4.22.

Use huggingface_hub to download the dataset.

Database (ChromaDB):

Run as a separate service in Docker Compose.

Use a named volume (chroma-data) to persist the vector data.

Frontend (React / Vite / Tailwind CSS):

Use axios for API calls.

Use recharts for the dashboard visualizations.

Docker & Deployment:

Backend Dockerfile: Based on python:3.10-slim.

Frontend Dockerfile: A multi-stage build using node:18-alpine for building and nginx:stable-alpine for serving the static files.

docker-compose.yml:

YAML

version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "80:80" # Maps host port 80 to container port 80
    depends_on:
      - backend
  backend:
    build: ./backend
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    depends_on:
      - chroma-db
  chroma-db:
    image: ghcr.io/chroma-core/chroma:0.4.22
    volumes:
      - chroma-data:/chroma/.chroma/index
    ports:
      - "8001:8000" # Expose Chroma's port for potential direct inspection
volumes:
  chroma-data:
Environment Variables: The GEMINI_API_KEY must be managed via a .env file and not hardcoded.

Part 5: Development Roadmap & Acceptance Criteria (The "Plan")
This is the required order of operations.

Phase 1: The Foundation (Core Backend & Data)

Set up the Docker Compose file with the backend and ChromaDB services.

Implement the ingest_data.py script and successfully populate ChromaDB.

Build and test the /search endpoint. Verify it returns relevant results using a tool like Postman.

Acceptance: You can run the ingestion script and get accurate search results from the API.

Phase 2: The Core User Journey (Frontend & Search)

Build the frontend Dockerfile and integrate it into Docker Compose.

Create the Home Page, Search Results Page, and Detail Page components.

Integrate the frontend with the /search API. A user must be able to search and see a list of results.

Acceptance: A user can complete the full search journey: type a query -> see results -> click a result -> see the detail page.

Phase 3: The "Magic" Features

Implement the /recommend-github backend service and connect it to the frontend modal.

Implement the /chat backend service with the precise Gemini prompt.

Build the ChatInterface component on the detail page and connect it to the API.

Acceptance: The GitHub and Chat features are fully functional.

Phase 4: Polish & Finalization

Implement the /stats endpoint and build the Dashboard page with all required charts.

Thoroughly test for responsiveness on mobile, tablet, and desktop.

Write the final README.md with clear setup and run instructions.

Acceptance: The application is feature-complete, polished, and can be started with a single docker-compose up command.