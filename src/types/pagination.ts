export interface OffsetPage<T> {
  items: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface CursorPage<T> {
  items: T[];
  continuation_token: string | null;
  has_more: boolean;
  limit: number;
}
