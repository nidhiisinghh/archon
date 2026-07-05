'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { 
  Terminal, 
  ArrowRight, 
  Cpu, 
  Database, 
  Network, 
  ShieldCheck, 
  Zap, 
  Users,
  Sun,
  Moon,
  Info,
  CheckCircle,
  Play,
  Server,
  X
} from 'lucide-react';

const scaleData = {
  '10k': {
    totalCost: '₹4,675',
    nodes: [
      {
        id: 'gateway',
        name: 'AWS API Gateway',
        type: 'API GATEWAY',
        tech: 'Simple REST Routing',
        cost: '₹425/mo',
        color: 'text-pink-400',
        borderColor: 'border-pink-900/50',
        dotColor: 'bg-sky-400',
        detail: 'Requirements Analyst: "A basic REST API Gateway provides low-cost routing with complete CORS and rate limiting controls, perfect for 10k daily operations."'
      },
      {
        id: 'worker',
        name: 'FastAPI ECS Container',
        type: 'API WORKER',
        tech: 'Single Fargate Container',
        cost: '₹2,550/mo',
        color: 'text-indigo-400',
        borderColor: 'border-indigo-900/50',
        dotColor: 'bg-indigo-400',
        detail: 'System Architect: "Deploying a single ECS Fargate worker prevents container orchestrator overhead. It handles up to 50 concurrent requests easily."'
      },
      {
        id: 'database',
        name: 'RDS PostgreSQL',
        type: 'RELATIONAL STORE',
        tech: 'db.t4g.micro Instance',
        cost: '₹1,700/mo',
        color: 'text-emerald-400',
        borderColor: 'border-emerald-900/50',
        dotColor: 'bg-emerald-400',
        detail: 'DB Specialist: "At 10k scale, a single small RDS instance is completely sufficient. Enabling auto-backups handles persistence securely without extra replica cost."'
      }
    ]
  },
  '100k': {
    totalCost: '₹25,075',
    nodes: [
      {
        id: 'gateway',
        name: 'Gateway Edge Router',
        type: 'API GATEWAY',
        tech: 'AWS API Gateway',
        cost: '₹2,125/mo',
        color: 'text-pink-400',
        borderColor: 'border-pink-900/50',
        dotColor: 'bg-sky-400',
        detail: 'Requirements Analyst: "We scale up edge request queues. AWS API Gateway provides automatic throttling and burst mitigation for up to 100k requests."'
      },
      {
        id: 'worker',
        name: 'Backend Core Services',
        type: 'API WORKER',
        tech: 'FastAPI / Docker Cluster',
        cost: '₹10,200/mo',
        color: 'text-indigo-400',
        borderColor: 'border-indigo-900/50',
        dotColor: 'bg-indigo-400',
        detail: 'System Architect: "ECS cluster with 2 tasks distributed across Multi-AZ zones to protect against single datacenter failures."'
      },
      {
        id: 'database',
        name: 'PostgreSQL DB Cluster',
        type: 'RELATIONAL STORE',
        tech: 'Amazon Aurora PG',
        cost: '₹12,750/mo',
        color: 'text-emerald-400',
        borderColor: 'border-emerald-900/50',
        dotColor: 'bg-emerald-400',
        detail: 'DB Specialist: "Upgrading to Amazon Aurora Serverless PG provides 3x read performance of standard RDS and instant autoscaling properties."'
      }
    ]
  },
  '1m': {
    totalCost: '₹110,500',
    nodes: [
      {
        id: 'gateway',
        name: 'CloudFront Edge Router',
        type: 'API GATEWAY',
        tech: 'CDN + Edge API Gateway',
        cost: '₹8,500/mo',
        color: 'text-pink-400',
        borderColor: 'border-pink-900/50',
        dotColor: 'bg-sky-400',
        detail: 'Infrastructure Engineer: "Adding CloudFront CDN is required at 1M scale to cache static edge payloads and reduce traffic load on downstream application microservices."'
      },
      {
        id: 'worker',
        name: 'API Auto-Scale Node',
        type: 'API WORKER',
        tech: 'EKS Kubernetes (3-6 Pods)',
        cost: '₹42,500/mo',
        color: 'text-indigo-400',
        borderColor: 'border-indigo-900/50',
        dotColor: 'bg-indigo-400',
        detail: 'System Architect: "Migrated compute to AWS EKS. HPA (Horizontal Pod Autoscaler) dynamically scales compute pods up/down based on CPU and memory thresholds."'
      },
      {
        id: 'database',
        name: 'Aurora PG + Redis Cache',
        type: 'RELATIONAL STORE',
        tech: 'Multi-AZ Aurora + ElastiCache',
        cost: '₹59,500/mo',
        color: 'text-emerald-400',
        borderColor: 'border-emerald-900/50',
        dotColor: 'bg-emerald-400',
        detail: 'DB Specialist: "To support 1M active requests, standard SQL reads would choke. We add Redis ElastiCache in front of Aurora to offload 85% of read queries."'
      }
    ]
  },
  '10m': {
    totalCost: '₹416,500',
    nodes: [
      {
        id: 'gateway',
        name: 'Global Edge Shield',
        type: 'API GATEWAY',
        tech: 'CloudFront + WAF Shield',
        cost: '₹34,000/mo',
        color: 'text-pink-400',
        borderColor: 'border-pink-900/50',
        dotColor: 'bg-sky-400',
        detail: 'Security Architect: "At 10M scale, the risk of DDoS attacks is high. Adding AWS WAF Shield defends Edge connections, caching DNS queries globally."'
      },
      {
        id: 'worker',
        name: 'Multi-Region ECS Grid',
        type: 'API WORKER',
        tech: 'ECS Fargate Multi-Region',
        cost: '₹170,000/mo',
        color: 'text-indigo-400',
        borderColor: 'border-indigo-900/50',
        dotColor: 'bg-indigo-400',
        detail: 'System Architect: "Compute is now geographically distributed. Traffic is routed using Latency-Based Routing across us-east-1 and eu-west-1 regions."'
      },
      {
        id: 'database',
        name: 'DynamoDB Global Store',
        type: 'RELATIONAL STORE',
        tech: 'DynamoDB + DAX Multi-Region',
        cost: '₹212,500/mo',
        color: 'text-emerald-400',
        borderColor: 'border-emerald-900/50',
        dotColor: 'bg-emerald-400',
        detail: 'DB Specialist: "At 10M scale, traditional SQL database locks are too slow. Migrated core telemetry to DynamoDB Global Tables to ensure sub-10ms global latency."'
      }
    ]
  }
};

const agents = [
  {
    name: 'Planner Agent',
    role: 'Orchestration Lead',
    icon: <Network className="w-5 h-5 text-emerald-400" />,
    detail: 'Lays out the consensus pipeline milestones and establishes the scale target.',
    log: 'Planner: "Parsed requirements. User base matches scaling target. Booting consensus loop..."'
  },
  {
    name: 'Requirements Analyst',
    role: 'Constraint Discovery',
    icon: <Users className="w-5 h-5 text-indigo-400" />,
    detail: 'Discovers protocol dependencies, security standards, and traffic rate limitations.',
    log: 'Analyst: "Detected security requirements. Enforcing edge firewall rule specifications..."'
  },
  {
    name: 'System Architect',
    role: 'Compute & Layout Design',
    icon: <Cpu className="w-5 h-5 text-pink-400" />,
    detail: 'Determines server layouts, API proxy endpoints, and load balancing configurations.',
    log: 'Architect: "Laying out microservices container tasks. Formulating multi-zone distribution..."'
  },
  {
    name: 'DB Specialist',
    role: 'Persistence Topology',
    icon: <Database className="w-5 h-5 text-teal-400" />,
    detail: 'Picks datastores, database nodes, replication parameters, and caching servers.',
    log: 'DB Specialist: "Evaluating relational vs Key-Value data model. Initializing replication topology..."'
  },
  {
    name: 'Security Officer',
    role: 'Compliance & Safety Guard',
    icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
    detail: 'Applies IAM roles, VPC isolation groups, and data-at-rest encryption policies.',
    log: 'Security Officer: "Secured database subnet group. Injecting SSL enforcement configurations..."'
  },
  {
    name: 'Consensus Engine',
    role: 'Blueprints Compiler',
    icon: <Server className="w-5 h-5 text-white" />,
    detail: 'Collects agent votes, resolves design conflicts, and outputs Terraform + Mermaid.',
    log: 'Consensus: "All votes recorded. Generating Terraform main.tf and canvas node configurations..."'
  }
];

export default function LandingPage() {
  const { theme, toggleTheme } = useStore();
  const [requestsScale, setRequestsScale] = useState<'10k' | '100k' | '1m' | '10m'>('100k');
  const [activeModal, setActiveModal] = useState<'docs' | 'security' | 'terms' | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [activeAgentIndex, setActiveAgentIndex] = useState(0);
  const [isAutoCycling, setIsAutoCycling] = useState(true);

  // Auto-cycle active agent index
  useEffect(() => {
    if (!isAutoCycling) return;
    const timer = setInterval(() => {
      setActiveAgentIndex(prev => (prev + 1) % agents.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isAutoCycling]);

  const activeScaleData = useMemo(() => scaleData[requestsScale], [requestsScale]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } }
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden grid-bg">
      {/* Decorative Radial Gradients */}
      {theme === 'dark' && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
          <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />
        </>
      )}

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-md">
            <span className="font-black text-black text-base tracking-tighter">A</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white uppercase">Archon</span>
          <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono font-medium tracking-wide">
            v1.0 PRD
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
            title="Toggle theme mode"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          <Link href="/login" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link 
            href="/register" 
            className="text-sm font-semibold bg-white text-black px-3.5 py-1.5 rounded-lg hover:bg-zinc-200 transition-all flex items-center gap-1 group shadow-[0_0_15px_rgba(255,255,255,0.05)]"
          >
            Create Account
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <motion.div 
          className="text-center max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Tagline */}
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800/80 mb-6 backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono text-zinc-400 tracking-wider uppercase">
              The First Collaborative AI Architect
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1 
            variants={itemVariants}
            className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mb-6 bg-gradient-to-b from-white via-white to-zinc-500 bg-clip-text text-transparent"
          >
            Design Better Systems.
          </motion.h1>

          {/* Subtext */}
          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-zinc-400 font-light max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Your AI Software Architect that <span className="text-white font-semibold underline decoration-zinc-800 underline-offset-4">thinks</span> before it designs. We discover system structures collaboratively.
          </motion.p>

          {/* Call to Actions */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link 
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-white text-black font-semibold text-sm transition-all hover:bg-zinc-200 flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              Enter Command Center
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a 
              href="#demo"
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-zinc-300 font-semibold text-sm transition-all hover:bg-zinc-900/60 hover:text-white flex items-center justify-center gap-2"
            >
              Watch Demo Studio
            </a>
          </motion.div>

          {/* Dynamic Scaling Slider Control */}
          <motion.div 
            variants={itemVariants}
            className="max-w-md mx-auto mb-10 p-4 rounded-xl border border-zinc-900 bg-zinc-950/70 backdrop-blur-md flex flex-col gap-3.5 text-left"
          >
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-zinc-400 uppercase tracking-wide">Scalability Simulator</span>
              <span className="font-mono text-white bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded font-semibold">
                {requestsScale === '10k' && '10,000 requests/day'}
                {requestsScale === '100k' && '100,000 requests/day'}
                {requestsScale === '1m' && '1 Million requests/day'}
                {requestsScale === '10m' && '10 Million requests/day'}
              </span>
            </div>
            
            <div className="relative flex items-center mt-1">
              <input 
                type="range" 
                min="0" 
                max="3" 
                step="1"
                value={requestsScale === '10k' ? 0 : requestsScale === '100k' ? 1 : requestsScale === '1m' ? 2 : 3}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val === 0) setRequestsScale('10k');
                  else if (val === 1) setRequestsScale('100k');
                  else if (val === 2) setRequestsScale('1m');
                  else setRequestsScale('10m');
                }}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-zinc-550 font-bold px-1">
              <span>10K</span>
              <span>100K</span>
              <span>1M</span>
              <span>10M</span>
            </div>
          </motion.div>

          {/* Dynamic Mock Interactive Canvas Card */}
          <motion.div 
            id="demo"
            variants={itemVariants}
            className="relative rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4 md:p-6 backdrop-blur-md shadow-2xl max-w-5xl mx-auto overflow-hidden group mb-24"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            {/* Mock Header Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-900/80 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <span className="text-[11px] font-mono text-zinc-600 ml-2">architecture_studio_v1.archon</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[10px] font-mono text-zinc-400">
                  Estimated cost: <span className="font-bold text-white bg-zinc-900/60 px-1.5 py-0.5 rounded border border-zinc-850">{activeScaleData.totalCost}/mo</span>
                </div>
                <div className="flex items-center gap-1 bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-800">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-400">Agent Network: Consensus Ready</span>
                </div>
              </div>
            </div>

            {/* Simulated Live Diagram Render */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[220px] relative">
              <AnimatePresence mode="popLayout">
                {activeScaleData.nodes.map((node, index) => {
                  const isHovered = hoveredNode === node.id;
                  
                  return (
                    <motion.div 
                      key={`${requestsScale}-${node.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      className={`relative p-4 rounded-lg bg-zinc-950/80 border transition-all text-left flex flex-col justify-between cursor-pointer ${isHovered ? 'border-zinc-500 shadow-[0_0_15px_rgba(255,255,255,0.05)] scale-[1.02]' : 'border-zinc-900 hover:border-zinc-800'}`}
                    >
                      {/* Connection lines */}
                      {index > 0 && (
                        <div className={`absolute top-1/2 left-[-24px] right-full border-t border-dashed pointer-events-none hidden md:block transition-colors duration-300 ${isHovered || hoveredNode === activeScaleData.nodes[index-1].id ? 'border-zinc-400 border-solid' : 'border-zinc-800'}`} />
                      )}

                      <div className="flex items-start justify-between">
                        <div className="flex gap-2.5 items-center">
                          <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
                            {node.id === 'gateway' && <Network className={`w-4 h-4 ${node.color}`} />}
                            {node.id === 'worker' && <Cpu className={`w-4 h-4 ${node.color}`} />}
                            {node.id === 'database' && <Database className={`w-4 h-4 ${node.color}`} />}
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-zinc-200">{node.name}</h4>
                            <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">{node.type}</p>
                          </div>
                        </div>
                        <span className={`w-1.5 h-1.5 rounded-full ${node.dotColor} shadow-[0_0_8px_rgba(255,255,255,0.3)]`} />
                      </div>
                      
                      <div className="mt-8 pt-2 border-t border-zinc-900/60 text-[10px] font-mono text-zinc-550 flex justify-between">
                        <span>{node.tech}</span>
                        <span>{node.cost}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Recommendation Detail Row */}
            <div className="mt-6 pt-4 border-t border-zinc-900/60 min-h-[56px] flex items-center justify-center text-center">
              <AnimatePresence mode="wait">
                {hoveredNode ? (
                  <motion.div
                    key={hoveredNode}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="text-[11px] text-zinc-300 max-w-2xl mx-auto leading-relaxed text-center"
                  >
                    <span className="inline-flex items-center gap-1 mr-1.5 align-middle">
                      <Info className="w-3.5 h-3.5 text-sky-400" />
                    </span>
                    <strong className="text-white mr-1">{activeScaleData.nodes.find(n => n.id === hoveredNode)?.name}:</strong>{" "}
                    <span className="italic text-zinc-400">
                      {(() => {
                        const detail = activeScaleData.nodes.find(n => n.id === hoveredNode)?.detail || '';
                        const parts = detail.split(': "');
                        return parts.length > 1 ? `"${parts[1]}` : `"${detail}"`;
                      })()}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    exit={{ opacity: 0 }}
                    className="text-[11px] text-zinc-500 italic text-center"
                  >
                    <span className="inline-flex items-center gap-1 mr-1.5 align-middle">
                      <Info className="w-3.5 h-3.5 text-zinc-650" />
                    </span>
                    Hover over any component node to read the agent recommendation rationale.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Interactive Agent Consensus Collaboration visualizer */}
          <motion.div 
            variants={itemVariants}
            className="max-w-4xl mx-auto mb-32 p-6 rounded-xl border border-zinc-900 bg-zinc-950/30 backdrop-blur-sm text-left flex flex-col gap-6"
          >
            <div className="flex flex-col gap-1 text-center md:text-left">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Multi-Agent Consensus Network</h3>
              <p className="text-xs text-zinc-400">Watch the agent pipeline coordinate, vote, and generate configurations. Click an agent to view details.</p>
            </div>

            {/* Agent steps timeline */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {agents.map((agent, index) => {
                const isActive = activeAgentIndex === index;
                
                return (
                  <button 
                    key={agent.name}
                    onClick={() => {
                      setActiveAgentIndex(index);
                      setIsAutoCycling(false);
                    }}
                    className={`p-3 rounded-lg border transition-all flex flex-col items-center justify-between text-center gap-2 cursor-pointer ${isActive ? 'bg-zinc-900 border-zinc-700 shadow-md scale-[1.03]' : 'bg-zinc-950/60 border-zinc-950 hover:border-zinc-900'}`}
                  >
                    <div className={`p-2 rounded-full ${isActive ? 'bg-white/5 border border-zinc-700' : 'bg-zinc-900'}`}>
                      {agent.icon}
                    </div>
                    <span className="text-[10px] font-bold text-zinc-200">{agent.name}</span>
                    <span className="text-[8px] text-zinc-550 font-mono tracking-tighter uppercase font-medium">{agent.role}</span>
                  </button>
                );
              })}
            </div>

            {/* Agent active logs screen */}
            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-900/60 font-mono text-xs flex flex-col gap-2 relative overflow-hidden min-h-[90px]">
              <div className="absolute top-2 right-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Stream Active</span>
              </div>
              <div className="text-zinc-500 uppercase tracking-wider text-[9px] font-bold">
                Log Stream - {agents[activeAgentIndex].name}
              </div>
              <p className="text-emerald-400 font-semibold leading-relaxed">
                &gt; {agents[activeAgentIndex].log}
              </p>
              <p className="text-[10px] text-zinc-400">
                {agents[activeAgentIndex].detail}
              </p>
            </div>
          </motion.div>

        </motion.div>

        {/* Feature Grid */}
        <section className="mt-32 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-lg bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800/80 transition-all flex flex-col justify-between">
            <div>
              <Network className="w-6 h-6 text-white mb-4" />
              <h3 className="text-sm font-bold text-white mb-2">Discovery Interview</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">Archon conducts structured discovery dialogs to map dependencies, constraints, and latency targets instead of blankly guessing.</p>
            </div>
            <div className="mt-4 pt-2 border-t border-zinc-900/30 flex items-center gap-1.5 text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-bold">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Stream Ingestion ready</span>
            </div>
          </div>
          <div className="p-6 rounded-lg bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800/80 transition-all flex flex-col justify-between">
            <div>
              <Cpu className="w-6 h-6 text-white mb-4" />
              <h3 className="text-sm font-bold text-white mb-2">Infinite Studio Canvas</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">Drag nodes, trace data flows, inspect tech choices, cost projections, and security metrics side-by-side using React Flow.</p>
            </div>
            <div className="mt-4 pt-2 border-t border-zinc-900/30 flex items-center gap-1.5 text-[9px] font-mono text-zinc-550 uppercase tracking-wider font-bold">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Canvas persistence</span>
            </div>
          </div>
          <div className="p-6 rounded-lg bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800/80 transition-all flex flex-col justify-between">
            <div>
              <Zap className="w-6 h-6 text-white mb-4" />
              <h3 className="text-sm font-bold text-white mb-2">Scalability Simulator</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">Slide requests volume from 10k up to 10M. Archon automatically shifts replication, sharding, caching layers and updates cost metrics.</p>
            </div>
            <div className="mt-4 pt-2 border-t border-zinc-900/30 flex items-center gap-1.5 text-[9px] font-mono text-zinc-550 uppercase tracking-wider font-bold">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Consensus modeling</span>
            </div>
          </div>
          <div className="p-6 rounded-lg bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800/80 transition-all flex flex-col justify-between">
            <div>
              <ShieldCheck className="w-6 h-6 text-white mb-4" />
              <h3 className="text-sm font-bold text-white mb-2">Trade-off Inspector</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">Deep-dive into recommendations. Understand Postgres vs MongoDB confidence factors, risks, alternative choices, and pricing.</p>
            </div>
            <div className="mt-4 pt-2 border-t border-zinc-900/30 flex items-center gap-1.5 text-[9px] font-mono text-zinc-550 uppercase tracking-wider font-bold">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>IaC Export validation</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
        <div className="flex flex-col md:flex-row items-center gap-1.5 md:gap-3 text-center md:text-left">
          <p>© 2026 Archon Systems Design. All rights reserved.</p>
          <span className="hidden md:inline text-zinc-800">|</span>
          <p className="text-zinc-400">Created by <span className="text-zinc-300 font-semibold">Nidhi Singh</span></p>
        </div>
        <div className="flex gap-6">
          <button 
            onClick={() => setActiveModal('docs')} 
            className="hover:text-white transition-colors cursor-pointer bg-transparent border-0"
          >
            Documentation
          </button>
          <button 
            onClick={() => setActiveModal('security')} 
            className="hover:text-white transition-colors cursor-pointer bg-transparent border-0"
          >
            Security Policy
          </button>
          <button 
            onClick={() => setActiveModal('terms')} 
            className="hover:text-white transition-colors cursor-pointer bg-transparent border-0"
          >
            Terms of Service
          </button>
        </div>
      </footer>

      {/* Modals Portal */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-950 p-6 md:p-8 shadow-2xl text-left z-10 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-900 mb-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-sky-400" />
                  {activeModal === 'docs' && 'Archon Documentation'}
                  {activeModal === 'security' && 'Archon Security Framework'}
                  {activeModal === 'terms' && 'Archon Terms of Service'}
                </h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto pr-2 space-y-5 text-xs text-zinc-400 leading-relaxed font-sans scrollbar-thin">
                {activeModal === 'docs' && (
                  <>
                    <p>
                      Welcome to the Archon Platform guide. Archon is an autonomous multi-agent systems architect that structures production-grade cloud configurations.
                    </p>
                    <div className="space-y-4">
                      <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-850">
                        <h4 className="font-bold text-white mb-1">1. Multi-Agent Systems Discovery</h4>
                        <p>Archon conducts discovery through specialized agent profiles. These agents vote on constraints, pick libraries, and agree on optimal scalability configurations.</p>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-850">
                        <h4 className="font-bold text-white mb-1">2. Ingesting Specifications</h4>
                        <p>You can upload Draw.io diagrams (XML/JSON), Mermaid code (.mmd), or plain text files in the project workspace. Archon automatically parses these inputs to build or update your canvas.</p>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-850">
                        <h4 className="font-bold text-white mb-1">3. Infrastructure Code Generation</h4>
                        <p>Once a consensus blueprint is rendered, export ready-to-deploy configurations directly to a GitHub repository or download canvas configuration bundles.</p>
                      </div>
                    </div>
                  </>
                )}

                {activeModal === 'security' && (
                  <>
                    <p>
                      We enforce rigorous standards to ensure the security, integrity, and privacy of your architectural specifications and system secrets.
                    </p>
                    <div className="space-y-4">
                      <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-850">
                        <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-emerald-400" />
                          PostgreSQL Storage Isolation
                        </h4>
                        <p>All project specifications, architecture graphs, layout versions, and user records are stored securely in a dedicated PostgreSQL instance. We never use volatile or unencrypted temporary storage for persistence.</p>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-850">
                        <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                          Token Encryption & Integrity
                        </h4>
                        <p>GitHub Personal Access Tokens (PATs) and other sensitive credentials are encrypted before persistence. Communication between your browser and the FastAPI orchestrator is fully encrypted via secure HTTPS protocol.</p>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-850">
                        <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-sky-400" />
                          Model Proxy Security
                        </h4>
                        <p>To avoid prompt injections or credentials leakage, model queries are routed through backend API layers. Sensitive data is stripped or scrubbed before being analyzed by LLM agents.</p>
                      </div>
                    </div>
                  </>
                )}

                {activeModal === 'terms' && (
                  <>
                    <p>
                      Please review the platform guidelines and terms for evaluating and compiling cloud configurations using Archon.
                    </p>
                    <div className="space-y-4">
                      <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-850">
                        <h4 className="font-bold text-white mb-1">1. MIT Open Source License</h4>
                        <p>This software is provided under the MIT license. You are permitted to run, modify, fork, and distribute the project code for personal or commercial development plans.</p>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-850">
                        <h4 className="font-bold text-white mb-1">2. Resource Consumption</h4>
                        <p>Users are responsible for any cloud service charges incurred from deployment scripts generated by Archon (e.g. AWS or GCP infrastructure resources instantiated via Terraform).</p>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-850">
                        <h4 className="font-bold text-white mb-1">3. Automated Design Disclaimer</h4>
                        <p>The system designs generated by Archon represent automated agent recommendations. They should be reviewed, tested, and approved by qualified engineering teams before production deployment.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-zinc-900 flex justify-end">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
