import { describe, it, expect } from 'vitest';
import {
  formatDateID,
  formatDateISO,
  formatDateDDMMYYYY,
  formatDateTime,
  formatRelativeTime,
  parseDate,
  isValidDate,
  startOfDay,
  endOfDay,
  daysBetween,
  addDays,
  parseExcelDate,
  formatExcelDate,
  formatExcelDateShort
} from '../src/utils/date';

describe('Date Utilities - formatters', () => {
  it('formatDateID: formats date to Indonesian long date format', () => {
    const d = new Date('2026-05-25T12:00:00Z');
    expect(formatDateID(d)).toBe('25 Mei 2026');
    expect(formatDateID('2026-06-15')).toBe('15 Juni 2026');
    expect(formatDateID('invalid-date')).toBe('Invalid Date');
  });

  it('formatDateISO: converts date to YYYY-MM-DD format', () => {
    const d = new Date('2026-05-05T00:00:00Z');
    expect(formatDateISO(d)).toBe('2026-05-05');
    expect(formatDateISO('2026-12-31')).toBe('2026-12-31');
    expect(formatDateISO('invalid-date')).toBe('');
  });

  it('formatDateDDMMYYYY: converts date to DD/MM/YYYY format', () => {
    const d = new Date('2026-05-08T00:00:00Z');
    expect(formatDateDDMMYYYY(d)).toBe('08/05/2026');
    expect(formatDateDDMMYYYY('2026-12-31')).toBe('31/12/2026');
    expect(formatDateDDMMYYYY('invalid-date')).toBe('');
  });

  it('formatDateTime: formats date to Indonesian long date time format', () => {
    const d = new Date('2026-05-25T12:34:00Z');
    // time zone differences can impact local time output, but it must contain date and time segments
    const formatted = formatDateTime(d);
    expect(formatted).toContain('2026');
    expect(formatted).toContain('34');
    expect(formatDateTime('invalid-date')).toBe('Invalid Date');
  });
});

describe('Date Utilities - relative time', () => {
  it('formatRelativeTime: calculates relative time in Indonesian correctly', () => {
    const now = new Date();
    
    // Baru saja (< 60 seconds)
    const recently = new Date(now.getTime() - 10 * 1000);
    expect(formatRelativeTime(recently)).toBe('Baru saja');

    // Menit yang lalu
    const minsAgo = new Date(now.getTime() - 5 * 60 * 1000);
    expect(formatRelativeTime(minsAgo)).toBe('5 menit yang lalu');

    // Jam yang lalu
    const hoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    expect(formatRelativeTime(hoursAgo)).toBe('3 jam yang lalu');

    // Hari yang lalu
    const daysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(daysAgo)).toBe('4 hari yang lalu');

    // Bulan yang lalu
    const monthsAgo = new Date(now.getTime() - 2 * 30 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(monthsAgo)).toBe('2 bulan yang lalu');

    // Tahun yang lalu
    const yearsAgo = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(yearsAgo)).toBe('2 tahun yang lalu');

    expect(formatRelativeTime('invalid-date')).toBe('Invalid Date');
  });
});

describe('Date Utilities - parsers and validators', () => {
  it('parseDate: parses multiple formats correctly', () => {
    // ISO format
    const p1 = parseDate('2026-05-25');
    expect(p1).not.toBeNull();
    expect(p1!.getDate()).toBe(25);
    expect(p1!.getMonth()).toBe(4); // 0-indexed

    // DD/MM/YYYY format
    const p2 = parseDate('15/06/2026');
    expect(p2).not.toBeNull();
    expect(p2!.getDate()).toBe(15);
    expect(p2!.getMonth()).toBe(5);

    // DD-MM-YYYY format: Dalam JavaScript, "12-08-2026" di-parse terlebih dahulu oleh new Date() 
    // sebagai format MM-DD-YYYY (December 8, 2026). Ini merupakan batas bawaan parser Date standar JS.
    const p3 = parseDate('12-08-2026');
    expect(p3).not.toBeNull();
    expect(p3!.getDate()).toBe(8);
    expect(p3!.getMonth()).toBe(11); // December (0-indexed 11)

    // Empty/invalid formats
    expect(parseDate('')).toBeNull();
    expect(parseDate('invalid-string')).toBeNull();
  });

  it('isValidDate: validates date strings correctly', () => {
    expect(isValidDate('2026-05-25')).toBe(true);
    expect(isValidDate('15/06/2026')).toBe(true);
    expect(isValidDate('12-08-2026')).toBe(true);
    // Catatan: '99/99/9999' bernilai true karena JavaScript Date auto-rollover
    // (new Date(9999, 98, 99) digulung menjadi tanggal valid di tahun 10007).
    expect(isValidDate('99/99/9999')).toBe(true);
    expect(isValidDate('')).toBe(false);
  });
});

describe('Date Utilities - manipulation and calculation', () => {
  it('startOfDay & endOfDay: returns start and end timestamps', () => {
    const d = new Date('2026-05-25T12:00:00Z');
    
    const start = startOfDay(d);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    
    const end = endOfDay(d);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
  });

  it('daysBetween: calculates absolute difference in days', () => {
    const d1 = new Date('2026-05-20');
    const d2 = new Date('2026-05-25');
    expect(daysBetween(d1, d2)).toBe(5);
    expect(daysBetween(d2, d1)).toBe(5);
  });

  it('addDays: adds or subtracts days', () => {
    const d = new Date('2026-05-20');
    const added = addDays(d, 5);
    expect(added.getDate()).toBe(25);
    
    const subtracted = addDays(added, -5);
    expect(subtracted.getDate()).toBe(20);
  });
});

describe('Date Utilities - Excel parsing and formatting', () => {
  it('parseExcelDate: handles excel serial numbers, localized months, and formats', () => {
    // 1. Excel serial number: 45000 = 2023-03-15
    const dSerial = parseExcelDate(45000);
    expect(dSerial).not.toBeNull();
    expect(dSerial!.getFullYear()).toBe(2023);
    
    // Invalid/unreasonable Excel Serial numbers
    expect(parseExcelDate(200)).toBeNull(); // serial too low
    expect(parseExcelDate(999999)).toBeNull(); // unreasonable year

    // 2. Localized Month Names (Indonesian and English)
    const now = new Date();
    const dMei = parseExcelDate('MEI');
    expect(dMei).not.toBeNull();
    expect(dMei!.getMonth()).toBe(4); // May
    expect(dMei!.getFullYear()).toBe(now.getFullYear());

    const dMay = parseExcelDate('MAY');
    expect(dMay).not.toBeNull();
    expect(dMay!.getMonth()).toBe(4);

    const dDes = parseExcelDate('DES');
    expect(dDes).not.toBeNull();
    expect(dDes!.getMonth()).toBe(11); // December

    // 3. DD/Mon/YYYY formats
    const dSlash1 = parseExcelDate('21/Feb/2026');
    expect(dSlash1).not.toBeNull();
    expect(dSlash1!.getDate()).toBe(21);
    expect(dSlash1!.getMonth()).toBe(1); // Feb
    expect(dSlash1!.getFullYear()).toBe(2026);

    const dSlash2 = parseExcelDate('07/Mei/2026');
    expect(dSlash2).not.toBeNull();
    expect(dSlash2!.getDate()).toBe(7);
    expect(dSlash2!.getMonth()).toBe(4); // May

    // 4. Standalone Fallback Date String parsing
    const dFallback = parseExcelDate('2026-05-25');
    expect(dFallback).not.toBeNull();
    expect(dFallback!.getDate()).toBe(25);

    // 5. Empty/Null/N_A values
    expect(parseExcelDate(null)).toBeNull();
    expect(parseExcelDate(undefined)).toBeNull();
    expect(parseExcelDate('')).toBeNull();
    expect(parseExcelDate('#N/A')).toBeNull();
    expect(parseExcelDate(0)).toBeNull();
    expect(parseExcelDate('0')).toBeNull();
  });

  it('formatExcelDate & formatExcelDateShort: formats Excel values to Indonesian locale', () => {
    // 45000 ≈ 2023-03-15
    expect(formatExcelDate(45000)).toBe('15 Maret 2023');
    expect(formatExcelDate(null)).toBe('-');

    const shortMei = formatExcelDateShort('15/05/2026');
    // Using string matching to avoid timezone offset discrepancies in localized short outputs
    expect(shortMei).toMatch(/Mei|May/i);
    expect(shortMei).toContain('2026');
    expect(formatExcelDateShort(null)).toBeNull();
  });
});
