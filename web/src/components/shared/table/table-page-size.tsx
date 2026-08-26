type TablePageSizeProps = {
    value: number;
    onChange: (value: number) => void;
    label: string;
    options?: readonly number[];
};

function TablePageSize({
    value,
    onChange,
    label,
    options = [5, 10, 30, 50, 100],
}: TablePageSizeProps) {
    return (
        <label className="form-control flex-row items-center gap-2">
            <span className="text-sm whitespace-nowrap mr-2">{label}</span>
            <select
                className="select select-sm select-bordered w-20"
                aria-label={label}
                value={value}
                onChange={event => onChange(Number(event.target.value))}
            >
                {options.map(option => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
        </label>
    );
}

export default TablePageSize;
