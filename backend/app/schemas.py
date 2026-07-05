from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Component Schemas ---
class ComponentBase(BaseModel):
    name: str
    type: str
    technology: str
    x: float
    y: float
    responsibilities: Optional[str] = None
    dependencies: List[str] = []
    cost: float = 0.0
    security_notes: Optional[str] = None
    scaling_notes: Optional[str] = None

class ComponentCreate(ComponentBase):
    pass

class ComponentResponse(ComponentBase):
    id: str
    version_id: str

    class Config:
        from_attributes = True

# --- Connection Schemas ---
class ConnectionBase(BaseModel):
    source_id: str
    target_id: str
    label: Optional[str] = None
    animated: bool = False

class ConnectionCreate(ConnectionBase):
    pass

class ConnectionResponse(ConnectionBase):
    id: str
    version_id: str

    class Config:
        from_attributes = True

# --- Architecture Version Schemas ---
class VersionResponse(BaseModel):
    id: str
    project_id: str
    version_number: int
    commit_msg: str
    created_at: datetime
    parent_version_id: Optional[str] = None
    components: List[ComponentResponse] = []
    connections: List[ConnectionResponse] = []

    class Config:
        from_attributes = True

# --- Project Schemas ---
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    industry: Optional[str] = None
    scale: Optional[str] = None
    region: Optional[str] = None
    target_users: Optional[str] = None
    compliance: Optional[str] = None
    preferred_cloud: Optional[str] = None
    budget: Optional[str] = None
    team_size: int = 1

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    scale: Optional[str] = None
    region: Optional[str] = None
    target_users: Optional[str] = None
    compliance: Optional[str] = None
    preferred_cloud: Optional[str] = None
    budget: Optional[str] = None
    team_size: Optional[int] = None

class ProjectResponse(ProjectBase):
    id: str
    created_at: datetime
    versions: List[VersionResponse] = []

    class Config:
        from_attributes = True

# --- Discovery Session Schemas ---
class ChatMessage(BaseModel):
    role: str # user or archon
    content: str

class DiscoverySessionBase(BaseModel):
    project_id: str

class DiscoverySessionResponse(DiscoverySessionBase):
    id: str
    status: str
    chat_history: List[ChatMessage] = []
    created_at: datetime

    class Config:
        from_attributes = True

# --- Decision Explorer Schemas ---
class AlternativeItem(BaseModel):
    name: str
    pros: str
    cons: str

class DecisionResponse(BaseModel):
    id: str
    project_id: str
    component_name: str
    chosen_tech: str
    reason: str
    evidence: Optional[str] = None
    trade_offs: Optional[str] = None
    confidence: float
    alternatives: List[AlternativeItem] = []

    class Config:
        from_attributes = True

# --- Architecture Review Schemas ---
class ReviewResponse(BaseModel):
    id: str
    project_id: str
    version_id: str
    score: int
    security_issues: List[str] = []
    scalability_issues: List[str] = []
    cost_issues: List[str] = []
    latency_issues: List[str] = []
    general_recommendations: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True

# --- Search Query / Response ---
class SearchResult(BaseModel):
    project_id: str
    project_name: str
    matching_components: List[str]
    matching_versions: List[int]

# --- Auth Schemas ---
class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

