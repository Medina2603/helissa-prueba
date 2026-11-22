import { Module } from '@nestjs/common';
import { AccountsController } from './presentation/accounts.controller.js';
import { InMemoryAccountRepository } from './infrastructure/repositories/in-memory-account.repository.js';
import { CreateAccountUseCase } from './application/use-cases/create-account.use-case.js';
import { GetAccountTreeUseCase } from './application/use-cases/get-account-tree.use-case.js';
import { DeleteAccountUseCase } from './application/use-cases/delete-account.use-case.js';
import { RenameAccountUseCase } from './application/use-cases/rename-account.use-case.js';

const REPOSITORY = Symbol('AccountRepository');
@Module({
  controllers: [AccountsController],
  providers: [
    { provide: REPOSITORY, useClass: InMemoryAccountRepository },
    { provide: CreateAccountUseCase, useFactory: (repo: InMemoryAccountRepository) => new CreateAccountUseCase(repo), inject: [REPOSITORY] },
    { provide: GetAccountTreeUseCase, useFactory: (repo: InMemoryAccountRepository) => new GetAccountTreeUseCase(repo), inject: [REPOSITORY] },
    { provide: DeleteAccountUseCase, useFactory: (repo: InMemoryAccountRepository) => new DeleteAccountUseCase(repo), inject: [REPOSITORY] },
    { provide: RenameAccountUseCase, useFactory: (repo: InMemoryAccountRepository) => new RenameAccountUseCase(repo), inject: [REPOSITORY] },
  ],
})
export class AccountsModule {}
