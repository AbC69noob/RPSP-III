import jwtDecode from 'jwt-decode';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        const decoded = jwtDecode(token);
        const role = decoded.role;

        if (role !== 'admin' && role !== 'teacher') {
            return <Navigate to="/login" replace />;
        }

        return children;
    } catch {
        return <Navigate to="/login" replace />;
    }
};

export default ProtectedRoute;
