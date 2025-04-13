import type {Alert} from '../components/AlertManager'
import {triggerAlert} from '../components/AlertManager'

export function useAlert() {
    return (message: string, type: Alert['type'] = 'alert-info') => {
        triggerAlert({ message, type })
    }
}
