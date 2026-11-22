import type { AccountRepository } from '../../domain/repositories/account.repository.js';
import { AccountError } from '../../domain/errors/account.errors.js';

export class DeleteAccountUseCase {
  constructor(private readonly repository: AccountRepository) {}

  async execute(code: string): Promise<void> {
    const account = await this.repository.findByCode(code);
    if (!account) throw new AccountError('Account not found', 'not_found');
    const accounts = await this.repository.findAll();
    if (accounts.some(child => child.parentCode === code)) {
      throw new AccountError('Cannot delete an account with children', 'conflict');
    }
    await this.repository.delete(code);
  }
}
