'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vendorFormSchema, type VendorFormData } from '@/lib/validation';

interface VendorFormProps {
  initialData?: Partial<VendorFormData>;
  onSubmit: (data: VendorFormData) => Promise<void>;
  onCancel: () => void;
}

export function VendorForm({ initialData, onSubmit, onCancel }: VendorFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      vendor_name: initialData?.vendor_name || '',
      vendor_code: initialData?.vendor_code || '',
      contact_person: initialData?.contact_person || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      address: initialData?.address || '',
      contract_start_date: initialData?.contract_start_date || '',
      contract_end_date: initialData?.contract_end_date || '',
      contract_value: initialData?.contract_value || 0,
      rating: initialData?.rating || 0,
      status: initialData?.status || 'active',
      notes: initialData?.notes || '',
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vendor Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Vendor Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('vendor_name')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="PT. Vendor Name"
          />
          {errors.vendor_name && (
            <p className="text-red-500 text-sm mt-1">{errors.vendor_name.message}</p>
          )}
        </div>

        {/* Vendor Code */}
        <div>
          <label className="block text-sm font-medium mb-1">Vendor Code</label>
          <input
            {...register('vendor_code')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="VND-001"
          />
        </div>

        {/* Contact Person */}
        <div>
          <label className="block text-sm font-medium mb-1">Contact Person</label>
          <input
            {...register('contact_person')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="John Doe"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            {...register('phone')}
            type="tel"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="+62 812 3456 7890"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            {...register('email')}
            type="email"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="contact@vendor.com"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
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
          </select>
        </div>

        {/* Contract Start Date */}
        <div>
          <label className="block text-sm font-medium mb-1">Contract Start Date</label>
          <input
            {...register('contract_start_date')}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Contract End Date */}
        <div>
          <label className="block text-sm font-medium mb-1">Contract End Date</label>
          <input
            {...register('contract_end_date')}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Contract Value */}
        <div>
          <label className="block text-sm font-medium mb-1">Contract Value (IDR)</label>
          <input
            {...register('contract_value', { valueAsNumber: true })}
            type="number"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="1000000000"
          />
          {errors.contract_value && (
            <p className="text-red-500 text-sm mt-1">{errors.contract_value.message}</p>
          )}
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium mb-1">Rating (0-5)</label>
          <input
            {...register('rating', { valueAsNumber: true })}
            type="number"
            step="0.1"
            min="0"
            max="5"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            placeholder="4.5"
          />
          {errors.rating && (
            <p className="text-red-500 text-sm mt-1">{errors.rating.message}</p>
          )}
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <textarea
          {...register('address')}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
          placeholder="Full address..."
        />
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