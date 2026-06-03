export interface Page<T> {
  items: T[]
  hasMore: boolean
}

export function paginate<T>(items: T[], limit: number, offset: number): Page<T> {
  return {
    items: items.slice(offset, offset + limit),
    hasMore: offset + limit < items.length,
  }
}
