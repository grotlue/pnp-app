const DEFAULT_LIST_PAGE_SIZE = 20;

const normalizeListQuery = (value: string): string => {
  return value.trim().toLowerCase();
};

const paginateListItems = <T>(
  items: T[],
  page: number,
  pageSize: number = DEFAULT_LIST_PAGE_SIZE,
): T[] => {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
};

const clampListPage = (
  page: number,
  totalItems: number,
  pageSize: number = DEFAULT_LIST_PAGE_SIZE,
): number => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return Math.min(Math.max(page, 1), totalPages);
};

export {
  DEFAULT_LIST_PAGE_SIZE,
  clampListPage,
  normalizeListQuery,
  paginateListItems,
};
