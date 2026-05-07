// Visual representation of network node hierarchy
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Network, 
  ChevronRight, 
  ChevronDown, 
  Zap, 
  Box, 
  Database, 
  Activity,
  Maximize2,
  Minimize2,
  Filter
} from 'lucide-react';
import { 
  TopologyHierarchy,
  OltData
} from '@/lib/topology';


const StatusBadge = ({ status }: { status: string }) => {
  const s = status.toLowerCase();
  if (s.includes('done') || s.includes('complete') || s.includes('live')) {
    return <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />;
  }
  if (s.includes('progress') || s.includes('ongoing')) {
    return <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />;
  }
  return <span className="flex h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />;
};

export default function NetworkTopology({ initialData }: { initialData: TopologyHierarchy | null }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ 'ROOT': true });
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  useEffect(() => {
    if (!initialData) {
      fetch('/api/topology')
        .then(res => res.json())
        .then(response => {
          if (response.success) {
            setData(response.data);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching topology:', err);
          setLoading(false);
        });
    }
  }, [initialData]);

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const areas = Object.keys(data || {});

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin" />
            <Network className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
        </div>
        <p className="text-sm font-bold text-gray-500 animate-pulse uppercase tracking-widest">Generating Topology Map...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 rounded-xl text-white">
                <Network size={18} />
                <span className="text-xs font-black uppercase tracking-wider">Network Topology</span>
            </div>
            
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 hidden md:block" />
            
            <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <select 
                    value={selectedArea}
                    onChange={(e) => { setSelectedArea(e.target.value); setSelectedBranch(''); }}
                    className="bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer"
                >
                    <option value="">ALL AREAS</option>
                    {areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
            </div>

            {selectedArea && (
                <div className="flex items-center gap-2">
                    <select 
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer"
                    >
                        <option value="">ALL BRANCHES</option>
                        {Object.keys((data?.[selectedArea] || {})).map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
            )}
        </div>

        <div className="flex items-center gap-3">
            <button 
                onClick={() => setExpandedNodes({ 'ROOT': true })}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                title="Collapse All"
            >
                <Minimize2 size={18} />
            </button>
            <button 
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                title="Fullscreen"
            >
                <Maximize2 size={18} />
            </button>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden min-h-[600px] bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.05),transparent)]">
        <div className="relative max-w-4xl mx-auto">
            <div className="flex flex-col items-center">
                <div className="relative group cursor-pointer">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative px-6 py-4 bg-white dark:bg-gray-900 ring-1 ring-gray-900/5 rounded-2xl flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Core Network</h4>
                            <p className="text-xl font-black text-gray-900 dark:text-white">SUMBAGTENG</p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 w-full space-y-12">
                    {areas
                      .filter(a => !selectedArea || a === selectedArea)
                      .map((area) => (
                        <div key={area} className="relative pl-8">
                            <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 to-transparent" />
                            
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-4 h-px bg-blue-500/50" />
                                <div 
                                    className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                                    onClick={() => toggleNode(`AREA-${area}`)}
                                >
                                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                        <Box size={14} /> AREA: {area}
                                        {expandedNodes[`AREA-${area}`] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </span>
                                </div>
                            </div>

                            {expandedNodes[`AREA-${area}`] && Object.keys(data?.[area] || {})
                                .filter(b => !selectedBranch || b === selectedBranch)
                                .map((branch) => (
                                    <div key={branch} className="ml-8 mb-8 relative">
                                        <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800" />
                                        
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-4 h-px bg-gray-200 dark:bg-gray-800" />
                                            <div 
                                                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                onClick={() => toggleNode(`BRANCH-${branch}`)}
                                            >
                                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                                    <Database size={12} /> BRANCH: {branch}
                                                    {expandedNodes[`BRANCH-${branch}`] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                </span>
                                            </div>
                                        </div>

                                        {expandedNodes[`BRANCH-${branch}`] && (Object.values((data?.[area]?.[branch] as any) || {}) as OltData[]).map((olt: OltData) => (
                                            <div key={olt.name} className="ml-8 mt-6">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="relative group">
                                                        <div className="absolute -inset-0.5 bg-emerald-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                                        <div className="relative flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-2 border-emerald-500/30 rounded-xl shadow-sm">
                                                            <div className="p-2 bg-emerald-500 rounded-lg text-white">
                                                                <Zap size={16} />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">OLT (GPON)</span>
                                                                    <StatusBadge status={olt.status} />
                                                                </div>
                                                                <p className="text-xs font-bold text-gray-900 dark:text-white">{olt.name}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/50 to-transparent" />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-4">
                                                    {Object.values(olt.odcs || {}).map((odc) => (
                                                        <div key={odc.name} className="relative p-4 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-2xl hover:border-blue-500/50 transition-colors group">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                                                                        <Box size={14} />
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">ODC Cabinet</span>
                                                                        <h5 className="text-[10px] font-black text-gray-900 dark:text-white truncate max-w-[120px]" title={odc.name}>{odc.name}</h5>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-[8px] font-black text-gray-500 uppercase">{odc.realizedPorts} / {odc.plannedPorts} Ports</span>
                                                                    <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                                                                        <div 
                                                                            className="h-full bg-blue-500 rounded-full" 
                                                                            style={{ width: `${Math.min(100, (odc.realizedPorts / odc.plannedPorts) * 100 || 0)}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap gap-1.5">
                                                                {odc.odps.slice(0, 12).map((odp, idx) => (
                                                                    <div 
                                                                        key={`${odp.id}-${idx}`} 
                                                                        className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all cursor-help
                                                                            ${odp.status.toLowerCase().includes('done') 
                                                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500/30 text-emerald-600' 
                                                                                : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'
                                                                            }`}
                                                                        title={`${odp.name} - ${odp.status}`}
                                                                    >
                                                                        <Zap size={8} className={odp.status.toLowerCase().includes('done') ? 'fill-current' : ''} />
                                                                    </div>
                                                                ))}
                                                                {odc.odps.length > 12 && (
                                                                    <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                                                                        <span className="text-[8px] font-bold text-gray-400">+{odc.odps.length - 12}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                        </div>
                      ))}
                </div>
            </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-8 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Live / Done</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">In-Progress</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Planned</span>
        </div>
      </div>
    </div>
  );
}
