import { create } from 'zustand';
import { type Node, type Edge } from '@xyflow/react';

export interface Project {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  scale?: string;
  region?: string;
  target_users?: string;
  compliance?: string;
  preferred_cloud?: string;
  budget?: string;
  team_size: number;
  created_at: string;
}

export interface ComponentData {
  id: string;
  name: string;
  type: string;
  technology: string;
  responsibilities?: string;
  cost: number;
  security_notes?: string;
  scaling_notes?: string;
  dependencies: string[];
}

export interface Decision {
  id: string;
  component_name: string;
  chosen_tech: string;
  reason: string;
  evidence?: string;
  trade_offs?: string;
  confidence: number;
  alternatives: { name: string; pros: string; cons: string }[];
}

export interface Review {
  id: string;
  score: number;
  security_issues: string[];
  scalability_issues: string[];
  cost_issues: string[];
  latency_issues: string[];
  general_recommendations: string[];
  created_at: string;
}

export interface ChatMessage {
  role: 'user' | 'archon';
  content: string;
}

export interface AgentLog {
  agent: string;
  status: 'running' | 'completed';
  log: string;
}

interface AppState {
  // Theme state
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Auth state
  token: string | null;
  user: { id: string; email: string; name: string } | null;

  projects: Project[];
  currentProject: Project | null;
  versions: any[];
  currentVersion: any | null;
  nodes: Node[];
  edges: Edge[];
  decisions: Decision[];
  reviews: Review[];
  discoveryChat: ChatMessage[];
  agentThinking: AgentLog[];
  scaleFactor: number; // 0: 10k, 1: 100k, 2: 1M, 3: 10M
  isLoading: boolean;
  selectedNodeId: string | null;
  
  // Auth actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  initializeAuth: () => void;

  // API actions
  fetchProjects: () => Promise<void>;
  fetchProjectDetails: (id: string) => Promise<void>;
  createProject: (data: Partial<Project>) => Promise<Project>;
  fetchVersion: (projectId: string, versionId: string) => Promise<void>;
  saveNewVersion: (projectId: string, commitMsg: string) => Promise<void>;
  fetchDecisions: (projectId: string) => Promise<void>;
  fetchReviews: (projectId: string) => Promise<void>;
  requestReview: (projectId: string, versionId: string) => Promise<void>;
  sendStudioChatMessage: (projectId: string, message: string) => Promise<{ reply: string, isHybridFallback: boolean }>;
  exportToGitHub: (projectId: string, githubRepo: string, githubToken: string, terraformCode: string, mermaidCode: string, commitMsg: string) => Promise<string>;

  // Local actions
  setNodes: (nodes: Node[] | ((nds: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((eds: Edge[]) => Edge[])) => void;
  setSelectedNodeId: (id: string | null) => void;
  setScaleFactor: (val: number) => void;
  setDiscoveryChat: (chat: ChatMessage[]) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setAgentThinking: (logs: AgentLog[]) => void;
  addAgentLog: (log: AgentLog) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const useStore = create<AppState>((set, get) => ({
  // Theme state init
  theme: 'dark',
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    if (typeof window !== 'undefined') {
      localStorage.setItem('archon_theme', nextTheme);
    }
    set({ theme: nextTheme });
  },

  // Auth state init
  token: null,
  user: null,

  projects: [],
  currentProject: null,
  versions: [],
  currentVersion: null,
  nodes: [],
  edges: [],
  decisions: [],
  reviews: [],
  discoveryChat: [],
  agentThinking: [],
  scaleFactor: 1, // default 100k
  isLoading: false,
  selectedNodeId: null,

  login: async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) return false;
      const data = await res.json();
      localStorage.setItem('archon_token', data.access_token);
      set({ token: data.access_token });
      await get().fetchCurrentUser();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  register: async (email, password, name) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('archon_token');
    set({ token: null, user: null, projects: [], currentProject: null, versions: [], currentVersion: null, nodes: [], edges: [] });
  },

  fetchCurrentUser: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const user = await res.json();
        set({ user });
      } else {
        get().logout();
      }
    } catch (e) {
      console.error(e);
      get().logout();
    }
  },

  initializeAuth: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('archon_token');
      if (token) {
        set({ token });
        get().fetchCurrentUser();
      }
      const savedTheme = localStorage.getItem('archon_theme') as 'dark' | 'light' | null;
      if (savedTheme) {
        set({ theme: savedTheme });
      }
    }
  },

  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const headers: Record<string, string> = {};
      if (get().token) {
        headers['Authorization'] = `Bearer ${get().token}`;
      }
      const res = await fetch(`${API_BASE}/api/projects`, { headers });
      if (res.status === 401) {
        get().logout();
        return;
      }
      const data = await res.json();
      set({ projects: data });
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProjectDetails: async (id: string) => {
    set({ isLoading: true });
    try {
      const headers: Record<string, string> = {};
      if (get().token) {
        headers['Authorization'] = `Bearer ${get().token}`;
      }
      const res = await fetch(`${API_BASE}/api/projects/${id}`, { headers });
      if (res.status === 401) {
        get().logout();
        return;
      }
      const data = await res.json();
      set({ currentProject: data, versions: data.versions || [] });
      if (data.versions && data.versions.length > 0) {
        const latest = data.versions[data.versions.length - 1];
        get().fetchVersion(id, latest.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (projectData) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (get().token) {
      headers['Authorization'] = `Bearer ${get().token}`;
    }
    const res = await fetch(`${API_BASE}/api/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify(projectData),
    });
    if (res.status === 401) {
      get().logout();
      throw new Error("Session expired. Please log in again.");
    }
    if (!res.ok) throw new Error("Failed to create project");
    const data = await res.json();
    set(state => ({ projects: [data, ...state.projects] }));
    return data;
  },

  fetchVersion: async (projectId, versionId) => {
    try {
      const headers: Record<string, string> = {};
      if (get().token) {
        headers['Authorization'] = `Bearer ${get().token}`;
      }
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/versions/${versionId}`, { headers });
      if (res.status === 401) {
        get().logout();
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      
      // Build name → UUID map so connections (stored by name) resolve to node IDs
      const nameToId: Record<string, string> = {};
      (data.components || []).forEach((comp: any) => {
        nameToId[comp.name] = comp.id;
      });

      const flowNodes: Node[] = (data.components || []).map((comp: any) => ({
        id: comp.id,
        type: 'customNode',
        position: { x: comp.x, y: comp.y },
        data: {
          id: comp.id,
          name: comp.name,
          type: comp.type,
          technology: comp.technology,
          responsibilities: comp.responsibilities,
          cost: comp.cost,
          security_notes: comp.security_notes,
          scaling_notes: comp.scaling_notes,
          dependencies: comp.dependencies || []
        }
      }));

      const flowEdges: Edge[] = (data.connections || []).map((conn: any) => ({
        id: conn.id,
        source: nameToId[conn.source_id] || conn.source_id,
        target: nameToId[conn.target_id] || conn.target_id,
        label: conn.label,
        animated: conn.animated,
        type: 'smoothstep',
        style: { stroke: conn.animated ? '#6366f1' : 'rgba(255,255,255,0.20)', strokeWidth: conn.animated ? 2 : 1.5 }
      }));

      set({ 
        currentVersion: data, 
        nodes: flowNodes, 
        edges: flowEdges,
        selectedNodeId: null
      });
    } catch (e) {
      console.error(e);
    }
  },

  saveNewVersion: async (projectId, commitMsg) => {
    const { nodes, edges } = get();
    const components = nodes.map(n => ({
      name: n.data.name,
      type: n.data.type,
      technology: n.data.technology,
      x: n.position.x,
      y: n.position.y,
      responsibilities: n.data.responsibilities,
      cost: n.data.cost,
      security_notes: n.data.security_notes,
      scaling_notes: n.data.scaling_notes,
      dependencies: n.data.dependencies || []
    }));

    const connections = edges.map(e => ({
      source_id: e.source,
      target_id: e.target,
      label: e.label as string || '',
      animated: e.animated || false
    }));

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (get().token) {
        headers['Authorization'] = `Bearer ${get().token}`;
      }
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/versions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ commit_msg: commitMsg, components, connections })
      });
      if (!res.ok) return;
      const newVersion = await res.json();
      set(state => ({
        versions: [newVersion, ...state.versions],
        currentVersion: newVersion
      }));
    } catch (e) {
      console.error(e);
    }
  },

  fetchDecisions: async (projectId) => {
    try {
      const headers: Record<string, string> = {};
      if (get().token) {
        headers['Authorization'] = `Bearer ${get().token}`;
      }
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/decisions`, { headers });
      const data = await res.json();
      set({ decisions: data });
    } catch (e) {
      console.error(e);
    }
  },

  fetchReviews: async (projectId) => {
    try {
      const headers: Record<string, string> = {};
      if (get().token) {
        headers['Authorization'] = `Bearer ${get().token}`;
      }
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/reviews`, { headers });
      const data = await res.json();
      set({ reviews: data });
    } catch (e) {
      console.error(e);
    }
  },

  requestReview: async (projectId, versionId) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (get().token) {
        headers['Authorization'] = `Bearer ${get().token}`;
      }
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/reviews`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ version_id: versionId })
      });
      const data = await res.json();
      set(state => ({ reviews: [data, ...state.reviews] }));
    } catch (e) {
      console.error(e);
    }
  },

  sendStudioChatMessage: async (projectId, message) => {
    const { nodes, edges } = get();
    const components = nodes.map(n => ({
      name: n.data.name,
      type: n.data.type,
      technology: n.data.technology,
      x: n.position.x,
      y: n.position.y,
      responsibilities: n.data.responsibilities,
      cost: n.data.cost,
      security_notes: n.data.security_notes,
      scaling_notes: n.data.scaling_notes,
      dependencies: n.data.dependencies || []
    }));

    const connections = edges.map(e => ({
      source_id: e.source,
      target_id: e.target,
      label: e.label as string || '',
      animated: e.animated || false
    }));

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (get().token) {
        headers['Authorization'] = `Bearer ${get().token}`;
      }
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message, components, connections })
      });
      if (!res.ok) throw new Error("Failed to send chat message");
      const data = await res.json();
      
      const flowNodes: Node[] = (data.components || []).map((comp: any) => ({
        id: comp.id || comp.name,
        type: 'customNode',
        position: { x: comp.x, y: comp.y },
        data: {
          id: comp.id || comp.name,
          name: comp.name,
          type: comp.type,
          technology: comp.technology,
          responsibilities: comp.responsibilities,
          cost: comp.cost,
          security_notes: comp.security_notes,
          scaling_notes: comp.scaling_notes,
          dependencies: comp.dependencies || []
        }
      }));

      const flowEdges: Edge[] = (data.connections || []).map((conn: any) => ({
        id: conn.id || `edge_${conn.source_id}_${conn.target_id}`,
        source: conn.source_id,
        target: conn.target_id,
        label: conn.label,
        animated: conn.animated,
        type: 'smoothstep',
        style: { stroke: conn.animated ? '#ffffff' : 'rgba(255,255,255,0.25)' }
      }));

      set({ 
        nodes: flowNodes, 
        edges: flowEdges,
        selectedNodeId: null
      });

      get().fetchDecisions(projectId);
      
      const detailRes = await fetch(`${API_BASE}/api/projects/${projectId}`, { headers });
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        set({ versions: detailData.versions || [] });
      }

      return { reply: data.reply, isHybridFallback: data.is_hybrid_fallback };
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  exportToGitHub: async (projectId, githubRepo, githubToken, terraformCode, mermaidCode, commitMsg) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = get().token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/export-github`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        github_repo: githubRepo,
        github_token: githubToken,
        terraform_code: terraformCode,
        mermaid_code: mermaidCode,
        commit_msg: commitMsg,
      }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Failed to export to GitHub');
    }
    const data = await res.json();
    return data.pr_url;
  },

  setNodes: (nodes) => set(state => ({
    nodes: typeof nodes === 'function' ? nodes(state.nodes) : nodes
  })),

  setEdges: (edges) => set(state => ({
    edges: typeof edges === 'function' ? edges(state.edges) : edges
  })),

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setScaleFactor: (val) => set({ scaleFactor: val }),
  setDiscoveryChat: (chat) => set({ discoveryChat: chat }),
  addChatMessage: (msg) => set(state => ({ discoveryChat: [...state.discoveryChat, msg] })),
  setAgentThinking: (logs) => set({ agentThinking: logs }),
  addAgentLog: (log) => set(state => {
    const existingIdx = state.agentThinking.findIndex(l => l.agent === log.agent);
    if (existingIdx > -1) {
      const updated = [...state.agentThinking];
      updated[existingIdx] = log;
      return { agentThinking: updated };
    }
    return { agentThinking: [...state.agentThinking, log] };
  })
}));
