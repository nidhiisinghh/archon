'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, type ChatMessage, type AgentLog } from '@/store/useStore';
import { 
  ArrowRight, 
  Send, 
  Bot, 
  Cpu, 
  Database, 
  ShieldAlert, 
  Workflow, 
  Cloud,
  CheckCircle,
  HelpCircle,
  Code
} from 'lucide-react';

export default function NewProjectWizard() {
  const router = useRouter();
  const { createProject, token, user, logout, theme, toggleTheme } = useStore();

  useEffect(() => {
    const localToken = typeof window !== 'undefined' ? localStorage.getItem('archon_token') : null;
    if (!localToken && !token) {
      router.push('/login');
    }
  }, [token, router]);
  
  // Wizard Form States
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: 'SaaS',
    preferred_cloud: 'AWS',
    scale: '100k',
    budget: 'Medium'
  });
  
  const [step, setStep] = useState<'form' | 'discovery'>('form');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Chat States
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [systemLog, setSystemLog] = useState<string>('Initializing discovery session...');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  
  // WebSocket Reference
  const ws = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const consoleEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottoms
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentLogs]);

  // Clean up WebSocket on unmount
  useEffect(() => {
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const handleStartDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      // 1. Create project in DB
      const project = await createProject(formData);
      setProjectId(project.id);
      
      // 2. Fetch the session ID
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const headers: Record<string, string> = {};
      const localToken = typeof window !== 'undefined' ? localStorage.getItem('archon_token') : null;
      if (localToken || token) {
        headers['Authorization'] = `Bearer ${localToken || token}`;
      }
      const sessionRes = await fetch(`${API_BASE}/api/projects/${project.id}/session`, { headers });
      const sessionData = await sessionRes.json();
      
      setSessionId(sessionData.id);
      setChatMessages(sessionData.chat_history || []);
      setStep('discovery');

      // 3. Connect WebSocket
      connectWebSocket(sessionData.id);
    } catch (err) {
      console.error(err);
      alert("Error initializing project");
    }
  };

  const connectWebSocket = (sessId: string) => {
    const WS_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
      .replace('http://', 'ws://')
      .replace('https://', 'wss://');
    
    ws.current = new WebSocket(`${WS_BASE}/api/ws/discovery/${sessId}`);

    ws.current.onopen = () => {
      setSystemLog("Connected to Archon agent network.");
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'chat_reply') {
        // Normal question reply
        setChatMessages(data.chat_history);
      } else if (data.type === 'status') {
        // Multi-agent status log
        setSystemLog(data.log);
        if (data.status === 'thinking') {
          setIsGenerating(true);
        }
      } else if (data.type === 'agent_thinking') {
        // Live agent logs
        setActiveAgent(data.agent);
        setAgentLogs(prev => {
          // Check if log for this agent already exists
          const exists = prev.some(l => l.log === data.log);
          if (exists) return prev;
          return [...prev, { agent: data.agent, status: data.status, log: data.log }];
        });
      } else if (data.type === 'generation_completed') {
        // Done! Redirect to architecture studio
        setSystemLog("Architecture consensus compiled! Launching studio...");
        setTimeout(() => {
          router.push(`/studio/${data.project_id}`);
        }, 1200);
      } else if (data.type === 'error') {
        alert("Discovery Session encountered an error: " + data.message);
      }
    };

    ws.current.onclose = () => {
      setSystemLog("Agent network disconnected.");
    };
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !ws.current) return;

    // Send answer to backend via WebSocket
    ws.current.send(JSON.stringify({ message: chatInput }));
    
    // Add locally immediately to keep it fluid
    setChatMessages(prev => [...prev, { role: 'user', content: chatInput }]);
    setChatInput('');
  };

  // Agent configuration for the multi-agent UI
  const agentMetadata = [
    { name: 'Planner', icon: <Workflow className="w-4 h-4 text-purple-400" /> },
    { name: 'Requirement Analyst', icon: <HelpCircle className="w-4 h-4 text-pink-400" /> },
    { name: 'Backend Architect', icon: <Code className="w-4 h-4 text-indigo-400" /> },
    { name: 'Database Specialist', icon: <Database className="w-4 h-4 text-emerald-400" /> },
    { name: 'Security Architect', icon: <ShieldAlert className="w-4 h-4 text-amber-400" /> },
    { name: 'Infrastructure Engineer', icon: <Cloud className="w-4 h-4 text-sky-400" /> },
    { name: 'Consensus Engine', icon: <Bot className="w-4 h-4 text-white" /> },
  ];

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col grid-bg">
      {/* Navigation */}
      <nav className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/dashboard')} className="w-7 h-7 rounded bg-white flex items-center justify-center font-black text-black text-sm tracking-tighter hover:bg-zinc-200">
            A
          </button>
          <span className="font-bold tracking-tight text-white uppercase text-base">Archon Setup</span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <button
            onClick={toggleTheme}
            className="bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white px-2.5 py-1.5 rounded transition-all font-semibold cursor-pointer"
            title="Toggle theme mode"
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          {user && (
            <div className="text-zinc-400">
              Logged in as <span className="font-bold text-zinc-200">{user.name}</span>
            </div>
          )}
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white px-3 py-1.5 rounded transition-colors font-semibold"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Panel Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col items-center justify-center relative z-10">
        
        <AnimatePresence mode="wait">
          {step === 'form' ? (
            /* WIZARD FORM */
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-lg glass-panel p-6 rounded-xl shadow-2xl flex flex-col gap-6"
            >
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2">Create a New Architecture Project</h2>
                <p className="text-xs text-zinc-400">Specify details to frame the Discovery Session boundary.</p>
              </div>

              <form onSubmit={handleStartDiscovery} className="flex flex-col gap-4 text-left">
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Food Delivery Platform"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded text-sm text-white placeholder-zinc-550 focus:outline-none focus:border-zinc-700"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Description</label>
                  <textarea
                    placeholder="Briefly describe what this system does..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded text-sm text-white placeholder-zinc-550 h-20 focus:outline-none focus:border-zinc-700 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Industry */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Industry</label>
                    <select
                      value={formData.industry}
                      onChange={e => setFormData({...formData, industry: e.target.value})}
                      className="px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded text-sm text-white focus:outline-none focus:border-zinc-700"
                    >
                      <option value="SaaS">SaaS / B2B</option>
                      <option value="Fintech">Fintech / Banking</option>
                      <option value="Food Delivery">Food Delivery</option>
                      <option value="E-commerce">E-commerce</option>
                      <option value="Healthtech">Healthtech</option>
                    </select>
                  </div>

                  {/* Cloud */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Preferred Cloud</label>
                    <select
                      value={formData.preferred_cloud}
                      onChange={e => setFormData({...formData, preferred_cloud: e.target.value})}
                      className="px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded text-sm text-white focus:outline-none focus:border-zinc-700"
                    >
                      <option value="AWS">Amazon Web Services</option>
                      <option value="GCP">Google Cloud Platform</option>
                      <option value="Azure">Microsoft Azure</option>
                      <option value="Multi-Cloud">Multi-Cloud / Hybrid</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Scale (Indian Standard) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Project Scale</label>
                    <select
                      value={formData.scale}
                      onChange={e => setFormData({...formData, scale: e.target.value})}
                      className="px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded text-sm text-white focus:outline-none focus:border-zinc-700"
                    >
                      <option value="10k">10,000 Users</option>
                      <option value="100k">1 Lakh Users</option>
                      <option value="1M">10 Lakh Users</option>
                      <option value="10M">1 Crore Users</option>
                    </select>
                  </div>

                  {/* Budget (Indian Standard) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Estimated Budget</label>
                    <select
                      value={formData.budget}
                      onChange={e => setFormData({...formData, budget: e.target.value})}
                      className="px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded text-sm text-white focus:outline-none focus:border-zinc-700"
                    >
                      <option value="Low">Low (₹10k - ₹50k/mo)</option>
                      <option value="Medium">Medium (₹50k - ₹2.5L/mo)</option>
                      <option value="High">High (₹2.5L+/mo)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-4 px-6 py-2.5 rounded bg-white text-black font-semibold text-sm hover:bg-zinc-250 transition-colors flex items-center justify-center gap-2 group cursor-pointer"
                >
                  Start Discovery Session
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </form>
            </motion.div>
          ) : (
            /* DISCOVERY INTERVIEW */
            <motion.div 
              key="discovery"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[550px]"
            >
              {/* Left Column: Chat Console */}
              <div className="glass-panel rounded-xl flex flex-col overflow-hidden h-[600px]">
                {/* Chat Header */}
                <div className="px-4 py-3 bg-zinc-950/80 border-b border-zinc-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 text-xs font-bold">
                      A
                    </div>
                    <span className="text-xs font-semibold text-zinc-200">Discovery Chat Session</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    STATUS: {isGenerating ? 'GENERATING ARCHITECTURE' : 'INTERVIEWING'}
                  </span>
                </div>

                {/* Messages Panel */}
                <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
                  {chatMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse text-right' : 'mr-auto text-left'}`}
                    >
                      <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-zinc-900 border-zinc-800' : 'bg-indigo-950 border-indigo-900'}`}>
                        {msg.role === 'user' ? (
                          <span className="text-[10px] font-bold text-zinc-400">U</span>
                        ) : (
                          <Bot className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                      </div>
                      <div className={`p-3 rounded-lg text-xs leading-relaxed ${msg.role === 'user' ? 'bg-zinc-900 border border-zinc-850 text-zinc-200' : 'bg-zinc-950 border border-zinc-900 text-zinc-350'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Form Input */}
                <form onSubmit={handleSendMessage} className="p-3 bg-zinc-950/80 border-t border-zinc-900 flex gap-2">
                  <input
                    type="text"
                    disabled={isGenerating}
                    placeholder={isGenerating ? "Consensus engine running, please wait..." : "Type your answer..."}
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-zinc-900/60 border border-zinc-850 rounded text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-zinc-700 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isGenerating || !chatInput.trim()}
                    className="p-2 bg-white text-black hover:bg-zinc-250 disabled:opacity-30 disabled:hover:bg-white rounded transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              {/* Right Column: Multi-Agent Thinking Screen */}
              <div className="glass-panel rounded-xl flex flex-col overflow-hidden h-[600px]">
                {/* Panel Header */}
                <div className="px-4 py-3 bg-zinc-950/80 border-b border-zinc-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-zinc-200">Consensus Engine Dashboard</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {systemLog}
                  </span>
                </div>

                {/* Agents List */}
                <div className="p-4 border-b border-zinc-900/60 flex flex-col gap-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Active Agents Network</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {agentMetadata.map((agent, i) => {
                      // Check status of agent based on current activeAgent state and logs
                      const logsForAgent = agentLogs.filter(l => l.agent === agent.name);
                      const isCompleted = logsForAgent.some(l => l.status === 'completed');
                      const isRunning = activeAgent === agent.name && !isCompleted;

                      return (
                        <div 
                          key={i} 
                          className={`p-2 rounded border flex items-center justify-between transition-all ${
                            isRunning 
                              ? 'bg-zinc-900/60 border-zinc-700 shadow-[0_0_8px_rgba(255,255,255,0.02)]' 
                              : isCompleted 
                                ? 'bg-zinc-950/20 border-emerald-950/60' 
                                : 'bg-zinc-950/40 border-zinc-900/80 opacity-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded bg-zinc-900 border border-zinc-800 shrink-0">
                              {agent.icon}
                            </div>
                            <span className="text-xs font-medium text-zinc-300">{agent.name}</span>
                          </div>
                          
                          {/* Status Dot */}
                          <div className="flex items-center gap-1.5">
                            {isRunning ? (
                              <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                              </span>
                            ) : isCompleted ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Agent Reasoning Logs Console */}
                <div className="flex-1 p-4 bg-zinc-950/60 font-mono text-[10px] text-zinc-400 overflow-y-auto flex flex-col gap-1.5">
                  <div className="text-zinc-600 mb-1 flex items-center gap-1 border-b border-zinc-900 pb-1">
                    <span className="text-[9px] bg-zinc-900 text-zinc-550 border border-zinc-850 px-1 rounded">SYS</span>
                    <span>AGENT REASONING LOGS CONSOLE</span>
                  </div>

                  {agentLogs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-zinc-650 italic">
                      Awaiting user input parameters to start agent reasoning...
                    </div>
                  ) : (
                    agentLogs.map((log, i) => (
                      <div key={i} className="leading-relaxed hover:bg-zinc-900/40 p-0.5 rounded transition-all">
                        <span className="text-indigo-400 select-none">❯</span>{' '}
                        <span className="text-zinc-500 font-bold">[{log.agent}]</span>{' '}
                        <span className={log.status === 'completed' ? 'text-emerald-400' : 'text-zinc-300'}>
                          {log.log}
                        </span>
                      </div>
                    ))
                  )}
                  <div ref={consoleEndRef} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
