
import { AccountError } from '../errors/account.errors.js';

export type AccountNature = 'DEBIT' | 'CREDIT';

export type AccountLevel =
  | 'CLASS'
  | 'GROUP'
  | 'ACCOUNT'
  | 'SUBACCOUNT';

const LEVEL_BY_LENGTH: Record<number, AccountLevel> = {
  1: 'CLASS',
  2: 'GROUP',
  4: 'ACCOUNT',
  6: 'SUBACCOUNT',
};

const PARENT_LENGTH_BY_LENGTH: Record<number, number> = {
  2: 1,
  4: 2,
  6: 4,
};

export class Account {
  readonly code: string;
  readonly name: string;
  readonly level: AccountLevel;
  readonly parentCode: string | null;
  readonly nature: AccountNature | null;

  constructor(
    code: string,
    name: string,
    nature: AccountNature | null = null,
  ) {
    if (typeof code !== 'string' || !/^\d+$/.test(code)) {
      throw new AccountError('Account code must contain only digits', 'validation');
    }

    const level = LEVEL_BY_LENGTH[code.length];

    if (!level) {
      throw new AccountError('Account code must have 1, 2, 4 or 6 digits', 'validation');
    }

    if (typeof name !== 'string' || !name.trim()) {
      throw new AccountError('Account name cannot be empty', 'validation');
    }

    if (nature !== null && nature !== 'DEBIT' && nature !== 'CREDIT') {
      throw new AccountError('Nature must be DEBIT or CREDIT', 'validation');
    }

    if (level === 'CLASS' && nature === null) {
      throw new AccountError('Class accounts require a nature', 'validation');
    }

    if (level !== 'CLASS' && nature !== null) {
      throw new AccountError('Only class accounts can define a nature', 'validation');
    }

    this.code = code;
    this.name = name.trim();
    this.level = level;
    this.nature = nature;

    const parentLength = PARENT_LENGTH_BY_LENGTH[code.length];

    this.parentCode = parentLength
      ? code.slice(0, parentLength)
      : null;
  }
}
