import React from 'react';
import {ArrowDownIcon} from "@heroicons/react/16/solid";
import {useTranslation} from "react-i18next";

interface Props {
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
}

const AmountItemsComponent: React.FC<Props> = ({setLimit, setPage}) => {
    const {t} = useTranslation()
    return (
        <div className="dropdown dropdown-bottom">
            <div tabIndex={0} role="button" className="btn m-1 btn-primary btn-sm text-xs" title={t('tasks.show')}>
                <ArrowDownIcon className="h-3 w-3"/>
            </div>
            <ul tabIndex={0}
                className="dropdown-content menu bg-base-200 rounded-box z-1 w-14 shadow-md mb-1 mt-1">
                <li onClick={() => {
                    setLimit(5)
                    setPage(1)
                }}>
                    <a>5</a>
                </li>
                <li onClick={() => {
                    setLimit(10)
                    setPage(1)
                }}>
                    <a>10</a>
                </li>
                <li onClick={() => {
                    setLimit(30)
                    setPage(1)
                }}>
                    <a>30</a>
                </li>
                <li onClick={() => {
                    setLimit(50)
                    setPage(1)
                }}>
                    <a>50</a>
                </li>
            </ul>
        </div>
    );
};

export default AmountItemsComponent;