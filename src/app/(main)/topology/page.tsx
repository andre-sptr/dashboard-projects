'use client';

import NetworkTopology from '@/components/features/topology/NetworkTopology';

export default function TopologyPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            NETWORK <span className="text-blue-600">TOPOLOGY</span>
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Visualisasi hirarki infrastruktur OLT (GPON) → ODC → ODP.
          </p>
        </div>
      </div>

      <NetworkTopology initialData={null} />
    </div>
  );
}
