import React from 'react';

interface KpiCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number | string;
  accent: string;
  sub?: string;
}

export const KpiCard = ({
  icon: Icon,
  label,
  value,
  accent,
  sub,
}: KpiCardProps) => {
  return (
    <div className="glass-panel rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
            {label}
          </p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
          {sub && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">{sub}</p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${accent} shrink-0`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  );
};
