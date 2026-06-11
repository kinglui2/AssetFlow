export const DEFAULT_PAGE_SIZE = 25

export default function Pagination({ page, pageSize = DEFAULT_PAGE_SIZE, totalCount, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalCount)

  return (
    <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs text-white/55">
        {totalCount === 0 ? 'No results' : `Showing ${from}–${to} of ${totalCount}`}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <span className="min-w-[6rem] text-center text-xs text-white/70">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  )
}
