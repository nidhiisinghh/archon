# Archon — Collaborative AI Systems Design Platform

Archon is an interactive, multi-agent AI systems design platform that guides developers and software teams from a raw product idea to a production-ready, security-audited, and cost-aware cloud architecture. 

It replicates the logic of an experienced Staff Systems Architect, using specialized reasoning agents to interview the user, compile infrastructure choices, simulate trade-offs, and generate a dynamic architecture canvas.

---

## 🚀 Key Features

*   **Collaborative Discovery Interview**: A multi-agent consensus pipeline (Planner, Requirements, Security, Backend, Database, and Infra Agents) that conducts a structured chat interview to understand system requirements.
*   **Interactive Architecture Studio**: A high-fidelity visual canvas powered by **React Flow** showing components (APIs, databases, cache layers, queues, clients) with editable specifications.
*   **Scalability Simulator**: Slide traffic volumes (from 10k to 10M+ users) to watch the architecture reactively shift technologies, modify configurations, and estimate monthly cloud expenditures.
*   **Decision Explorer**: Deep-dives into the design choices made, showing alternative technical options, tradeoffs, pros, and cons.
*   **Security & Latency Audit**: Dynamic scoring (0-100) and actionable lists auditing VPC setups, data compliance, and single-points-of-failure.
*   **JWT User Authentication**: Secure authentication endpoints, session state caching, and private workspace protection.

---

## 📂 Project Structure

```text
archon/
├── backend/
│   ├── app/
│   │   ├── auth.py         # Bcrypt hashing & JWT operations
│   │   ├── database.py     # SQLite and PostgreSQL sessions
│   │   ├── main.py         # REST Router and API Endpoints
│   │   ├── models.py       # SQLAlchemy Schema definitions
│   │   ├── schemas.py      # Pydantic validation structures
│   │   └── orchestrator.py # Multi-agent consensus engine & websockets
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # Backend container configurations
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router (Dashboard, Studio, Login, Register)
│   │   ├── components/     # Custom React Flow Nodes & Layout components
│   │   └── store/          # Zustand store for global application state
│   ├── package.json        # Frontend configuration & dependencies
│   └── Dockerfile          # Next.js deployment configuration
└── docker-compose.yml      # Orchestration setup for PostgreSQL, Redis, Frontend & Backend
```

---

## 🛠️ Local Startup Guide (Recommended)

Running locally allows the backend to automatically fall back to **SQLite** (`archon.db`) and **natively compile** Next.js and Tailwind on your host system with zero external dependency requirements.

### Prerequisites
*   **Python**: Version 3.9 or higher
*   **Node.js**: Version 20 or higher
*   **npm**: Version 9 or higher

### Step 1: Start the Backend (FastAPI)
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
4. Run the development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
*The API specs will be available at [http://localhost:8000/docs](http://localhost:8000/docs).*

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
4. Open your browser and go to:
   ```text
   http://localhost:3000
   ```

---

## 🐳 Containerized Startup Guide (Docker Compose)

To run the entire ecosystem (including PostgreSQL and Redis containers):

1. Make sure Docker Desktop is open.
2. Run the build and startup command from the root directory:
   ```bash
   docker compose up --build
   ```
3. Access the dashboard:
   *   **Frontend App**: [http://localhost:3000](http://localhost:3000)
   *   **Backend Specs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🔒 Configuration & Environment Variables

The default configuration values are hardcoded for local development ease, but can be overridden using environment variables:

| Variable | Default Value | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | `sqlite:///./archon.db` | Backend connection string (PostgreSQL/SQLite) |
| `JWT_SECRET` | `archon-super-secret-key-12345` | Signing key for JWT user tokens |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Frontend target URL for FastAPI gateway |
| `PORT` | `3000` (Frontend) / `8000` (Backend) | Listening ports for services |
