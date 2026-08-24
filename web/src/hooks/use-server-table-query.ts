import {useCallback, useEffect, useState} from 'react';
import {SortOrder} from '../schemas/global.ts';
import {useDebounce} from './use-debounce.ts';

export type ServerTableQuery = {
    page: number;
    limit: number;
    sort: SortOrder;
    search: string;
};

export function useServerTableQuery(initialLimit = 10) {
    const [searchInput, setSearchInput] = useState('');
    const [query, setQuery] = useState<ServerTableQuery>({
        page: 1,
        limit: initialLimit,
        sort: 'asc',
        search: '',
    });
    const debouncedSearch = useDebounce(searchInput, 400);

    useEffect(() => {
        const search = debouncedSearch.trim();
        setQuery(previous => previous.search === search
            ? previous
            : {...previous, page: 1, search});
    }, [debouncedSearch]);

    const setPage = useCallback((page: number) => {
        setQuery(previous => ({...previous, page}));
    }, []);

    const setLimit = useCallback((limit: number) => {
        setQuery(previous => ({...previous, limit, page: 1}));
    }, []);

    const setSort = useCallback((sort: SortOrder) => {
        setQuery(previous => ({...previous, sort, page: 1}));
    }, []);

    return {
        query,
        searchInput,
        setSearchInput,
        setPage,
        setLimit,
        setSort,
    };
}
