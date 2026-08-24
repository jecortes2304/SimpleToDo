import {ArrowLeftIcon, ArrowRightIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon} from '@heroicons/react/16/solid';
import {useTranslation} from 'react-i18next';

type TablePaginationProps = {
    page: number;
    totalPages: number;
    totalItems: number;
    currentItems: number;
    onPageChange: (page: number) => void;
    maxVisiblePages?: number;
    label?: string;
};

function TablePagination({
    page,
    totalPages,
    totalItems,
    currentItems,
    onPageChange,
    maxVisiblePages = 5,
    label = 'items',
}: TablePaginationProps) {
    const {t} = useTranslation();
    const startPage = Math.max(1, Math.min(page - Math.floor(maxVisiblePages / 2), totalPages - maxVisiblePages + 1));
    const safeStartPage = Math.max(1, startPage);
    const endPage = Math.min(totalPages, safeStartPage + maxVisiblePages - 1);
    const pages = totalPages > 0
        ? Array.from({length: endPage - safeStartPage + 1}, (_, index) => safeStartPage + index)
        : [];

    const goToPage = (nextPage: number) => {
        onPageChange(Math.min(Math.max(nextPage, 1), Math.max(totalPages, 1)));
    };

    return (
        <nav className="mt-4 flex flex-col items-center gap-2" aria-label={t('table.pagination')}>
            <span className="text-sm text-base-content/70">
                {t('table.showing', {current: currentItems, total: totalItems, label})}
            </span>
            <div className="join">
                <button
                    type="button"
                    className="join-item btn btn-sm"
                    aria-label={t('table.firstPage')}
                    onClick={() => goToPage(1)}
                    disabled={page <= 1 || totalPages === 0}
                >
                    <ChevronDoubleLeftIcon className="h-3 w-3"/>
                </button>
                <button
                    type="button"
                    className="join-item btn btn-sm"
                    aria-label={t('table.previousPage')}
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1 || totalPages === 0}
                >
                    <ArrowLeftIcon className="h-3 w-3"/>
                </button>
                {pages.map(pageNumber => (
                    <button
                        type="button"
                        key={pageNumber}
                        className={`join-item btn btn-sm ${page === pageNumber ? 'btn-active' : ''}`}
                        aria-label={t('table.goToPage', {page: pageNumber})}
                        aria-current={page === pageNumber ? 'page' : undefined}
                        onClick={() => goToPage(pageNumber)}
                    >
                        {pageNumber}
                    </button>
                ))}
                <button
                    type="button"
                    className="join-item btn btn-sm"
                    aria-label={t('table.nextPage')}
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages || totalPages === 0}
                >
                    <ArrowRightIcon className="h-3 w-3"/>
                </button>
                <button
                    type="button"
                    className="join-item btn btn-sm"
                    aria-label={t('table.lastPage')}
                    onClick={() => goToPage(totalPages)}
                    disabled={page >= totalPages || totalPages === 0}
                >
                    <ChevronDoubleRightIcon className="h-3 w-3"/>
                </button>
            </div>
        </nav>
    );
}

export default TablePagination;
