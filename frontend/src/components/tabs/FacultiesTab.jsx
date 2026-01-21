import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import './FacultiesTab.css';

const FacultiesTab = () => {
    const [faculties, setFaculties] = useState([]);
    const [selectedFacultyId, setSelectedFacultyId] = useState('');
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [programForm, setProgramForm] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        fetchFaculties();
    }, []);

    useEffect(() => {
        if (selectedFacultyId) {
            fetchPrograms(selectedFacultyId);
        } else {
            setPrograms([]);
        }
    }, [selectedFacultyId]);

    const fetchFaculties = async () => {
        try {
            const response = await api.get('/faculties');
            setFaculties(response.data);
        } catch (error) {
            console.error('Failed to fetch faculties:', error);
        }
    };

    const fetchPrograms = async (facultyId) => {
        setLoading(true);
        try {
            const response = await api.get(`/programs/faculty/${facultyId}`);
            setPrograms(response.data);
        } catch (error) {
            console.error('Failed to fetch programs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProgram = async (e) => {
        e.preventDefault();
        try {
            await api.post('/programs', {
                ...programForm,
                facultyId: Number(selectedFacultyId)
            });
            alert('Program created successfully!');
            setShowModal(false);
            setProgramForm({ name: '', description: '' });
            fetchPrograms(selectedFacultyId);
        } catch (error) {
            console.error('Failed to create program:', error);
            alert('Failed to create program.');
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Card: Faculty Selection */}
            <div className="card w-full">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-800 m-0">Faculties Management</h3>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <label className="text-sm font-bold text-gray-700 whitespace-nowrap">Select Faculty:</label>
                        <select
                            className="border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white font-medium text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 shadow-sm hover:shadow-md w-full md:min-w-[380px] appearance-none cursor-pointer"
                            style={{
                                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 0.75rem center',
                                backgroundSize: '1.5em 1.5em',
                                paddingRight: '2.5rem'
                            }}
                            value={selectedFacultyId}
                            onChange={(e) => setSelectedFacultyId(e.target.value)}
                        >
                            <option value="">-- Select a Faculty --</option>
                            {faculties.map(faculty => (
                                <option key={faculty.id} value={faculty.id}>{faculty.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Programs List Area (Only visible if faculty selected) */}
            {selectedFacultyId && (
                <div className="card">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800 m-0">
                            Programs under {faculties.find(f => f.id === Number(selectedFacultyId))?.name}
                        </h3>
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn btn-primary text-sm"
                        >
                            + Create Program
                        </button>
                    </div>

                    <div className="table-container">
                        {loading ? (
                            <p className="text-center py-4 text-gray-500">Loading programs...</p>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr>
                                        <th className="py-3 px-4 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Program Name</th>
                                        <th className="py-3 px-4 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="py-3 px-4 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {programs.map((program) => (
                                        <tr key={program.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-4 text-sm text-gray-900 font-medium">{program.name}</td>
                                            <td className="py-4 px-4 text-sm text-gray-500">{program.description || '-'}</td>
                                            <td className="py-4 px-4 text-sm text-gray-500">
                                                {new Date(program.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {programs.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="text-center py-8 text-gray-500">
                                                No programs found for this faculty.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Create Program Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content program-modal-content">
                        <div className="modal-header">
                            <h3 className="text-lg font-bold text-gray-800 m-0">Create New Program</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-500 hover:text-gray-700 font-bold text-xl bg-transparent border-none"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="modal-body">
                            <form onSubmit={handleCreateProgram} className="space-y-4">
                                <div className="form-group">
                                    <label className="label">Program Name *</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={programForm.name}
                                        onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="label">Description</label>
                                    <textarea
                                        className="input-field"
                                        rows="3"
                                        value={programForm.description}
                                        onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                                    />
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                    >
                                        Create Program
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultiesTab;
