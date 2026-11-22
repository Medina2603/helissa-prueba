export class AccountError extends Error {
  constructor(message: string, public readonly kind: 'validation' | 'conflict' | 'not_found') {
    super(message);
    this.name = 'AccountError';
  }
}
