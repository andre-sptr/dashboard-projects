'use client';

import { useState, useEffect } from 'react';
import { Server, Plus, Search, Filter, Edit, Trash2 } from 'lucide-react';
import { FormModal } from '@/components/ui/FormModal';
import { OltForm } from '@/components/features/olt/OltForm';
import { ExportButton } from '@/components/ui/ExportButton';
import { exportToExcel, exportToCSV } from '@/utils/export';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import type { OltFormData } from '@/lib/validation';

interface OltDevice {
  id: string;
  hostname: string;
  ip_address: string;
  area: string;
  branch: string;
  sto: string;
  total_ports: number;
  used_ports: number;
  available_ports: number;
  status: string;
}

interface OltStats {
  total_devices: number;
  active_devices: number;
  total_ports: number;
  used_ports: number;
  available_ports: number;
  utilization_percentage: number;
}

export default function OltInventoryPage() {
  const [olts, setOlts] = useState<OltDevice[]>([]);
  const [stats, setStats] = useState<OltStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOlt, setEditingOlt] = useState<OltDevice | null>(null);
  
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  useEffect(() => {
    fetchOlts();
  }, []);

  const fetchOlts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/olt');
      
      if (!response.ok) {
        throw new Error('Failed to fetch OLT data');
      }

      const data = await response.json();
      
      if (data.success) {
        setOlts(data.data.olts || []);
        setStats(data.data.stats || null);
      } else {
        throw new Error(data.error || 'Failed to fetch OLT data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOlt = () => {
    setEditingOlt(null);
    setIsModalOpen(true);
  };

  const handleEditOlt = (olt: OltDevice) => {
    setEditingOlt(olt);
    setIsModalOpen(true);
  };

  const handleDeleteOlt = async (olt: OltDevice) => {
    const confirmed = await confirm({
      title: 'Delete OLT Device',
      message: `Are you sure you want to delete ${olt.hostname}? This action cannot be undone.`,
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/olt?id=${olt.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete OLT device');
      }

      showToast({
        type: 'success',
        message: `OLT device ${olt.hostname} deleted successfully`,
      });

      fetchOlts();
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to delete OLT device',
      });
    }
  };

  const handleSubmitOlt = async (data: OltFormData) => {
    try {
      const url = editingOlt ? `/api/olt?id=${editingOlt.id}` : '/api/olt';
      const method = editingOlt ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save OLT device');
      }

      showToast({
        type: 'success',
        message: `OLT device ${editingOlt ? 'updated' : 'created'} successfully`,
      });

      setIsModalOpen(false);
      setEditingOlt(null);
      fetchOlts();
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save OLT device',
      });
      throw err;
    }
  };

  const handleExport = (format: 'excel' | 'csv') => {
    const columns = [
      { key: 'hostname' as keyof OltDevice, label: 'Hostname' },
      { key: 'ip_address' as keyof OltDevice, label: 'IP Address' },
      { key: 'area' as keyof OltDevice, label: 'Area' },
      { key: 'branch' as keyof OltDevice, label: 'Branch' },
      { key: 'sto' as keyof OltDevice, label: 'STO' },
      { key: 'total_ports' as keyof OltDevice, label: 'Total Ports' },
      { key: 'used_ports' as keyof OltDevice, label: 'Used Ports' },
      { key: 'available_ports' as keyof OltDevice, label: 'Available Ports' },
      { key: 'status' as keyof OltDevice, label: 'Status' },
    ];

    if (format === 'excel') {
      exportToExcel(filteredOlts, columns, 'olt-inventory');
    } else {
      exportToCSV(filteredOlts, columns, 'olt-inventory');
    }

    showToast({
      type: 'success',
      message: `Data exported successfully as ${format.toUpperCase()}`,
    });
  };

  const filteredOlts = olts.filter(olt =>
    olt.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    olt.ip_address.includes(searchTerm) ||
    olt.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 80) return 'text-red-600 dark:text-red-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Server className="w-7 h-7" />
            OLT Inventory
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and monitor OLT devices
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton
            onExport={handleExport}
            disabled={filteredOlts.length === 0}
          />
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={handleAddOlt}
          >
            <Plus size={18} />
            Add OLT
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Devices</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.total_devices}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.active_devices} active
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Ports</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.total_ports.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Across all devices
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Used Ports</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.used_ports.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.available_ports.toLocaleString()} available
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Utilization</div>
            <div className={`text-2xl font-bold mt-1 ${getUtilizationColor(stats.utilization_percentage)}`}>
              {stats.utilization_percentage.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Port usage
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by hostname, IP, or area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          onClick={() => alert('Filter feature coming soon!')}
        >
          <Filter size={18} />
          Filter
        </button>
      </div>

      {/* OLT Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Loading OLT devices...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 dark:text-red-400">
            Error: {error}
          </div>
        ) : filteredOlts.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No OLT devices found matching your search.' : 'No OLT devices yet. Click "Add OLT" to get started.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Hostname
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ports
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Utilization
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOlts.map((olt) => {
                  const utilization = olt.total_ports > 0 
                    ? (olt.used_ports / olt.total_ports) * 100 
                    : 0;

                  return (
                    <tr key={olt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {olt.hostname}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 font-mono">
                        {olt.ip_address}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        <div>{olt.area || '-'}</div>
                        {olt.sto && <div className="text-xs text-gray-500 dark:text-gray-400">STO: {olt.sto}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        <div>{olt.used_ports} / {olt.total_ports}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {olt.available_ports} available
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className={`font-medium ${getUtilizationColor(utilization)}`}>
                          {utilization.toFixed(1)}%
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              utilization >= 80 ? 'bg-red-600' :
                              utilization >= 60 ? 'bg-yellow-600' :
                              'bg-green-600'
                            }`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(olt.status)}`}>
                          {olt.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditOlt(olt)}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteOlt(olt)}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results count */}
      {!loading && !error && filteredOlts.length > 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Showing {filteredOlts.length} of {olts.length} OLT devices
        </div>
      )}

      {/* Add/Edit Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingOlt(null);
        }}
        title={editingOlt ? 'Edit OLT Device' : 'Add New OLT Device'}
      >
        <OltForm
          initialData={editingOlt as any}
          onSubmit={handleSubmitOlt}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingOlt(null);
          }}
        />
      </FormModal>
    </div>
  );
}

// Made with Bob
