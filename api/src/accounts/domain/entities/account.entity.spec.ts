
import { describe, expect, it } from 'vitest';
import { Account } from './account.entity.js';

describe('Account entity', () => {
  it('creates a class with a nature', () => {
    const account = new Account('1', 'Activo', 'DEBIT');

    expect(account.level).toBe('CLASS');
    expect(account.parentCode).toBeNull();
    expect(account.nature).toBe('DEBIT');
  });

  it('calculates the parent of a subaccount', () => {
    const account = new Account('110505', 'Caja general');

    expect(account.level).toBe('SUBACCOUNT');
    expect(account.parentCode).toBe('1105');
  });

  it('rejects invalid code lengths', () => {
    expect(() => new Account('123', 'Invalid account')).toThrow();
  });

  it('rejects non-numeric codes', () => {
    expect(() => new Account('11A5', 'Invalid account')).toThrow();
  });

  it('requires a nature for classes', () => {
    expect(() => new Account('1', 'Activo')).toThrow();
  });

  it('rejects a nature defined on descendants', () => {
    expect(() => new Account('11', 'Disponible', 'DEBIT')).toThrow();
  });
});

