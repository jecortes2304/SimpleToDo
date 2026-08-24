import {SortOrder} from '../../../schemas/global.ts';

type TableSortProps = {
    value: SortOrder;
    onChange: (value: SortOrder) => void;
    label: string;
    ascendingLabel: string;
    descendingLabel: string;
};

function TableSort({value, onChange, label, ascendingLabel, descendingLabel}: TableSortProps) {
    return (
        <label className="form-control flex-row items-center gap-2">
            <span className="text-sm whitespace-nowrap mr-2">{label}</span>
            <select
                className="select select-sm select-bordered w-32"
                aria-label={label}
                value={value}
                onChange={event => onChange(event.target.value as SortOrder)}
            >
                <option value="asc">{ascendingLabel}</option>
                <option value="desc">{descendingLabel}</option>
            </select>
        </label>
    );
}

export default TableSort;
