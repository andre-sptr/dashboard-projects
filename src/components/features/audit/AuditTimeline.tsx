'use client';

import React, { useState, useEffect } from 'react';
import { 
  History, 
  User, 
  Tag, 
  Calendar, 
  Info, 
  ChevronRight, 
  Search,
  Filter,
  Loader2,
  Clock,
  ArrowRight
} from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value: string;
  new_value: string;
  created_at: string;
}

export default function AuditTimeline() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/audit-logs?limit=100');
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || log.entity_type.toLowerCase() === filterType.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });

  const getActionColor = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('create') || a.includes('upload')) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
    if (a.includes('delete') || a.includes('remove')) return 'text-red-600 bg-red-50 dark:bg-red-900/20';
    if (a.includes('update') || a.includes('change')) return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
    return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
            <History size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Audit Timeline</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Track all system activities and changes</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">All Entities</option>
            <option value="project">Project</option>
            <option value="document">Document</option>
            <option value="sync">Sync</option>
          </select>
        </div>
      </div>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800 hidden md:block" />

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <span className="text-sm font-medium">Loading activity logs...</span>
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="space-y-8">
            {filteredLogs.map((log, idx) => (
              <div key={log.id} className="relative pl-0 md:pl-16 group animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${idx * 50}ms` }}>
                {/* Timeline Dot */}
                <div className="absolute left-[29px] top-1.5 w-3 h-3 rounded-full bg-white dark:bg-gray-900 border-2 border-indigo-500 z-10 hidden md:block group-hover:scale-125 transition-transform" />
                
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                        <Tag size={14} />
                        <span className="text-xs font-semibold">{log.entity_type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <User size={14} />
                        <span>{log.user_id === 'SYSTEM' ? 'System' : 'Administrator'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        <span>{new Date(log.created_at).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="text-gray-400">Entity ID:</span>
                      <code className="bg-gray-50 dark:bg-gray-900 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400 text-xs">
                        {log.entity_id}
                      </code>
                    </div>

                    {(log.old_value || log.new_value) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        {log.old_value && (
                          <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Previous</span>
                            <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 break-all">
                              {log.old_value}
                            </div>
                          </div>
                        )}
                        {log.new_value && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800/50">
                            <span className="text-[10px] font-bold text-blue-400 dark:text-blue-500 uppercase tracking-widest block mb-1">New Value</span>
                            <div className="text-xs text-blue-700 dark:text-blue-300 line-clamp-2 break-all">
                              {log.new_value}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-gray-400 gap-3">
            <History size={48} strokeWidth={1} />
            <p className="text-sm font-medium">No activity logs found</p>
          </div>
        )}
      </div>
    </div>
  );
}
