import {useEffect, useState} from "react";

export function useLocalStorage<T>(key: string, defaultValue: T) {
    const [value, setValue] = useState<T>(() => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? (JSON.parse(raw) as T) : defaultValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}"`, error);
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error writing localStorage key "${key}"`, error);
        }
    }, [key, value]);

    return [value, setValue] as const;
}