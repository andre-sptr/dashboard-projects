import { describe, expect, it } from 'vitest';
import { findDuplicateByIdIhld } from '../src/lib/duplicate-check';

describe('findDuplicateByIdIhld', () => {
  const list = [
    { id: 'A1', id_ihld: 'IHLD-001' },
    { id: 'A2', id_ihld: 'IHLD-002' },
  ];

  it('returns undefined when no entry matches', () => {
    expect(findDuplicateByIdIhld(list, 'IHLD-999')).toBeUndefined();
  });

  it('returns the matching entry (case-insensitive, trimmed)', () => {
    expect(findDuplicateByIdIhld(list, '  ihld-001 ')).toEqual({ id: 'A1', id_ihld: 'IHLD-001' });
  });

  it('excludes the entry being edited via excludeId', () => {
    expect(findDuplicateByIdIhld(list, 'IHLD-001', 'A1')).toBeUndefined();
  });

  it('returns undefined for a blank id_ihld', () => {
    expect(findDuplicateByIdIhld(list, '   ')).toBeUndefined();
  });
});
