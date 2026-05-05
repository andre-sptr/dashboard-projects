import { z } from 'zod';

// Common ID validation (alphanumeric with hyphens)
export const idSchema = z
  .string()
  .min(1, 'ID tidak boleh kosong')
  .regex(/^[A-Z0-9-]+$/, 'ID harus berupa huruf kapital, angka, dan tanda hubung');

// Common name validation
export const nameSchema = z
  .string()
  .min(1, 'Nama tidak boleh kosong')
  .max(255, 'Nama terlalu panjang (maksimal 255 karakter)');

// Date string validation (YYYY-MM-DD)
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
  .refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Tanggal tidak valid');

// Optional text field
export const optionalTextSchema = z.string().optional().default('');

// Optional integer field
export const optionalIntSchema = z.coerce.number().int().optional().default(0);

// Schema for creating/updating aanwijzing
export const aanwijzingSchema = z.object({
  id: idSchema.optional(),
  nama_lop: nameSchema,
  id_ihld: z.string().min(1, 'ID IHLD tidak boleh kosong'),
  tematik: optionalTextSchema,
  tanggal_aanwijzing: dateSchema,
  catatan: optionalTextSchema,
  status_after_aanwijzing: optionalTextSchema,
  gpon: optionalTextSchema,
  frame: optionalIntSchema,
  slot_awal: optionalIntSchema,
  slot_akhir: optionalIntSchema,
  port_awal: optionalIntSchema,
  port_akhir: optionalIntSchema,
  wa_spang: optionalTextSchema,
  ut: optionalTextSchema,
});

export type AanwijzingInput = z.infer<typeof aanwijzingSchema>;

// Schema for aanwijzing query parameters
export const aanwijzingQuerySchema = z.object({
  id: idSchema,
});

// Schema for BoQ Aanwijzing
export const boqAanwijzingSchema = z.object({
  aanwijzing_id: idSchema,
  nama_lop: nameSchema,
  id_ihld: z.string().min(1, 'ID IHLD tidak boleh kosong'),
  boq_items: z.array(z.any()).optional().default([]),
});

export type BoqAanwijzingInput = z.infer<typeof boqAanwijzingSchema>;

// Schema for creating/updating UT
export const utSchema = z.object({
  id: idSchema.optional(),
  nama_lop: nameSchema,
  id_ihld: z.string().min(1, 'ID IHLD tidak boleh kosong'),
  witel: optionalTextSchema,
  tematik: optionalTextSchema,
  sto: optionalTextSchema,
  tim_ut: optionalTextSchema,
  commtest_ut: optionalTextSchema,
  jumlah_odp: optionalIntSchema,
  jumlah_port: optionalIntSchema,
  tanggal_ct_ut: z.string().optional().default(''),
  temuan: optionalTextSchema,
  follow_up_mitra: optionalIntSchema,
  mitra: optionalTextSchema,
  jumlah_temuan: optionalIntSchema,
  wa_spang: optionalTextSchema,
  komitmen_penyelesaian: optionalTextSchema,
});

export type UtInput = z.infer<typeof utSchema>;

// Schema for UT query parameters
export const utQuerySchema = z.object({
  id: idSchema,
});

// Schema for BoQ UT
export const boqUtSchema = z.object({
  ut_id: idSchema,
  nama_lop: nameSchema,
  id_ihld: z.string().min(1, 'ID IHLD tidak boleh kosong'),
  boq_items: z.array(z.any()).optional().default([]),
});

export type BoqUtInput = z.infer<typeof boqUtSchema>;

// Schema for BoQ file upload
export const boqUploadSchema = z.object({
  nama_lop: nameSchema,
  id_ihld: z.string().min(1, 'ID IHLD tidak boleh kosong'),
});

export type BoqUploadInput = z.infer<typeof boqUploadSchema>;

// Schema for BoQ query parameters
export const boqQuerySchema = z.object({
  id: idSchema,
});

// Schema for file validation
export const fileSchema = z.object({
  name: z.string().min(1, 'Nama file tidak boleh kosong'),
  size: z.number().positive('Ukuran file harus lebih dari 0'),
  type: z.string().min(1, 'Tipe file tidak boleh kosong'),
});

// Validate Excel file extension
export function validateExcelFile(filename: string): boolean {
  return filename.endsWith('.xlsx') || filename.endsWith('.xls');
}

// Validate file size (max 10MB)
export function validateFileSize(size: number, maxSizeMB: number = 10): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return size <= maxBytes;
}

// Schema for webhook request
export const webhookSchema = z.object({
});

// Parse and validate request body
export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

// Parse and validate query parameters
export function validateQuery<T>(schema: z.ZodSchema<T>, params: unknown): T {
  return schema.parse(params);
}

// Safe parse with error handling
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

// Format Zod validation errors for API response
export function formatValidationError(error: z.ZodError): string {
  const errors = error.issues.map((issue) => {
    const path = issue.path.join('.');
    return `${path}: ${issue.message}`;
  });
  return errors.join(', ');
}

// Format Zod validation errors as object
export function formatValidationErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });
  return errors;
}

