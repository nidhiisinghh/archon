import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { 
  Database, 
  Server, 
  Cpu, 
  Layers, 
  Globe, 
  Workflow,
  Shield,
  Zap
} from 'lucide-react';

const CustomNode = ({ data, selected }: { data: any; selected?: boolean }) => {
  const { name, type, technology, cost } = data;

  const getIcon = () => {
    switch (type.toLowerCase()) {
      case 'database':
        return <Database className="w-5 h-5 text-emerald-400" />;
      case 'gateway':
        return <Globe className="w-5 h-5 text-sky-400" />;
      case 'cache':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'queue':
        return <Workflow className="w-5 h-5 text-purple-400" />;
      case 'service':
        return <Server className="w-5 h-5 text-indigo-400" />;
      case 'client':
        return <Cpu className="w-5 h-5 text-pink-400" />;
      default:
        return <Layers className="w-5 h-5 text-zinc-400" />;
    }
  };

  const getBorderColor = () => {
    if (selected) return 'border-white ring-2 ring-white/10';
    switch (type.toLowerCase()) {
      case 'database': return 'border-emerald-500/30 hover:border-emerald-500/60';
      case 'gateway': return 'border-sky-500/30 hover:border-sky-500/60';
      case 'cache': return 'border-amber-500/30 hover:border-amber-500/60';
      case 'queue': return 'border-purple-500/30 hover:border-purple-500/60';
      case 'service': return 'border-indigo-500/30 hover:border-indigo-500/60';
      default: return 'border-zinc-800 hover:border-zinc-700';
    }
  };

  const getGlowColor = () => {
    switch (type.toLowerCase()) {
      case 'database': return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
      case 'gateway': return 'bg-sky-500 shadow-[0_0_10px_rgba(56,189,248,0.5)]';
      case 'cache': return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
      case 'queue': return 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]';
      case 'service': return 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]';
      default: return 'bg-zinc-500 shadow-[0_0_10px_rgba(255,255,255,0.2)]';
    }
  };

  return (
    <div className={`px-4 py-3 rounded-lg bg-zinc-950/90 border backdrop-blur-md text-left w-60 shadow-xl transition-all duration-200 ${getBorderColor()}`}>
      {/* Handles */}
      <Handle type="target" position={Position.Top} className="!bg-zinc-600" />
      
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
            {getIcon()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 tracking-wide truncate max-w-[140px]">{name}</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{type}</p>
          </div>
        </div>
        
        {/* Glow status dot */}
        <div className={`w-2 h-2 rounded-full ${getGlowColor()}`} />
      </div>

      <div className="mt-2 pt-2 border-t border-zinc-900 flex justify-between items-center">
        <span className="text-[11px] font-mono text-zinc-400 truncate max-w-[120px]">{technology}</span>
        {cost > 0 && (
          <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
            ₹{new Intl.NumberFormat('en-IN').format(cost * 85)}/mo
          </span>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-zinc-600" />
    </div>
  );
};

export default memo(CustomNode);
