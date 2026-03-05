import { HttpClient, type RequestInterceptor, type ResponseInterceptor } from './core/http-client.js';
import { AuthManager } from './core/auth-manager.js';
import { DEFAULT_RETRY_CONFIG, type RetryConfig } from './core/retry.js';
import { Invoices } from './resources/invoices.js';
import { BalanceResource } from './resources/balance.js';
import { Withdrawals } from './resources/withdrawals.js';
import { Transactions } from './resources/transactions.js';

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
  readonly invoices: Invoices;
  readonly balance: BalanceResource;
  readonly withdrawals: Withdrawals;
  readonly transactions: Transactions;

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

    this.invoices = new Invoices(this.httpClient);
    this.balance = new BalanceResource(this.httpClient);
    this.withdrawals = new Withdrawals(this.httpClient);
    this.transactions = new Transactions(this.httpClient);
  }

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.httpClient.addRequestInterceptor(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.httpClient.addResponseInterceptor(interceptor);
  }
}
