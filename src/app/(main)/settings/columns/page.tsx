// Spreadsheet column mapping configuration
import { ColumnConfigRepository } from '@/repositories/ColumnConfigRepository';
import ColumnConfigClient from '@/components/features/settings/ColumnConfigClient';

export const dynamic = 'force-dynamic';

export default async function ColumnConfigPage() {
  const config = ColumnConfigRepository.getAll();
  return <ColumnConfigClient initialConfig={config} />;
}
