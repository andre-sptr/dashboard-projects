// Detects an existing record that a save for the given id_ihld would overwrite.
// Shared by the BoQ Plan, AANWIJZING, and Rekap UT pages to confirm before overwriting.

export interface IdentifiableRecord {
  id?: string;
  id_ihld: string;
}

export function findDuplicateByIdIhld<T extends IdentifiableRecord>(
  list: T[],
  idIhld: string,
  excludeId?: string | null
): T | undefined {
  const target = (idIhld || '').trim().toLowerCase();
  if (!target) return undefined;
  return list.find(
    (item) => (item.id_ihld || '').trim().toLowerCase() === target && item.id !== excludeId
  );
}
