import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

// Structural pattern based on shadcn/ui's Pagination (nav/ul/li semantics,
// chevron Previous/Next, ellipsis icon), restyled with this app's own
// design tokens so it reads as part of the same admin UI, not a
// transplanted component.
function getPageWindow(currentPage, totalPages, delta) {
  const pages = [];
  const left = Math.max(2, currentPage - delta);
  const right = Math.min(totalPages - 1, currentPage + delta);

  pages.push(1);
  if (left > 2) pages.push('ellipsis-left');
  for (let p = left; p <= right; p++) pages.push(p);
  if (right < totalPages - 1) pages.push('ellipsis-right');
  if (totalPages > 1) pages.push(totalPages);
  return pages;
}

function Pagination({ currentPage, totalPages, onPageChange, delta = 2 }) {
  if (totalPages <= 1) return null;

  const pages = getPageWindow(currentPage, totalPages, delta);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      <ul className="flex items-center gap-1">
        <li>
          <button
            type="button"
            aria-label="Halaman sebelumnya"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex h-9 items-center gap-1 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>
        </li>

        {pages.map((p) =>
          typeof p === 'number' ? (
            <li key={p}>
              <button
                type="button"
                aria-label={`Halaman ${p}`}
                aria-current={p === currentPage ? 'page' : undefined}
                onClick={() => onPageChange(p)}
                className={
                  p === currentPage
                    ? 'flex h-9 min-w-9 items-center justify-center rounded-lg bg-accent px-2 text-sm font-semibold text-white'
                    : 'flex h-9 min-w-9 items-center justify-center rounded-lg bg-surface-alt px-2 text-sm font-medium text-ink transition-colors hover:bg-border'
                }
              >
                {p}
              </button>
            </li>
          ) : (
            <li key={p} aria-hidden="true">
              <span className="flex h-9 w-9 items-center justify-center text-muted">
                <MoreHorizontal size={16} />
              </span>
            </li>
          )
        )}

        <li>
          <button
            type="button"
            aria-label="Halaman berikutnya"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex h-9 items-center gap-1 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="hidden sm:inline">Berikutnya</span>
            <ChevronRight size={16} />
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Pagination;
