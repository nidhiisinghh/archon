'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { 
  Terminal, 
  ArrowRight, 
  Cpu, 
  Database, 
  Network, 
  ShieldCheck, 
  Zap, 
  Users 
} from 'lucide-react';

export default function LandingPage() {
  const { theme, toggleTheme } = useStore();

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
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />

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
            className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-850 text-xs text-zinc-400 hover:text-white transition-all cursor-pointer"
            title="Toggle theme mode"
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
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
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
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

          {/* Dynamic Mock Interactive Canvas Card */}
          <motion.div 
            id="demo"
            variants={itemVariants}
            className="relative rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4 md:p-6 backdrop-blur-md shadow-2xl max-w-5xl mx-auto overflow-hidden group"
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
              <div className="flex items-center gap-1 bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-800">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-mono text-emerald-400">Agent Network: Consensus Ready</span>
              </div>
            </div>

            {/* Simulated Live Diagram Render */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[220px]">
              {/* Node 1 */}
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-900 flex flex-col justify-between hover:border-zinc-800 transition-all text-left">
                <div className="flex items-start justify-between">
                  <div className="flex gap-2.5 items-center">
                    <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
                      <Cpu className="w-4 h-4 text-pink-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-200">Gateway Edge Router</h4>
                      <p className="text-[9px] text-zinc-500">API GATEWAY</p>
                    </div>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                </div>
                <div className="mt-6 pt-2 border-t border-zinc-900/60 text-[10px] font-mono text-zinc-550 flex justify-between">
                  <span>AWS API Gateway</span>
                  <span>₹2,125/mo</span>
                </div>
              </div>

              {/* Node 2 */}
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-900 flex flex-col justify-between hover:border-zinc-800 transition-all text-left relative">
                {/* Simulated connection line overlay */}
                <div className="absolute top-1/2 left-[-15px] right-full border-t border-dashed border-zinc-700 pointer-events-none hidden md:block" />
                <div className="flex items-start justify-between">
                  <div className="flex gap-2.5 items-center">
                    <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
                      <Terminal className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-200">Backend Core Services</h4>
                      <p className="text-[9px] text-zinc-500">API WORKER</p>
                    </div>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                </div>
                <div className="mt-6 pt-2 border-t border-zinc-900/60 text-[10px] font-mono text-zinc-550 flex justify-between">
                  <span>FastAPI / Docker</span>
                  <span>₹10,200/mo</span>
                </div>
              </div>

              {/* Node 3 */}
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-900 flex flex-col justify-between hover:border-zinc-800 transition-all text-left relative">
                <div className="absolute top-1/2 left-[-15px] right-full border-t border-dashed border-zinc-700 pointer-events-none hidden md:block" />
                <div className="flex items-start justify-between">
                  <div className="flex gap-2.5 items-center">
                    <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
                      <Database className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-200">PostgreSQL DB Cluster</h4>
                      <p className="text-[9px] text-zinc-500">RELATIONAL STORE</p>
                    </div>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </div>
                <div className="mt-6 pt-2 border-t border-zinc-900/60 text-[10px] font-mono text-zinc-550 flex justify-between">
                  <span>Amazon Aurora PG</span>
                  <span>₹12,750/mo</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Feature Grid */}
        <section className="mt-32 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-lg bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800/80 transition-all">
            <Network className="w-6 h-6 text-white mb-4" />
            <h3 className="text-sm font-bold text-white mb-2">Discovery Interview</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">Archon conducts structured discovery dialogs to map dependencies, constraints, and latency targets instead of blankly guessing.</p>
          </div>
          <div className="p-6 rounded-lg bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800/80 transition-all">
            <Cpu className="w-6 h-6 text-white mb-4" />
            <h3 className="text-sm font-bold text-white mb-2">Infinite Studio Canvas</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">Drag nodes, trace data flows, inspect tech choices, cost projections, and security metrics side-by-side using React Flow.</p>
          </div>
          <div className="p-6 rounded-lg bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800/80 transition-all">
            <Zap className="w-6 h-6 text-white mb-4" />
            <h3 className="text-sm font-bold text-white mb-2">Scalability Simulator</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">Slide requests volume from 10k up to 10M. Archon automatically shifts replication, sharding, caching layers and updates cost metrics.</p>
          </div>
          <div className="p-6 rounded-lg bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800/80 transition-all">
            <ShieldCheck className="w-6 h-6 text-white mb-4" />
            <h3 className="text-sm font-bold text-white mb-2">Trade-off Inspector</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">Deep-dive into recommendations. Understand Postgres vs MongoDB confidence factors, risks, alternative choices, and pricing.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
        <p>© 2026 Archon Systems Design. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors">Documentation</a>
          <a href="#" className="hover:text-white transition-colors">Security Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}
