import {Navigate, Outlet} from 'react-router-dom';

const isAuthenticated = () => {
    return !!localStorage.getItem('token');
};

export const PrivateRoute = () => {
    return isAuthenticated() ? <Outlet /> : <Navigate to="/auth" replace />;
};
