'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge
} from '@xyflow/react';
import { useStore } from '@/store/useStore';
import CustomNode from '@/components/CustomNode';
import { 
  Cpu, 
  Database, 
  Server, 
  ShieldAlert, 
  Activity, 
  Sliders, 
  Compass, 
  FileCode, 
  MessageSquare,
  Sparkles,
  GitBranch,
  ChevronLeft,
  IndianRupee,
  Info,
  Layers,
  Flame,
  CheckCircle,
  HelpCircle,
  Copy,
  UploadCloud,
  AlertTriangle,
  Trash2,
  Undo,
  Redo,
  Settings,
  Sun,
  Moon
} from 'lucide-react';

// Register custom node type
const nodeTypes = {
  customNode: CustomNode
};

const generateTerraformCode = (nodes: any[], edges: any[], cloud: string, scaleFactor: number) => {
  const isGCP = cloud?.toLowerCase() === 'gcp';
  const provider = isGCP ? 'gcp' : 'aws';
  const scaleName = ["10,000 Users (Small)", "1 Lakh Users (Standard)", "10 Lakh Users (Large Cluster)", "1 Crore Users (Global Distribution)"][scaleFactor] || "Standard";
  
  let code = "# =========================================================================\n" +
             "# Archon Generated Terraform Infrastructure Configuration\n" +
             "# Cloud Provider: " + (isGCP ? "Google Cloud Platform (GCP)" : "Amazon Web Services (AWS)") + "\n" +
             "# Target Scale Factor: " + scaleName + "\n" +
             "# Generated At: " + new Date().toLocaleDateString() + "\n" +
             "# =========================================================================\n\n" +
             "terraform {\n" +
             '  required_version = ">= 1.5.0"\n' +
             "  required_providers {\n" +
             (isGCP ? 
             '    google = {\n' +
             '      source  = "hashicorp/google"\n' +
             '      version = "~> 5.0"\n' +
             '    }\n' : 
             '    aws = {\n' +
             '      source  = "hashicorp/aws"\n' +
             '      version = "~> 5.0"\n' +
             '    }\n') +
             "  }\n" +
             "}\n\n" +
             "provider \"" + provider + '" {\n' +
             '  region = "' + (isGCP ? "us-central1" : "us-east-1") + '"\n' +
             "}\n\n" +
             "# -------------------------------------------------------------------------\n" +
             "# Variables & Locals\n" +
             "# -------------------------------------------------------------------------\n" +
             "variable \"environment\" {\n" +
             '  type    = string\n' +
             '  default = "production"\n' +
             "}\n\n";

  nodes.forEach(node => {
    const id = node.id;
    const name = (node.data.name || id).toLowerCase().replace(/[^a-z0-9]/g, '_');
    const type = node.data.type;
    const tech = node.data.technology || "";
    
    code += "\n# --- Resource: " + node.data.name + " (" + tech + ") ---\n";
    
    if (type === 'client') {
      if (isGCP) {
        code += 'resource "google_storage_bucket" "' + name + '_bucket" {\n' +
                '  name          = "archon-${var.environment}-' + name + '-assets"\n' +
                '  location      = "US"\n' +
                '  force_destroy = true\n' +
                '  website {\n' +
                '    main_page_suffix = "index.html"\n' +
                '    not_found_page   = "404.html"\n' +
                '  }\n' +
                '}\n\n' +
                'resource "google_compute_backend_bucket" "' + name + '_cdn_backend" {\n' +
                '  name        = "' + name + '-backend"\n' +
                '  bucket_name = google_storage_bucket.' + name + '_bucket.name\n' +
                '  enable_cdn  = true\n' +
                '}\n';
      } else {
        code += 'resource "aws_s3_bucket" "' + name + '_bucket" {\n' +
                '  bucket        = "archon-${var.environment}-' + name + '-assets"\n' +
                '  force_destroy = true\n' +
                '}\n\n' +
                'resource "aws_cloudfront_distribution" "' + name + '_cdn" {\n' +
                '  origin {\n' +
                '    domain_name = aws_s3_bucket.' + name + '_bucket.bucket_regional_domain_name\n' +
                '    origin_id   = "S3-' + name + '"\n' +
                '  }\n' +
                '  enabled             = true\n' +
                '  default_root_object = "index.html"\n' +
                '  default_cache_behavior {\n' +
                '    allowed_methods  = ["GET", "HEAD"]\n' +
                '    cached_methods   = ["GET", "HEAD"]\n' +
                '    target_origin_id = "S3-' + name + '"\n' +
                '    viewer_protocol_policy = "redirect-to-https"\n' +
                '  }\n' +
                '  viewer_certificate {\n' +
                '    cloudfront_default_certificate = true\n' +
                '  }\n' +
                '}\n';
      }
    } else if (type === 'gateway') {
      if (isGCP) {
        code += 'resource "google_apikeys_key" "' + name + '_key" {\n' +
                '  name         = "' + name + '-api-key"\n' +
                '  display_name = "' + node.data.name + ' Key"\n' +
                '}\n\n' +
                'resource "google_compute_global_forwarding_rule" "' + name + '_lb" {\n' +
                '  name       = "' + name + '-load-balancer"\n' +
                '  target     = "https-proxy"\n' +
                '  port_range = "443"\n' +
                '}\n';
      } else {
        code += 'resource "aws_apigatewayv2_api" "' + name + '_api" {\n' +
                '  name          = "archon-' + name + '-gateway"\n' +
                '  protocol_type = "HTTP"\n' +
                '  cors_configuration {\n' +
                '    allow_origins = ["*"]\n' +
                '    allow_methods = ["GET", "POST", "PUT", "DELETE"]\n' +
                '    allow_headers = ["content-type", "authorization"]\n' +
                '  }\n' +
                '}\n\n' +
                'resource "aws_apigatewayv2_stage" "' + name + '_stage" {\n' +
                '  api_id      = aws_apigatewayv2_api.' + name + '_api.id\n' +
                '  name        = var.environment\n' +
                '  auto_deploy = true\n' +
                '}\n';
      }
    } else if (type === 'service') {
      const isWorker = name.includes('worker') || name.includes('async');
      const containerCpu = scaleFactor === 0 ? "256" : scaleFactor === 1 ? "512" : "1024";
      const containerMem = scaleFactor === 0 ? "512" : scaleFactor === 1 ? "1024" : "2048";
      const minReplicas = scaleFactor === 0 ? 1 : scaleFactor === 1 ? 2 : scaleFactor === 2 ? 4 : 8;
      const maxReplicas = scaleFactor === 0 ? 2 : scaleFactor === 1 ? 5 : scaleFactor === 2 ? 10 : 30;

      if (isGCP) {
        code += 'resource "google_cloud_run_v2_service" "' + name + '_service" {\n' +
                '  name     = "archon-' + name + '-service"\n' +
                '  location = "us-central1"\n' +
                '  template {\n' +
                '    containers {\n' +
                '      image = "gcr.io/archon-prod/' + name + ':latest"\n' +
                '      resources {\n' +
                '        limits = {\n' +
                '          cpu    = "' + (scaleFactor <= 1 ? "1" : "2") + '"\n' +
                '          memory = "' + (scaleFactor <= 1 ? "1Gi" : "2Gi") + '"\n' +
                '        }\n' +
                '      }\n' +
                '    }\n' +
                '    scaling {\n' +
                '      min_instance_count = ' + minReplicas + '\n' +
                '      max_instance_count = ' + maxReplicas + '\n' +
                '    }\n' +
                '  }\n' +
                '}\n';
      } else {
        code += 'resource "aws_ecs_task_definition" "' + name + '_task" {\n' +
                '  family                   = "archon-' + name + '"\n' +
                '  network_mode             = "awsvpc"\n' +
                '  requires_compatibilities = ["FARGATE"]\n' +
                '  cpu                      = "' + containerCpu + '"\n' +
                '  memory                   = "' + containerMem + '"\n' +
                '  container_definitions = jsonencode([{\n' +
                '    name      = "' + name + '"\n' +
                '    image     = "123456789012.dkr.ecr.us-east-1.amazonaws.com/archon-' + name + ':latest"\n' +
                '    essential = true\n' +
                '    portMappings = [{\n' +
                '      containerPort = ' + (isWorker ? 8080 : 8000) + '\n' +
                '      hostPort      = ' + (isWorker ? 8080 : 8000) + '\n' +
                '    }]\n' +
                '  }])\n' +
                '}\n\n' +
                'resource "aws_ecs_service" "' + name + '_service" {\n' +
                '  name            = "archon-' + name + '"\n' +
                '  cluster         = "archon-main-cluster"\n' +
                '  task_definition = aws_ecs_task_definition.' + name + '_task.arn\n' +
                '  desired_count   = ' + minReplicas + '\n' +
                '  launch_type     = "FARGATE"\n' +
                '  network_configuration {\n' +
                '    subnets          = ["subnet-123456", "subnet-789012"]\n' +
                '    assign_public_ip = false\n' +
                '  }\n' +
                '}\n';
      }
    } else if (type === 'database') {
      const isPostgres = tech.toLowerCase().includes('postgre') || tech.toLowerCase().includes('aurora');
      const pgInstanceClass = scaleFactor === 0 ? "db.t3.micro" : scaleFactor === 1 ? "db.t3.medium" : scaleFactor === 2 ? "db.r6g.xlarge" : "db.r6g.4xlarge";
      const storageSize = scaleFactor === 0 ? 20 : scaleFactor === 1 ? 100 : scaleFactor === 2 ? 500 : 2000;

      if (isGCP) {
        if (isPostgres) {
          code += 'resource "google_sql_database_instance" "' + name + '_db" {\n' +
                  '  name             = "archon-' + name + '-instance"\n' +
                  '  database_version = "POSTGRES_15"\n' +
                  '  region           = "us-central1"\n' +
                  '  settings {\n' +
                  '    tier = "' + (scaleFactor === 0 ? "db-f1-micro" : scaleFactor === 1 ? "db-custom-2-7680" : "db-custom-8-30720") + '"\n' +
                  '    disk_size = ' + storageSize + '\n' +
                  '    ip_configuration {\n' +
                  '      ipv4_enabled    = false\n' +
                  '      private_network = "projects/archon-gcp/global/networks/vpc-main"\n' +
                  '    }\n' +
                  '  }\n' +
                  '}\n';
        } else {
          code += 'resource "google_firestore_database" "' + name + '_db" {\n' +
                  '  name                    = "archon-' + name + '-nosql"\n' +
                  '  location_id             = "nam5"\n' +
                  '  type                    = "FIRESTORE_NATIVE"\n' +
                  '  concurrency_mode        = "OPTIMISTIC"\n' +
                  '}\n';
        }
      } else {
        if (isPostgres) {
          if (scaleFactor <= 1) {
            code += 'resource "aws_db_instance" "' + name + '_db" {\n' +
                    '  allocated_storage    = ' + storageSize + '\n' +
                    '  db_name              = "archon_' + name + '"\n' +
                    '  engine               = "postgres"\n' +
                    '  engine_version       = "15.4"\n' +
                    '  instance_class       = "' + pgInstanceClass + '"\n' +
                    '  username             = "archon_admin"\n' +
                    '  password             = "super_secure_vault_password"\n' +
                    '  skip_final_snapshot  = true\n' +
                    '}\n';
          } else {
            code += 'resource "aws_rds_cluster" "' + name + '_cluster" {\n' +
                    '  cluster_identifier      = "archon-' + name + '-cluster"\n' +
                    '  engine                  = "aurora-postgresql"\n' +
                    '  engine_version          = "15.4"\n' +
                    '  database_name           = "archon_' + name + '"\n' +
                    '  master_username         = "archon_admin"\n' +
                    '  master_password         = "super_secure_vault_password"\n' +
                    '  backup_retention_period = 14\n' +
                    '  preferred_backup_window = "02:00-03:00"\n' +
                    '}\n\n' +
                    'resource "aws_rds_cluster_instance" "' + name + '_instances" {\n' +
                    '  count              = ' + (scaleFactor === 2 ? 2 : 4) + '\n' +
                    '  identifier         = "archon-' + name + '-${count.index}"\n' +
                    '  cluster_identifier = aws_rds_cluster.' + name + '_cluster.id\n' +
                    '  instance_class     = "' + pgInstanceClass + '"\n' +
                    '  engine             = aws_rds_cluster.' + name + '_cluster.engine\n' +
                    '  engine_version     = aws_rds_cluster.' + name + '_cluster.engine_version\n' +
                    '}\n';
          }
        } else {
          code += 'resource "aws_dynamodb_table" "' + name + '_table" {\n' +
                  '  name           = "archon_' + name + '_table"\n' +
                  '  billing_mode   = "' + (scaleFactor >= 2 ? "PAY_PER_REQUEST" : "PROVISIONED") + '"\n' +
                  (scaleFactor < 2 ? '  read_capacity  = 20\n  write_capacity = 20\n' : '') +
                  '  hash_key       = "id"\n' +
                  '  attribute {\n' +
                  '    name = "id"\n' +
                  '    type = "S"\n' +
                  '  }\n' +
                  '}\n';
        }
      }
    } else if (type === 'cache') {
      const cacheNodeSize = scaleFactor === 0 ? "cache.t3.micro" : scaleFactor === 1 ? "cache.t3.medium" : "cache.r6g.large";

      if (isGCP) {
        code += 'resource "google_redis_instance" "' + name + '_redis" {\n' +
                '  name           = "archon-' + name + '-cache"\n' +
                '  tier           = "' + (scaleFactor >= 2 ? "STANDARD_HA" : "BASIC") + '"\n' +
                '  memory_size_gb = ' + (scaleFactor === 0 ? 1 : scaleFactor === 1 ? 5 : 16) + '\n' +
                '  region         = "us-central1"\n' +
                '}\n';
      } else {
        code += 'resource "aws_elasticache_cluster" "' + name + '_cache" {\n' +
                '  cluster_id           = "archon-' + name + '-cache"\n' +
                '  engine               = "redis"\n' +
                '  node_type            = "' + cacheNodeSize + '"\n' +
                '  num_cache_nodes      = 1\n' +
                '  parameter_group_name = "default.redis7"\n' +
                '  port                 = 6379\n' +
                '}\n';
      }
    } else if (type === 'queue') {
      const isKafka = tech.toLowerCase().includes('kafka') || tech.toLowerCase().includes('msk');
      
      if (isGCP) {
        code += 'resource "google_pubsub_topic" "' + name + '_topic" {\n' +
                '  name = "archon-' + name + '-events"\n' +
                '}\n\n' +
                'resource "google_pubsub_subscription" "' + name + '_sub" {\n' +
                '  name  = "archon-' + name + '-worker-sub"\n' +
                '  topic = google_pubsub_topic.' + name + '_topic.name\n' +
                '  ack_deadline_seconds = 20\n' +
                '}\n';
      } else {
        if (isKafka) {
          code += 'resource "aws_msk_cluster" "' + name + '_msk" {\n' +
                  '  cluster_name           = "archon-' + name + '-kafka"\n' +
                  '  kafka_version          = "3.2.0"\n' +
                  '  number_of_broker_nodes = ' + (scaleFactor >= 2 ? 3 : 2) + '\n' +
                  '  broker_node_group_info {\n' +
                  '    instance_type   = "kafka.t3.small"\n' +
                  '    client_subnets = ["subnet-123456", "subnet-789012"]\n' +
                  '    security_groups = ["sg-123456"]\n' +
                  '  }\n' +
                  '}\n';
        } else {
          code += 'resource "aws_sqs_queue" "' + name + '_queue" {\n' +
                  '  name                      = "archon-' + name + '-queue"\n' +
                  '  delay_seconds             = 0\n' +
                  '  max_message_size          = 262144\n' +
                  '  message_retention_seconds = 86400\n' +
                  '  visibility_timeout_seconds = 30\n' +
                  '}\n';
        }
      }
    }
  });

  return code;
};

function StudioContent() {
  const { projectId } = useParams() as { projectId: string };
  const router = useRouter();
  
  const {
    currentProject,
    currentVersion,
    nodes: storeNodes,
    edges: storeEdges,
    decisions,
    reviews,
    fetchProjectDetails,
    fetchDecisions,
    fetchReviews,
    requestReview,
    sendStudioChatMessage,
    exportToGitHub,
    setNodes,
    setEdges,
    saveNewVersion,
    scaleFactor,
    setScaleFactor,
    selectedNodeId,
    setSelectedNodeId,
    past,
    future,
    undo,
    redo,
    takeSnapshot,
    updateProject,
    regenerateProjectArchitecture,
    uploadProjectSpec,
    token,
    user,
    logout,
    theme,
    toggleTheme
  } = useStore();

  const formatINR = useCallback((val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  }, []);

  // Auth check
  useEffect(() => {
    const localToken = typeof window !== 'undefined' ? localStorage.getItem('archon_token') : null;
    if (!localToken && !token) {
      router.push('/login');
    }
  }, [token, router]);

  // Component local states
  const [nodes, setNodesState, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdgesState, onEdgesChange] = useEdgesState<Edge>([]);
  const [activeTab, setActiveTab] = useState<'inspector' | 'explorer' | 'reviews' | 'versions'>('inspector');
  const [codeMode, setCodeMode] = useState<'mermaid' | 'terraform'>('mermaid');
  const [githubRepo, setGithubRepo] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [prUrl, setPrUrl] = useState('');
  const [githubExportError, setGithubExportError] = useState('');

  // Project requirements local settings form states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [settingsName, setSettingsName] = useState('');
  const [settingsDesc, setSettingsDesc] = useState('');
  const [settingsIndustry, setSettingsIndustry] = useState('SaaS');
  const [settingsCloud, setSettingsCloud] = useState('AWS');
  const [settingsScale, setSettingsScale] = useState('100k');
  const [settingsBudget, setSettingsBudget] = useState('Medium');

  useEffect(() => {
    if (currentProject) {
      setSettingsName(currentProject.name || '');
      setSettingsDesc(currentProject.description || '');
      setSettingsIndustry(currentProject.industry || 'SaaS');
      setSettingsCloud(currentProject.preferred_cloud || 'AWS');
      setSettingsScale(currentProject.scale || '100k');
      setSettingsBudget(currentProject.budget || 'Medium');
    }
  }, [currentProject]);

  // Keyboard shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.getAttribute('contenteditable') === 'true'
      );
      if (isTyping) return;

      const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key?.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (modifier && e.key?.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setGithubRepo(localStorage.getItem('archon_github_repo') || '');
      setGithubToken(localStorage.getItem('archon_github_token') || '');
    }
  }, []);

  const [aiInput, setAiInput] = useState('');
  const [aiChat, setAiChat] = useState<{ role: 'user' | 'archon'; content: string }[]>([
    { role: 'archon', content: "Welcome to the studio AI console. You can ask me questions about this architecture (e.g. 'Why Redis?', 'How does it scale?') or ask me to modify it." }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [commitMsg, setCommitMsg] = useState('');

  // Sync React Flow nodes & edges with Zustand store
  useEffect(() => {
    setNodesState(storeNodes);
  }, [storeNodes, setNodesState]);

  useEffect(() => {
    setEdgesState(storeEdges);
  }, [storeEdges, setEdgesState]);

  // Load project details
  useEffect(() => {
    if (projectId) {
      fetchProjectDetails(projectId);
      fetchDecisions(projectId);
      fetchReviews(projectId);
    }
  }, [projectId, fetchProjectDetails, fetchDecisions, fetchReviews]);

  // Handle Node Select
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setActiveTab('inspector');
  }, [setSelectedNodeId]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const onNodeDragStart = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);

  const onNodeDragStop = useCallback(() => {
    setNodes(nodes);
  }, [nodes, setNodes]);

  // Selected Component helper
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodes.find(n => n.id === selectedNodeId);
  }, [selectedNodeId, nodes]);

  // Local states for editing the selected node's details
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedTech, setEditedTech] = useState('');
  const [editedCost, setEditedCost] = useState(0);
  const [editedResp, setEditedResp] = useState('');
  const [editedSecurity, setEditedSecurity] = useState('');
  const [editedScaling, setEditedScaling] = useState('');

  // Sync editing fields when selected node changes
  useEffect(() => {
    if (selectedNode) {
      const data = selectedNode.data as any;
      setEditedName(data.name || '');
      setEditedTech(data.technology || '');
      setEditedCost(data.cost || 0);
      setEditedResp(data.responsibilities || '');
      setEditedSecurity(data.security_notes || '');
      setEditedScaling(data.scaling_notes || '');
    }
    setIsEditing(false);
  }, [selectedNodeId, selectedNode]);

  // Auto-fill security & scaling notes when technology changes
  const handleTechChange = useCallback((tech: string) => {
    setEditedTech(tech);
    const t = tech.toLowerCase();

    // Payment gateways
    if (t.includes('stripe')) {
      setEditedSecurity('PCI-DSS Level 1 certified. All card data tokenized via Stripe Vault. Webhook signature verification enforced.');
      setEditedScaling('Stripe handles horizontal scaling automatically. Use Stripe Connect for multi-party payouts.');
    } else if (t.includes('razorpay')) {
      setEditedSecurity('PCI-DSS compliance via Razorpay. API key rotation every 90 days. Webhook HMAC signature validation.');
      setEditedScaling('Automatic scaling with Razorpay Gateway. Route high-volume transactions through Razorpay Smart Routing.');
    } else if (t.includes('paypal')) {
      setEditedSecurity('PayPal Buyer Protection and Seller Protection enforced. OAuth 2.0 token-based API access.');
      setEditedScaling('PayPal auto-scales. Use PayPal Commerce Platform for marketplace splits.');

    // Caching
    } else if (t.includes('redis')) {
      setEditedSecurity('Access restricted to private VPC subnet. AUTH password + TLS-in-transit enforced.');
      setEditedScaling('Read scaling through replica nodes. Cluster mode for horizontal sharding.');
    } else if (t.includes('memcached')) {
      setEditedSecurity('Network-level isolation. No authentication natively — enforce VPC-only access.');
      setEditedScaling('Horizontal scaling via consistent hashing across multiple Memcached nodes.');

    // Databases
    } else if (t.includes('postgres') || t.includes('postgresql') || t.includes('aurora')) {
      setEditedSecurity('TLS connection enforced. Role-based access with least-privilege grants. Automated daily snapshots.');
      setEditedScaling('Multi-AZ read replicas. PgBouncer connection pooling for high concurrency.');
    } else if (t.includes('mongodb')) {
      setEditedSecurity('TLS encryption in transit and at rest. SCRAM-SHA-256 authentication. Field-level encryption for PII.');
      setEditedScaling('Horizontal sharding across replica sets. Atlas auto-scales storage and compute.');
    } else if (t.includes('dynamodb')) {
      setEditedSecurity('IAM role-based access. Encryption at rest via AWS KMS. VPC endpoint access only.');
      setEditedScaling('On-demand auto-scaling mode. Global tables for multi-region active-active replication.');
    } else if (t.includes('mysql')) {
      setEditedSecurity('TLS connections enforced. Password rotation via Secrets Manager. Encrypted EBS volumes.');
      setEditedScaling('Read replicas for read-heavy workloads. ProxySQL for connection pooling.');

    // Message queues
    } else if (t.includes('kafka')) {
      setEditedSecurity('TLS + SASL authentication. ACL-based topic authorization. Encrypted storage volumes.');
      setEditedScaling('Horizontal scaling via partition increases. Consumer group rebalancing for throughput.');
    } else if (t.includes('rabbitmq')) {
      setEditedSecurity('VPC-isolated endpoints. TLS on all connections. User-level permission bindings per queue.');
      setEditedScaling('Scales through additional topics and queue partitions. Quorum queues for high availability.');
    } else if (t.includes('sqs') || t.includes('pubsub')) {
      setEditedSecurity('IAM policy-scoped access. Server-side encryption (SSE-SQS or SSE-KMS). Dead letter queues for poison messages.');
      setEditedScaling('Serverless auto-scaling. FIFO queues for ordered processing. Visibility timeout tuning for retry control.');

    // API Gateways
    } else if (t.includes('kong') || t.includes('nginx')) {
      setEditedSecurity('Rate limiting, IP allowlisting, JWT validation plugins enabled. mTLS for upstream services.');
      setEditedScaling('Horizontal scaling via load balancer. Kong declarative config enables zero-downtime deploys.');
    } else if (t.includes('api gateway') || t.includes('apigee')) {
      setEditedSecurity('API rate-limiting enabled at gateway level. Validates JWT signatures. WAF rules applied.');
      setEditedScaling('Autoscaling group triggered on network packet limits. Regional deployment for low latency.');

    // Compute / runtimes
    } else if (t.includes('fastapi') || t.includes('python')) {
      setEditedSecurity('Input validation via Pydantic models. JWT authentication middleware. SQL injection prevention via ORM.');
      setEditedScaling('Horizontal scaling via Kubernetes HPA. Async workers via Uvicorn + Gunicorn.');
    } else if (t.includes('node') || t.includes('express')) {
      setEditedSecurity('Helmet.js security headers. JWT auth via jsonwebtoken. Rate limiting via express-rate-limit.');
      setEditedScaling('Cluster mode for multi-core utilization. Horizontal scaling via PM2 or Kubernetes.');
    } else if (t.includes('go') || t.includes('golang')) {
      setEditedSecurity('Static binary with minimal attack surface. Built-in crypto/tls. Input sanitization via validator package.');
      setEditedScaling('Goroutine-based concurrency. Scales efficiently with low memory overhead per connection.');
    }
    // If no match, leave existing notes untouched
  }, []);

  // Handler to delete the currently selected node
  const handleDeleteNode = useCallback(() => {
    if (!selectedNodeId) return;
    takeSnapshot();
    const updatedNodes = nodes.filter((n: any) => n.id !== selectedNodeId);
    const updatedEdges = edges.filter((e: any) => e.source !== selectedNodeId && e.target !== selectedNodeId);
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    setSelectedNodeId(null);
    setIsEditing(false);
  }, [selectedNodeId, nodes, edges, setNodes, setEdges, setSelectedNodeId, takeSnapshot]);

  // Handler to save updated node details back to Zustand store
  const handleSaveDetails = useCallback(() => {
    if (!selectedNodeId) return;
    takeSnapshot();
    const updatedNodes = nodes.map((n: any) => {
      if (n.id === selectedNodeId) {
        return {
          ...n,
          data: {
            ...n.data,
            name: editedName,
            technology: editedTech,
            cost: editedCost,
            responsibilities: editedResp,
            security_notes: editedSecurity,
            scaling_notes: editedScaling
          }
        };
      }
      return n;
    });
    setNodes(updatedNodes);
    setIsEditing(false);
  }, [
    selectedNodeId,
    nodes,
    editedName,
    editedTech,
    editedCost,
    editedResp,
    editedSecurity,
    editedScaling,
    setNodes,
    takeSnapshot
  ]);

  // Dynamic Architectural Scoring Engine & Bottleneck Alert Rules
  const architectInsights = useMemo(() => {
    // 1. Identify present components
    const hasGateway = nodes.some(n => {
      const d = n.data as any;
      const type = (d?.type || '').toLowerCase();
      const tech = (d?.technology || '').toLowerCase();
      const name = (d?.name || '').toLowerCase();
      return type === 'gateway' || tech.includes('gateway') || name.includes('gateway');
    });

    const hasCache = nodes.some(n => {
      const d = n.data as any;
      const type = (d?.type || '').toLowerCase();
      const tech = (d?.technology || '').toLowerCase();
      const name = (d?.name || '').toLowerCase();
      return type === 'cache' || tech.includes('redis') || tech.includes('memcached') || name.includes('cache') || name.includes('redis');
    });

    const hasQueue = nodes.some(n => {
      const d = n.data as any;
      const type = (d?.type || '').toLowerCase();
      const tech = (d?.technology || '').toLowerCase();
      const name = (d?.name || '').toLowerCase();
      return type === 'queue' || tech.includes('queue') || tech.includes('broker') || tech.includes('rabbitmq') || tech.includes('kafka') || tech.includes('sqs') || tech.includes('pubsub') || name.includes('queue') || name.includes('broker') || name.includes('rabbitmq') || name.includes('kafka');
    });

    const hasDbReplica = nodes.some(n => {
      const d = n.data as any;
      const type = (d?.type || '').toLowerCase();
      const scaleNotes = (d?.scaling_notes || '').toLowerCase();
      return type === 'database' && (
        scaleNotes.includes('replica') || 
        scaleNotes.includes('cluster') || 
        scaleNotes.includes('shard') || 
        scaleNotes.includes('read') || 
        scaleNotes.includes('multi-az') ||
        scaleNotes.includes('replicated')
      );
    });

    // 2. Base scores
    let security = 96;
    let scalability = 95;
    let reliability = 98;
    let performance = 94;

    const alerts: { level: 'error' | 'warning'; title: string; desc: string }[] = [];

    // Scale label mapping for helper messages
    const scaleLabels = ["10,000 Users", "1 Lakh Users", "10 Lakh Users (1M)", "1 Crore Users (10M)"];
    const scaleText = scaleLabels[scaleFactor] || "Current scale";

    // --- SECURITY SCORE RULES ---
    if (!hasGateway) {
      security -= 18;
      alerts.push({
        level: 'error',
        title: 'Missing API Gateway Edge',
        desc: 'Clients query core services directly. Exposes internal API workers to credentials injection and potential DDoS vulnerabilities.'
      });
    }

    // --- SCALABILITY SCORE RULES ---
    if (scaleFactor >= 1) { // 100k users
      if (!hasCache) {
        scalability -= 10;
        alerts.push({
          level: 'warning',
          title: 'Direct Database Reads',
          desc: `At ${scaleText}, frequently requested static items (e.g. product catalogs) should be cached. Introduce Redis to prevent database CPU exhaustion.`
        });
      }
    }
    if (scaleFactor >= 2) { // 1M users
      if (!hasCache) scalability -= 12; // Extra penalty
      if (!hasQueue) {
        scalability -= 15;
        alerts.push({
          level: 'error',
          title: 'Synchronous System Coupling',
          desc: `At ${scaleText}, heavy downstream processes (e.g., checkout notifications, dispatches) block client cycles. Introduce a Message Broker (RabbitMQ/SQS) to process tasks asynchronously.`
        });
      }
    }
    if (scaleFactor >= 3) { // 10M users
      if (!hasCache) scalability -= 15;
      if (!hasQueue) scalability -= 20;
      if (!hasDbReplica) {
        scalability -= 15;
        alerts.push({
          level: 'error',
          title: 'Database Read Bottleneck',
          desc: `PostgreSQL/DB is a bottleneck under 10M concurrent transactions. Configure multi-AZ read replicas or database sharding immediately.`
        });
      }
    }

    // --- RELIABILITY SCORE RULES ---
    if (scaleFactor >= 2 && !hasDbReplica) {
      reliability -= 15;
      if (!alerts.some(a => a.title === 'Database Read Bottleneck')) {
        alerts.push({
          level: 'warning',
          title: 'Single DB Failure Risk',
          desc: 'Primary database has no active failover or replica configurations. Any failure will result in complete service downtime.'
        });
      }
    }
    if (scaleFactor >= 3 && !hasQueue) {
      reliability -= 12;
    }

    // --- PERFORMANCE SCORE RULES ---
    if (!hasCache) {
      performance -= 18;
    }
    if (scaleFactor >= 2 && !hasGateway) {
      performance -= 10;
    }
    if (scaleFactor >= 3 && !hasCache) {
      performance -= 12; // Double penalty at 10M users
    }

    // Bound scores between 30 and 100
    return {
      security: Math.max(30, Math.min(100, security)),
      scalability: Math.max(30, Math.min(100, scalability)),
      reliability: Math.max(30, Math.min(100, reliability)),
      performance: Math.max(30, Math.min(100, performance)),
      alerts
    };
  }, [nodes, scaleFactor]);

  // Dynamic Component-Specific "Why?" Rationale Engine
  const rationaleData = useMemo(() => {
    if (!selectedNode) return null;
    const nodeData = selectedNode.data as any;
    const type = (nodeData.type || '').toLowerCase();
    const tech = (nodeData.technology || '').toLowerCase();
    const name = (nodeData.name || '').toLowerCase();
    
    const scaleLabels = ["10,000 Users", "1 Lakh Users", "10 Lakh Users (1M)", "1 Crore Users (10M)"];
    const scaleText = scaleLabels[scaleFactor] || "Current scale";

    // Cache/Redis
    if (type === 'cache' || tech.includes('redis') || name.includes('cache') || name.includes('redis')) {
      return {
        title: `Why ${nodeData.technology || 'Redis'}?`,
        reasons: [
          `Caching database reads at the ${scaleText} traffic target is critical.`,
          "Product catalog queries are read frequently and don't change by the second.",
          "Caching reduces core database disk load by up to 80%."
        ],
        latencyPenalty: "+230 ms latency increase on read paths.",
        loadPenalty: "+65% database CPU & disk IOPS spike."
      };
    }

    // Gateway
    if (type === 'gateway' || tech.includes('gateway') || name.includes('gateway') || tech.includes('nginx')) {
      return {
        title: `Why ${nodeData.technology || 'API Gateway'}?`,
        reasons: [
          "Terminates SSL/TLS certificates and decrypts requests at the edge.",
          "Prevents DDoS amplification attacks by rate-limiting client connections.",
          "Orchestrates routes, redirecting client queries to containerized backend workers."
        ],
        latencyPenalty: "Security compromise. Direct service exposure risks server hijacking.",
        loadPenalty: "API workers handle raw TCP handshake overhead directly, reducing throughput."
      };
    }

    // Queue/Message Broker
    if (type === 'queue' || tech.includes('queue') || tech.includes('broker') || tech.includes('rabbitmq') || tech.includes('kafka') || tech.includes('sqs') || name.includes('queue') || name.includes('broker') || name.includes('rabbitmq') || name.includes('kafka')) {
      return {
        title: `Why ${nodeData.technology || 'Message Broker'}?`,
        reasons: [
          `Decouples synchronous client cycles from heavy background worker jobs at the ${scaleText} scale.`,
          "Absorbs traffic bursts (e.g. flash sales checkout tasks) without failing request threads.",
          "Guarantees message delivery retry policies when workers scale or crash."
        ],
        latencyPenalty: "Response times surge by +520 ms as write tasks execute synchronously.",
        loadPenalty: "Critical database row-locking timeouts under highly concurrent write threads."
      };
    }

    // Database
    if (type === 'database' || tech.includes('postgres') || tech.includes('mongodb') || tech.includes('mysql') || tech.includes('dynamodb') || name.includes('database') || name.includes('db')) {
      const isPostgres = tech.includes('postgres');
      return {
        title: `Why ${nodeData.technology || 'Database'}?`,
        reasons: [
          isPostgres 
            ? "Serves as the ACID-compliant relational system of truth for transactional data integrity." 
            : "Acts as the horizontally scalable schema-less persistence engine for flexible document objects.",
          "Structured to process multi-indexed, high-throughput record queries.",
          scaleFactor >= 2 
            ? `Running replica endpoints to distribute read workloads and satisfy the active ${scaleText} volume.`
            : "Configured as a standalone instance within a private VPC subnet to satisfy budget boundaries."
        ],
        latencyPenalty: "System failure. Lack of stable state storage terminates all operations.",
        loadPenalty: "Total transactional block. Writing directly to local filesystem is not scalable."
      };
    }

    // Core Service / Backend
    if (type === 'service' || tech.includes('node') || tech.includes('python') || tech.includes('go') || tech.includes('fastapi') || name.includes('service') || name.includes('backend') || name.includes('api')) {
      return {
        title: `Why ${nodeData.technology || 'Core Service'}?`,
        reasons: [
          "Hosts the domain business logic, access controls, and validation rules.",
          "Designed to scale horizontally as independent container instances.",
          "Utilizes non-blocking execution layers to optimize API loop responsiveness."
        ],
        latencyPenalty: "+350 ms timeout delays due to missing execution resources.",
        loadPenalty: "100% gateway 504 errors as incoming calls fail to resolve."
      };
    }

    // Default fallback for any other component
    return {
      title: `Why ${nodeData.technology || nodeData.name}?`,
      reasons: [
        "Provides isolation and decoupling of system functionalities.",
        "Optimized for the active budget and scale boundaries.",
        "Satisfies standard distributed architecture decoupling conventions."
      ],
      latencyPenalty: "Degraded performance and potential layout bottlenecks.",
      loadPenalty: "Increased resource contention on adjacent components."
    };
  }, [selectedNode, scaleFactor]);

  // Scalability Simulator Slider Action
  // Updates costs, labels, and specs reactively!
  const handleScaleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setScaleFactor(val);
    
    // Scale labels mapping
    const scales = ["10,000 Users", "1 Lakh Users", "10 Lakh Users", "1 Crore Users"];
    
    // Update nodes in the canvas store with scaled cost, tech, and notes
    const updatedNodes = nodes.map(node => {
      const baseCost = node.data.cost as number || 0;
      const type = node.data.type as string;
      
      let multiplier = 1;
      let suffix = "";
      let newTech = node.data.technology as string;
      let newScaling = node.data.scaling_notes as string;

      if (val === 0) { // 10k
        multiplier = 0.4;
        suffix = " (Small Instance)";
        if (type === 'database') {
          newTech = "Single RDS SQLite / PostgreSQL";
          newScaling = "Single node database. No sharding required at this scale.";
        }
      } else if (val === 1) { // 100k (default)
        multiplier = 1.0;
        suffix = "";
        if (type === 'database') {
          newTech = "RDS PostgreSQL (Master)";
          newScaling = "Master instance. Read replication ready.";
        }
      } else if (val === 2) { // 1M
        multiplier = 2.5;
        suffix = " (Clustered)";
        if (type === 'database') {
          newTech = "Aurora PostgreSQL (Multi-AZ)";
          newScaling = "Multi-AZ Master-Replica clustered setup. Read-scaling active.";
        }
      } else if (val === 3) { // 10M
        multiplier = 6.0;
        suffix = " (Distributed & Sharded)";
        if (type === 'database') {
          newTech = "Aurora PG + CockroachDB Core";
          newScaling = "Distributed active-active database cluster. Multi-region sharding active.";
        }
      }

      return {
        ...node,
        data: {
          ...node.data,
          technology: newTech + (val > 1 && !newTech.includes("Aurora") ? " Cluster" : ""),
          cost: baseCost * multiplier,
          scaling_notes: newScaling
        }
      };
    });

    // Update Zustand state
    setNodes(updatedNodes);
  };

  const currentScaleLabel = useMemo(() => {
    const labels = ["10,000 Users", "1 Lakh Users", "10 Lakh Users", "1 Crore Users"];
    return labels[scaleFactor];
  }, [scaleFactor]);

  // AI Chat helper
  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userMsg = aiInput;
    setAiChat(prev => [...prev, { role: 'user', content: userMsg }]);
    setAiInput('');
    setIsAiLoading(true);

    try {
      const res = await sendStudioChatMessage(projectId, userMsg);
      setAiChat(prev => [...prev, { role: 'archon', content: res.reply }]);
    } catch (err) {
      setAiChat(prev => [...prev, { role: 'archon', content: "Sorry, I had trouble sending that command to the architect server. Please check that the backend is running." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Save changes/Commit version
  const handleSaveCommit = () => {
    if (!commitMsg.trim()) return;
    saveNewVersion(projectId, commitMsg);
    setCommitMsg('');
    setIsCommitModalOpen(false);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsName.trim()) return;

    setIsRegenerating(true);
    try {
      await updateProject(projectId, {
        name: settingsName,
        description: settingsDesc,
        industry: settingsIndustry,
        preferred_cloud: settingsCloud,
        scale: settingsScale,
        budget: settingsBudget
      });

      await regenerateProjectArchitecture(projectId);
      setIsSettingsOpen(false);
    } catch (err) {
      console.error(err);
      alert("Error saving settings & regenerating architecture.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds the 10MB limit.");
      return;
    }

    setIsRegenerating(true);
    try {
      await uploadProjectSpec(projectId, file);
      alert(`Successfully ingested design spec file "${file.name}"! The consensus agents have generated an updated version of your architecture.`);
    } catch (err) {
      console.error(err);
      alert("Error ingesting design specification. Please verify file format and try again.");
    } finally {
      setIsRegenerating(false);
      e.target.value = '';
    }
  };

  // Export to GitHub
  const handleExportToGitHub = async () => {
    if (!githubRepo || !githubToken) return;

    const repoTrimmed = githubRepo.trim();
    if (repoTrimmed.includes('@') || !repoTrimmed.includes('/') || repoTrimmed.split('/').length !== 2) {
      setGithubExportError("Invalid Repository format. Please use 'owner/repository-name' (e.g. 'myusername/archon-infra'), not an email address.");
      return;
    }

    setIsExporting(true);
    setPrUrl('');
    setGithubExportError('');

    if (typeof window !== 'undefined') {
      localStorage.setItem('archon_github_repo', githubRepo);
      localStorage.setItem('archon_github_token', githubToken);
    }

    try {
      const url = await exportToGitHub(
        projectId,
        githubRepo,
        githubToken,
        terraformCode,
        mermaidCode,
        `Update via Archon Studio for project ${currentProject?.name || 'Architecture'}`
      );
      setPrUrl(url);
    } catch (err: any) {
      setGithubExportError(err.message || 'An error occurred during export');
    } finally {
      setIsExporting(false);
    }
  };

  // Export Mermaid Code
  const mermaidCode = useMemo(() => {
    let code = "graph TD\n";
    nodes.forEach(n => {
      code += `  ${n.id}["${n.data.name} (${n.data.technology})"]\n`;
    });
    edges.forEach(e => {
      code += `  ${e.source} -->|${e.label || ''}| ${e.target}\n`;
    });
    return code;
  }, [nodes, edges]);

  // Export Terraform Code
  const terraformCode = useMemo(() => {
    return generateTerraformCode(nodes, edges, currentProject?.preferred_cloud || 'aws', scaleFactor);
  }, [nodes, edges, currentProject?.preferred_cloud, scaleFactor]);

  // Compute Total Cost
  const totalMonthlyCost = useMemo(() => {
    return nodes.reduce((sum, n) => sum + (n.data.cost as number || 0), 0);
  }, [nodes]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col grid-bg h-screen overflow-hidden">
      
      {/* Studio Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-4 py-3 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/dashboard')} 
            className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-bold text-white uppercase tracking-wider">{currentProject?.name}</h1>
              <span className="text-[10px] bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 font-mono">
                v{currentVersion?.version_number || 1}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-medium truncate max-w-[280px]">
              {currentVersion?.commit_msg || 'Initial AI Discovery Architecture'}
            </p>
          </div>
        </div>

        {/* Scalability Simulator Slider */}
        <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-900 px-4 py-1.5 rounded-lg">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Scale Simulator:</span>
            <span className="text-[10px] font-mono bg-indigo-950 border border-indigo-900 px-1.5 py-0.5 rounded text-indigo-400 font-bold">
              {currentScaleLabel}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="3"
            step="1"
            value={scaleFactor}
            onChange={handleScaleSlider}
            className="w-24 h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-white"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
            title="Toggle theme mode"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          {user && (
            <div className="text-[10px] text-zinc-400 mr-2">
              Logged in as <span className="font-bold text-zinc-200">{user.name}</span>
            </div>
          )}
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors text-xs font-semibold"
          >
            Sign Out
          </button>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Configure Project Settings & Requirements"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
            Settings
          </button>

          <button 
            onClick={() => setIsCommitModalOpen(true)}
            className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5"
          >
            <GitBranch className="w-3.5 h-3.5" />
            Commit Version
          </button>
          
          <button 
            onClick={() => requestReview(projectId, currentVersion?.id)}
            className="px-3 py-1.5 rounded bg-white text-black hover:bg-zinc-200 transition-all text-xs font-semibold flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Audit System
          </button>
        </div>
      </header>

      {/* Main Studio Split Grid */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Panel: Requirements Directory */}
        <div className="w-60 bg-zinc-950/80 border-r border-zinc-900 flex flex-col overflow-hidden hidden md:flex shrink-0">
          <div className="px-4 py-3 border-b border-zinc-900/60 bg-zinc-950 flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Requirements Matrix</span>
            <span className="text-[9px] bg-zinc-900 border border-zinc-800 px-1 rounded text-zinc-550 font-mono">MD</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-left">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Business Goals</h4>
              <div className="p-2 rounded bg-zinc-900/40 border border-zinc-900 text-xs text-zinc-300 flex flex-col gap-1">
                <span className="font-semibold text-white">Target Latency:</span>
                <span>Sub 200ms transaction responses globally.</span>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">System Constraints</h4>
              <div className="flex flex-col gap-1.5 text-xs text-zinc-400">
                <div className="flex gap-1.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-650 mt-1.5 shrink-0" />
                  <span>Region: {currentProject?.region || 'Global'}</span>
                </div>
                <div className="flex gap-1.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-650 mt-1.5 shrink-0" />
                  <span>Cloud: {currentProject?.preferred_cloud || 'AWS'}</span>
                </div>
                <div className="flex gap-1.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-650 mt-1.5 shrink-0" />
                  <span>Compliance: {currentProject?.compliance || 'None'}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Actors & Triggers</h4>
              <div className="flex flex-col gap-1.5 text-xs text-zinc-400">
                <div className="flex gap-1.5 items-center">
                  <span className="px-1 rounded bg-zinc-900 border border-zinc-850 font-mono text-[9px]">ACTOR</span>
                  <span>End-user Client</span>
                </div>
                <div className="flex gap-1.5 items-center">
                  <span className="px-1 rounded bg-zinc-900 border border-zinc-850 font-mono text-[9px]">JOB</span>
                  <span>Background Task Scheduler</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Architect Insights Dashboard (Fixed at bottom of Left Panel) */}
          <div className="border-t border-zinc-900 bg-zinc-950/40 p-4 flex flex-col gap-3 shrink-0">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Live Architect Insights</span>
              <span className="text-[9px] bg-emerald-950 border border-emerald-900 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">ACTIVE</span>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-zinc-900/30 border border-zinc-900/60 p-2 rounded-lg flex flex-col items-center">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Security</span>
                <span className={`text-sm font-black font-mono mt-1 ${architectInsights.security > 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {architectInsights.security}/100
                </span>
                <div className="w-full bg-zinc-900 h-1 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full ${architectInsights.security > 80 ? 'bg-emerald-400' : 'bg-rose-400'}`} 
                    style={{ width: `${architectInsights.security}%` }} 
                  />
                </div>
              </div>

              <div className="bg-zinc-900/30 border border-zinc-900/60 p-2 rounded-lg flex flex-col items-center">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Scalability</span>
                <span className={`text-sm font-black font-mono mt-1 ${architectInsights.scalability > 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {architectInsights.scalability}/100
                </span>
                <div className="w-full bg-zinc-900 h-1 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full ${architectInsights.scalability > 80 ? 'bg-emerald-400' : 'bg-rose-400'}`} 
                    style={{ width: `${architectInsights.scalability}%` }} 
                  />
                </div>
              </div>

              <div className="bg-zinc-900/30 border border-zinc-900/60 p-2 rounded-lg flex flex-col items-center">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Reliability</span>
                <span className={`text-sm font-black font-mono mt-1 ${architectInsights.reliability > 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {architectInsights.reliability}/100
                </span>
                <div className="w-full bg-zinc-900 h-1 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full ${architectInsights.reliability > 80 ? 'bg-emerald-400' : 'bg-rose-400'}`} 
                    style={{ width: `${architectInsights.reliability}%` }} 
                  />
                </div>
              </div>

              <div className="bg-zinc-900/30 border border-zinc-900/60 p-2 rounded-lg flex flex-col items-center">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Performance</span>
                <span className={`text-sm font-black font-mono mt-1 ${architectInsights.performance > 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {architectInsights.performance}/100
                </span>
                <div className="w-full bg-zinc-900 h-1 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full ${architectInsights.performance > 80 ? 'bg-emerald-400' : 'bg-rose-400'}`} 
                    style={{ width: `${architectInsights.performance}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* Live Bottleneck Alerts List */}
            <div className="flex flex-col gap-2 mt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Bottlenecks & Alerts</span>
              {architectInsights.alerts.length === 0 ? (
                <div className="text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-950/40 p-2 rounded-lg flex items-start gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>No active bottlenecks. Optimized.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {architectInsights.alerts.map((alert, idx) => (
                    <div key={idx} className={`text-[10px] p-2 rounded-lg border flex items-start gap-1.5 ${
                      alert.level === 'error' 
                        ? 'bg-rose-950/20 border-rose-900/40 text-rose-300' 
                        : 'bg-amber-950/20 border-amber-900/40 text-amber-300'
                    }`}>
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-0.5 text-left">
                        <span className="font-bold text-[9px]">{alert.title}</span>
                        <span className="text-[8px] leading-normal opacity-85">{alert.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center: Infinite Canvas (React Flow) */}
        <div className="flex-1 bg-zinc-950 relative overflow-hidden flex flex-col">
          <div className="absolute top-3 left-3 z-10 flex gap-2">
            <div className="bg-zinc-950/80 border border-zinc-900 px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-400 flex items-center gap-1.5 backdrop-blur-md">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
              Est. Infrastructure Cost:{' '}
              <span className="font-bold text-white">{formatINR(totalMonthlyCost * 85)}/mo</span>
            </div>

            <div className="flex bg-zinc-950/80 border border-zinc-900 rounded-lg p-0.5 backdrop-blur-md gap-0.5">
              <button
                onClick={undo}
                disabled={past.length === 0}
                className="p-1.5 text-zinc-400 hover:text-white disabled:text-zinc-700 hover:bg-zinc-900 rounded transition-all cursor-pointer flex items-center justify-center"
                title="Undo (Cmd+Z / Ctrl+Z)"
              >
                <Undo className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={redo}
                disabled={future.length === 0}
                className="p-1.5 text-zinc-400 hover:text-white disabled:text-zinc-700 hover:bg-zinc-900 rounded transition-all cursor-pointer flex items-center justify-center"
                title="Redo (Cmd+Y / Ctrl+Y)"
              >
                <Redo className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onNodeDragStart={onNodeDragStart}
            onNodeDragStop={onNodeDragStop}
            fitView
            className="flex-1"
          >
            <Background color="#27272a" gap={20} size={1} />
            <Controls className="!bg-zinc-900 !border-zinc-800 !text-white [&>button]:!border-zinc-800 [&>button]:!bg-zinc-900 [&>button:hover]:!bg-zinc-800 [&>button>svg]:!fill-white" />
          </ReactFlow>

          {/* Bottom AI Panel */}
          <div className="h-60 border-t border-zinc-900 bg-zinc-950/80 backdrop-blur-md flex flex-col overflow-hidden shrink-0">
            <div className="px-4 py-2 border-b border-zinc-900/60 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Archon AI Assistant</span>
              </div>
              <span className="text-[9px] text-zinc-650 font-mono">WEB CONSOLE</span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2.5">
              {aiChat.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 max-w-[90%] text-xs ${msg.role === 'user' ? 'ml-auto flex-row-reverse text-right' : 'mr-auto text-left'}`}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-zinc-900 border-zinc-800' : 'bg-indigo-950 border-indigo-900'}`}>
                    <span className="text-[9px] font-bold">{msg.role === 'user' ? 'U' : 'A'}</span>
                  </div>
                  <div className={`p-2.5 rounded-lg leading-relaxed ${msg.role === 'user' ? 'bg-zinc-900 border border-zinc-850 text-zinc-300' : 'bg-zinc-950/60 border border-zinc-900 text-zinc-400'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isAiLoading && (
                <div className="flex gap-2.5 mr-auto text-left text-xs items-center text-zinc-500">
                  <div className="w-5 h-5 rounded bg-indigo-950 border border-indigo-900 flex items-center justify-center animate-pulse" />
                  <span>Thinking...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendAiMessage} className="p-2 border-t border-zinc-900 bg-zinc-950 flex gap-2">
              <input
                type="text"
                placeholder="Ask architect: 'Why Redis?', 'Switch DB to DynamoDB', 'How much will this cost?'..."
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-zinc-900/60 border border-zinc-850 rounded text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-zinc-700"
              />
              <button
                type="submit"
                disabled={!aiInput.trim()}
                className="px-3 py-2 bg-white text-black hover:bg-zinc-250 disabled:opacity-35 rounded transition-colors text-xs font-semibold"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Right Sidebar: Multi-Tool Inspector Panel */}
        <div className="w-80 bg-zinc-950/80 border-l border-zinc-900 flex flex-col overflow-hidden shrink-0">
          {/* Tab Selector */}
          <div className="grid grid-cols-4 border-b border-zinc-900 bg-zinc-950 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            <button 
              onClick={() => setActiveTab('inspector')}
              className={`py-3 border-r border-zinc-900 transition-colors ${activeTab === 'inspector' ? 'text-white bg-zinc-900/40 font-black' : 'hover:text-zinc-300'}`}
            >
              Node
            </button>
            <button 
              onClick={() => setActiveTab('explorer')}
              className={`py-3 border-r border-zinc-900 transition-colors ${activeTab === 'explorer' ? 'text-white bg-zinc-900/40 font-black' : 'hover:text-zinc-300'}`}
            >
              Decide
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`py-3 border-r border-zinc-900 transition-colors ${activeTab === 'reviews' ? 'text-white bg-zinc-900/40 font-black' : 'hover:text-zinc-300'}`}
            >
              Audit
            </button>
            <button 
              onClick={() => setActiveTab('versions')}
              className={`py-3 transition-colors ${activeTab === 'versions' ? 'text-white bg-zinc-900/40 font-black' : 'hover:text-zinc-300'}`}
            >
              Code
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 overflow-y-auto p-4 text-left">
            
            {/* T1: Node Inspector */}
            {activeTab === 'inspector' && (
              selectedNode ? (() => {
                const nodeData = selectedNode.data as any;
                return (
                  <div className="flex flex-col gap-4">
                    {isEditing ? (
                      <div className="flex flex-col gap-3.5">
                        <div>
                          <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-mono uppercase">
                            Editing {nodeData.type}
                          </span>
                        </div>

                        {/* Name Input */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Component Name</label>
                          <input
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700"
                          />
                        </div>

                        {/* Technology Input */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Technology</label>
                          <input
                            type="text"
                            value={editedTech}
                            onChange={(e) => handleTechChange(e.target.value)}
                            placeholder="e.g. Stripe, Redis, PostgreSQL…"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700"
                          />
                          <span className="text-[9px] text-indigo-400 italic">Security & Scaling notes auto-fill on known technologies</span>
                        </div>

                        {/* Cost Input (USD) */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Base Cost (USD)</label>
                            <span className="text-[10px] font-mono text-zinc-500">({formatINR(editedCost * 85)}/mo)</span>
                          </div>
                          <input
                            type="number"
                            value={editedCost}
                            onChange={(e) => setEditedCost(parseFloat(e.target.value) || 0)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700"
                          />
                        </div>

                        {/* Responsibilities Input */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Responsibilities</label>
                          <textarea
                            rows={3}
                            value={editedResp}
                            onChange={(e) => setEditedResp(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700 resize-none"
                          />
                        </div>

                        {/* Security Note */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Security Note</label>
                          <textarea
                            rows={2}
                            value={editedSecurity}
                            onChange={(e) => setEditedSecurity(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700 resize-none"
                          />
                        </div>

                        {/* Scaling Note */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Scaling Note</label>
                          <textarea
                            rows={2}
                            value={editedScaling}
                            onChange={(e) => setEditedScaling(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700 resize-none"
                          />
                        </div>

                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={handleSaveDetails}
                            className="flex-1 bg-white text-black hover:bg-zinc-200 transition-all font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center cursor-pointer"
                          >
                            Save Details
                          </button>
                          <button
                            onClick={() => setIsEditing(false)}
                            className="flex-1 bg-zinc-950 border border-zinc-850 text-zinc-300 hover:bg-zinc-900 transition-all font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-mono uppercase">
                            {nodeData.type}
                          </span>
                          <h2 className="text-sm font-bold text-white mt-1.5">{nodeData.name}</h2>
                          <p className="text-xs text-zinc-400 mt-1 font-mono">{nodeData.technology}</p>
                        </div>

                        {/* Architect's Rationale ("Why?") Section */}
                        {rationaleData && (
                          <div className="p-3 rounded bg-indigo-950/20 border border-indigo-950/60 flex flex-col gap-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              {rationaleData.title}
                            </span>
                            <ul className="flex flex-col gap-1.5 text-[11px] text-zinc-300 list-disc pl-4 leading-relaxed">
                              {rationaleData.reasons.map((reason, idx) => (
                                <li key={idx}>{reason}</li>
                              ))}
                            </ul>
                            
                            {/* Latency & Load Penalty Cards */}
                            <div className="mt-1 pt-2 border-t border-indigo-950/40 flex flex-col gap-2">
                              <div className="text-[10px] flex flex-col gap-0.5 text-zinc-400">
                                <span className="font-semibold text-rose-400">⚠️ Latency impact if removed:</span>
                                <span className="text-[9px] text-rose-300/80">{rationaleData.latencyPenalty}</span>
                              </div>
                              <div className="text-[10px] flex flex-col gap-0.5 text-zinc-400">
                                <span className="font-semibold text-rose-400">⚠️ Load impact if removed:</span>
                                <span className="text-[9px] text-rose-300/80">{rationaleData.loadPenalty}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="p-3 rounded bg-zinc-900/30 border border-zinc-900 flex flex-col gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Responsibilities</span>
                          <p className="text-xs text-zinc-400 leading-relaxed">{nodeData.responsibilities || 'No responsibilities defined.'}</p>
                        </div>

                        <div className="flex flex-col gap-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Specifications</span>
                          <div className="grid grid-cols-1 gap-2 text-xs text-zinc-400">
                            {nodeData.cost > 0 && (
                              <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                                <span>Allocated Cost:</span>
                                <span className="font-mono text-white">{formatINR((nodeData.cost as number) * 85)}/mo</span>
                              </div>
                            )}
                            <div className="flex flex-col border-b border-zinc-900 pb-2">
                              <span>Security Audit Note:</span>
                              <span className="text-[11px] text-zinc-550 mt-1">{nodeData.security_notes || 'Pending audit.'}</span>
                            </div>
                            <div className="flex flex-col pb-1">
                              <span>Scale/Replication Note:</span>
                              <span className="text-[11px] text-zinc-550 mt-1">{nodeData.scaling_notes || 'Autoscaled instance.'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => setIsEditing(true)}
                            className="flex-1 bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 hover:text-white text-zinc-300 transition-all font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center cursor-pointer"
                          >
                            Edit Details
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${(selectedNode?.data as any)?.name}" from canvas?`)) handleDeleteNode();
                            }}
                            className="bg-rose-950/30 border border-rose-900/50 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 transition-all py-2 px-3 rounded-lg text-xs flex items-center justify-center cursor-pointer"
                            title="Delete this node"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })() : (
                <div className="h-full flex items-center justify-center text-xs text-zinc-650 py-20 italic">
                  Select a node on the canvas to inspect its parameters.
                </div>
              )
            )}

            {/* T2: Decision Explorer */}
            {activeTab === 'explorer' && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Decision Trade-offs</h3>
                  <Compass className="w-4 h-4 text-indigo-400" />
                </div>

                {decisions.length === 0 ? (
                  <div className="text-xs text-zinc-650 py-16 text-center">No decisions recorded.</div>
                ) : (
                  decisions.map(dec => (
                    <div key={dec.id} className="p-3 rounded bg-zinc-900/40 border border-zinc-900 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] text-zinc-550 uppercase font-mono">{dec.component_name}</span>
                          <h4 className="text-xs font-bold text-zinc-200 mt-0.5">{dec.chosen_tech}</h4>
                        </div>
                        <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-1 rounded font-bold">
                          {(dec.confidence * 100).toFixed(0)}% Conf.
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed border-t border-zinc-900/60 pt-1.5">{dec.reason}</p>
                      
                      {dec.alternatives && dec.alternatives.length > 0 && (
                        <div className="mt-2 flex flex-col gap-1.5">
                          <span className="text-[9px] font-bold uppercase text-zinc-600">Evaluated Alternatives:</span>
                          {dec.alternatives.map((alt, idx) => (
                            <div key={idx} className="p-1.5 rounded bg-zinc-950 border border-zinc-900 text-[10px] flex flex-col gap-0.5">
                              <span className="font-semibold text-zinc-300">{alt.name}</span>
                              <div className="flex gap-1 text-[9px] text-zinc-550">
                                <span className="text-emerald-500">PRO:</span> {alt.pros}
                              </div>
                              <div className="flex gap-1 text-[9px] text-zinc-550">
                                <span className="text-amber-500">CON:</span> {alt.cons}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* T3: Architecture Review / Audit */}
            {activeTab === 'reviews' && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Security & Scale Audit</h3>
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                </div>

                {reviews.length === 0 ? (
                  <div className="text-xs text-zinc-650 py-16 text-center">
                    No audits found. Click "Audit System" to analyze the canvas.
                  </div>
                ) : (
                  reviews.map(rev => (
                    <div key={rev.id} className="flex flex-col gap-3">
                      <div className="p-3 rounded bg-zinc-900/20 border border-zinc-900 flex justify-between items-center">
                        <span className="text-xs font-bold text-zinc-200">Consensus Quality Score:</span>
                        <span className={`text-sm font-black px-2 py-0.5 rounded font-mono ${
                          rev.score > 80 ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                        }`}>
                          {rev.score}/100
                        </span>
                      </div>

                      {rev.security_issues.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-1.5">Security Vulnerabilities</h4>
                          <ul className="flex flex-col gap-1.5 text-[11px] text-zinc-400 list-disc pl-4">
                            {rev.security_issues.map((iss, idx) => <li key={idx}>{iss}</li>)}
                          </ul>
                        </div>
                      )}

                      {rev.scalability_issues.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-1.5">Scaling Risks</h4>
                          <ul className="flex flex-col gap-1.5 text-[11px] text-zinc-400 list-disc pl-4">
                            {rev.scalability_issues.map((iss, idx) => <li key={idx}>{iss}</li>)}
                          </ul>
                        </div>
                      )}

                      {rev.cost_issues.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-sky-500 mb-1.5">Cost Overhead Recommendations</h4>
                          <ul className="flex flex-col gap-1.5 text-[11px] text-zinc-400 list-disc pl-4">
                            {rev.cost_issues.map((iss, idx) => <li key={idx}>{iss}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* T4: Mermaid Export / Git Version History */}
            {/* T4: Mermaid Export / Terraform IaC Compiler */}
            {activeTab === 'versions' && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    {codeMode === 'mermaid' ? 'Mermaid Diagram Export' : 'Terraform IaC Compiler'}
                  </h3>
                  <FileCode className="w-4 h-4 text-zinc-400" />
                </div>

                <div className="flex gap-2 p-0.5 rounded-lg bg-zinc-950 border border-zinc-900">
                  <button
                    onClick={() => setCodeMode('mermaid')}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
                      codeMode === 'mermaid' 
                        ? 'bg-zinc-900 text-white shadow-sm' 
                        : 'text-zinc-500 hover:text-zinc-350'
                    }`}
                  >
                    Mermaid
                  </button>
                  <button
                    onClick={() => setCodeMode('terraform')}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
                      codeMode === 'terraform' 
                        ? 'bg-zinc-900 text-white shadow-sm' 
                        : 'text-zinc-500 hover:text-zinc-350'
                    }`}
                  >
                    Terraform
                  </button>
                </div>
                
                {codeMode === 'mermaid' ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] text-zinc-550 leading-normal">
                      You can copy this Mermaid structure and paste it into Confluence, Notion, or Draw.io to synchronize your documentation.
                    </p>
                    
                    <div className="relative">
                      <pre className="p-3 bg-zinc-950 border border-zinc-900 rounded font-mono text-[9px] text-zinc-400 max-h-60 overflow-y-auto select-all leading-relaxed">
                        {mermaidCode}
                      </pre>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(mermaidCode);
                          alert("Copied to clipboard!");
                        }}
                        className="absolute top-2 right-2 p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white transition-colors"
                        title="Copy to Clipboard"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] text-zinc-550 leading-normal">
                      Copy this deployable Terraform configuration to provision this architecture directly in your cloud environment.
                    </p>
                    
                    <div className="relative">
                      <pre className="p-3 bg-zinc-950 border border-zinc-900 rounded font-mono text-[9px] text-zinc-400 max-h-60 overflow-y-auto select-all leading-relaxed">
                        {terraformCode}
                      </pre>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(terraformCode);
                          alert("Copied to clipboard!");
                        }}
                        className="absolute top-2 right-2 p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white transition-colors"
                        title="Copy to Clipboard"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Export to GitHub Integration */}
                <div className="mt-4 pt-4 border-t border-zinc-900/60 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Push to GitHub</h3>
                    <GitBranch className="w-3.5 h-3.5 text-zinc-550" />
                  </div>
                  <p className="text-[10px] text-zinc-550 leading-normal">
                    Create a Pull Request containing your compiled Terraform configuration (`terraform/main.tf`) and dynamic Mermaid architecture documentation (`architecture.md`).
                  </p>

                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Repository Name</label>
                      <input
                        type="text"
                        placeholder="e.g. username/repository"
                        value={githubRepo}
                        onChange={(e) => setGithubRepo(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-900 rounded text-[11px] text-white focus:outline-none focus:border-zinc-700 transition-all font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Personal Access Token</label>
                      <input
                        type="password"
                        placeholder="ghp_..."
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-900 rounded text-[11px] text-white focus:outline-none focus:border-zinc-700 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleExportToGitHub}
                    disabled={isExporting || !githubRepo || !githubToken}
                    className="w-full py-2 bg-white hover:bg-zinc-200 text-black disabled:bg-zinc-900 disabled:text-zinc-600 disabled:border disabled:border-zinc-800/50 transition-all rounded text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-[0.98]"
                  >
                    {isExporting ? (
                      <>
                        <span className="w-3 h-3 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin"></span>
                        <span>Creating Pull Request...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Create Pull Request</span>
                      </>
                    )}
                  </button>

                  {githubExportError && (
                    <div className="p-2 bg-red-950/20 border border-red-900/40 rounded text-[10px] text-red-400 font-medium">
                      {githubExportError}
                    </div>
                  )}

                  {prUrl && (
                    <a
                      href={prUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-emerald-950/30 border border-emerald-900/60 hover:bg-emerald-950/50 text-emerald-400 transition-all rounded text-xs font-bold flex items-center justify-center gap-1.5 text-center shadow-lg"
                    >
                      <span>View Pull Request on GitHub</span>
                    </a>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-900/60">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Upload Diagrams & Docs</h3>
                  <input
                    type="file"
                    id="file-uploader"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    accept=".xml,.drawio,.mmd,.mermaid,.txt,.pdf,.json"
                  />
                  <label
                    htmlFor="file-uploader"
                    className="border border-dashed border-zinc-800 hover:border-zinc-700 transition-colors rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-zinc-900/10"
                  >
                    <UploadCloud className="w-6 h-6 text-zinc-500" />
                    <span className="text-[11px] font-bold text-zinc-350">Upload Draw.io / Mermaid / PDF</span>
                    <span className="text-[9px] text-zinc-550">File size capped at 10MB</span>
                  </label>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Commit Version Modal */}
      {isCommitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm rounded-xl p-5 flex flex-col gap-4 text-left">
            <div>
              <h3 className="text-sm font-bold text-white">Commit Architecture Version</h3>
              <p className="text-xs text-zinc-400 mt-1">Provide a commit label to save current layout state.</p>
            </div>
            
            <input
              type="text"
              required
              placeholder="e.g. Added caching layer to db"
              value={commitMsg}
              onChange={e => setCommitMsg(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-850 rounded text-xs text-white focus:outline-none focus:border-zinc-700"
            />

            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setIsCommitModalOpen(false)}
                className="px-3.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors text-xs font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveCommit}
                className="px-3.5 py-1.5 rounded bg-white text-black hover:bg-zinc-200 transition-colors text-xs font-semibold"
              >
                Save Commit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-xl p-6 flex flex-col gap-4 text-left border border-zinc-900 bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Project Requirements & Settings</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Modify parameters to update metadata and re-generate design recommendations.</p>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="Project name"
                  value={settingsName}
                  onChange={e => setSettingsName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Project Description</label>
                <textarea
                  rows={2}
                  placeholder="Primary business goals and target features..."
                  value={settingsDesc}
                  onChange={e => setSettingsDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none focus:border-zinc-700 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Target Industry</label>
                  <select
                    value={settingsIndustry}
                    onChange={e => setSettingsIndustry(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none focus:border-zinc-700 cursor-pointer"
                  >
                    <option value="SaaS">SaaS / Web App</option>
                    <option value="Fintech">Fintech / Banking</option>
                    <option value="Healthcare">Healthcare / HIPAA</option>
                    <option value="E-commerce">E-commerce / Retail</option>
                    <option value="IoT">IoT / Realtime Streams</option>
                    <option value="Social">Social Media / Feeds</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Preferred Cloud</label>
                  <select
                    value={settingsCloud}
                    onChange={e => setSettingsCloud(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none focus:border-zinc-700 cursor-pointer"
                  >
                    <option value="AWS">Amazon Web Services (AWS)</option>
                    <option value="GCP">Google Cloud Platform (GCP)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Target Scale</label>
                  <select
                    value={settingsScale}
                    onChange={e => setSettingsScale(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none focus:border-zinc-700 cursor-pointer"
                  >
                    <option value="10k">10k active users</option>
                    <option value="100k">100k active users</option>
                    <option value="1M">1M active users</option>
                    <option value="10M">10M active users</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Budget Limit</label>
                  <select
                    value={settingsBudget}
                    onChange={e => setSettingsBudget(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none focus:border-zinc-700 cursor-pointer"
                  >
                    <option value="Low">Low / Cost Optimization</option>
                    <option value="Medium">Medium / Default Balanced</option>
                    <option value="High">High / Enterprise Redundancy</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-2 pt-3 border-t border-zinc-900">
                <button 
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Save & Regenerate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Regeneration loading screen overlay */}
      {isRegenerating && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="flex flex-col items-center gap-4 text-center max-w-sm">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center animate-pulse shadow-2xl shadow-white/10">
              <span className="text-black font-extrabold text-2xl tracking-tighter">A</span>
            </div>
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mt-2" />
            <h3 className="text-sm font-bold text-white tracking-wide mt-2">Regenerating Architecture Consensus...</h3>
            <p className="text-[11px] text-zinc-550 leading-relaxed mt-1">
              Consensus agents are re-evaluating Cloud provider recommendations, infrastructure scaling limits, security isolation boundaries, and costs based on updated settings.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudioPage() {
  return (
    <ReactFlowProvider>
      <StudioContent />
    </ReactFlowProvider>
  );
}
