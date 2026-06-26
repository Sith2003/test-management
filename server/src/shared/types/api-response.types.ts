export interface ApiMeta {
  timestamp: string;
  resultCount?: number;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CollectionResponse<T> {
  data: T[];
  pagination: PaginationMeta;
  meta: ApiMeta;
}

export interface ErrorDetail {
  field?: string;
  message: string;
  value?: unknown;
}

export interface ErrorBody {
  code: string;
  message: string;
  details?: ErrorDetail[] | string;
}

export interface ErrorMeta {
  timestamp: string;
  path: string;
  method: string;
  requestId?: string;
}

export interface ErrorResponse {
  error: ErrorBody;
  meta: ErrorMeta;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
}

export function buildPaginationMeta(options: PaginationOptions): PaginationMeta {
  const { page, limit, total } = options;
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
