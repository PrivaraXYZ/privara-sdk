export interface ReportTransactionParams {
  tx_hash: string;
  entity_type: 'invoice' | 'withdrawal';
  entity_id: string;
}

export interface ReportTransactionResponse {
  entity_type: string;
  entity_id: string;
  tx_hash: string;
  status: string;
}
