export class PrivaraError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrivaraError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
