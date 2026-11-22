import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryAccountRepository } from '../../infrastructure/repositories/in-memory-account.repository.js';
import { CreateAccountUseCase } from './create-account.use-case.js';
import { GetAccountTreeUseCase } from './get-account-tree.use-case.js';
import { DeleteAccountUseCase } from './delete-account.use-case.js';
import { RenameAccountUseCase } from './rename-account.use-case.js';

describe('Account operations', () => {
  let repo: InMemoryAccountRepository;
  let create: CreateAccountUseCase;
  beforeEach(() => { repo = new InMemoryAccountRepository(); create = new CreateAccountUseCase(repo); });
  it('builds a nested tree with inherited nature and leaf movement permissions', async () => {
    await create.execute({ code: '1', name: 'Activo', nature: 'DEBIT' });
    await create.execute({ code: '11', name: 'Disponible' });
    await create.execute({ code: '1105', name: 'Caja' });
    const tree = await new GetAccountTreeUseCase(repo).execute();
    expect(tree[0].allowsMovements).toBe(false);
    expect(tree[0].children[0].nature).toBe('DEBIT');
    expect(tree[0].children[0].children[0].allowsMovements).toBe(true);
  });
  it('rejects deleting a parent', async () => {
    await create.execute({ code: '2', name: 'Pasivo', nature: 'CREDIT' });
    await create.execute({ code: '21', name: 'Obligaciones' });
    await expect(new DeleteAccountUseCase(repo).execute('2')).rejects.toThrow('children');
  });
  it('deletes leaves and reports missing codes', async () => {
    await create.execute({ code: '1', name: 'Activo', nature: 'DEBIT' });
    await new DeleteAccountUseCase(repo).execute('1');
    expect(await repo.findByCode('1')).toBeNull();
    await expect(new DeleteAccountUseCase(repo).execute('1')).rejects.toThrow('not found');
  });
  it('renames without changing code or nature', async () => {
    await create.execute({ code: '1', name: 'Activo', nature: 'DEBIT' });
    const updated = await new RenameAccountUseCase(repo).execute('1', 'Activos');
    expect(updated.name).toBe('Activos');
    expect(updated.nature).toBe('DEBIT');
  });
});
