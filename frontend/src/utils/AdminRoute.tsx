import React from 'react';
import {Navigate, Outlet} from 'react-router-dom';

function getRoleFromToken(): number | null {
    const t = localStorage.getItem('token');
    if (!t) return null;
    try {
        const payload = JSON.parse(atob(t.split('.')[1]));
        return typeof payload.role === 'number' ? payload.role : null;
    } catch {
        return null;
    }
}

export const AdminRoute: React.FC = () => {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/auth" replace />;

    const role = getRoleFromToken();
    if (role !== 1) return <Navigate to="/" replace />;

    return <Outlet />;
};
