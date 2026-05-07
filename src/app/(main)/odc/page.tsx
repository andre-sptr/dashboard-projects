'use client';

import { useState, useEffect } from 'react';
import { Box, Plus, Search, Filter, Edit, Trash2 } from 'lucide-react';
import { FormModal } from '@/components/ui/FormModal';
import { OdcForm } from '@/components/features/odc/OdcForm';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import type { OdcFormData } from '@/lib/validation';

interface OdcDevice {
  id: string;
  odc_name: string;
  regional: string;
  witel: string;
  datel: string;
  sto: string;
  splitter_type: string;
  max_capacity: number;
  used_capacity: number;
  available_capacity: number;
  status: string;
  polygon_status: string;
}

interface OdcStats {
  total_odcs: number;
  active_odcs: number;
  total_capacity: number;
  used_capacity: number;
  available_capacity: number;
  utilization_percentage: number;
}

export default function OdcInventoryPage() {
  const [odcs, setOdcs] = useState<OdcDevice[]>([]);
  const [stats, setStats] = useState<OdcStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOdc, setEditingOdc] = useState<OdcDevice | null>(null);
  
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  useEffect(() => {
    fetchOdcs();
  }, []);

  const fetchOdcs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/odc');
      
      if (!response.ok) {
        throw new Error('Failed to fetch ODC data');
      }

      const data = await response.json();
      
      if (data.success) {
        setOdcs(data.data.odcs || []);
        setStats(data.data.stats || null);
      } else {
        throw new Error(data.error || 'Failed to fetch ODC data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOdc = () => {
    setEditingOdc(null);
    setIsModalOpen(true);
  };

  const handleEditOdc = (odc: OdcDevice) => {
    setEditingOdc(odc);
    setIsModalOpen(true);
  };

  const handleDeleteOdc = async (odc: OdcDevice) => {
    const confirmed = await confirm({
      title: 'Delete ODC',
      message: `Are you sure you want to delete ${odc.odc_name}? This action cannot be undone.`,
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/odc?id=${odc.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete ODC');
      }

      showToast({
        type: 'success',
        message: `ODC ${odc.odc_name} deleted successfully`,
      });

      fetchOdcs();
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to delete ODC',
      });
    }
  };

  const handleSubmitOdc = async (data: OdcFormData) => {
    try {
      const url = editingOdc ? `/api/odc?id=${editingOdc.id}` : '/api/odc';
      const method = editingOdc ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save ODC');
      }

      showToast({
        type: 'success',
        message: `ODC ${editingOdc ? 'updated' : 'created'} successfully`,
      });

      setIsModalOpen(false);
      setEditingOdc(null);
      fetchOdcs();
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save ODC',
      });
      throw err;
    }
  };

  const filteredOdcs = odcs.filter(odc =>
    odc.odc_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    odc.sto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    odc.regional.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getPolygonStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'planned':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
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
            <Box className="w-7 h-7" />
            ODC Inventory
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage Optical Distribution Cabinets
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={handleAddOdc}
        >
          <Plus size={18} />
          Add ODC
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total ODCs</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.total_odcs}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.active_odcs} active
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Capacity</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.total_capacity.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Splitter ports
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Used Capacity</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.used_capacity.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.available_capacity.toLocaleString()} available
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Utilization</div>
            <div className={`text-2xl font-bold mt-1 ${getUtilizationColor(stats.utilization_percentage)}`}>
              {stats.utilization_percentage.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Capacity usage
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
            placeholder="Search by ODC name, STO, or regional..."
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

      {/* ODC Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Loading ODC devices...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 dark:text-red-400">
            Error: {error}
          </div>
        ) : filteredOdcs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No ODC devices found matching your search.' : 'No ODC devices yet. Click "Add ODC" to get started.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ODC Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Splitter Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Capacity
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
                {filteredOdcs.map((odc) => {
                  const utilization = odc.max_capacity > 0 
                    ? (odc.used_capacity / odc.max_capacity) * 100 
                    : 0;

                  return (
                    <tr key={odc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {odc.odc_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        <div>{odc.regional || '-'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          STO: {odc.sto}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {odc.splitter_type || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        <div>{odc.used_capacity} / {odc.max_capacity}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {odc.available_capacity} available
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
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(odc.status)}`}>
                            {odc.status}
                          </span>
                          <div>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPolygonStatusColor(odc.polygon_status)}`}>
                              {odc.polygon_status}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditOdc(odc)}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteOdc(odc)}
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
      {!loading && !error && filteredOdcs.length > 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Showing {filteredOdcs.length} of {odcs.length} ODC devices
        </div>
      )}

      {/* Add/Edit Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingOdc(null);
        }}
        title={editingOdc ? 'Edit ODC' : 'Add New ODC'}
      >
        <OdcForm
          initialData={editingOdc as any}
          onSubmit={handleSubmitOdc}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingOdc(null);
          }}
        />
      </FormModal>
    </div>
  );
}

// Made with Bob
