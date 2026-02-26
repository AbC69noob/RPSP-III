import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './UsersTab.css';
import { Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

const UsersTab = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false); // Student Batch Modal
    const [programs, setPrograms] = useState([]);
    const [semesters, setSemesters] = useState([]); // List of semesters
    const [studentBatches, setStudentBatches] = useState([]); // List of student batches
    const [filterRole, setFilterRole] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = currentUser?.id;
    const currentUsername = currentUser?.username;
    const hideCurrentAdmin = currentUser?.role === 'admin';

    // Initial Form State
    const initialFormState = {
        username: '',
        email: '',
        password: '',
        role: 'student',
        name: '',
        gender: 'Male',
        dob: '',
        permanentAddress: '',
        temporaryAddress: '',
        // Student specific
        rollNo: '',
        studentBatchId: '', // Changed from batch (string) to ID
        semesterId: '', // Changed from semester (string) to ID
        programId: '',
        // Teacher specific
        employeeId: '',
        qualifications: '',
        contactNo: '',
        status: true
    };

    // Batch Form State
    const [batchForm, setBatchForm] = useState({
        name: '',
        courseBatchId: ''
    });

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchUsers();
        fetchPrograms();
        fetchSemesters();
        fetchStudentBatches();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPrograms = async () => {
        try {
            const response = await api.get('/programs');
            setPrograms(response.data);
        } catch (error) {
            console.error('Failed to fetch programs:', error);
        }
    };

    const fetchStudentBatches = async () => {
        try {
            const response = await api.get('/student-batches');
            setStudentBatches(response.data);
        } catch (error) {
            console.error('Failed to fetch student batches:', error);
        }
    };

    const fetchSemesters = async () => {
        try {
            const response = await api.get('/semesters');
            setSemesters(response.data.sort((a, b) => a.semesterNumber - b.semesterNumber));
        } catch (error) {
            console.error('Failed to fetch semesters:', error);
        }
    };

    const deleteUser = (id) => {
        setUserToDelete(id);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;
        setDeleteLoading(true);
        try {
            await api.delete(`/users/${userToDelete}`);
            setUsers(users.filter(u => u.id !== userToDelete));
            setShowDeleteModal(false);
            setUserToDelete(null);
            toast.success('User deleted successfully');
        } catch (error) {
            console.error('Failed to delete user:', error);
            toast.error('Failed to delete user');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'rollNo' && value !== '') {
            const numValue = Number(value);
            if (numValue < 1 || numValue > 45) {
                toast.warn("Roll number must be between 1 and 45");
                return;
            }
        }

        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let payload = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                role: formData.role
            };

            // Add role-specific fields
            if (formData.role === 'student') {
                const rollNoNum = formData.rollNo ? Number(formData.rollNo) : null;
                if (rollNoNum !== null && (rollNoNum < 1 || rollNoNum > 45)) {
                    toast.warn("Roll number must be between 1 and 45");
                    return;
                }
                payload = {
                    ...payload,
                    name: formData.name,
                    gender: formData.gender,
                    dob: formData.dob,
                    permanentAddress: formData.permanentAddress,
                    temporaryAddress: formData.temporaryAddress,
                    rollNo: rollNoNum,
                    batchId: formData.studentBatchId ? Number(formData.studentBatchId) : null,
                    semesterId: formData.semesterId ? Number(formData.semesterId) : null,
                    programId: formData.programId ? Number(formData.programId) : null
                };
            } else if (formData.role === 'teacher') {
                payload = {
                    ...payload,
                    name: formData.name,
                    gender: formData.gender,
                    dob: formData.dob,
                    permanentAddress: formData.permanentAddress,
                    temporaryAddress: formData.temporaryAddress,
                    employeeId: formData.employeeId,
                    qualifications: formData.qualifications,
                    contactNo: formData.contactNo
                };
            }
            // For admin role, only username, email, password, role are sent

            await api.post('/users/create', payload);
            toast.success('User created successfully!');

            // Keep program, semester, batch - only clear user-specific fields
            setFormData({
                ...formData,
                username: '',
                email: '',
                password: '',
                name: '',
                gender: 'Male',
                dob: '',
                permanentAddress: '',
                temporaryAddress: '',
                rollNo: '',
                employeeId: '',
                qualifications: '',
                contactNo: ''
            });

            fetchUsers();
        } catch (error) {
            console.error('Failed to create user:', error);
            toast.error('Failed to create user. Please try again.');
        }
    };

    const visibleUsers = users
        .filter(user => filterRole === '' || user.role.toLowerCase() === filterRole.toLowerCase())
        .filter(user => {
            if (!hideCurrentAdmin) return true;
            if (currentUserId != null) return user.id !== currentUserId;
            if (currentUsername) return user.username !== currentUsername;
            return true;
        });

    return (
        <div className="space-y-6 w-full">
            {/* Top Card: Users Management */}
            <div className="card flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 m-0">Users Management</h3>
                <div className="flex gap-3">
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowModal(true)}
                    >
                        Create User
                    </button>
                </div>
            </div>

            {/* Create User Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '1000px' }}>
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-gray-800 m-0">Create New User</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="btn btn-danger"
                            >
                                Cancel
                            </button>
                        </div>

                        <div className="modal-body">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Basic Info Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="form-group">
                                        <label className="label">Username *</label>
                                        <input
                                            type="text"
                                            name="username"
                                            placeholder='jdoe123'
                                            required
                                            className="input-field"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder='jdoe@example.com'
                                            required
                                            className="input-field"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Password *</label>
                                        <input
                                            type="password"
                                            name="password"
                                            placeholder='********'
                                            required
                                            className="input-field"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Role *</label>
                                        <select
                                            name="role"
                                            className="input-field"
                                            value={formData.role}
                                            onChange={handleInputChange}
                                        >
                                            <option value="student">Student</option>
                                            <option value="teacher">Teacher</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Additional Fields based on Role */}
                                {(formData.role === 'student' || formData.role === 'teacher') && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="form-group">
                                            <label className="label">Name *</label>
                                            <input
                                                type="text"
                                                name="name"
                                                placeholder='John Doe'
                                                required
                                                className="input-field"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="label">Gender</label>
                                            <select
                                                name="gender"
                                                className="input-field"
                                                value={formData.gender}
                                                onChange={handleInputChange}
                                            >
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Others">Others</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="label">Date of Birth</label>
                                            <input
                                                type="date"
                                                name="dob"
                                                className="input-field"
                                                value={formData.dob}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="label">Permanent Address</label>
                                            <input
                                                type="text"
                                                name="permanentAddress"
                                                placeholder='123 Main Street, City, Country'
                                                className="input-field"
                                                value={formData.permanentAddress}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="label">Temporary Address</label>
                                            <input
                                                type="text"
                                                name="temporaryAddress"
                                                placeholder='123 College Ave, City, Country'
                                                className="input-field"
                                                value={formData.temporaryAddress}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Student Specific Fields */}
                                {formData.role === 'student' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="form-group">
                                            <label className="label">Roll No *</label>
                                            <input
                                                type="number"
                                                name="rollNo"
                                                placeholder='01'
                                                required
                                                className="input-field"
                                                value={formData.rollNo}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="label">Faculty/Program *</label>
                                            <select
                                                name="programId"
                                                required
                                                className="input-field"
                                                value={formData.programId}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">Select Faculty</option>
                                                {programs.map(prog => (
                                                    <option key={prog.id} value={prog.id}>{prog.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="label">Student Batch *</label>
                                            <select
                                                name="studentBatchId"
                                                required
                                                className="input-field"
                                                value={formData.studentBatchId}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">Select Batch</option>
                                                {studentBatches.map(batch => (
                                                    <option key={batch.id} value={batch.id}>{batch.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="label">Semester *</label>
                                            <select
                                                name="semesterId"
                                                required
                                                className="input-field"
                                                value={formData.semesterId}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">Select Semester</option>
                                                {semesters.map(sem => (
                                                    <option key={sem.id} value={sem.id}>{sem.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Teacher Specific Fields */}
                                {formData.role === 'teacher' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="form-group">
                                            <label className="label">Employee ID *</label>
                                            <input
                                                type="text"
                                                name="employeeId"
                                                placeholder='101'
                                                required
                                                className="input-field"
                                                value={formData.employeeId}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="label">Qualifications</label>
                                            <input
                                                type="text"
                                                name="qualifications"
                                                placeholder='BSc/ MSc'
                                                className="input-field"
                                                value={formData.qualifications}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="label">Contact No</label>
                                            <input
                                                type="text"
                                                name="contactNo"
                                                placeholder='9876543210'
                                                className="input-field"
                                                value={formData.contactNo}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="form-group flex items-end">
                                            <label className="flex items-center space-x-2 cursor-pointer pb-2">
                                                <input
                                                    type="checkbox"
                                                    name="status"
                                                    checked={formData.status}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                                />
                                                <span className="text-sm font-bold text-gray-900">Active Status</span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <div className="modal-footer">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                    >
                                        Create User
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div >
            )}

            {/* Bottom Card: All Users Table */}
            <div className="card">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800 m-0">All Users</h3>

                    {/* Filter Dropdown */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-600">Filter by User Type:</label>
                        <select
                            className="input-field"
                            style={{ width: 'auto', padding: '0.4rem 0.8rem' }}
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                        >
                            <option value="">All Users</option>
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="table-container">
                    {loading ? (
                        <p className="text-center py-4 text-gray-500">Loading users...</p>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="py-3 px-4 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</th>
                                    <th className="py-3 px-4 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="py-3 px-4 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="py-3 px-4 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {visibleUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-4 text-sm text-gray-900 font-medium">{user.username}</td>
                                        <td className="py-4 px-4 text-sm text-gray-500">{user.email}</td>
                                        <td className="py-4 px-4 text-sm text-gray-500">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                    user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-green-100 text-green-800'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-sm font-medium">
                                            <button
                                                onClick={() => deleteUser(user.id)}
                                                className="btn-danger text-xs px-3 py-1"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {visibleUsers.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center py-8 text-gray-500">
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {/* Simple Delete Confirmation Modal */}
            {
                showDeleteModal && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '400px' }}>
                            <div className="modal-header border-none pb-0">
                                <h2 className="text-xl font-bold text-gray-800 m-0">Confirm Delete</h2>
                            </div>
                            <div className="modal-body py-4">
                                <p className="text-gray-600 m-0">Are you sure you want to delete this user? This action is not reversible.</p>
                            </div>
                            <div className="modal-footer pt-0 border-none flex justify-end gap-3">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={deleteLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={handleConfirmDelete}
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default UsersTab;
