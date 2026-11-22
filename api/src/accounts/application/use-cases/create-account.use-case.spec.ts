
import { beforeEach, describe, expect, it } from 'vitest';

import { CreateAccountUseCase } from './create-account.use-case.js';
import { InMemoryAccountRepository } from '../../infrastructure/repositories/in-memory-account.repository.js';

describe('CreateAccountUseCase', () => {
  let repository: InMemoryAccountRepository;
  let useCase: CreateAccountUseCase;

  beforeEach(() => {
    repository = new InMemoryAccountRepository();
    useCase = new CreateAccountUseCase(repository);
  });

  it('creates a class account', async () => {
    const account = await useCase.execute({
      code: '1',
      name: 'Activo',
      nature: 'DEBIT',
    });

    expect(account.code).toBe('1');
    expect(account.level).toBe('CLASS');
  });

  it('rejects duplicate account codes', async () => {
    await useCase.execute({
      code: '1',
      name: 'Activo',
      nature: 'DEBIT',
    });

    await expect(
      useCase.execute({
        code: '1',
        name: 'Otro activo',
        nature: 'DEBIT',
      }),
    ).rejects.toThrow('already exists');
  });

  it('rejects an account without its parent', async () => {
    await expect(
      useCase.execute({
        code: '1105',
        name: 'Caja',
      }),
    ).rejects.toThrow('Parent account 11 does not exist');
  });

  it('creates an account when its parent exists', async () => {
    await useCase.execute({
      code: '1',
      name: 'Activo',
      nature: 'DEBIT',
    });

    const account = await useCase.execute({
      code: '11',
      name: 'Disponible',
    });

    expect(account.parentCode).toBe('1');
  });
});
