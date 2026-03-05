export type BusinessType = 'RETAIL' | 'SERVICE';

export interface CreateBusinessProfileParams {
  business_name: string;
  business_type: BusinessType;
  business_address?: string;
  tax_id?: string;
}

export interface CreateBusinessProfileResponse {
  id: string;
}
