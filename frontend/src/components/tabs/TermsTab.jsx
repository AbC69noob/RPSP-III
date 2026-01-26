import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import './TermsTab.css';
import { toast } from 'react-toastify';

const TermsTab = () => {
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [editingId, setEditingId] = useState(null);

    // Form State
    const [termForm, setTermForm] = useState({
        code: '',
        name: '',
        remarks: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchTerms();
    }, []);

    const fetchTerms = async () => {
        setLoading(true);
        try {
            const response = await api.get('/terms');
            setTerms(response.data);
        } catch (error) {
            console.error('Failed to fetch terms:', error);
            toast.error('Failed to fetch terms');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTerm = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                // Update existing term
                await api.put(`/terms/${editingId}`, termForm);
                toast.success('Term updated successfully!');
                setEditingId(null);
            } else {
                // Create new term
                await api.post('/terms', termForm);
                toast.success('Term created successfully!');
            }
            setShowModal(false);
            setTermForm({ code: '', name: '', remarks: '', startDate: '', endDate: '' });
            fetchTerms();
        } catch (error) {
            console.error('Failed to save term:', error);
            toast.error('Failed to save term. Please try again.');
        }
    };

    const handleEditClick = (term) => {
        setEditingId(term.id);
        setTermForm({
            code: term.code,
            name: term.name,
            remarks: term.remarks || '',
            startDate: term.startDate || '',
            endDate: term.endDate || ''
        });
        setShowModal(true);
    };

    const handleDeleteClick = (id) => {
        setConfirmDeleteId(id);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/terms/${confirmDeleteId}`);
            toast.success('Term deleted successfully!');
            setConfirmDeleteId(null);
            fetchTerms();
        } catch (error) {
            console.error('Failed to delete term:', error);
            toast.error('Failed to delete term.');
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Card: Management Header */}
            <div className="card w-full">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-800 m-0">Terms Processing</h3>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn btn-primary text-sm"
                    >
                        + Create Term
                    </button>
                </div>
            </div>

            {/* Terms List Area */}
            <div className="card">
                <div className="table-container">
                    {loading ? (
                        <p className="text-center py-4 text-gray-500">Loading terms...</p>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="py-3 px-4 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                                    <th className="py-3 px-4 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="py-3 px-4 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks</th>
                                    <th className="py-3 px-4 bg-gray-50 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {terms.map((term) => (
                                    <tr key={term.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-4 text-sm text-gray-900 font-medium">{term.code}</td>
                                        <td className="py-4 px-4 text-sm text-gray-900 font-medium">{term.name}</td>
                                        <td className="py-4 px-4 text-sm text-gray-500">{term.remarks || '-'}</td>
                                        <td className="py-4 px-4 text-sm text-right">
                                            <button
                                                onClick={() => handleEditClick(term)}
                                                className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded-lg shadow-sm text-xs font-semibold transition-all duration-200 mr-2"
                                            >
                                                Update
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(term.id)}
                                                className="bg-red-600 text-white hover:bg-red-700 px-3 py-1.5 rounded-lg shadow-sm text-xs font-semibold transition-all duration-200"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {terms.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center py-8 text-gray-500">
                                            No terms found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Create/Edit Term Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content term-modal-content">
                        <div className="modal-header">
                            <h3 className="text-lg font-bold text-gray-800 m-0">{editingId ? 'Edit Term' : 'Create New Term'}</h3>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingId(null);
                                    setTermForm({ code: '', name: '', remarks: '' });
                                }}
                                className="text-gray-500 hover:text-gray-700 font-bold text-xl bg-transparent border-none"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="modal-body">
                            <form onSubmit={handleCreateTerm} className="space-y-4">
                                <div className="form-group">
                                    <label className="label">Term Code *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. TERM-01"
                                        className="input-field"
                                        value={termForm.code}
                                        onChange={(e) => setTermForm({ ...termForm, code: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="label">Term Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. First Term 2024"
                                        className="input-field"
                                        value={termForm.name}
                                        onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="label">Start Date *</label>
                                        <input
                                            type="date"
                                            required
                                            className="input-field"
                                            value={termForm.startDate}
                                            onChange={(e) => setTermForm({ ...termForm, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">End Date *</label>
                                        <input
                                            type="date"
                                            required
                                            className="input-field"
                                            value={termForm.endDate}
                                            onChange={(e) => setTermForm({ ...termForm, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="label">Remarks</label>
                                    <textarea
                                        className="input-field"
                                        rows="3"
                                        placeholder="Optional remarks..."
                                        value={termForm.remarks}
                                        onChange={(e) => setTermForm({ ...termForm, remarks: e.target.value })}
                                    />
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingId(null);
                                            setTermForm({ code: '', name: '', remarks: '', startDate: '', endDate: '' });
                                        }}
                                        className="btn btn-secondary mr-2"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                    >
                                        {editingId ? 'Update Term' : 'Create Term'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDeleteId && (
                <div className="modal-overlay">
                    <div className="modal-content delete-modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3 className="text-lg font-bold text-red-600">Delete Term</h3>
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-gray-500 hover:text-gray-700 font-bold text-xl bg-transparent border-none"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="modal-body py-6">
                            <p className="text-gray-700 font-medium">Are you sure you want to delete this term?</p>
                            <p className="text-gray-500 text-sm mt-2">This action cannot be reversed. All data associated with this term will be permanently removed.</p>
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="btn btn-secondary mr-2"
                            >
                                No, Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="btn bg-red-600 text-white hover:bg-red-700 shadow-sm"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TermsTab;

