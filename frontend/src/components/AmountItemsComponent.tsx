import React, {useMemo} from 'react';
import {ArrowDownIcon} from "@heroicons/react/16/solid";
import {useTranslation} from "react-i18next";
import {useLocalStorage} from "../hooks/useStorage.ts";
import {STORAGE_KEYS} from "../schemas/globals.ts";

interface Props {
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
}

const AmountItemsComponent: React.FC<Props> = ({setLimit, setPage}) => {

    const [selected, setSelected] = useLocalStorage<number>(STORAGE_KEYS.TASKS_LIMIT, 100);
    const options = useMemo(() => [5, 10, 30, 50, 100], []);
    const {t} = useTranslation()
    return (
        <div className="dropdown dropdown-bottom">
            <div tabIndex={0} role="button" className="btn m-1 btn-primary btn-sm w-14 text-xs" title={t('tasks.show')}>
                <ArrowDownIcon className="h-3 w-3"/>
            </div>
            <ul tabIndex={0}
                className="dropdown-content menu bg-base-200 rounded-box z-10  shadow-md mb-1 mt-1">
                {
                    options.map((option) => (
                        <li key={option} onClick={() => {
                            setLimit(option)
                            setPage(1)
                            setSelected(option)
                        }} className={selected === option ? "bg-primary/15 rounded-sm" : ""}>
                            <a>{option}</a>
                        </li>
                    ))
                }
            </ul>
        </div>
    );
};

export default AmountItemsComponent;