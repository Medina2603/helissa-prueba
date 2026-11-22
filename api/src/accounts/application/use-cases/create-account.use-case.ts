import { AccountError } from '../../domain/errors/account.errors.js';

import {
  Account,
  type AccountNature,
} from '../../domain/entities/account.entity.js';

import type { AccountRepository } from '../../domain/repositories/account.repository.js';

export interface CreateAccountInput {
  code: string;
  name: string;
  nature?: AccountNature;
}

export class CreateAccountUseCase {
  constructor(
    private readonly repository: AccountRepository,
  ) {}

  async execute(input: CreateAccountInput): Promise<Account> {
    // 1. Validate the account's own business rules.
    const account = new Account(
      input.code,
      input.name,
      input.nature ?? null,
    );

    // 2. Ensure the code is unique.
    const existing = await this.repository.findByCode(
      account.code,
    );

    if (existing) {
      throw new AccountError('An account with this code already exists', 'conflict');
    }

    // 3. Ensure the parent exists when required.
    if (account.parentCode !== null) {
      const parent = await this.repository.findByCode(
        account.parentCode,
      );

      if (!parent) {
        throw new AccountError(
          `Parent account ${account.parentCode} does not exist`, 'validation',
        );
      }
    }

    // 4. Persist the validated account.
    await this.repository.save(account);

    return account;
  }
}
