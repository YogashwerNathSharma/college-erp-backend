import { Request } from "express";

interface PaginationQuery {
  page?: string;
  limit?: string;
}

export const getPagination = (query: PaginationQuery) => {
  let page = Number(query.page) || 1;
  let limit = Number(query.limit) || 10;

  // ✅ safety checks
  if (page < 1) page = 1;
  if (limit < 1) limit = 10;

  // ✅ max limit protection
  if (limit > 100) limit = 100;

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};
export const buildPaginationMeta = (
  total: number,
  page: number,
  limit: number
) => {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};