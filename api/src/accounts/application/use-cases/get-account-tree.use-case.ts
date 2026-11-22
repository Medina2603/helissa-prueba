import type { Account, AccountNature } from '../../domain/entities/account.entity.js';
import type { AccountRepository } from '../../domain/repositories/account.repository.js';

export interface AccountNode {
  code: string;
  name: string;
  level: Account['level'];
  parentCode: string | null;
  nature: AccountNature;
  allowsMovements: boolean;
  children: AccountNode[];
}

export class GetAccountTreeUseCase {
  constructor(private readonly repository: AccountRepository) {}

  async execute(): Promise<AccountNode[]> {
    const accounts = (await this.repository.findAll()).sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true }));
    const nodes = new Map<string, AccountNode>();
    const roots: AccountNode[] = [];
    for (const account of accounts) {
      nodes.set(account.code, {
        code: account.code, name: account.name, level: account.level,
        parentCode: account.parentCode, nature: 'DEBIT', allowsMovements: true, children: [],
      });
    }
    for (const account of accounts) {
      const node = nodes.get(account.code)!;
      if (account.parentCode === null) {
        node.nature = account.nature!;
        roots.push(node);
      } else {
        const parent = nodes.get(account.parentCode);
        if (parent) {
          parent.children.push(node);
          parent.allowsMovements = false;
        }
        const root = nodes.get(account.code.slice(0, 1));
        node.nature = root?.nature ?? 'DEBIT';
      }
    }
    return roots;
  }
}
