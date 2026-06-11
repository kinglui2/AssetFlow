import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_PAGE_SIZE } from '../components/ui/Pagination.jsx'

export function useClientPagination(items, pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1)

  const totalCount = items.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  useEffect(() => {
    setPage(1)
  }, [items])

  const paginatedItems = useMemo(() => {
    const from = (page - 1) * pageSize
    return items.slice(from, from + pageSize)
  }, [items, page, pageSize])

  return { page, setPage, paginatedItems, totalCount, pageSize }
}
