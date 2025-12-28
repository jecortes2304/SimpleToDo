import React from 'react';
import {Navigate, Outlet} from 'react-router-dom';
import useAuthStore from '../store/authStore';

export const AdminRoute: React.FC = () => {
    const {isAuthenticated, isLoading, user} = useAuthStore();

    if (isLoading) {
        return null;
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/auth" replace />;
    }

    const role = user.role;
    if (role !== 1) return <Navigate to="/" replace />;

    return <Outlet />;
};
