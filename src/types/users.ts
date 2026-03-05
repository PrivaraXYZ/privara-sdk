export interface User {
  id: string;
  create_date: string;
  status: 'ENABLED' | 'DISABLED';
  email: string;
  wallet_provider?: string;
}

export interface Wallet {
  id: string;
  blockchain: string;
  address: string;
  state: string;
  create_date: string;
}

export interface UserStatusResponse {
  user: User;
  wallets: Wallet[];
}
