import { describe, it, expect } from '@jest/globals';
import { nextSocietyCode, normalizeSocietyCode, societyCodePrefix, societyLookup } from './society-code';

describe('society codes', () => {
  it('normalizes what residents type', () => {
    expect(normalizeSocietyCode('  ama-001 ')).toBe('AMA-001');
  });

  it('derives the prefix the same way as the backfill migration', () => {
    expect(societyCodePrefix('AMA Grand Estate')).toBe('AMA');
    expect(societyCodePrefix('Orchid Towers')).toBe('ORCH');
    expect(societyCodePrefix('123 Plaza')).toBe('SOC');
    expect(societyCodePrefix("St. Mary's Enclave")).toBe('ST');
  });

  it('picks the next free number for a prefix', () => {
    expect(nextSocietyCode('AMA', [])).toBe('AMA-001');
    expect(nextSocietyCode('AMA', ['AMA-001', 'AMA-002', 'ORCH-007'])).toBe('AMA-003');
    expect(nextSocietyCode('AMA', ['AMA-009', 'AMA-010'])).toBe('AMA-011');
  });

  it('looks a society up by code (any case) or ID', () => {
    expect(societyLookup(' ama-001')).toEqual({ OR: [{ code: 'AMA-001' }, { id: 'ama-001' }] });
  });
});
