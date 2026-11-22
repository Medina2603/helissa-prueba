import { Body, Controller, Delete, Get, HttpCode, HttpException, Param, Patch, Post } from '@nestjs/common';
import { CreateAccountUseCase } from '../application/use-cases/create-account.use-case.js';
import { GetAccountTreeUseCase } from '../application/use-cases/get-account-tree.use-case.js';
import { DeleteAccountUseCase } from '../application/use-cases/delete-account.use-case.js';
import { RenameAccountUseCase } from '../application/use-cases/rename-account.use-case.js';
import { AccountError } from '../domain/errors/account.errors.js';

function translate(error: unknown): never {
  if (error instanceof AccountError) {
    const status = error.kind === 'not_found' ? 404 : error.kind === 'conflict' ? 409 : 400;
    throw new HttpException({ message: error.message }, status);
  }
  throw error;
}

@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly createAccount: CreateAccountUseCase,
    private readonly getTree: GetAccountTreeUseCase,
    private readonly deleteAccount: DeleteAccountUseCase,
    private readonly renameAccount: RenameAccountUseCase,
  ) {}

  @Post()
  async create(@Body() body: unknown) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new HttpException({ message: 'Request body must be an object' }, 400);
    }
    const data = body as Record<string, unknown>;
    if (typeof data.code !== 'string' || typeof data.name !== 'string' ||
        (data.nature !== undefined && typeof data.nature !== 'string')) {
      throw new HttpException({ message: 'code and name must be strings; nature must be a string if provided' }, 400);
    }
    try {
      return await this.createAccount.execute({
        code: data.code, name: data.name,
        nature: data.nature as 'DEBIT' | 'CREDIT' | undefined,
      });
    } catch (error) { translate(error); }
  }

  @Get('tree')
  tree() { return this.getTree.execute(); }

  @Delete(':code')
  @HttpCode(204)
  async remove(@Param('code') code: string) {
    try { await this.deleteAccount.execute(code); }
    catch (error) { translate(error); }
  }

  @Patch(':code')
  async rename(@Param('code') code: string, @Body() body: unknown) {
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        typeof (body as Record<string, unknown>).name !== 'string') {
      throw new HttpException({ message: 'name must be a string' }, 400);
    }
    try { return await this.renameAccount.execute(code, (body as {name: string}).name); }
    catch (error) { translate(error); }
  }
}
