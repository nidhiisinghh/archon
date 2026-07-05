# Archon — Collaborative AI Systems Design Platform

[![Frontend Web App](https://img.shields.io/badge/Frontend-Vercel-pink?style=for-the-badge&logo=vercel)](https://archon-architect.vercel.app)
[![Backend API Service](https://img.shields.io/badge/Backend-FastAPI-emerald?style=for-the-badge&logo=fastapi)](https://archon-1hpp.onrender.com/docs)

Archon is an interactive, multi-agent AI systems design platform that guides developers and software teams from a raw product idea to a production-ready, security-audited, and cost-aware cloud architecture. 

It replicates the logic of an experienced Staff Systems Architect, using specialized reasoning agents to interview the user, compile infrastructure choices, simulate trade-offs, and generate a dynamic architecture canvas.

### 🌐 Live Deployments
*   **Web Application (Next.js/Vercel):** [https://archon-architect.vercel.app](https://archon-architect.vercel.app)
*   **API Command Center (FastAPI/Render):** [https://archon-1hpp.onrender.com](https://archon-1hpp.onrender.com)
*   **Interactive Swagger Documentation:** [https://archon-1hpp.onrender.com/docs](https://archon-1hpp.onrender.com/docs)

---

## 🚀 Key Features

*   **Collaborative Discovery Interview**: A multi-agent consensus pipeline (Planner, Requirements, Security, Backend, Database, and Infra Agents) that conducts a structured chat interview to understand system requirements.
*   **Interactive Architecture Studio**: A high-fidelity visual canvas powered by **React Flow** showing components (APIs, databases, cache layers, queues, clients) with editable specifications.
*   **Canvas Undo & Redo History**: Complete state management with local history queues, allowing users to reverse or restore canvas modifications (node moves, updates, deletions) using keyboard shortcuts (`Ctrl/Cmd + Z`/`Ctrl/Cmd + Y`) or control panel buttons.
*   **Dynamic Reconfiguration**: Update project scale, industry, or cloud provider parameters on the fly and trigger an instant multi-agent canvas redesign.
*   **AI Ingestion File Upload**: Ingest and parse architecture specifications (e.g. Draw.io XML/JSON, Mermaid diagram `.mmd`, or plain-text specification files) to generate new canvas layouts directly from existing assets.
*   **Scalability Simulator**: Slide traffic volumes (from 10k to 10M+ users) to watch the architecture reactively shift technologies, modify configurations, and estimate monthly cloud expenditures.
*   **Decision Explorer**: Deep-dives into the design choices made, showing alternative technical options, tradeoffs, pros, and cons.
*   **Security & Latency Audit**: Dynamic scoring (0-100) and actionable lists auditing VPC setups, data compliance, and single-points-of-failure.
*   **Repository Validation & Push**: Verify repository formats (`owner/repository`) and securely export generated Terraform files, Dockerfiles, and architectural specs straight to GitHub.
*   **Minimalist Global Theme Toggles**: Clean icon-based Lucide controls (`Sun`/`Moon`) standardized across all screens (Landing Page, Dashboard, Setup Wizard, and Studio Workspace).

---

## 📂 Project Structure

```text
archon/
├── backend/
│   ├── app/
│   │   ├── auth.py         # Bcrypt hashing & JWT operations
│   │   ├── database.py     # PostgreSQL database session initializer (SQLite fallback disabled)
│   │   ├── main.py         # REST Router, file upload handlers, and API endpoints
│   │   ├── models.py       # SQLAlchemy schema definitions
│   │   ├── schemas.py      # Pydantic validation structures
│   │   └── orchestrator.py # Multi-agent consensus engine & websockets
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # Backend container configurations
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router (Dashboard, Studio, Login, Register)
│   │   ├── components/     # Custom React Flow Nodes & Layout components
│   │   └── store/          # Zustand store for state history & API actions
│   ├── package.json        # Frontend configuration & dependencies
│   └── Dockerfile          # Next.js deployment configuration
└── docker-compose.yml      # Orchestration setup for PostgreSQL, Redis, Frontend & Backend
```

---

## 🛠️ Local Startup Guide (Recommended)

To run Archon locally, you must connect the backend to a running PostgreSQL database instance (SQLite fallback is disabled to ensure production-grade transactional integrity).

### Prerequisites
*   **PostgreSQL**: A running instance (local or containerized)
*   **Python**: Version 3.9 or higher
*   **Node.js**: Version 20 or higher
*   **npm**: Version 9 or higher

### Step 1: Configure and Start the Backend (FastAPI)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Define your environment variables (create a `.env` file or export them directly):
   ```bash
   export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/archon"
   export GROQ_API_KEY="your-groq-api-key"
   export JWT_SECRET="your-super-secure-signing-key-here"
   ```
5. Run the development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *The API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).*

### Step 2: Start the Frontend (Next.js)
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

---

## 🐳 Containerized Startup Guide (Docker Compose)

To quickly spin up the entire ecosystem—including PostgreSQL, Redis, Frontend, and Backend containers:

1. Verify Docker Desktop is running.
2. Run the build and startup command from the root directory:
   ```bash
   docker compose up --build
   ```
3. Access the services:
   *   **Frontend Web App**: [http://localhost:3000](http://localhost:3000)
   *   **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🔒 Configuration & Environment Variables

The system expects the following environment variables. If you are running via Docker Compose, these are pre-configured automatically:

| Variable | Requirement | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | **Required** (PostgreSQL URL) | Connection string (SQLite is disabled for data integrity) |
| `GROQ_API_KEY` | **Required** (Groq Console) | API Key for LLM multi-agent orchestrator reasoning |
| `JWT_SECRET` | Optional (Fallback provided) | Encryption signing key for JWT user tokens |
| `NEXT_PUBLIC_API_URL` | Optional (Fallback provided) | Frontend target API url for communication |
| `PORT` | Optional (Fallback provided) | Service execution ports (3000 for frontend / 8000 for backend) |
