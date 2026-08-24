import {MagnifyingGlassIcon, XMarkIcon} from '@heroicons/react/16/solid';
import {useTranslation} from 'react-i18next';

type TableSearchInputProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    ariaLabel?: string;
};

function TableSearchInput({value, onChange, placeholder, ariaLabel = placeholder}: TableSearchInputProps) {
    const {t} = useTranslation();

    return (
        <label className="input w-full sm:w-72">
            <MagnifyingGlassIcon className="h-5 w-5 shrink-0"/>
            <input
                type="search"
                className="grow"
                aria-label={ariaLabel}
                placeholder={placeholder}
                value={value}
                onChange={event => onChange(event.target.value)}
            />
            {value && (
                <button
                    type="button"
                    className="btn btn-ghost btn-xs btn-circle"
                    aria-label={t('table.clearSearch')}
                    onClick={() => onChange('')}
                >
                    <XMarkIcon className="h-4 w-4"/>
                </button>
            )}
        </label>
    );
}

export default TableSearchInput;
