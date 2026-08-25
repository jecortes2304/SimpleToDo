import {isValidElement, Key, ReactNode} from 'react';
import NotFoundSearch from '../empty-search-state.tsx';

export type SharedTableColumn<Row> = {
    /** Unique identifier for the column. */
    id: string;
    /** Content displayed in the table header. */
    label: ReactNode;
    /** Property to display when the cell does not need custom rendering. */
    accessorKey?: keyof Row;
    /** Custom cell. It receives the original entity, not a copied table row. */
    render?: (row: Row, rowIndex: number) => ReactNode;
    headerClassName?: string;
    cellClassName?: string;
};

export type SharedTableProps<Row> = {
    columns: readonly SharedTableColumn<Row>[];
    rows: readonly Row[];
    getRowKey: (row: Row, index: number) => Key;
    emptyContent?: ReactNode;
    isLoading?: boolean;
    loadingContent?: ReactNode;
    className?: string;
    rowClassName?: (row: Row, index: number) => string | undefined;
};

function displayValue(value: unknown): ReactNode {
    if (value === null || value === undefined || value === '') {
        return <span className="text-base-content/50">—</span>;
    }

    if (isValidElement(value) || typeof value === 'string' || typeof value === 'number') {
        return value;
    }

    if (typeof value === 'boolean') {
        return String(value);
    }

    return JSON.stringify(value);
}

function SharedTable<Row>({
    columns,
    rows,
    getRowKey,
    emptyContent = <NotFoundSearch/>,
    isLoading = false,
    loadingContent = <span className="loading loading-spinner loading-md"/>,
    className = '',
    rowClassName,
}: SharedTableProps<Row>) {
    const columnCount = Math.max(columns.length, 1);

    return (
        <table className={`table ${className}`.trim()}>
            <thead>
                <tr>
                    {columns.map(column => (
                        <th key={column.id} className={column.headerClassName} scope="col">
                            {column.label}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {isLoading ? (
                    <tr>
                        <td className="py-10 text-center" colSpan={columnCount}>
                            {loadingContent}
                        </td>
                    </tr>
                ) : rows.length > 0 ? (
                    rows.map((row, rowIndex) => {
                        const customRowClass = rowClassName?.(row, rowIndex) ?? '';
                        const stripedClass = rowIndex % 2 === 0 ? 'bg-base-200' : '';

                        return (
                            <tr
                                key={getRowKey(row, rowIndex)}
                                className={`${stripedClass} ${customRowClass}`.trim()}
                            >
                                {columns.map(column => {
                                    const content = column.render
                                        ? column.render(row, rowIndex)
                                        : column.accessorKey
                                            ? displayValue(row[column.accessorKey])
                                            : null;

                                    return (
                                        <td key={column.id} className={column.cellClassName}>
                                            {content}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })
                ) : (
                    <tr>
                        <td colSpan={columnCount}>{emptyContent}</td>
                    </tr>
                )}
            </tbody>
        </table>
    );
}

export default SharedTable;
