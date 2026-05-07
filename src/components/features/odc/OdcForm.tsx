'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { odcFormSchema, type OdcFormData } from '@/lib/validation';

interface OdcFormProps {
  initialData?: Partial<OdcFormData>;
  onSubmit: (data: OdcFormData) => Promise<void>;
  onCancel: () => void;
}

export function OdcForm({ initialData, onSubmit, onCancel }: OdcFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<OdcFormData>({
    resolver: zodResolver(odcFormSchema),
    defaultValues: {
      odc_name: initialData?.odc_name || '',
      sto: initialData?.sto || '',
      regional: initialData?.regional || '',
      witel: initialData?.witel || '',
      datel: initialData?.datel || '',
      olt_id: initialData?.olt_id || '',
      splitter_type: initialData?.splitter_type || '',
      max_capacity: initialData?.max_capacity || 48,
      latitude: initialData?.latitude || '',
      longitude: initialData?.longitude || '',
      polygon_status: initialData?.polygon_status ?? 'planned',
      status: initialData?.status ?? 'active',
      installation_date: initialData?.installation_date || '',
      notes: initialData?.notes || '',
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ODC Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            ODC Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('odc_name')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="ODC-PKU-001"
          />
          {errors.odc_name && (
            <p className="text-red-500 text-sm mt-1">{errors.odc_name.message}</p>
          )}
        </div>

        {/* STO */}
        <div>
          <label className="block text-sm font-medium mb-1">
            STO <span className="text-red-500">*</span>
          </label>
          <input
            {...register('sto')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="PKU"
          />
          {errors.sto && (
            <p className="text-red-500 text-sm mt-1">{errors.sto.message}</p>
          )}
        </div>

        {/* Regional */}
        <div>
          <label className="block text-sm font-medium mb-1">Regional</label>
          <input
            {...register('regional')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="Sumbagteng"
          />
        </div>

        {/* Witel */}
        <div>
          <label className="block text-sm font-medium mb-1">Witel</label>
          <input
            {...register('witel')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="Pekanbaru"
          />
        </div>

        {/* Datel */}
        <div>
          <label className="block text-sm font-medium mb-1">Datel</label>
          <input
            {...register('datel')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="Pekanbaru"
          />
        </div>

        {/* Splitter Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Splitter Type</label>
          <select
            {...register('splitter_type')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Type</option>
            <option value="1:8">1:8</option>
            <option value="1:16">1:16</option>
            <option value="1:32">1:32</option>
            <option value="1:64">1:64</option>
          </select>
        </div>

        {/* Max Capacity */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Max Capacity <span className="text-red-500">*</span>
          </label>
          <input
            {...register('max_capacity', { valueAsNumber: true })}
            type="number"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="48"
          />
          {errors.max_capacity && (
            <p className="text-red-500 text-sm mt-1">{errors.max_capacity.message}</p>
          )}
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

        {/* Polygon Status */}
        <div>
          <label className="block text-sm font-medium mb-1">Polygon Status</label>
          <select
            {...register('polygon_status')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
          >
            <option value="planned">Planned</option>
            <option value="surveyed">Surveyed</option>
            <option value="approved">Approved</option>
            <option value="deployed">Deployed</option>
          </select>
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