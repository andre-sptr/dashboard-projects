'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, Star } from 'lucide-react';

interface Vendor {
  id: string;
  vendor_name: string;
  vendor_code: string | null;
  contact_person: string;
  phone: string;
  email: string;
  rating: number;
  total_projects: number;
  completed_projects: number;
  on_time_delivery_rate: number;
  quality_score: number;
  status: string;
}

interface VendorStats {
  total_vendors: number;
  active_vendors: number;
  inactive_vendors: number;
  average_rating: number;
  total_contract_value: number;
}

export default function VendorManagementPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vendors');
      
      if (!response.ok) {
        throw new Error('Failed to fetch vendor data');
      }

      const data = await response.json();
      
      if (data.success) {
        setVendors(data.data.vendors || []);
        setStats(data.data.stats || null);
      } else {
        throw new Error(data.error || 'Failed to fetch vendor data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vendor.vendor_code && vendor.vendor_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    vendor.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600 dark:text-green-400';
    if (rating >= 3.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7" />
            Vendor Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage vendors and track performance
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => alert('Add Vendor feature coming soon!')}
        >
          <Plus size={18} />
          Add Vendor
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Vendors</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.total_vendors}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.active_vendors} active
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Average Rating</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1 flex items-center gap-2">
              {stats.average_rating.toFixed(1)}
              <Star size={20} className="fill-yellow-400 text-yellow-400" />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Out of 5.0
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Contract Value</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {(stats.total_contract_value / 1000000000).toFixed(1)}B
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              IDR total
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Inactive</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.inactive_vendors}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Vendors
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
            placeholder="Search by vendor name, code, or contact person..."
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

      {/* Vendor Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Loading vendors...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 dark:text-red-400">
            Error: {error}
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No vendors found matching your search.' : 'No vendors yet. Click "Add Vendor" to get started.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Projects
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredVendors.map((vendor) => {
                  const completionRate = vendor.total_projects > 0 
                    ? (vendor.completed_projects / vendor.total_projects) * 100 
                    : 0;

                  return (
                    <tr key={vendor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {vendor.vendor_name}
                        </div>
                        {vendor.vendor_code && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Code: {vendor.vendor_code}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        <div>{vendor.contact_person || '-'}</div>
                        {vendor.phone && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {vendor.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        <div>{vendor.completed_projects} / {vendor.total_projects}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {completionRate.toFixed(0)}% completed
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className={`font-medium ${getPerformanceColor(vendor.on_time_delivery_rate)}`}>
                          {vendor.on_time_delivery_rate.toFixed(0)}% on-time
                        </div>
                        <div className={`text-xs ${getPerformanceColor(vendor.quality_score)}`}>
                          {vendor.quality_score.toFixed(0)}% quality
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {renderStars(vendor.rating)}
                          <span className={`font-medium ${getRatingColor(vendor.rating)}`}>
                            {vendor.rating.toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vendor.status)}`}>
                          {vendor.status}
                        </span>
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
      {!loading && !error && filteredVendors.length > 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Showing {filteredVendors.length} of {vendors.length} vendors
        </div>
      )}
    </div>
  );
}

// Made with Bob
