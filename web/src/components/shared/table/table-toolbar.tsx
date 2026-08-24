import {ReactNode} from 'react';

type TableToolbarProps = {
    children: ReactNode;
    actions?: ReactNode;
};

function TableToolbar({children, actions}: TableToolbarProps) {
    return (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-5">
                {children}
            </div>
            {actions && (
                <div className="flex shrink-0 items-center justify-end gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}

export default TableToolbar;
