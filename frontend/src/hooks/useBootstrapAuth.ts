import {useEffect} from 'react'
import {useLocation} from 'react-router-dom'
import {getCurrentUser} from '../services/AuthService'
import useAuthStore from '../store/authStore'
import {CurrentUserMe} from "../schemas/auth.ts";

export const useBootstrapAuth = () => {
    const { setAuth, setLoading } = useAuthStore()
    const location = useLocation()

    useEffect(() => {
        const publicAuthPaths = [
            '/auth',
            '/verification-email',
            '/pending-email-verification',
            '/forgot-password',
            '/reseting-password',
        ]

        if (publicAuthPaths.includes(location.pathname)) {
            setLoading(false)
            return
        }

        const run = async () => {
            try {
                const res = await getCurrentUser()
                if (res.ok && res.result) {
                    const { id, email, role } = res.result as CurrentUserMe
                    setAuth({ id, email, role })
                } else {
                    setAuth(null)
                }
            } finally {
                setLoading(false)
            }
        }

        run().then()
    }, [setAuth, setLoading, location.pathname])
}
