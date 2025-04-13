import React from 'react'
import {ArrowLeftIcon, ArrowRightIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon,} from '@heroicons/react/16/solid'
import {useTranslation} from "react-i18next";

interface PaginationProps {
    page: number
    totalPages: number
    totalItems: number
    currentItems: number
    onPageChange: (page: number) => void
    maxVisiblePages?: number
    label?: string
}

const PaginationComponent: React.FC<PaginationProps> = ({
                                                   page,
                                                   totalPages,
                                                   totalItems,
                                                   currentItems,
                                                   onPageChange,
                                                   maxVisiblePages = 3,
                                                   label = 'items',
                                               }) => {
    const startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    const showFirst = startPage > 1
    const showLast = endPage < totalPages
    const {t} = useTranslation()

    return (
        <div className="join join-vertical w-full items-center gap-2">
      <span className="text-sm">
        {t('tasks.showing')} {currentItems} {t('tasks.of')} {totalItems} {label}
      </span>

            <div className="w-full flex justify-center items-center gap-1 px-4">
                <button
                    className="join-item btn btn-sm"
                    onClick={() => onPageChange(1)}
                    disabled={page === 1 || totalPages === 0}
                >
                    <ChevronDoubleLeftIcon className="h-3 w-3" />
                </button>
                <button
                    className="join-item btn btn-sm"
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page === 1 || totalPages === 0}
                >
                    <ArrowLeftIcon className="h-3 w-3" />
                </button>

                {showFirst && (
                    <>
                        <input
                            onClick={() => onPageChange(1)}
                            className="join-item btn btn-square btn-sm"
                            type="radio"
                            name="pagination"
                            aria-label="1"
                            checked={page === 1}
                            readOnly
                        />
                        <span className="px-2">...</span>
                    </>
                )}

                {Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                    const pageNum = startPage + i
                    return (
                        <input
                            key={pageNum}
                            onClick={() => onPageChange(pageNum)}
                            className="join-item btn btn-square btn-sm"
                            type="radio"
                            name="pagination"
                            aria-label={'' + pageNum}
                            checked={page === pageNum}
                            readOnly
                        />
                    )
                })}

                {showLast && (
                    <>
                        <span className="px-2">...</span>
                        <input
                            onClick={() => onPageChange(totalPages)}
                            className="join-item btn btn-square btn-sm"
                            type="radio"
                            name="pagination"
                            aria-label={'' + totalPages}
                            checked={page === totalPages}
                            readOnly
                        />
                    </>
                )}

                <button
                    className="join-item btn btn-sm"
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages || totalPages === 0}
                >
                    <ArrowRightIcon className="h-3 w-3" />
                </button>
                <button
                    className="join-item btn btn-sm"
                    onClick={() => onPageChange(totalPages)}
                    disabled={page === totalPages || totalPages === 0}
                >
                    <ChevronDoubleRightIcon className="h-3 w-3" />
                </button>
            </div>
        </div>
    )
}

export default PaginationComponent
