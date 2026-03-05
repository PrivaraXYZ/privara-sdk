export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
}

interface TokenData {
  accessToken: string;
  expiresAt: number;
}

const REFRESH_MARGIN_MS = 60_000;

export class AuthManager {
  private credentials: OAuthCredentials;
  private readonly baseUrl: string;
  private token: TokenData | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor(credentials: OAuthCredentials, baseUrl: string) {
    this.credentials = credentials;
    this.baseUrl = baseUrl;
  }

  async getAccessToken(): Promise<string> {
    if (this.token && Date.now() < this.token.expiresAt - REFRESH_MARGIN_MS) {
      return this.token.accessToken;
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.fetchToken().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  private async fetchToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/v1/auth/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: this.credentials.clientId,
        client_secret: this.credentials.clientSecret,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({
        type: 'about:blank',
        title: 'OAuth token request failed',
        status: response.status,
      }));
      throw new Error(`OAuth token request failed: ${response.status} ${body.title ?? body.detail ?? ''}`);
    }

    const data = await response.json() as {
      access_token: string;
      expires_in: number;
    };

    this.token = {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    return this.token.accessToken;
  }
}
