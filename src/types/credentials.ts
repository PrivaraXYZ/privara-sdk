export interface GenerateCredentialsResponse {
  client_id: string;
  client_secret: string;
  status: 'active';
  created_at: string;
}

export interface Credential {
  client_id: string;
  status: 'active' | 'revoked';
  created_at: string;
  last_used_at: string | null;
}

export interface ListCredentialsResponse {
  items: Credential[];
}
