import { HttpClient, type RequestInterceptor, type ResponseInterceptor } from './core/http-client.js';
import { AuthManager } from './core/auth-manager.js';
import { DEFAULT_RETRY_CONFIG, type RetryConfig } from './core/retry.js';
import { Users } from './resources/users.js';
import { BusinessProfiles } from './resources/business-profiles.js';
import { Invoices } from './resources/invoices.js';
import { BalanceResource } from './resources/balance.js';
import { Withdrawals } from './resources/withdrawals.js';
import { Transactions } from './resources/transactions.js';
import { Credentials } from './resources/credentials.js';
import { ExecutorWallets } from './resources/executor-wallets.js';

const DEFAULT_BASE_URL = 'https://api.privara.io';
const DEFAULT_TIMEOUT = 30_000;

export interface PrivaraConfig {
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  baseUrl?: string;
  timeout?: number;
  retry?: Partial<RetryConfig>;
}

export class Privara {
  readonly users: Users;
  readonly businessProfiles: BusinessProfiles;
  readonly invoices: Invoices;
  readonly balance: BalanceResource;
  readonly withdrawals: Withdrawals;
  readonly transactions: Transactions;
  readonly credentials: Credentials;
  readonly executorWallets: ExecutorWallets;

  private httpClient: HttpClient;

  constructor(config: PrivaraConfig) {
    const baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');

    let authManager: AuthManager | undefined;
    if (config.clientId && config.clientSecret) {
      authManager = new AuthManager(
        { clientId: config.clientId, clientSecret: config.clientSecret },
        baseUrl,
      );
    } else if (!config.accessToken && !config.clientId) {
      throw new Error('Provide either accessToken or clientId/clientSecret.');
    }

    this.httpClient = new HttpClient({
      baseUrl,
      authManager,
      accessToken: config.accessToken,
      timeout: config.timeout ?? DEFAULT_TIMEOUT,
      retryConfig: { ...DEFAULT_RETRY_CONFIG, ...config.retry },
    });

    this.users = new Users(this.httpClient);
    this.businessProfiles = new BusinessProfiles(this.httpClient);
    this.invoices = new Invoices(this.httpClient);
    this.balance = new BalanceResource(this.httpClient);
    this.withdrawals = new Withdrawals(this.httpClient);
    this.transactions = new Transactions(this.httpClient);
    this.credentials = new Credentials(this.httpClient);
    this.executorWallets = new ExecutorWallets(this.httpClient);
  }

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.httpClient.addRequestInterceptor(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.httpClient.addResponseInterceptor(interceptor);
  }
}
