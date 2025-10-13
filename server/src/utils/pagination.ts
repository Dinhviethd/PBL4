export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export class PaginationUtil {
  static createPagination<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ): PaginationResult<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  static validatePagination(page: number, limit: number): void {
    if (page < 1) {
      throw new Error('Page must be greater than 0');
    }
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }
  }

  static getDefaultPagination(): PaginationOptions {
    return {
      page: 1,
      limit: 20,
    };
  }
}

export const createPaginationQuery = (page: number, limit: number) => {
  PaginationUtil.validatePagination(page, limit);
  
  return {
    skip: PaginationUtil.calculateOffset(page, limit),
    take: limit,
  };
};