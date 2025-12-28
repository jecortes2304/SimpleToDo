import {Navigate, Outlet} from 'react-router-dom';
import useAuthStore from '../store/authStore';

export const PrivateRoute = () => {
    const {isAuthenticated, isLoading} = useAuthStore();

    if (isLoading) {
        return null; // o un spinner si quieres
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/auth" replace />;
};
