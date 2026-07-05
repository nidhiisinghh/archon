'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { 
  FolderPlus, 
  GitCommit, 
  ShieldAlert, 
  Activity, 
  Search,
  Cloud,
  ChevronRight,
  TrendingUp,
  Cpu,
  Trash2,
  Sun,
  Moon
} from 'lucide-react';

export default function Dashboard() {
  const { projects, fetchProjects, isLoading, token, logout, user, theme, toggleTheme, deleteProject } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCloud, setIsCloud] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl && !apiUrl.includes('localhost')) {
      setIsCloud(true);
    }
  }, []);

  const formatScaleIndian = (scale?: string) => {
    if (!scale) return '1 Lakh';
    const val = scale.toLowerCase();
    if (val === '10k') return '10,000';
    if (val === '100k') return '1 Lakh';
    if (val === '1m') return '10 Lakh';
    if (val === '10m') return '1 Crore';
    return scale;
  };

  useEffect(() => {
    const localToken = typeof window !== 'undefined' ? localStorage.getItem('archon_token') : null;
    if (!localToken && !token) {
      router.push('/login');
    } else {
      fetchProjects();
    }
  }, [token, fetchProjects, router]);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col grid-bg">
      {/* Navigation */}
      <nav className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <Link href="/" className="w-7 h-7 rounded bg-white flex items-center justify-center font-black text-black text-sm tracking-tighter">
            A
          </Link>
          <span className="font-bold tracking-tight text-white uppercase text-base">Archon Command Center</span>
        </div>
        
        <div className="flex items-center gap-4 text-xs">
          <button
            onClick={toggleTheme}
            className="bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white p-2 rounded transition-all cursor-pointer flex items-center justify-center"
            title="Toggle theme mode"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
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

      {/* Command Center Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10 overflow-hidden">
        
        {/* Left Column: Projects Command */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="glass-panel rounded-lg p-4 flex flex-col gap-4 flex-1">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Projects</h3>
              <Link 
                href="/project/new" 
                className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
                title="Create New Project"
              >
                <FolderPlus className="w-4 h-4" />
              </Link>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-900/60 border border-zinc-850 rounded text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
              />
            </div>

            {/* Projects List */}
            <div className="flex-1 overflow-y-auto max-h-[400px] lg:max-h-[500px] flex flex-col gap-2">
              {isLoading ? (
                <div className="py-8 text-center text-xs text-zinc-500">Loading projects...</div>
              ) : filteredProjects.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center gap-3">
                  <span className="text-xs text-zinc-650">No projects found.</span>
                  <Link 
                    href="/project/new" 
                    className="text-[11px] bg-white text-black px-3 py-1.5 rounded font-semibold hover:bg-zinc-200 transition-colors"
                  >
                    Create Project
                  </Link>
                </div>
              ) : (
                filteredProjects.map(project => (
                  <div 
                    key={project.id} 
                    onClick={() => router.push(`/studio/${project.id}`)}
                    className="group relative p-3 rounded bg-zinc-900/40 border border-zinc-900 hover:border-zinc-850 hover:bg-zinc-900/80 transition-all flex flex-col gap-1 text-left cursor-pointer"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-200 group-hover:text-white">{project.name}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
                              deleteProject(project.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-650 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                    {project.description && (
                      <p className="text-[11px] text-zinc-500 truncate max-w-[200px]">{project.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-[9px] font-mono text-zinc-400">
                      <span className="flex items-center gap-0.5">
                        <Cloud className="w-3 h-3 text-zinc-500" />
                        {project.preferred_cloud || 'Any'}
                      </span>
                      <span className="bg-zinc-950 border border-zinc-900 px-1 rounded">
                        {formatScaleIndian(project.scale)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Center: Architecture Version History Timeline */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="glass-panel rounded-lg p-4 flex flex-col gap-4 flex-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Global Architecture Timeline</h3>
            
            <div className="flex-1 overflow-y-auto max-h-[500px] flex flex-col gap-4">
              {projects.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-zinc-500 py-16">
                  Create a project to populate the timeline.
                </div>
              ) : (
                projects.map(project => (
                  <div key={project.id} className="border-l border-zinc-850 pl-4 py-1 relative">
                    {/* Bullet marker */}
                    <div className="absolute left-[-4.5px] top-2.5 w-2.5 h-2.5 rounded-full bg-zinc-800 border border-zinc-650" />
                    
                    <div className="flex items-center gap-2 mb-1.5">
                      <Link href={`/studio/${project.id}`} className="text-xs font-bold text-zinc-200 hover:text-white">
                        {project.name}
                      </Link>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Commit log elements */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <GitCommit className="w-3.5 h-3.5 text-indigo-400" />
                        <span>v1: Initial AI Discovery Architecture</span>
                      </div>
                      <p className="text-[10px] font-mono text-zinc-500 pl-5">
                        Generated by Requirements & Database Specialty Agents.
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Reviews */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="glass-panel rounded-lg p-4 flex flex-col gap-4 flex-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Recent Reviews</h3>
            
            <div className="flex-1 overflow-y-auto max-h-[500px] flex flex-col gap-3">
              {projects.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-zinc-500 py-16">
                  No active reviews.
                </div>
              ) : (
                projects.map(project => (
                  <div key={project.id} className="p-3 rounded bg-zinc-900/20 border border-zinc-900 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Project Review</span>
                        <h4 className="text-xs font-bold text-zinc-300">{project.name}</h4>
                      </div>
                      <div className="bg-emerald-950 border border-emerald-900 text-emerald-400 text-xs px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        86/100
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1 border-t border-zinc-900/60 pt-2 text-[10px] text-zinc-400">
                      <div className="flex gap-1.5 items-start">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="line-clamp-2">API Gateway open, check WAF settings.</p>
                      </div>
                      <div className="flex gap-1.5 items-start mt-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="line-clamp-2">RDS PG primary needs VPC private bindings.</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Panel: Activity Feed */}
      <footer className="relative z-10 border-t border-zinc-900 bg-zinc-950/80 p-4 max-w-7xl w-full mx-auto flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span className="text-zinc-650">SYSTEM ACTIVITY:</span>
          <span>Agent Database Specialist compiled PostgreSQL schemas for project stack.</span>
        </div>
        <div className="text-[10px] text-zinc-600 font-mono">
          REF: 11a631f0
        </div>
      </footer>
    </div>
  );
}
