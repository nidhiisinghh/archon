import os
import json
import logging
import requests
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from .database import engine, Base, get_db
from . import models, schemas, auth
from .orchestrator import AgentOrchestrator
from fastapi.security import OAuth2PasswordRequestForm

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize DB Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Archon API", description="AI Systems Design Platform API Backend", version="1.0")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "archon-backend"}

# --- Auth Routes ---

@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = auth.get_password_hash(user_data.password)
    db_user = models.User(
        email=user_data.email,
        hashed_password=hashed_pwd,
        name=user_data.name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/api/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = auth.create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/token", response_model=schemas.Token)
def login_json(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not auth.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = auth.create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_required_current_user)):
    return current_user


# --- Projects Routes ---

@app.get("/api/projects", response_model=List[schemas.ProjectResponse])
def list_projects(db: Session = Depends(get_db), current_user: Optional[models.User] = Depends(auth.get_current_user)):
    if current_user:
        projects = db.query(models.Project).filter(
            (models.Project.user_id == current_user.id) | (models.Project.user_id == None)
        ).order_by(models.Project.created_at.desc()).all()
    else:
        projects = db.query(models.Project).order_by(models.Project.created_at.desc()).all()
    return projects

@app.post("/api/projects", response_model=schemas.ProjectResponse)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db), current_user: Optional[models.User] = Depends(auth.get_current_user)):
    db_project = models.Project(
        user_id=current_user.id if current_user else None,
        name=project.name,
        description=project.description,
        industry=project.industry,
        scale=project.scale,
        region=project.region,
        target_users=project.target_users,
        compliance=project.compliance,
        preferred_cloud=project.preferred_cloud,
        budget=project.budget,
        team_size=project.team_size
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)

    # Initialize discovery session
    db_session = models.DiscoverySession(
        project_id=db_project.id,
        status="active",
        chat_history=[
            {"role": "archon", "content": f"Hello! I am Archon, your AI Software Architect. Let's design {project.name}. What is the primary business goal of this platform?"}
        ]
    )
    db.add(db_session)
    db.commit()
    return db_project

@app.get("/api/projects/{project_id}", response_model=schemas.ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db), current_user: Optional[models.User] = Depends(auth.get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check ownership if project has a user_id
    if project.user_id and (not current_user or project.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this project")
        
    db.delete(project)
    db.commit()
    return {"status": "success", "message": f"Project {project_id} deleted successfully"}

@app.put("/api/projects/{project_id}", response_model=schemas.ProjectResponse)
def update_project(project_id: str, project_update: schemas.ProjectUpdate, db: Session = Depends(get_db), current_user: Optional[models.User] = Depends(auth.get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check ownership if project has a user_id
    if project.user_id and (not current_user or project.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to edit this project")
        
    update_data = project_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)
        
    db.commit()
    db.refresh(project)
    return project

@app.post("/api/projects/{project_id}/regenerate", response_model=schemas.VersionResponse)
async def regenerate_project_architecture(project_id: str, db: Session = Depends(get_db), current_user: Optional[models.User] = Depends(auth.get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Check ownership if project has a user_id
    if project.user_id and (not current_user or project.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to edit this project")
        
    # Instantiate orchestrator with the project's parameters
    orchestrator = AgentOrchestrator(project_data={
        "name": project.name,
        "description": project.description,
        "industry": project.industry,
        "scale": project.scale,
        "region": project.region,
        "preferred_cloud": project.preferred_cloud,
        "budget": project.budget,
        "compliance": project.compliance
    })
    
    # Run orchestrator stream to get the final compiled layout
    final_update = None
    async for update in orchestrator.run_discovery_stream():
        if update["type"] == "architecture_ready":
            final_update = update
            break
            
    if not final_update:
        raise HTTPException(status_code=500, detail="Failed to regenerate architecture layout")
        
    # Save the new version
    latest_v = db.query(models.ArchitectureVersion).filter(
        models.ArchitectureVersion.project_id == project_id
    ).order_by(models.ArchitectureVersion.version_number.desc()).first()
    
    next_num = (latest_v.version_number + 1) if latest_v else 1
    
    db_version = models.ArchitectureVersion(
        project_id=project_id,
        version_number=next_num,
        commit_msg=f"Regenerated architecture for settings: Cloud={project.preferred_cloud}, Scale={project.scale}",
        parent_version_id=latest_v.id if latest_v else None
    )
    db.add(db_version)
    db.commit()
    db.refresh(db_version)
    
    # Save components
    for comp in final_update["components"]:
        db_comp = models.Component(
            version_id=db_version.id,
            name=comp["name"],
            type=comp["type"],
            technology=comp["technology"],
            x=comp["x"],
            y=comp["y"],
            responsibilities=comp.get("responsibilities"),
            dependencies=comp.get("dependencies", []),
            cost=comp.get("cost", 0.0),
            security_notes=comp.get("security_notes"),
            scaling_notes=comp.get("scaling_notes")
        )
        db.add(db_comp)
        
    # Save connections
    for conn in final_update["connections"]:
        db_conn = models.Connection(
            version_id=db_version.id,
            source_id=conn["source_id"],
            target_id=conn["target_id"],
            label=conn.get("label", ""),
            animated=conn.get("animated", False)
        )
        db.add(db_conn)
        
    # Add new review
    rev_data = final_update["review"]
    db_review = models.Review(
        project_id=project_id,
        version_id=db_version.id,
        score=rev_data["score"],
        security_issues=rev_data["security_issues"],
        scalability_issues=rev_data["scalability_issues"],
        cost_issues=rev_data["cost_issues"],
        latency_issues=rev_data["latency_issues"],
        general_recommendations=rev_data["general_recommendations"]
    )
    db.add(db_review)
    
    db.commit()
    db.refresh(db_version)
    
    return db_version

@app.post("/api/projects/{project_id}/upload-spec", response_model=schemas.VersionResponse)
async def upload_project_spec(
    project_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Check ownership if project has a user_id
    if project.user_id and (not current_user or project.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to edit this project")
        
    content = await file.read()
    filename = file.filename
    
    try:
        text_content = content.decode("utf-8")
    except UnicodeDecodeError:
        text_content = f"[Binary File: {filename} - Content omitted]"

    spec_context = f"\n\n[Ingested Specification from '{filename}']:\n{text_content[:6000]}"
    
    orchestrator = AgentOrchestrator(project_data={
        "name": project.name,
        "description": project.description + spec_context,
        "industry": project.industry,
        "scale": project.scale,
        "region": project.region,
        "preferred_cloud": project.preferred_cloud,
        "budget": project.budget,
        "compliance": project.compliance
    })
    
    final_update = None
    async for update in orchestrator.run_discovery_stream():
        if update["type"] == "architecture_ready":
            final_update = update
            break
            
    if not final_update:
        raise HTTPException(status_code=500, detail="Failed to parse spec and generate architecture layout")
        
    latest_v = db.query(models.ArchitectureVersion).filter(
        models.ArchitectureVersion.project_id == project_id
    ).order_by(models.ArchitectureVersion.version_number.desc()).first()
    
    next_num = (latest_v.version_number + 1) if latest_v else 1
    
    db_version = models.ArchitectureVersion(
        project_id=project_id,
        version_number=next_num,
        commit_msg=f"Uploaded Spec: {filename}",
        parent_version_id=latest_v.id if latest_v else None
    )
    db.add(db_version)
    db.commit()
    db.refresh(db_version)
    
    for comp in final_update["components"]:
        db_comp = models.Component(
            version_id=db_version.id,
            name=comp["name"],
            type=comp["type"],
            technology=comp["technology"],
            x=comp["x"],
            y=comp["y"],
            responsibilities=comp.get("responsibilities"),
            dependencies=comp.get("dependencies", []),
            cost=comp.get("cost", 0.0),
            security_notes=comp.get("security_notes"),
            scaling_notes=comp.get("scaling_notes")
        )
        db.add(db_comp)
        
    for conn in final_update["connections"]:
        db_conn = models.Connection(
            version_id=db_version.id,
            source_id=conn["source_id"],
            target_id=conn["target_id"],
            label=conn.get("label", ""),
            animated=conn.get("animated", False)
        )
        db.add(db_conn)
        
    rev_data = final_update["review"]
    db_review = models.Review(
        project_id=project_id,
        version_id=db_version.id,
        score=rev_data["score"],
        security_issues=rev_data["security_issues"],
        scalability_issues=rev_data["scalability_issues"],
        cost_issues=rev_data["cost_issues"],
        latency_issues=rev_data["latency_issues"],
        general_recommendations=rev_data["general_recommendations"]
    )
    db.add(db_review)
    
    db.commit()
    db.refresh(db_version)
    
    return db_version

# --- Discovery Sessions ---

@app.get("/api/projects/{project_id}/session", response_model=schemas.DiscoverySessionResponse)
def get_project_session(project_id: str, db: Session = Depends(get_db)):
    session = db.query(models.DiscoverySession).filter(models.DiscoverySession.project_id == project_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

# --- Architecture Versions ---

@app.get("/api/projects/{project_id}/versions", response_model=List[schemas.VersionResponse])
def get_project_versions(project_id: str, db: Session = Depends(get_db)):
    versions = db.query(models.ArchitectureVersion).filter(models.ArchitectureVersion.project_id == project_id).order_by(models.ArchitectureVersion.version_number.desc()).all()
    return versions

@app.get("/api/projects/{project_id}/versions/{version_id}", response_model=schemas.VersionResponse)
def get_version(project_id: str, version_id: str, db: Session = Depends(get_db)):
    version = db.query(models.ArchitectureVersion).filter(
        models.ArchitectureVersion.id == version_id,
        models.ArchitectureVersion.project_id == project_id
    ).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    return version

@app.post("/api/projects/{project_id}/versions", response_model=schemas.VersionResponse)
def save_new_version(project_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    # Query latest version number
    latest_v = db.query(models.ArchitectureVersion).filter(
        models.ArchitectureVersion.project_id == project_id
    ).order_by(models.ArchitectureVersion.version_number.desc()).first()
    
    next_num = (latest_v.version_number + 1) if latest_v else 1
    
    db_version = models.ArchitectureVersion(
        project_id=project_id,
        version_number=next_num,
        commit_msg=payload.get("commit_msg", f"Version {next_num}"),
        parent_version_id=latest_v.id if latest_v else None
    )
    db.add(db_version)
    db.commit()
    db.refresh(db_version)

    # Add components
    for comp in payload.get("components", []):
        db_comp = models.Component(
            version_id=db_version.id,
            name=comp["name"],
            type=comp["type"],
            technology=comp["technology"],
            x=comp["x"],
            y=comp["y"],
            responsibilities=comp.get("responsibilities"),
            dependencies=comp.get("dependencies", []),
            cost=comp.get("cost", 0.0),
            security_notes=comp.get("security_notes"),
            scaling_notes=comp.get("scaling_notes")
        )
        db.add(db_comp)

    # Add connections
    for conn in payload.get("connections", []):
        db_conn = models.Connection(
            version_id=db_version.id,
            source_id=conn["source_id"],
            target_id=conn["target_id"],
            label=conn.get("label"),
            animated=conn.get("animated", False)
        )
        db.add(db_conn)

    db.commit()
    db.refresh(db_version)
    return db_version

# --- Architecture Decisions ---

@app.get("/api/projects/{project_id}/decisions", response_model=List[schemas.DecisionResponse])
def get_decisions(project_id: str, db: Session = Depends(get_db)):
    decisions = db.query(models.Decision).filter(models.Decision.project_id == project_id).all()
    return decisions

# --- Reviews ---

@app.get("/api/projects/{project_id}/reviews", response_model=List[schemas.ReviewResponse])
def get_reviews(project_id: str, db: Session = Depends(get_db)):
    reviews = db.query(models.Review).filter(models.Review.project_id == project_id).order_by(models.Review.created_at.desc()).all()
    return reviews

@app.post("/api/projects/{project_id}/reviews", response_model=schemas.ReviewResponse)
def create_review(project_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    version_id = payload.get("version_id")
    if not version_id:
        raise HTTPException(status_code=400, detail="version_id is required")

    version = db.query(models.ArchitectureVersion).filter(models.ArchitectureVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    project = version.project
    components = db.query(models.Component).filter(models.Component.version_id == version_id).all()
    connections = db.query(models.Connection).filter(models.Connection.version_id == version_id).all()

    comp_list = []
    for c in components:
        comp_list.append({
            "name": c.name,
            "type": c.type,
            "technology": c.technology,
            "responsibilities": c.responsibilities,
            "cost": c.cost,
            "security_notes": c.security_notes,
            "scaling_notes": c.scaling_notes
        })

    conn_list = []
    for cn in connections:
        conn_list.append({
            "source_id": cn.source_id,
            "target_id": cn.target_id,
            "label": cn.label,
            "animated": cn.animated
        })

    system_prompt = (
        "You are Archon, an expert AI Software Architect and Security Auditor.\n"
        "Evaluate the provided system architecture topology and requirements, and output a detailed security, scalability, and cost audit report.\n"
        "You MUST respond ONLY with a JSON object in this format:\n"
        "{\n"
        "  \"score\": integer (0 to 100, representing the overall quality, security, and scalability of the design),\n"
        "  \"security_issues\": [\"specific issue 1\", \"specific issue 2\", ...],\n"
        "  \"scalability_issues\": [\"specific issue 1\", ...],\n"
        "  \"cost_issues\": [\"specific issue 1\", ...],\n"
        "  \"latency_issues\": [\"specific issue 1\", ...],\n"
        "  \"general_recommendations\": [\"rec 1\", \"rec 2\", ...]\n"
        "}"
    )

    user_prompt = (
        f"Audit this architecture design:\n"
        f"- Project Name: {project.name}\n"
        f"- Description: {project.description}\n"
        f"- Cloud Provider: {project.preferred_cloud}\n"
        f"- Budget: {project.budget}\n"
        f"- Scaling Target: {project.scale}\n"
        f"- Compliance Level: {project.compliance}\n\n"
        f"Components:\n{json.dumps(comp_list, indent=2)}\n\n"
        f"Connections:\n{json.dumps(conn_list, indent=2)}\n\n"
        "Analyze and output the structured JSON report."
    )

    groq_api_key = os.getenv("GROQ_API_KEY")
    score = 85
    security_issues = []
    scalability_issues = []
    cost_issues = []
    latency_issues = []
    general_recommendations = []

    if groq_api_key:
        try:
            res = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.2
                },
                timeout=15
            )
            if res.status_code == 200:
                parsed = res.json()["choices"][0]["message"]["content"]
                audit_data = json.loads(parsed)
                score = audit_data.get("score", 85)
                security_issues = audit_data.get("security_issues", [])
                scalability_issues = audit_data.get("scalability_issues", [])
                cost_issues = audit_data.get("cost_issues", [])
                latency_issues = audit_data.get("latency_issues", [])
                general_recommendations = audit_data.get("general_recommendations", [])
            else:
                raise Exception(f"HTTP {res.status_code}")
        except Exception as e:
            print(f"Audit generation failed via Groq, falling back to local engine: {e}")
            groq_api_key = None

    if not groq_api_key:
        # Rule-based audit generation fallback
        has_gateway = any(c.type == "gateway" for c in components)
        has_cache = any(c.type == "cache" for c in components)
        has_db = any(c.type == "database" for c in components)
        has_queue = any(c.type == "queue" for c in components)
        total_cost = sum(c.cost or 0 for c in components)

        score = 90
        if not has_gateway:
            score -= 10
            security_issues.append("No API Gateway detected. Exposing internal microservices directly presents severe authentication and DDoS threat vectors.")
        if not has_cache and has_db:
            score -= 5
            scalability_issues.append("High-traffic lookups query the database directly. Recommend inserting a cache layer (e.g. Redis) to relieve read pressure.")
        if total_cost > 150 and project.budget == "startup":
            score -= 5
            cost_issues.append(f"Estimated infrastructure cost (${total_cost}/mo) exceeds standard budget expectations for early-stage startup tiers.")
        if not has_queue and len(components) > 4:
            score -= 5
            scalability_issues.append("Lack of an asynchronous event broker or queue. Cross-service communication appears completely synchronous, risking cascading failures.")

        # Default rules
        security_issues.append("TLS version 1.2 is active. Upgrade to TLS 1.3 across edge routers is recommended.")
        scalability_issues.append("Horizontal autoscaling is dependent on basic CPU metrics. Consider scaling based on network requests/sec metrics.")
        cost_issues.append("Resource instances are configured at fixed sizes. Recommend reviewing auto-scaling policies to downscale outside peak hours.")
        latency_issues.append("Cross-component dependencies lack a global CDN cache for static content.")
        general_recommendations.append("Establish distributed tracing across all HTTP endpoints using OpenTelemetry.")
        general_recommendations.append("Verify database backup policies to ensure point-in-time recovery is enabled.")

    review = models.Review(
        project_id=project_id,
        version_id=version_id,
        score=score,
        security_issues=security_issues,
        scalability_issues=scalability_issues,
        cost_issues=cost_issues,
        latency_issues=latency_issues,
        general_recommendations=general_recommendations
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review

@app.post("/api/projects/{project_id}/chat")
def handle_project_chat(project_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    message = payload.get("message", "")
    components = payload.get("components", [])
    connections = payload.get("connections", [])
    
    if not message:
        raise HTTPException(status_code=400, detail="Message is empty")
        
    groq_api_key = os.getenv("GROQ_API_KEY")
    reply = ""
    actions = []
    
    if groq_api_key:
        try:
            system_prompt = (
                "You are Archon, an expert AI Software Architect guiding a developer design session.\n"
                "The current system design consists of these components:\n"
                f"{json.dumps(components, indent=2)}\n"
                "And these connections between components:\n"
                f"{json.dumps(connections, indent=2)}\n\n"
                "IMPORTANT COST CONVERSION NOTE:\n"
                "All component costs in the data metadata are in USD (e.g. cost: 10 represents $10 USD).\n"
                "However, the frontend UI displays costs to the user in Indian Rupees (INR) using a conversion rate of 1 USD = 85 INR.\n"
                "If the user asks about a component's cost or the total cost, convert the user's INR values back to USD to check them (e.g. 850 INR = 10 USD, 1700 INR = 20 USD).\n"
                "When answering the user, refer to the cost in Indian Rupees (INR) using the 85x multiplier (e.g. ₹850/mo instead of $10) so it matches what they see on their screen, but clarify the conversion for them.\n\n"
                "ITEMIZED COST BREAKDOWN INSTRUCTION:\n"
                "When a user asks about costs, do NOT give generic descriptions (like 'developer time' or 'maintenance'). Instead, provide a concrete, specific itemized breakdown of technical expenses matching the component type:\n"
                "- Clients (React Native, Web, etc.): Static web assets hosting & CDN delivery (e.g., AWS S3 + CloudFront), App Store developer license fees ($99/year Apple Developer Program, $25 Google Play Console), push notification traffic (FCM/OneSignal), and application error tracking/analytics (Sentry/Mixpanel).\n"
                "- Gateways (API Gateway, etc.): Bandwidth data-out charges, request volume processing fees, edge routers, and custom SSL certificate renewals.\n"
                "- Services (APIs, Workers): Compute node resources (CPU/RAM sizing), application load balancer (ALB) active connection fees, container registries, and centralized logging.\n"
                "- Databases: Database instance hosting, persistent storage storage (GBs), write/read IOPS, and automated backup storage.\n"
                "- Caches: Managed in-memory storage cluster nodes (RAM size).\n"
                "- Queues: Message delivery requests volume and message retention buffer storage.\n\n"
                "Your objective is to reply to the user's message and optionally provide actions to modify the canvas layout.\n"
                "You MUST respond ONLY with a JSON object in this format:\n"
                "{\n"
                "  \"reply\": \"A helpful explanation of what you did or why you suggest this system change.\",\n"
                "  \"actions\": [\n"
                "    {\n"
                "      \"type\": \"add_node\",\n"
                "      \"node\": {\n"
                "        \"name\": \"Unique Node Name\",\n"
                "        \"type\": \"client\" | \"gateway\" | \"service\" | \"database\" | \"cache\" | \"queue\",\n"
                "        \"technology\": \"Tech label\",\n"
                "        \"x\": float,\n"
                "        \"y\": float,\n"
                "        \"responsibilities\": \"...\",\n"
                "        \"dependencies\": [\"names of dependency components\"],\n"
                "        \"cost\": float,\n"
                "        \"security_notes\": \"...\",\n"
                "        \"scaling_notes\": \"...\"\n"
                "      }\n"
                "    },\n"
                "    {\n"
                "      \"type\": \"remove_node\",\n"
                "      \"node_name\": \"Name of node to remove\"\n"
                "    },\n"
                "    {\n"
                "      \"type\": \"update_node\",\n"
                "      \"node_name\": \"Name of node to update\",\n"
                "      \"node\": {\n"
                "        \"name\": \"Name\",\n"
                "        \"type\": \"...\",\n"
                "        \"technology\": \"...\",\n"
                "        \"responsibilities\": \"...\",\n"
                "        \"cost\": float,\n"
                "        \"security_notes\": \"...\",\n"
                "        \"scaling_notes\": \"...\"\n"
                "      }\n"
                "    },\n"
                "    {\n"
                "      \"type\": \"add_edge\",\n"
                "      \"edge\": {\n"
                "        \"source_id\": \"Source node name\",\n"
                "        \"target_id\": \"Target node name\",\n"
                "        \"label\": \"Connection label\",\n"
                "        \"animated\": boolean\n"
                "      }\n"
                "    },\n"
                "    {\n"
                "      \"type\": \"remove_edge\",\n"
                "      \"source_id\": \"Source node name\",\n"
                "      \"target_id\": \"Target node name\"\n"
                "    }\n"
                "  ]\n"
                "}\n"
                "If the user asks a question without asking to change the system, keep \"actions\" empty."
            )
            
            res = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": message}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.2
                },
                timeout=20
            )
            
            if res.status_code == 200:
                data = res.json()
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                reply = parsed.get("reply", "")
                actions = parsed.get("actions", [])
            else:
                raise Exception(f"Groq API error: {res.text}")
        except Exception as e:
            reply = f"Sorry, I encountered an error communicating with the Groq API: {str(e)}."
            actions = []
            
    else:
        # Local Hybrid Mode fallback (smart keyword matcher)
        lower = message.lower()
        if "redis" in lower or "cache" in lower:
            reply = "Redis caching is deployed at the cache tier. It acts as an in-memory lookup system for session hashes and common query paths. This reduces database read cycles by up to 80% and satisfies our latency boundary of <200ms."
        elif "kafka" in lower or "rabbitmq" in lower:
            reply = "We chose RabbitMQ over Kafka because the workload demands transactional task delivery rather than persistent event-streaming. However, if you scale up to 10M+ events, we can hot-swap the broker tier to Apache Kafka for log durability."
        elif "cost" in lower or "expensive" in lower:
            total = sum(c.get("cost", 0.0) for c in components)
            reply = f"The current estimated monthly infrastructure cost is ₹{int(total * 85):,}/mo. You can lower this by scaling down the Kubernetes node replica count or switching Redis to a managed single-node server."
        elif "add" in lower or "create" in lower:
            if "prometheus" in lower or "monitoring" in lower or "grafana" in lower:
                reply = "I have successfully added a Prometheus/Grafana Monitoring stack to your architecture. It will scrape metrics from the backend nodes and raise warnings if memory or CPU loads exceed thresholds."
                actions = [
                    {
                        "type": "add_node",
                        "node": {
                            "name": "Monitoring Node",
                            "type": "service",
                            "technology": "Prometheus & Grafana",
                            "x": 950.0,
                            "y": 180.0,
                            "responsibilities": "Monitors backend system metrics, aggregates logs, and displays health alerts.",
                            "dependencies": ["Core Backend Service"],
                            "cost": 30.0,
                            "security_notes": "Internal access protected behind HTTPS credentials.",
                            "scaling_notes": "Configured with 30-day retention policies."
                        }
                    },
                    {
                        "type": "add_edge",
                        "edge": {
                            "source_id": "Core Backend Service",
                            "target_id": "Monitoring Node",
                            "label": "Scrapes metrics",
                            "animated": True
                        }
                    }
                ]
            else:
                reply = "I support adding nodes like 'Monitoring Node' via chat. Try asking: 'add a monitoring node'."
        elif "remove" in lower or "delete" in lower:
            removed = False
            for comp in components:
                name = comp["name"]
                if name.lower() in lower:
                    reply = f"I have successfully removed the '{name}' component from your architecture as requested."
                    actions = [
                        {
                            "type": "remove_node",
                            "node_name": name
                        }
                    ]
                    removed = True
                    break
            if not removed:
                reply = "I support removing nodes. Please specify the name of the component you want to remove."
        else:
            reply = (
                "Welcome to the Local Hybrid Assistant! If you want to connect to a real Llama3 model "
                "for free-form architecture designs, please set `GROQ_API_KEY` in your `backend/.env` file. "
                "Otherwise, you can try local commands like 'add a monitoring node', 'remove CDN Cache', or ask 'Why Redis?'."
            )
            
    modified = False
    new_components = list(components)
    new_connections = list(connections)
    
    for action in actions:
        act_type = action.get("type")
        if act_type == "add_node" and "node" in action:
            node = action["node"]
            if not any(c["name"] == node["name"] for c in new_components):
                new_components.append(node)
                modified = True
        elif act_type == "remove_node" and "node_name" in action:
            node_name = action["node_name"]
            new_components = [c for c in new_components if c["name"] != node_name]
            new_connections = [e for e in new_connections if e["source_id"] != node_name and e["target_id"] != node_name]
            modified = True
        elif act_type == "update_node" and "node_name" in action and "node" in action:
            node_name = action["node_name"]
            node = action["node"]
            for idx, c in enumerate(new_components):
                if c["name"] == node_name:
                    new_components[idx] = node
                    modified = True
                    break
        elif act_type == "add_edge" and "edge" in action:
            edge = action["edge"]
            if not any(e["source_id"] == edge["source_id"] and e["target_id"] == edge["target_id"] for e in new_connections):
                new_connections.append(edge)
                modified = True
        elif act_type == "remove_edge":
            src = action.get("source_id")
            tgt = action.get("target_id")
            new_connections = [e for e in new_connections if not (e["source_id"] == src and e["target_id"] == tgt)]
            modified = True

    if modified:
        latest_v = db.query(models.ArchitectureVersion).filter(
            models.ArchitectureVersion.project_id == project_id
        ).order_by(models.ArchitectureVersion.version_number.desc()).first()
        
        next_num = (latest_v.version_number + 1) if latest_v else 1
        
        db_version = models.ArchitectureVersion(
            project_id=project_id,
            version_number=next_num,
            commit_msg=f"AI Assist: {message[:60]}...",
            parent_version_id=latest_v.id if latest_v else None
        )
        db.add(db_version)
        db.commit()
        db.refresh(db_version)
        
        for comp in new_components:
            db_comp = models.Component(
                version_id=db_version.id,
                name=comp["name"],
                type=comp["type"],
                technology=comp["technology"],
                x=comp.get("x", 100.0),
                y=comp.get("y", 100.0),
                responsibilities=comp.get("responsibilities"),
                dependencies=comp.get("dependencies", []),
                cost=comp.get("cost", 0.0),
                security_notes=comp.get("security_notes"),
                scaling_notes=comp.get("scaling_notes")
            )
            db.add(db_comp)
            
        for conn in new_connections:
            db_conn = models.Connection(
                version_id=db_version.id,
                source_id=conn["source_id"],
                target_id=conn["target_id"],
                label=conn.get("label"),
                animated=conn.get("animated", False)
            )
            db.add(db_conn)
            
        db.commit()

    return {
        "reply": reply,
        "components": new_components,
        "connections": new_connections,
        "is_hybrid_fallback": not bool(groq_api_key)
    }

# --- WebSocket Discovery ---

GENERAL_QUESTIONS = [
    "What is the expected initial and target scale of the application (e.g. 10k, 100k, 1M+ active users)?",
    "Which cloud provider do you prefer (AWS, GCP, Azure, or Hybrid/On-Premise)?",
    "Do you require real-time features like WebSockets, real-time message streams, or push notifications?",
    "Are there any compliance requirements we must satisfy (e.g. HIPAA, GDPR, SOC2)?",
    "What is your target budget constraint (Startup, Mid-Sized, Enterprise)?"
]

INDUSTRY_QUESTIONS = {
    "health": [
        "What is the expected patient registry size and active daily user scale (e.g., 10k, 100k, 1M+ patients/doctors)?",
        "Which cloud provider do you prefer for HIPAA-compliant hosting (AWS, GCP, Azure, or Hybrid)?",
        "Do you need to integrate with Electronic Health Records (EHR/EMR) via FHIR/HL7, or support DICOM medical imaging?",
        "Are there strict regulatory compliance standards we must adhere to (e.g., HIPAA, GDPR, SOC2, or local healthcare acts)?",
        "What are your target budget constraints for secure, high-availability hosting (Startup, Mid-Sized, Enterprise)?"
    ],
    "fintech": [
        "What is the expected active user base and transaction throughput (e.g., 10k users, 100+ Transactions Per Second)?",
        "Which cloud provider or hosting model do you prefer for secure financial services (AWS, GCP, Azure, or Private Cloud)?",
        "Do you require real-time transaction ledgers, instant fraud detection pipelines, or third-party banking API integrations?",
        "What financial compliance or auditing standards apply to this platform (e.g., PCI-DSS, SOC2, ISO 27001)?",
        "What is your hosting budget tier, keeping in mind database redundancy and HSM/KMS costs (Startup, Mid-Sized, Enterprise)?"
    ],
    "finance": [
        "What is the expected active user base and transaction throughput (e.g., 10k users, 100+ Transactions Per Second)?",
        "Which cloud provider or hosting model do you prefer for secure financial services (AWS, GCP, Azure, or Private Cloud)?",
        "Do you require real-time transaction ledgers, instant fraud detection pipelines, or third-party banking API integrations?",
        "What financial compliance or auditing standards apply to this platform (e.g., PCI-DSS, SOC2, ISO 27001)?",
        "What is your hosting budget tier, keeping in mind database redundancy and HSM/KMS costs (Startup, Mid-Sized, Enterprise)?"
    ],
    "e-commerce": [
        "What is the expected user scale and peak concurrency (e.g., 10k, 100k, 1M+ active shoppers during holiday sales)?",
        "Which cloud provider do you prefer for running a fast, global e-commerce application (AWS, GCP, Azure)?",
        "Do you require real-time inventory synchronization, instant cart state updates, or AI-driven recommendation engines?",
        "Are there any payment card industry (PCI-DSS) or user privacy compliance regulations (GDPR, CCPA) we must satisfy?",
        "What is the budget tier for this project, including CDN and multi-region failover costs (Startup, Mid-Sized, Enterprise)?"
    ],
    "iot": [
        "What is the expected number of connected IoT devices and data ingestion rate (e.g., 10k devices, 1000 telemetry packets/sec)?",
        "Which cloud provider do you prefer for managing IoT core registries and data streams (AWS, GCP, Azure)?",
        "Do we need real-time telemetry streaming, WebSockets for status changes, or message queues for asynchronous task workers?",
        "Are there specific industrial, automotive, or consumer data safety and privacy regulations we need to comply with?",
        "What is the budget constraint for high-volume database writes and cold storage archiving (Startup, Mid-Sized, Enterprise)?"
    ],
    "social": [
        "What is the target active user count and media/chat message volume (e.g., 10k, 100k, 1M+ daily active users)?",
        "Which cloud provider do you prefer for cost-effective application and media hosting (AWS, GCP, Azure)?",
        "Do you require real-time features like instant messaging, live feed updates, WebSockets, or push notifications?",
        "Are there specific content moderation, child safety (COPPA), or privacy compliance standards (GDPR) we must support?",
        "What is the budget tier for hosting and network egress (Startup, Mid-Sized, Enterprise)?"
    ]
}

@app.websocket("/api/ws/discovery/{session_id}")
async def websocket_discovery(websocket: WebSocket, session_id: str, db: Session = Depends(get_db)):
    await websocket.accept()
    logger.info(f"WebSocket discovery session {session_id} connected.")

    # Fetch session
    session = db.query(models.DiscoverySession).filter(models.DiscoverySession.id == session_id).first()
    if not session:
        await websocket.send_text(json.dumps({"type": "error", "message": "Session not found"}))
        await websocket.close()
        return

    # Fetch project and resolve questions
    project = session.project
    industry_key = (project.industry or "").lower().strip() if project else ""
    
    questions = GENERAL_QUESTIONS
    for key, q_list in INDUSTRY_QUESTIONS.items():
        if key in industry_key:
            questions = q_list
            break

    # Track how many questions have been asked
    chat_history = session.chat_history or []

    try:
        while True:
            # Receive user message
            data = await websocket.receive_text()
            message_data = json.loads(data)
            user_message = message_data.get("message")

            if not user_message:
                continue

            # 1. Update session chat history with user reply
            chat_history.append({"role": "user", "content": user_message})
            session.chat_history = chat_history
            db.commit()

            # Determine next step
            answered_questions = sum(1 for m in chat_history if m["role"] == "user")
            
            if answered_questions - 1 < len(questions):
                # Ask next question
                next_q = questions[answered_questions - 1]
                chat_history.append({"role": "archon", "content": next_q})
                session.chat_history = chat_history
                db.commit()

                # Send back to client
                await websocket.send_text(json.dumps({
                    "type": "chat_reply",
                    "role": "archon",
                    "content": next_q,
                    "chat_history": chat_history
                }))
            else:
                # We have enough info, trigger the Multi-Agent consensus generation!
                session.status = "thinking"
                db.commit()
                
                await websocket.send_text(json.dumps({
                    "type": "status",
                    "status": "thinking",
                    "log": "All requirements collected. Starting Multi-Agent Consensus Engine..."
                }))

                # Extract parameters from replies to pass to orchestrator
                user_replies = [m["content"] for m in chat_history if m["role"] == "user"]
                
                # Update project metadata based on chat replies to make it highly reactive
                if len(user_replies) >= 2: project.scale = user_replies[1]
                if len(user_replies) >= 3: project.preferred_cloud = user_replies[2]
                if len(user_replies) >= 4: 
                    project.description = (project.description or "") + f" | Special/Real-time requirements: {user_replies[3]}"
                if len(user_replies) >= 5: project.compliance = user_replies[4]
                if len(user_replies) >= 6: project.budget = user_replies[5]
                
                db.commit()

                # Run Orchestrator
                orchestrator = AgentOrchestrator(project_data={
                    "name": project.name,
                    "description": project.description,
                    "industry": project.industry,
                    "scale": project.scale,
                    "region": project.region,
                    "preferred_cloud": project.preferred_cloud,
                    "budget": project.budget,
                    "compliance": project.compliance
                })

                async for update in orchestrator.run_discovery_stream():
                    if update["type"] == "architecture_ready":
                        # Save the generated architecture version to database
                        db_version = models.ArchitectureVersion(
                            project_id=project.id,
                            version_number=1,
                            commit_msg="Initial AI Discovery Architecture"
                        )
                        db.add(db_version)
                        db.commit()
                        db.refresh(db_version)

                        # Write components
                        saved_comps = []
                        for comp in update["components"]:
                            db_comp = models.Component(
                                version_id=db_version.id,
                                name=comp["name"],
                                type=comp["type"],
                                technology=comp["technology"],
                                x=comp["x"],
                                y=comp["y"],
                                responsibilities=comp["responsibilities"],
                                dependencies=comp["dependencies"],
                                cost=comp["cost"],
                                security_notes=comp["security_notes"],
                                scaling_notes=comp["scaling_notes"]
                            )
                            db.add(db_comp)
                            saved_comps.append(db_comp)

                        # Write connections
                        for conn in update["connections"]:
                            db_conn = models.Connection(
                                version_id=db_version.id,
                                source_id=conn["source_id"],
                                target_id=conn["target_id"],
                                label=conn.get("label"),
                                animated=conn.get("animated", False)
                            )
                            db.add(db_conn)

                        # Write decisions
                        for dec in update["decisions"]:
                            db_dec = models.Decision(
                                project_id=project.id,
                                component_name=dec["component_name"],
                                chosen_tech=dec["chosen_tech"],
                                reason=dec["reason"],
                                evidence=dec.get("evidence"),
                                trade_offs=dec.get("trade_offs"),
                                confidence=dec.get("confidence", 0.9),
                                alternatives=dec.get("alternatives", [])
                            )
                            db.add(db_dec)

                        # Write review
                        rev_data = update["review"]
                        db_review = models.Review(
                            project_id=project.id,
                            version_id=db_version.id,
                            score=rev_data["score"],
                            security_issues=rev_data["security_issues"],
                            scalability_issues=rev_data["scalability_issues"],
                            cost_issues=rev_data["cost_issues"],
                            latency_issues=rev_data["latency_issues"],
                            general_recommendations=rev_data["general_recommendations"]
                        )
                        db.add(db_review)

                        # Set session completed
                        session.status = "completed"
                        db.commit()

                        # Return everything as completed payload
                        await websocket.send_text(json.dumps({
                            "type": "generation_completed",
                            "project_id": project.id,
                            "version_id": db_version.id
                        }))
                    else:
                        # Forward thinking logs
                        await websocket.send_text(json.dumps(update))

    except WebSocketDisconnect:
        logger.info(f"WebSocket discovery session {session_id} disconnected.")
    except Exception as e:
        logger.error(f"WebSocket error in session {session_id}: {e}")
        await websocket.send_text(json.dumps({"type": "error", "message": str(e)}))

@app.post("/api/projects/{project_id}/export-github")
def export_to_github(project_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    import base64
    import time
    
    github_repo = payload.get("github_repo")
    github_token = payload.get("github_token")
    terraform_code = payload.get("terraform_code")
    mermaid_code = payload.get("mermaid_code")
    commit_msg = payload.get("commit_msg", "Update architecture and infrastructure")

    if not github_repo or "/" not in github_repo:
        raise HTTPException(status_code=400, detail="Invalid GitHub repository name. Must be in owner/repo format.")
    if not github_token:
        raise HTTPException(status_code=400, detail="GitHub token is required.")

    # 1. Fetch project info to show in PR body
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    project_name = project.name if project else "Archon System Design"
    project_desc = project.description if project else ""

    headers = {
        "Authorization": f"Bearer {github_token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Archon-Architect"
    }

    # 2. Get default branch of the repository
    repo_url = f"https://api.github.com/repos/{github_repo}"
    r = requests.get(repo_url, headers=headers)
    if r.status_code != 200:
        err_msg = r.json().get('message', r.text) if r.headers.get('content-type', '').startswith('application/json') else r.text
        raise HTTPException(status_code=r.status_code, detail=f"Failed to fetch repository: {err_msg}")
    repo_data = r.json()
    default_branch = repo_data.get("default_branch", "main")

    # 3. Get SHA of the default branch ref
    ref_url = f"https://api.github.com/repos/{github_repo}/git/ref/heads/{default_branch}"
    r = requests.get(ref_url, headers=headers)
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=f"Failed to get default branch SHA: {r.text}")
    ref_data = r.json()
    default_branch_sha = ref_data["object"]["sha"]

    # 4. Create new branch
    branch_name = f"archon-update-{int(time.time())}"
    create_branch_url = f"https://api.github.com/repos/{github_repo}/git/refs"
    branch_payload = {
        "ref": f"refs/heads/{branch_name}",
        "sha": default_branch_sha
    }
    r = requests.post(create_branch_url, json=branch_payload, headers=headers)
    if r.status_code != 201:
        raise HTTPException(status_code=r.status_code, detail=f"Failed to create new branch: {r.text}")

    # 5. Helper function to create/update file on GitHub
    def commit_file_to_branch(file_path: str, content: str, commit_message: str):
        # Fetch file sha if exists
        content_url = f"https://api.github.com/repos/{github_repo}/contents/{file_path}?ref={branch_name}"
        file_sha = None
        r_get = requests.get(content_url, headers=headers)
        if r_get.status_code == 200:
            file_sha = r_get.json().get("sha")

        encoded_content = base64.b64encode(content.encode("utf-8")).decode("utf-8")
        
        file_payload = {
            "message": commit_message,
            "content": encoded_content,
            "branch": branch_name
        }
        if file_sha:
            file_payload["sha"] = file_sha

        r_put = requests.put(f"https://api.github.com/repos/{github_repo}/contents/{file_path}", json=file_payload, headers=headers)
        if r_put.status_code not in [200, 201]:
            raise HTTPException(status_code=r_put.status_code, detail=f"Failed to commit {file_path}: {r_put.text}")

    # Write files
    if terraform_code:
        commit_file_to_branch("terraform/main.tf", terraform_code, f"Archon: Update Terraform infrastructure - {commit_msg}")

    # Create dynamic documentation page
    readme_doc = f"# System Architecture: {project_name}\n\n"
    if project_desc:
        readme_doc += f"## Description\n{project_desc}\n\n"
    if mermaid_code:
        readme_doc += f"## Architecture Diagram (Mermaid)\n\n```mermaid\n{mermaid_code}\n```\n\n"
    readme_doc += "## Deployment Instructions\nTo deploy this architecture, navigate to the `terraform/` directory and execute:\n```bash\nterraform init\nterraform apply\n```\n\n---\n*Generated automatically by [Archon](https://github.com/nidhisinghh/archon).*"

    commit_file_to_branch("architecture.md", readme_doc, "Archon: Update system architecture documentation")

    # 6. Create Pull Request
    pr_url = f"https://api.github.com/repos/{github_repo}/pulls"
    pr_body = (
        f"This Pull Request was dynamically generated by the **Archon Collaborative AI Architect** platform for project **{project_name}**.\n\n"
        "### 🛠️ Changes\n"
        "1. Updated **Terraform Infrastructure** configuration (`terraform/main.tf`)\n"
        "2. Updated **System Architecture Documentation** (`architecture.md`) including the latest Mermaid diagram.\n\n"
        "---\n"
        "*Generated with 🖤 by Archon*"
    )
    pr_payload = {
        "title": f"Archon: Infrastructure Update - {commit_msg}",
        "body": pr_body,
        "head": branch_name,
        "base": default_branch
    }
    
    r_pr = requests.post(pr_url, json=pr_payload, headers=headers)
    if r_pr.status_code != 201:
        raise HTTPException(status_code=r_pr.status_code, detail=f"Failed to create Pull Request: {r_pr.text}")

    pr_data = r_pr.json()
    return {"pr_url": pr_data.get("html_url"), "branch": branch_name}
