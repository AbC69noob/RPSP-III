import React, { useState } from 'react';
import { ChevronDown, ChevronRight, GraduationCap, KeyRound, CalendarDays } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const SettingsTab = () => {
    // State for Student Batch
    const [batchName, setBatchName] = useState('');
    const [selectedCourseBatchId, setSelectedCourseBatchId] = useState('');
    const [courseBatches, setCourseBatches] = useState([]); // In a complete implementation, fetch these
    const [loadingBatch, setLoadingBatch] = useState(false);

    // State for Password Change
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loadingPassword, setLoadingPassword] = useState(false);

    // State for CrTerms
    const [crTerms, setCrTerms] = useState([]);
    const [newCrTermName, setNewCrTermName] = useState('');
    const [loadingCrTerms, setLoadingCrTerms] = useState(false);

    // Accordion State
    const [openSection, setOpenSection] = useState('studentBatch');

    // Fetch data on mount
    React.useEffect(() => {
        fetchCourseBatches();
        fetchCrTerms();
    }, []);

    const fetchCrTerms = async () => {
        try {
            const res = await api.get('/cr-terms');
            setCrTerms(res.data);
        } catch (error) {
            console.error("Error fetching cr-terms", error);
        }
    };

    const fetchCourseBatches = async () => {
        try {
            const res = await api.get('/course-batches');
            setCourseBatches(res.data);
            if (res.data.length > 0) setSelectedCourseBatchId(res.data[0].id);
        } catch (error) {
            console.error("Error fetching course batches", error);
            toast.error("Failed to load course batches for selection");
        }
    };

    const handleCreateStudentBatch = async (e) => {
        e.preventDefault();
        setLoadingBatch(true);
        try {
            if (!batchName || !selectedCourseBatchId) {
                toast.warning("Please provide batch name and select a course batch.");
                setLoadingBatch(false);
                return;
            }

            await api.post('/student-batches', {
                name: batchName,
                courseBatchId: selectedCourseBatchId
            });

            toast.success("Student Batch created successfully!");
            setBatchName('');
        } catch (error) {
            console.error(error);
            toast.error("Failed to create Student Batch");
        } finally {
            setLoadingBatch(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.warning("New passwords do not match!");
            return;
        }

        setLoadingPassword(true);
        try {
            // Ideally an endpoint like /auth/change-password is required. 
            // For now, assuming a standard update payload or specific password endpoint.
            // Using a generic user update structure assuming backend handles it.
            const user = JSON.parse(localStorage.getItem('user'));
            await api.put(`/users/${user.id}/password`, {
                currentPassword,
                newPassword
            });
            toast.success("Password changed successfully!");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error(error);
            toast.error("Failed to change password. Ensure current password is correct.");
        } finally {
            setLoadingPassword(false);
        }
    };

    const handleCreateCrTerm = async (e) => {
        e.preventDefault();
        if (!newCrTermName) return;
        setLoadingCrTerms(true);
        try {
            await api.post('/cr-terms', { name: newCrTermName });
            toast.success("Master Term created successfully!");
            setNewCrTermName('');
            fetchCrTerms();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create master term");
        } finally {
            setLoadingCrTerms(false);
        }
    };

    const toggleSection = (section) => {
        setOpenSection(openSection === section ? '' : section);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 m-0 pb-2">System Settings</h2>

            <div className="space-y-4">

                {/* --- Create Student Batch Section --- */}
                <div className="card m-0 overflow-hidden" style={{ padding: 0 }}>
                    <button
                        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                        onClick={() => toggleSection('studentBatch')}
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                <GraduationCap size={20} />
                            </div>
                            <h3 className="text-lg font-bold m-0 text-gray-800">Create Student Batch</h3>
                        </div>
                        {openSection === 'studentBatch' ? <ChevronDown className="text-gray-500" /> : <ChevronRight className="text-gray-500" />}
                    </button>

                    {openSection === 'studentBatch' && (
                        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                            <form onSubmit={handleCreateStudentBatch} className="space-y-4 max-w-2xl">
                                <div>
                                    <label className="label">Batch Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g., 2024 Spring"
                                        value={batchName}
                                        onChange={(e) => setBatchName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Course Batch (Syllabus)</label>
                                    <select
                                        className="input-field"
                                        value={selectedCourseBatchId}
                                        onChange={(e) => setSelectedCourseBatchId(e.target.value)}
                                        required
                                    >
                                        <option value="">Select a Course Batch</option>
                                        {courseBatches.map(cb => {
                                            const label = cb.startYear
                                                ? `Revised on ${cb.startYear}${cb.description ? ` - ${cb.description}` : ''}`
                                                : (cb.description || 'Course Batch');

                                            return (
                                                <option key={cb.id} value={cb.id}>{label}</option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loadingBatch}
                                        className="btn btn-primary"
                                    >
                                        {loadingBatch ? 'Creating...' : 'Create Student Batch'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* --- Manage Terms (CrTerm) Placeholder --- */}
                <div className="card m-0 overflow-hidden" style={{ padding: 0 }}>
                    <button
                        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                        onClick={() => toggleSection('terms')}
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                <CalendarDays size={20} />
                            </div>
                            <h3 className="text-lg font-bold m-0 text-gray-800">Manage Terms</h3>
                        </div>
                        {openSection === 'terms' ? <ChevronDown className="text-gray-500" /> : <ChevronRight className="text-gray-500" />}
                    </button>

                    {openSection === 'terms' && (
                        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Create New Master Term</h4>
                                    <form onSubmit={handleCreateCrTerm} className="space-y-4">
                                        <div>
                                            <label className="label">Term Category Name</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder="e.g., First Term, Mid Term"
                                                value={newCrTermName}
                                                onChange={(e) => setNewCrTermName(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loadingCrTerms}
                                            className="btn btn-primary"
                                        >
                                            {loadingCrTerms ? 'Creating...' : 'Add Master Term'}
                                        </button>
                                    </form>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Existing Master Terms</h4>
                                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                        {crTerms.length === 0 ? (
                                            <p className="p-4 text-sm text-gray-500 italic text-center m-0">No master terms defined yet.</p>
                                        ) : (
                                            <ul className="divide-y divide-gray-100 m-0 p-0 list-none">
                                                {crTerms.map(term => (
                                                    <li key={term.id} className="p-3 text-sm text-gray-700 flex justify-between items-center hover:bg-gray-50">
                                                        <span>{term.name}</span>
                                                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">ID: {term.id}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- Change Password Section --- */}
                <div className="card m-0 overflow-hidden" style={{ padding: 0 }}>
                    <button
                        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                        onClick={() => toggleSection('password')}
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                                <KeyRound size={20} />
                            </div>
                            <h3 className="text-lg font-bold m-0 text-gray-800">Change Password</h3>
                        </div>
                        {openSection === 'password' ? <ChevronDown className="text-gray-500" /> : <ChevronRight className="text-gray-500" />}
                    </button>

                    {openSection === 'password' && (
                        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                            <form onSubmit={handleChangePassword} className="space-y-4 max-w-2xl">
                                <div>
                                    <label className="label">Current Password</label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">New Password</label>
                                        <input
                                            type="password"
                                            className="input-field"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Confirm New Password</label>
                                        <input
                                            type="password"
                                            className="input-field"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loadingPassword}
                                        className="btn btn-primary"
                                    >
                                        {loadingPassword ? 'Updating...' : 'Update Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default SettingsTab;
