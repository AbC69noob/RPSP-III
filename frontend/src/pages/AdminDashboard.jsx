import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const AdminDashboard = () => {
    const tabs = [
        { name: 'Users', path: 'users' },
        { name: 'Subjects', path: 'subjects' },
        { name: 'Terms', path: 'terms' },
        { name: 'Faculties', path: 'faculties' },
        { name: 'Teachers', path: 'teachers' },
        { name: 'Results', path: 'results' },
        { name: 'Marks', path: '/dashboard/marks' },
    ];

    return (
        <div className="space-y-6">
            {/* Content Area */}
            <Outlet />
        </div>
    );
};

export default AdminDashboard;
