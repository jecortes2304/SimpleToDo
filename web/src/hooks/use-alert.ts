import {useCallback} from 'react'
import type {Alert} from '../components/alerts/alert-manager.tsx'
import {triggerAlert} from '../components/alerts/alert-manager.tsx'

export function useAlert() {
    return useCallback((message: string | string[], type: Alert['type'] = 'alert-info') => {
        triggerAlert({ message: Array.isArray(message) ? message.join('\n') : message, type })
    }, [])
}
