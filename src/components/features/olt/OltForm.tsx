'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { oltFormSchema, type OltFormData } from '@/lib/validation';

interface OltFormProps {
  initialData?: Partial<OltFormData>;
  onSubmit: (data: OltFormData) => Promise<void>;
  onCancel: () => void;
}

export function OltForm({ initialData, onSubmit, onCancel }: OltFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<OltFormData>({
    resolver: zodResolver(oltFormSchema),
    defaultValues: initialData || {
      status: 'active',
      total_ports: 48
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hostname */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Hostname <span className="text-red-500">*</span>
          </label>
          <input
            {...register('hostname')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="OLT-PKU-01"
          />
          {errors.hostname && (
            <p className="text-red-500 text-sm mt-1">{errors.hostname.message}</p>
          )}
        </div>

        {/* IP Address */}
        <div>
          <label className="block text-sm font-medium mb-1">
            IP Address <span className="text-red-500">*</span>
          </label>
          <input
            {...register('ip_address')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="10.10.1.1"
          />
          {errors.ip_address && (
            <p className="text-red-500 text-sm mt-1">{errors.ip_address.message}</p>
          )}
        </div>

        {/* Brand */}
        <div>
          <label className="block text-sm font-medium mb-1">Brand</label>
          <input
            {...register('brand')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="Huawei"
          />
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium mb-1">Model</label>
          <input
            {...register('model')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="MA5800-X7"
          />
        </div>

        {/* Software Version */}
        <div>
          <label className="block text-sm font-medium mb-1">Software Version</label>
          <input
            {...register('software_version')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="V800R021C00"
          />
        </div>

        {/* Serial Number */}
        <div>
          <label className="block text-sm font-medium mb-1">Serial Number</label>
          <input
            {...register('serial_number')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="SN123456789"
          />
        </div>

        {/* Location Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Location Name</label>
          <input
            {...register('location_name')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="STO Pekanbaru"
          />
        </div>

        {/* Area */}
        <div>
          <label className="block text-sm font-medium mb-1">Area</label>
          <input
            {...register('area')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="Pekanbaru"
          />
        </div>

        {/* Branch */}
        <div>
          <label className="block text-sm font-medium mb-1">Branch</label>
          <input
            {...register('branch')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="Sumbagteng"
          />
        </div>

        {/* STO */}
        <div>
          <label className="block text-sm font-medium mb-1">STO</label>
          <input
            {...register('sto')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="PKU"
          />
        </div>

        {/* Latitude */}
        <div>
          <label className="block text-sm font-medium mb-1">Latitude</label>
          <input
            {...register('latitude')}
            type="number"
            step="any"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="0.5071"
          />
          {errors.latitude && (
            <p className="text-red-500 text-sm mt-1">{errors.latitude.message}</p>
          )}
        </div>

        {/* Longitude */}
        <div>
          <label className="block text-sm font-medium mb-1">Longitude</label>
          <input
            {...register('longitude')}
            type="number"
            step="any"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="101.4478"
          />
          {errors.longitude && (
            <p className="text-red-500 text-sm mt-1">{errors.longitude.message}</p>
          )}
        </div>

        {/* Total Ports */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Total Ports <span className="text-red-500">*</span>
          </label>
          <input
            {...register('total_ports', { valueAsNumber: true })}
            type="number"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="48"
          />
          {errors.total_ports && (
            <p className="text-red-500 text-sm mt-1">{errors.total_ports.message}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            {...register('status')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        {/* Installation Date */}
        <div>
          <label className="block text-sm font-medium mb-1">Installation Date</label>
          <input
            {...register('installation_date')}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
          placeholder="Additional notes..."
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

// Made with Bob
