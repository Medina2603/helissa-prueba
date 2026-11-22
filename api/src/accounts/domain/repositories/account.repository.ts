
import type { Account } from '../entities/account.entity.js';

export interface AccountRepository {
  findByCode(code: string): Promise<Account | null>;
  findAll(): Promise<Account[]>;
  save(account: Account): Promise<void>;
  delete(code: string): Promise<void>;
}
