import {useSortable} from "@dnd-kit/react/sortable";
import {CollisionPriority} from "@dnd-kit/abstract";
import React, {ReactNode} from "react";
import {CheckIcon} from "@heroicons/react/16/solid";
import {TaskStatus} from "../schemas/tasks.ts";

export interface ColumnProps {
    children: ReactNode;
    id: string;
    index: number;
    columnTitle: string;
    itemCount?: number;
    allSelected?: boolean;
    onToggleSelectAll?: () => void;
}

const ColumnStatus: React.FC<ColumnProps> = ({
                                                 children,
                                                 id,
                                                 index,
                                                 columnTitle,
                                                 itemCount = 0,
                                                 allSelected = false,
                                                 onToggleSelectAll,
                                             }: ColumnProps) => {



    const getColourByColumn = (column: TaskStatus) => {
        switch (column) {
            case 'pending':
                return 'bg-info/5';
            case 'completed':
                return 'bg-success/5';
            case 'blocked':
                return 'bg-error/5';
            case 'cancelled':
                return 'bg-warning/5';
            case 'ongoing':
                return 'bg-primary/5';
            default:
                return 'bg-info/5';
        }
    };

    const {ref} = useSortable({
        id,
        index,
        type: "column",
        collisionPriority: CollisionPriority.Low,
        accept: ["item", "column"],
    });

    return (
        <div
            ref={ref}
            className={`
    ${getColourByColumn(id as TaskStatus)}
    column
    rounded-2xl
    border border-base-300/40
    shadow-md
    min-h-52
    w-70 sm:w-[320px] lg:w-90
    shrink-0
    lg:max-h-[calc(100vh-30rem)]
    lg:overflow-y-auto
`}
        >
            <div className="sticky top-0 rounded-t-2xl border-b border-base-300/40 bg-base-100/70 backdrop-blur-sm px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="h-3 w-3 rounded-full bg-current opacity-80"></div>
                        <h3 className="font-semibold text-sm truncate">{columnTitle}</h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <span className="badge badge-outline badge-sm">
                            {itemCount}
                        </span>

                        <button
                            type="button"
                            className={`btn btn-xs ${allSelected ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={onToggleSelectAll}
                            title={allSelected ? "Deseleccionar columna" : "Seleccionar columna"}
                        >
                            <CheckIcon className="h-4 w-4"/>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 p-3">
                {children}
            </div>
        </div>
    );
};

export default ColumnStatus;