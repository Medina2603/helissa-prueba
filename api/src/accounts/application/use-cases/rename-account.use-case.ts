import type { AccountRepository } from '../../domain/repositories/account.repository.js';
import { Account } from '../../domain/entities/account.entity.js';
import { AccountError } from '../../domain/errors/account.errors.js';

export class RenameAccountUseCase {
  constructor(private readonly repository: AccountRepository) {}
  async execute(code: string, name: string): Promise<Account> {
    const existing = await this.repository.findByCode(code);
    if (!existing) throw new AccountError('Account not found', 'not_found');
    const updated = new Account(code, name, existing.nature);
    await this.repository.save(updated);
    return updated;
  }
}
