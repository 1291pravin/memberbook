import type { H3Event } from "h3";

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function parsePagination(event: H3Event, defaultLimit = 20): PaginationParams {
  const query = getQuery(event);
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || defaultLimit));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function buildPaginatedResponse<T>(data: T, total: number, params: PaginationParams): PaginatedResponse<T> {
  const totalPages = Math.max(1, Math.ceil(total / params.limit));
  const page = Math.min(params.page, totalPages);
  return {
    data,
    pagination: {
      page,
      limit: params.limit,
      total,
      totalPages,
    },
  };
}
