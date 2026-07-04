import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    industry = Column(String, nullable=True)
    scale = Column(String, nullable=True)
    region = Column(String, nullable=True)
    target_users = Column(String, nullable=True)
    compliance = Column(String, nullable=True)
    preferred_cloud = Column(String, nullable=True)
    budget = Column(String, nullable=True)
    team_size = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="projects")
    versions = relationship("ArchitectureVersion", back_populates="project", cascade="all, delete-orphan")
    decisions = relationship("Decision", back_populates="project", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="project", cascade="all, delete-orphan")
    sessions = relationship("DiscoverySession", back_populates="project", cascade="all, delete-orphan")


class DiscoverySession(Base):
    __tablename__ = "discovery_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    status = Column(String, default="active") # active, thinking, completed
    chat_history = Column(JSON, default=list) # [{role: "user" | "archon", content: "..."}]
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="sessions")


class ArchitectureVersion(Base):
    __tablename__ = "architecture_versions"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    commit_msg = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    parent_version_id = Column(String, nullable=True)

    project = relationship("Project", back_populates="versions")
    components = relationship("Component", back_populates="version", cascade="all, delete-orphan")
    connections = relationship("Connection", back_populates="version", cascade="all, delete-orphan")


class Component(Base):
    __tablename__ = "components"

    id = Column(String, primary_key=True, default=generate_uuid)
    version_id = Column(String, ForeignKey("architecture_versions.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False) # gateway, service, database, cache, queue, client
    technology = Column(String, nullable=False)
    x = Column(Float, default=100.0)
    y = Column(Float, default=100.0)
    responsibilities = Column(Text, nullable=True)
    dependencies = Column(JSON, default=list) # List of component ids
    cost = Column(Float, default=0.0)
    security_notes = Column(Text, nullable=True)
    scaling_notes = Column(Text, nullable=True)

    version = relationship("ArchitectureVersion", back_populates="components")


class Connection(Base):
    __tablename__ = "connections"

    id = Column(String, primary_key=True, default=generate_uuid)
    version_id = Column(String, ForeignKey("architecture_versions.id"), nullable=False)
    source_id = Column(String, nullable=False)
    target_id = Column(String, nullable=False)
    label = Column(String, nullable=True)
    animated = Column(Boolean, default=False)

    version = relationship("ArchitectureVersion", back_populates="connections")


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    component_name = Column(String, nullable=False)
    chosen_tech = Column(String, nullable=False)
    reason = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)
    trade_offs = Column(Text, nullable=True)
    confidence = Column(Float, default=0.9)
    alternatives = Column(JSON, default=list) # [{name: "...", pros: "...", cons: "..."}]

    project = relationship("Project", back_populates="decisions")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    version_id = Column(String, ForeignKey("architecture_versions.id"), nullable=False)
    score = Column(Integer, default=70) # 0 to 100
    security_issues = Column(JSON, default=list)
    scalability_issues = Column(JSON, default=list)
    cost_issues = Column(JSON, default=list)
    latency_issues = Column(JSON, default=list)
    general_recommendations = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="reviews")
