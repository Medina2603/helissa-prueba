
import type { AccountRepository } from '../../domain/repositories/account.repository.js';
import { Account } from '../../domain/entities/account.entity.js';

export class InMemoryAccountRepository implements AccountRepository {
  private readonly accounts = new Map<string, Account>();

  async findByCode(code: string): Promise<Account | null> {
    return this.accounts.get(code) ?? null;
  }

  async findAll(): Promise<Account[]> {
    return Array.from(this.accounts.values());
  }

  async save(account: Account): Promise<void> {
    this.accounts.set(account.code, account);
  }

  async delete(code: string): Promise<void> {
    this.accounts.delete(code);
  }
}
