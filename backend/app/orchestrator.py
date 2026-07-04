import os
import json
import asyncio
import requests
from typing import AsyncGenerator, Dict, Any, List

class AgentOrchestrator:
    def __init__(self, project_data: Dict[str, Any]):
        self.project_data = project_data
        self.name = project_data.get("name", "New Project")
        self.description = project_data.get("description", "")
        self.industry = project_data.get("industry", "SaaS")
        self.scale = project_data.get("scale", "10k")
        self.region = project_data.get("region", "ap-south-1")
        self.cloud = project_data.get("preferred_cloud", "AWS")
        self.budget = project_data.get("budget", "Medium")
        self.compliance = project_data.get("compliance", "None")
        
    async def run_discovery_stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Runs the multi-agent consensus network step-by-step and streams the logs.
        Calls Groq API if GROQ_API_KEY is present, else falls back to Local Hybrid Mode.
        """
        agents = [
            ("Planner", "Creating system design blueprint and defining execution milestones..."),
            ("Requirement Analyst", "Deconstructing requirements: Latency targets (<200ms), security constraints..."),
            ("Backend Architect", "Modeling API gateways, main service layer, and communications..."),
            ("Database Specialist", f"Evaluating database options for {self.industry} industry..."),
            ("Security Architect", "Configuring OAuth2, JWT mechanisms, secrets management, and compliance checks..."),
            ("Infrastructure Engineer", f"Designing deployment layout on {self.cloud} in {self.region} with {self.scale} capacity..."),
            ("Consensus Engine", "Resolving trade-offs between speed, cost, scalability, and complexity..."),
        ]

        # Check for Groq API Key
        groq_api_key = os.getenv("GROQ_API_KEY")

        if groq_api_key:
            # 1. Stream the Agent Thinking Process (for UI feedback)
            for agent_name, description in agents:
                yield {
                    "type": "agent_thinking",
                    "agent": agent_name,
                    "status": "running",
                    "log": f"[{agent_name}] {description}"
                }
                sub_logs = self._get_sub_logs_for_agent(agent_name)
                for log in sub_logs[:2]:
                    await asyncio.sleep(0.3)
                    yield {
                        "type": "agent_thinking",
                        "agent": agent_name,
                        "status": "running",
                        "log": f"[{agent_name}] {log}"
                    }
                yield {
                    "type": "agent_thinking",
                    "agent": agent_name,
                    "status": "completed",
                    "log": f"[{agent_name}] Analysis complete."
                }
                await asyncio.sleep(0.1)

            yield {
                "type": "status",
                "log": "Contacting Groq Llama 3 Architect for custom system generation..."
            }

            try:
                system_prompt = (
                    "You are Archon, an expert Multi-Agent AI Software Architect. You design enterprise-grade system architectures.\n"
                    "You MUST output a valid JSON object matching this structure EXACTLY:\n"
                    "{\n"
                    "  \"components\": [\n"
                    "    {\n"
                    "      \"name\": \"Component Name (unique)\",\n"
                    "      \"type\": \"client\" | \"gateway\" | \"service\" | \"database\" | \"cache\" | \"queue\",\n"
                    "      \"technology\": \"Specific Tech (e.g. Next.js, API Gateway, PostgreSQL, Redis, RabbitMQ)\",\n"
                    "      \"x\": float (row coordinate based on flow direction: client=100, gateway=300, service/cache=520, database/queue=750, workers/storage=950),\n"
                    "      \"y\": float (column coordinate e.g. 150, 300, 480, 600),\n"
                    "      \"responsibilities\": \"Core tasks of this node\",\n"
                    "      \"dependencies\": [\"Names of target components it depends on directly\"],\n"
                    "      \"cost\": float (estimated monthly hosting cost in USD, e.g., 10.0 to 200.0),\n"
                    "      \"security_notes\": \"Encryption details, auth, rules\",\n"
                    "      \"scaling_notes\": \"Autoscaling policies, limits\"\n"
                    "    }\n"
                    "  ],\n"
                    "  \"connections\": [\n"
                    "    {\n"
                    "      \"source_id\": \"Source Component Name\",\n"
                    "      \"target_id\": \"Target Component Name\",\n"
                    "      \"label\": \"HTTPS request, RPC call, write query, etc.\",\n"
                    "      \"animated\": boolean\n"
                    "    }\n"
                    "  ],\n"
                    "  \"decisions\": [\n"
                    "    {\n"
                    "      \"component_name\": \"Component Name\",\n"
                    "      \"chosen_tech\": \"Technology chosen\",\n"
                    "      \"reason\": \"Justification for choosing this technology\",\n"
                    "      \"evidence\": \"Benchmarks or architectural patterns supporting this decision\",\n"
                    "      \"trade_offs\": \"Trade-offs, negatives, or limitations compared to alternatives\",\n"
                    "      \"confidence\": float (0.0 to 1.0),\n"
                    "      \"alternatives\": [\n"
                    "        {\"name\": \"Alternative Tech Name\", \"pros\": \"Alternative Pros\", \"cons\": \"Alternative Cons\"}\n"
                    "      ]\n"
                    "    }\n"
                    "  ],\n"
                    "  \"review\": {\n"
                    "    \"score\": integer (0 to 100),\n"
                    "    \"security_issues\": [\"Issue 1\", ...],\n"
                    "    \"scalability_issues\": [\"Issue 1\", ...],\n"
                    "    \"cost_issues\": [\"Issue 1\", ...],\n"
                    "    \"latency_issues\": [\"Issue 1\", ...],\n"
                    "    \"general_recommendations\": [\"Recommendation 1\", ...]\n"
                    "  }\n"
                    "}"
                )

                user_prompt = (
                    f"Design a system architecture with these requirements:\n"
                    f"- Project Name: {self.name}\n"
                    f"- Industry: {self.industry}\n"
                    f"- Description / Core Business Concept: {self.description}\n"
                    f"- Cloud Provider: {self.cloud}\n"
                    f"- Deployment Region: {self.region}\n"
                    f"- Scaling / Scale Target: {self.scale}\n"
                    f"- Budget Tier: {self.budget}\n"
                    f"- Compliance Level: {self.compliance}\n"
                    f"Adjust the technology choices, security nodes, and topology structure to match this context."
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
                            {"role": "user", "content": user_prompt}
                        ],
                        "response_format": {"type": "json_object"},
                        "temperature": 0.2
                    },
                    timeout=25
                )

                if res.status_code == 200:
                    data = res.json()
                    content = data["choices"][0]["message"]["content"]
                    parsed = json.loads(content)
                    yield {
                        "type": "architecture_ready",
                        "components": parsed.get("components", []),
                        "connections": parsed.get("connections", []),
                        "decisions": parsed.get("decisions", []),
                        "review": parsed.get("review", {})
                    }
                    return
                else:
                    raise Exception(f"HTTP {res.status_code}: {res.text}")

            except Exception as e:
                yield {
                    "type": "status",
                    "log": f"Groq API connection failed ({str(e)}). Falling back to Local Hybrid Mode."
                }
                await asyncio.sleep(1)

        # 2. Local Hybrid Mode fallback (fully customized dynamic factory)
        for agent_name, description in agents:
            yield {
                "type": "agent_thinking",
                "agent": agent_name,
                "status": "running",
                "log": f"[{agent_name}] {description}"
            }
            sub_logs = self._get_sub_logs_for_agent(agent_name)
            for log in sub_logs:
                await asyncio.sleep(0.3)
                yield {
                    "type": "agent_thinking",
                    "agent": agent_name,
                    "status": "running",
                    "log": f"[{agent_name}] {log}"
                }
            yield {
                "type": "agent_thinking",
                "agent": agent_name,
                "status": "completed",
                "log": f"[{agent_name}] Completed analysis."
            }
            await asyncio.sleep(0.1)

        yield {
            "type": "status",
            "log": "Compiling final architecture consensus..."
        }
        await asyncio.sleep(0.5)

        components, connections = self._generate_architecture_data()
        decisions = self._generate_decisions_data()
        review = self._generate_review_data(components)

        yield {
            "type": "architecture_ready",
            "components": components,
            "connections": connections,
            "decisions": decisions,
            "review": review
        }

    def _get_sub_logs_for_agent(self, agent_name: str) -> List[str]:
        if agent_name == "Planner":
            return [
                "De-structuring application components...",
                "Assigning worker threads to backend structure...",
                "Drafting dependency chain mapping..."
            ]
        elif agent_name == "Requirement Analyst":
            return [
                f"Analyzing user traffic profile: scale capacity target {self.scale}.",
                f"Checking regulatory requirements for compliance: {self.compliance}...",
                "Defining Quality of Service metrics and performance constraints."
            ]
        elif agent_name == "Backend Architect":
            return [
                "Drafting API contracts (REST, WebSockets for live features)...",
                "Defining caching layers to reduce database strain...",
                "Designing message broker queues for decoupled tasks."
            ]
        elif agent_name == "Database Specialist":
            return [
                "Profiling query patterns: read-heavy vs write-heavy ratio (80:20)...",
                "Analyzing transactions support (ACID requirements)...",
                "Selecting master-replica configuration or document storage."
            ]
        elif agent_name == "Security Architect":
            return [
                "Analyzing token lifetimes, refresh token rotation strategies...",
                "Designing RBAC roles (Owner, Architect, Developer, Viewer)...",
                "Planning TLS terminal settings and security group boundaries."
            ]
        elif agent_name == "Infrastructure Engineer":
            return [
                f"Selecting cloud resource targets: {self.cloud} virtual machines/managed containers...",
                "Designing network segmentation: public DMZ subnet vs private database subnets...",
                "Drafting auto-scaling triggers based on CPU utilization > 70%."
            ]
        elif agent_name == "Consensus Engine":
            return [
                "Resolving SQL vs NoSQL document debate...",
                "Balancing cache memory cost against database load reduction...",
                "Aligning final design nodes with specified budget constraints."
            ]
        return ["Thinking..."]

    def _generate_architecture_data(self) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        # Local Hybrid Dynamic Schema Factory
        is_aws = self.cloud.upper() == "AWS"
        is_gcp = self.cloud.upper() == "GCP"
        
        gw_tech = "AWS API Gateway" if is_aws else ("GCP Apigee" if is_gcp else "Kong / Nginx")
        cdn_tech = "CloudFront" if is_aws else ("Cloud CDN" if is_gcp else "Cloudflare")
        compute_tech = "EKS (Kubernetes)" if is_aws else ("GKE" if is_gcp else "Docker / Docker Swarm")
        db_tech = "Amazon Aurora PostgreSQL" if is_aws else ("Cloud SQL Postgres" if is_gcp else "PostgreSQL")
        cache_tech = "AWS ElastiCache (Redis)" if is_aws else ("Memorystore Redis" if is_gcp else "Redis")
        queue_tech = "Amazon SQS / MSK" if is_aws else ("Google Pub/Sub" if is_gcp else "RabbitMQ")
        storage_tech = "Amazon S3" if is_aws else ("GCS Bucket" if is_gcp else "MinIO / Cloud Object Storage")

        ind_lower = (self.industry + " " + self.description).lower()
        
        # Industry Customization
        if "finance" in ind_lower or "fintech" in ind_lower or "pay" in ind_lower:
            db_tech = "PostgreSQL (with Ledger Extension)" if not is_aws else "Amazon Aurora PostgreSQL (Ledger DB)"
            db_label = "Ledger DB"
            special_service = "Compliance Audit Service"
            special_tech = "Go Audit Microservice"
            special_resp = "Calculates checksum logs of transaction records and files financial ledgers."
            special_cost = 75.0
        elif "iot" in ind_lower or "sensor" in ind_lower or "device" in ind_lower:
            db_tech = "InfluxDB / TimescaleDB"
            db_label = "TimeSeries DB"
            special_service = "MQTT Telemetry Ingester"
            special_tech = "Rust MQTT Service"
            special_resp = "Ingests high-frequency device metrics streams and batches to database."
            special_cost = 55.0
        elif "social" in ind_lower or "chat" in ind_lower or "messaging" in ind_lower:
            db_tech = "MongoDB / Neo4j Graph"
            db_label = "Graph & Document DB"
            special_service = "Real-time WebSocket Host"
            special_tech = "Node.js (Socket.io)"
            special_resp = "Manages active user connections, room bindings, and instant messaging frames."
            special_cost = 45.0
        else:
            # Default SaaS / E-Commerce
            db_label = "Main Database"
            special_service = "Async Worker Service"
            special_tech = "Python Worker (Celery)"
            special_resp = "Handles PDF generation, email dispatches, and heavy background calculations."
            special_cost = 80.0

        components = [
            {
                "name": "User Client",
                "type": "client",
                "technology": "Next.js / Web Browser",
                "x": 100,
                "y": 250,
                "responsibilities": f"Responsive application interface for {self.name}.",
                "dependencies": ["Gateway"],
                "cost": 15.0,
                "security_notes": "XSS sanitization, HTTPOnly cookie session token storage.",
                "scaling_notes": "Distributed globally over CDN edges."
            },
            {
                "name": "CDN Cache",
                "type": "gateway",
                "technology": cdn_tech,
                "x": 280,
                "y": 150,
                "responsibilities": "Caches web client assets, reduces primary server rendering cycles.",
                "dependencies": ["Gateway"],
                "cost": 45.0,
                "security_notes": "Standard SSL certificate binding, DDoS protection.",
                "scaling_notes": "Fully managed scaling handled by CDN provider."
            },
            {
                "name": "Gateway",
                "type": "gateway",
                "technology": gw_tech,
                "x": 300,
                "y": 300,
                "responsibilities": "Receives user API commands, checks rate limits, and validates JWT headers.",
                "dependencies": ["Core Backend Service"],
                "cost": 50.0,
                "security_notes": "API rate-limiting enabled at gateway level. Validates signatures.",
                "scaling_notes": "Autoscaling group triggered on network packet limits."
            },
            {
                "name": "Core Backend Service",
                "type": "service",
                "technology": f"FastAPI / {compute_tech}",
                "x": 520,
                "y": 300,
                "responsibilities": "Orchestrates business calculations, fetches state, and updates transactions.",
                "dependencies": [db_label, "Cache Layer", "Message Broker"],
                "cost": 120.0,
                "security_notes": "SQL injection prevention via ORM query bindings.",
                "scaling_notes": f"Horizontal scaling base of Kubernetes POD counts on {compute_tech}."
            },
            {
                "name": "Cache Layer",
                "type": "cache",
                "technology": cache_tech,
                "x": 520,
                "y": 120,
                "responsibilities": "Speeds up profile read lookups and maintains active session tokens.",
                "dependencies": [],
                "cost": 35.0,
                "security_notes": "Access restricted to backend private VPC subnet range.",
                "scaling_notes": "Read scaling through replica nodes."
            },
            {
                "name": db_label,
                "type": "database",
                "technology": db_tech,
                "x": 750,
                "y": 300,
                "responsibilities": "Maintains persistent app data records with strict data safety guarantees.",
                "dependencies": ["File Storage"],
                "cost": 150.0,
                "security_notes": "Automated daily snaps, private VPC deployment, TLS DB connection.",
                "scaling_notes": "Ready to scale with multi-AZ read-replicas."
            },
            {
                "name": "Message Broker",
                "type": "queue",
                "technology": queue_tech,
                "x": 520,
                "y": 480,
                "responsibilities": "Buffers task events to process heavy workflows asynchronously.",
                "dependencies": [special_service],
                "cost": 60.0,
                "security_notes": "VPC isolated endpoints and encrypted queues.",
                "scaling_notes": "Scales through additional topics and queue partitions."
            },
            {
                "name": special_service,
                "type": "service",
                "technology": special_tech,
                "x": 750,
                "y": 480,
                "responsibilities": special_resp,
                "dependencies": ["File Storage", db_label],
                "cost": special_cost,
                "security_notes": "No public ingress routes; strictly reads from the broker queues.",
                "scaling_notes": "Horizontal thread scaling based on queue depth metrics."
            },
            {
                "name": "File Storage",
                "type": "database",
                "technology": storage_tech,
                "x": 950,
                "y": 400,
                "responsibilities": "Stores images, static reports, and long-term files securely.",
                "dependencies": [],
                "cost": 25.0,
                "security_notes": "Private cloud bucket. Access only via pre-signed signed URLs.",
                "scaling_notes": "Natively elastic storage capacity."
            }
        ]

        connections = [
            {"source_id": "User Client", "target_id": "Gateway", "label": "HTTPS requests", "animated": True},
            {"source_id": "User Client", "target_id": "CDN Cache", "label": "Static files", "animated": False},
            {"source_id": "Gateway", "target_id": "Core Backend Service", "label": "API routing", "animated": True},
            {"source_id": "Core Backend Service", "target_id": "Cache Layer", "label": "Read cache", "animated": False},
            {"source_id": "Core Backend Service", "target_id": db_label, "label": "DB transactions", "animated": True},
            {"source_id": "Core Backend Service", "target_id": "Message Broker", "label": "Schedules task", "animated": True},
            {"source_id": "Message Broker", "target_id": special_service, "label": "Pulls message", "animated": True},
            {"source_id": special_service, "target_id": "File Storage", "label": "Saves files", "animated": False},
            {"source_id": special_service, "target_id": db_label, "label": "Completes transaction", "animated": False}
        ]

        return components, connections

    def _generate_decisions_data(self) -> List[Dict[str, Any]]:
        is_aws = self.cloud.upper() == "AWS"
        db_tech = "Amazon Aurora PostgreSQL" if is_aws else "PostgreSQL"
        cache_tech = "AWS ElastiCache (Redis)" if is_aws else "Redis"
        queue_tech = "Amazon SQS / MSK" if is_aws else "RabbitMQ"

        return [
            {
                "component_name": "Main Database",
                "chosen_tech": db_tech,
                "reason": "Ensures transactional safety and relational integrity for core models.",
                "evidence": f"Fits perfectly for {self.industry} models requiring complex relationships.",
                "trade_offs": "Difficult to scale writes globally without sharding strategies.",
                "confidence": 0.95,
                "alternatives": [
                    {"name": "MongoDB", "pros": "Dynamic JSON schema, easy scaling.", "cons": "Weak cross-document transactions."},
                    {"name": "CockroachDB", "pros": "Globally distributed SQL.", "cons": "High latency and setup complexity."}
                ]
            },
            {
                "component_name": "Cache Layer",
                "chosen_tech": cache_tech,
                "reason": "Allows sub-millisecond session access times to fit user SLA parameters.",
                "evidence": "Minimizes database query load by over 80%.",
                "trade_offs": "Cache synchronization and invalidation logic overhead.",
                "confidence": 0.90,
                "alternatives": [
                    {"name": "Memcached", "pros": "Simple multi-threading.", "cons": "No built-in persistence layers."},
                    {"name": "In-Memory Map", "pros": "Zero network latency.", "cons": "Cannot share state between load-balanced server replicas."}
                ]
            },
            {
                "component_name": "Message Broker",
                "chosen_tech": queue_tech,
                "reason": "Decouples the sync API response path from long-running worker operations.",
                "evidence": "Maintains API response loops under the 200ms limit.",
                "trade_offs": "Eventual consistency and dead-letter queue complexity.",
                "confidence": 0.88,
                "alternatives": [
                    {"name": "Apache Kafka", "pros": "High-volume stream replay.", "cons": "Extremely complex infrastructure configuration."},
                    {"name": "DB Queue", "pros": "Easy setup.", "cons": "Highly polling-intensive, slows DB down."}
                ]
            }
        ]

    def _generate_review_data(self, components: List[Dict[str, Any]]) -> Dict[str, Any]:
        return {
            "score": 88,
            "security_issues": [
                "Configure AWS WAF rules in front of the API Gateway to drop script injections.",
                "Bind databases strictly to private subnets without public elastic IP assignments."
            ],
            "scalability_issues": [
                "Consider database sharding or scaling read capacity when database logs grow past 1TB.",
                "Double-check cache eviction configurations to avoid sudden OOM restarts during peak traffic spikes."
            ],
            "cost_issues": [
                "Base container instances (EKS/GKE) cost roughly $73/mo. Look at serverless alternatives for dev/sandbox tier.",
                "Use standard development size cache nodes instead of production-grade nodes to reduce costs."
            ],
            "latency_issues": [
                "Ensure serverless functions or container limits do not cause long cold-start times.",
                "Configure edge caching locally to avoid inter-continental DNS trip delays."
            ],
            "general_recommendations": [
                "Implement structured JSON logs on application servers for seamless log monitoring.",
                "Use migration frameworks like Alembic from the start."
            ]
        }
