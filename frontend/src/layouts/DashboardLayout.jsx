import { Outlet, NavLink } from 'react-router-dom';
import {
  Users,
  BookOpen,
  Calendar,
  GraduationCap,
  UserCog,
  ClipboardCheck,
  LogOut,
  LayoutDashboard,
  Table
} from 'lucide-react';
import { useState } from 'react';

const DashboardLayout = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';
  const isTeacher = user.role === 'teacher';

  return (
    <div className="dashboard-container">
      {/* Sidebar - Only show for Admin */}
      {isAdmin && (
        <aside className="sidebar">
          <div className="sidebar-brand">
            <LayoutDashboard size={24} color="var(--primary-light)" />
            <div className="brand-text-container">
              <span className="brand-text">RPS Admin</span>
              {user.username && <span className="user-subtitle">{user.username}</span>}
            </div>
          </div>
          <nav className="sidebar-nav">
            <NavLink to="users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Users size={20} />
              <span className="link-text">Users</span>
            </NavLink>
            <NavLink to="subjects" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <BookOpen size={20} />
              <span className="link-text">Subjects</span>
            </NavLink>
            <NavLink to="terms" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Calendar size={20} />
              <span className="link-text">Terms</span>
            </NavLink>
            <NavLink to="faculties" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <GraduationCap size={20} />
              <span className="link-text">Faculties</span>
            </NavLink>

            <NavLink to="teachers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <UserCog size={20} />
              <span className="link-text">Course allocation</span>
            </NavLink>
            <NavLink to="marks" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <ClipboardCheck size={20} />
              <span className="link-text">Marks</span>
            </NavLink>
            {/* <NavLink to="results" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Table size={20} />
              <span className="link-text">Results</span>
            </NavLink> */}

          </nav>
          <button onClick={handleLogout} className="logout-btn-sidebar">
            <LogOut size={20} />
            <span className="link-text">Logout</span>
          </button>
        </aside>
      )}

      {/* Main Content */}
      <main className="main-content" style={!isAdmin ? { marginLeft: 0 } : {}}>
        {/* Teacher Header */}
        {isTeacher && (
          <header className="card flex justify-between items-center mb-6">
            <div className="flex flex-col">
              <h2 className="m-0 text-xl font-bold">Teacher Dashboard - Marks Management</h2>
              {user.username && <p className="m-0 text-sm text-gray-500 font-medium mt-1">Welcome, <span className="text-primary font-bold">{user.username}</span></p>}
            </div>
            <button onClick={handleLogout} className="btn btn-primary">Logout</button>
          </header>
        )}
        <Outlet />
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="text-lg font-bold text-red-600">Logout</h3>
              <button
                onClick={cancelLogout}
                className="text-gray-500 hover:text-gray-700 font-bold text-xl bg-transparent border-none"
              >
                &times;
              </button>
            </div>
            <div className="modal-body py-6">
              <p className="text-gray-700 font-medium">Are you sure you want to logout?</p>
              <p className="text-gray-500 text-sm mt-2">You will be redirected to the login page.</p>
            </div>
            <div className="modal-footer">
              <button
                onClick={cancelLogout}
                className="btn btn-secondary mr-2"
              >
                No, Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="btn bg-red-600 text-white hover:bg-red-700 shadow-sm"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
