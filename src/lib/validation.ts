import { z } from 'zod';

// Common ID validation (alphanumeric, hyphens, underscores)
export const idSchema = z
  .string()
  .min(1, 'ID tidak boleh kosong')
  .regex(/^[a-zA-Z0-9-_]+$/, 'ID harus berupa huruf, angka, tanda hubung, atau garis bawah');

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
  area: optionalTextSchema,
  sto: optionalTextSchema,
  tanggal_aanwijzing: dateSchema,
  catatan: optionalTextSchema,
  status_after_aanwijzing: optionalTextSchema,
  gpon: optionalTextSchema,
  odc_name: optionalTextSchema,
  frame: optionalIntSchema,
  slot_awal: optionalIntSchema,
  slot_akhir: optionalIntSchema,
  port_awal: optionalIntSchema,
  port_akhir: optionalIntSchema,
  wa_spang: optionalTextSchema,
  ut: optionalTextSchema,
  allow_overwrite: z.boolean().optional().default(false),
});

export type AanwijzingInput = z.infer<typeof aanwijzingSchema>;

// Schema for aanwijzing query parameters
export const aanwijzingQuerySchema = z.object({
  id: idSchema,
});

export const boqItemSchema = z.object({
  designator: z.string().min(1, 'Designator tidak boleh kosong'),
  volume: z.coerce.number().nonnegative('Volume harus non-negatif'),
  price: z.coerce.number().nonnegative('Harga harus non-negatif'),
  total: z.coerce.number().nonnegative('Total harus non-negatif'),
  kind: z.string().optional(),
  sort_no: z.coerce.number().int().optional().default(0),
});

// Schema for BoQ Aanwijzing
export const boqAanwijzingSchema = z.object({
  aanwijzing_id: idSchema,
  nama_lop: nameSchema,
  id_ihld: z.string().min(1, 'ID IHLD tidak boleh kosong'),
  boq_items: z.array(boqItemSchema).optional().default([]),
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
  boq_items: z.array(boqItemSchema).optional().default([]),
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

/**
 * Validate magic bytes (file signature) of the uploaded file to ensure it matches its extension.
 */
export function validateMagicBytes(arrayBuffer: ArrayBuffer, filename: string): boolean {
  const uint8 = new Uint8Array(arrayBuffer.slice(0, 4));
  const hex = Array.from(uint8)
    .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
    .join(' ');
  
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  switch (ext) {
    case '.xlsx':
    case '.docx':
      // ZIP-based Office Open XML format starts with "PK\x03\x04" (50 4B 03 04)
      return hex.startsWith('50 4B 03 04');
    case '.xls':
    case '.doc':
      // OLE2 / Compound File Binary Format starts with D0 CF 11 E0
      return hex.startsWith('D0 CF 11 E0');
    case '.pdf':
      // PDF format starts with "%PDF" (25 50 44 46)
      return hex.startsWith('25 50 44 46');
    case '.png':
      // PNG starts with 89 50 4E 47
      return hex.startsWith('89 50 4E 47');
    case '.jpg':
    case '.jpeg':
      // JPEG starts with FF D8 FF
      return hex.startsWith('FF D8 FF');
    case '.txt':
      // Text files have no fixed signature, we just allow it
      return true;
    default:
      return false;
  }
}

// Schema for webhook request
export const webhookSchema = z.object({
  api_key: z.string().optional(),
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




