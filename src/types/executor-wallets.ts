export interface CreateExecutorWalletParams {
  public_key: string;
}

export interface ExecutorWallet {
  id: string;
  public_key: string;
  status: 'active' | 'revoked';
  created_at: string;
}
