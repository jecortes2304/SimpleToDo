import React, {useEffect, useState} from 'react'
import {createPortal} from 'react-dom'
import {CheckIcon, ExclamationCircleIcon, ExclamationTriangleIcon, XMarkIcon} from "@heroicons/react/16/solid";

type AlertType = 'alert-success' | 'alert-error' | 'alert-warning' | 'alert-info'

export interface Alert {
    message: string
    type: AlertType
}

let showAlert: (alert: Alert) => void = () => {}

export const AlertManager: React.FC = () => {
    const [alert, setAlert] = useState<Alert | null>(null)

    useEffect(() => {
        showAlert = (newAlert: Alert) => {
            setAlert(newAlert)
            setTimeout(() => setAlert(null), 4000)
        }
    }, [])

    const renderIconByAlertType = (type: AlertType) => {
        switch (type) {
            case 'alert-success':
                return <CheckIcon className="h-5 w-5"/>
            case 'alert-error':
                return <XMarkIcon className="h-5 w-5"/>
            case 'alert-warning':
                return <ExclamationTriangleIcon className="h-5 w-5"/>
            default:
                return <ExclamationCircleIcon className="h-5 w-5"/>
        }
    }

    if (!alert) return null

    return createPortal(
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2">
            <div role="alert" className={`alert ${alert.type} shadow-lg w-[90vw] max-w-md`}>

                {renderIconByAlertType(alert.type)}

                <span>{alert.message}</span>
            </div>
        </div>,
        document.body
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function triggerAlert(alert: Alert) {
    showAlert(alert)
}
