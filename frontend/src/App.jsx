// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import AdminDashboard from './pages/AdminDashboard';
import UsersTab from './components/tabs/UsersTab';
import SubjectsTab from './components/tabs/SubjectsTab';
import TermsTab from './components/tabs/TermsTab';
import FacultiesTab from './components/tabs/FacultiesTab';
import TeachersTab from './components/tabs/TeachersTab';
import MarksTab from './components/tabs/MarksTab';
import ResultsTab from './components/tabs/ResultsTab';
import SettingsTab from './components/tabs/SettingsTab';
import StudentAdvancementTab from './components/tabs/StudentAdvancementTab';
import TeacherDashboard from './pages/TeacherDashboard';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Admin-only wrapper - redirects teachers away
const AdminDashboardWrapper = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.role === 'teacher') {
    return <Navigate to="/dashboard/teacher" replace />;
  }
  return <AdminDashboard><Outlet /></AdminDashboard>;
};

const DashboardIndex = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.role === 'teacher') {
    return <Navigate to="teacher" replace />;
  }
  return <Navigate to="users" replace />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Default redirect */}
          <Route index element={<DashboardIndex />} />

          {/* Teacher Dashboard */}
          <Route path="teacher" element={<TeacherDashboard />} />

          {/* Marks Tab (Accessible by both) */}
          <Route path="marks" element={<MarksTab />} />

          {/* Admin Dashboard Wrapper */}
          <Route path="" element={<AdminDashboardWrapper />}>
            <Route path="users" element={<UsersTab />} />
            <Route path="subjects" element={<SubjectsTab />} />
            <Route path="terms" element={<TermsTab />} />
            <Route path="faculties" element={<FacultiesTab />} />
            <Route path="teachers" element={<TeachersTab />} />
            <Route path="results" element={<ResultsTab />} />
            <Route path="settings" element={<SettingsTab />} />
            <Route path="advancement" element={<StudentAdvancementTab />} />
          </Route>
        </Route>

        {/* Catch-all: redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Router>
  );
};

export default App;
