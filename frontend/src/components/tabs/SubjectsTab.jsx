import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import './SubjectsTab.css';
import { toast } from 'react-toastify';



const SubjectsTab = () => {
    const [subjects, setSubjects] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editSubject, setEditSubject] = useState(null);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const [form, setForm] = useState({
        code: '',
        name: '',
        fullMark: '',
        passMarks: '',
        semester: '',
        programId: '',
        teacherId: '',
        batch: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [subjectsRes, programsRes, teachersRes, assignmentsRes] = await Promise.all([
                api.get('/subjects'),
                api.get('/programs'),
                api.get('/teachers'),
                api.get('/teacher-subjects')
            ]);
            setSubjects(subjectsRes.data);
            setPrograms(programsRes.data);
            setTeachers(teachersRes.data);
            setAssignments(assignmentsRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/subjects', {
                ...form,
                fullMark: Number(form.fullMark),
                passMarks: Number(form.passMarks),
                semester: Number(form.semester),
                programId: Number(form.programId),
                teacherId: form.teacherId ? Number(form.teacherId) : null
            });
            toast.success('Subject created successfully!');
            // Keep batch, program, semester, fullMark, and passMarks - only clear other fields
            setForm({
                ...form,
                code: '',
                name: '',
                teacherId: ''
            });
            fetchData(); // Refresh list
        } catch (error) {
            console.error('Failed to create subject:', error);
            toast.error('Failed to create subject. Please try again.');
        }
    };

    const getAssignedTeacherId = (subjectId) => {
        const assignment = assignments.find(a => a.subject?.id === subjectId);
        return assignment ? assignment.teacher?.id : '';
    };

    const getAssignedTeacherName = (subjectId) => {
        const assignment = assignments.find(a => a.subject?.id === subjectId);
        return assignment ? assignment.teacher?.name : 'Not Assigned';
    };

    const handleEditClick = (subject) => {
        setEditSubject(subject);
        setSelectedTeacher(getAssignedTeacherId(subject.id));
    };

    const handleSaveAssignment = async () => {
        if (!selectedTeacher) return toast.warning('Please select a teacher');
        try {
            await api.put(`/subjects/${editSubject.id}/teacher`, { teacherId: selectedTeacher });
            toast.success('Teacher assigned successfully');
            setEditSubject(null);
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Failed to update teacher:', error);
            toast.error('Failed to update assignment');
        }
    };

    const handleDeleteClick = (id) => {
        setConfirmDeleteId(id);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/subjects/${confirmDeleteId}`);
            toast.success('Subject deleted successfully');
            setConfirmDeleteId(null);
            fetchData(); // Refresh to remove deleted item
        } catch (error) {
            console.error('Failed to delete subject:', error);
            toast.error('Failed to delete subject');
        }
    };

    return (
        <div className="card">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 m-0">Subjects Management</h3>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + Create Subject
                </button>
            </div>

            {/* Grouped Display */}
            {/* Grouped Display - Hierarchical: Batch -> Program -> Semester */}
            <div className="space-y-10">
                {Object.entries(subjects.reduce((acc, subject) => {
                    const batch = subject.batch || 'Older Batches';
                    if (!acc[batch]) acc[batch] = {};

                    const progName = subject.program?.name || 'Unassigned';
                    if (!acc[batch][progName]) acc[batch][progName] = {};

                    const semester = subject.semester || 'Unknown';
                    if (!acc[batch][progName][semester]) acc[batch][progName][semester] = [];

                    acc[batch][progName][semester].push(subject);
                    return acc;
                }, {})).sort((a, b) => b[0].localeCompare(a[0])).map(([batch, programs]) => (
                    <div key={batch} className="batch-section">
                        <div className="flex items-center mb-6 border-b border-gray-300 pb-2">
                            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Batch {batch}</h2>
                        </div>

                        <div className="space-y-6 pl-4">
                            {Object.entries(programs).map(([progName, semesters]) => (
                                <div key={progName} className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                                    <div className="flex items-center mb-4">
                                        <div className="h-6 w-1.5 bg-indigo-600 rounded-full mr-3"></div>
                                        <h3 className="text-xl font-bold text-gray-800">{progName}</h3>
                                    </div>

                                    {Object.entries(semesters).map(([sem, subList]) => (
                                        <div key={sem} className="ml-5 mb-6 last:mb-0 border-l-2 border-gray-100 pl-4">
                                            <h4 className="text-md font-bold text-gray-600 mb-3 flex items-center">
                                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm mr-2">Semester {sem}</span>
                                                <span className="text-xs text-gray-400 font-normal">({subList.length} subjects)</span>
                                            </h4>
                                            <div className="table-container shadow-none border border-gray-100 rounded-lg overflow-hidden bg-white">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr>
                                                            <th className="py-2 px-4 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase w-24">Code</th>
                                                            <th className="py-2 px-4 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">Subject Name</th>
                                                            <th className="py-2 px-4 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase w-32">Pass/Full Marks</th>
                                                            <th className="py-2 px-4 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">Assigned Teacher</th>
                                                            <th className="py-2 px-4 bg-gray-50 text-right text-xs font-semibold text-gray-500 uppercase w-20">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {subList.map(sub => {
                                                            const teacherName = getAssignedTeacherName(sub.id);
                                                            return (
                                                                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                                                                    <td className="py-2 px-4 text-sm font-mono text-gray-600">{sub.code}</td>
                                                                    <td className="py-2 px-4 text-sm font-medium text-gray-800">{sub.name}</td>
                                                                    <td className="py-2 px-4 text-sm text-gray-600">{sub.passMarks} / {sub.fullMark}</td>
                                                                    <td className="py-2 px-4 text-sm">
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${teacherName !== 'Not Assigned' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                                                                            {teacherName}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-2 px-4 text-right">
                                                                        <div className="flex justify-end gap-4">
                                                                            <button
                                                                                onClick={() => handleEditClick(sub)}
                                                                                className="bg-green-600 text-white hover:bg-green-700 px-3 py-1 rounded shadow-sm text-xs font-medium transition-colors">
                                                                                Edit
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteClick(sub.id)}
                                                                                className="bg-red-600 text-white hover:bg-red-700 px-3 py-1 rounded shadow-sm text-xs font-medium transition-colors">
                                                                                Delete
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content subjects-modal-content">
                        <div className="modal-header">
                            <h3 className="text-lg font-bold">Create Subject</h3>
                            <button onClick={() => setShowModal(false)} className="text-xl font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleCreate} className="modal-body space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Batch</label>
                                    <input required className="input-field" placeholder="2023"
                                        value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label">Subject Code</label>
                                    <input required className="input-field" placeholder="401"
                                        value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label">Subject Name</label>
                                    <input required className="input-field"
                                        placeholder='Programming in C'
                                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Full Marks</label>
                                    <input type="number" required className="input-field"
                                        placeholder='100'
                                        value={form.fullMark} onChange={e => setForm({ ...form, fullMark: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label">Pass Marks</label>
                                    <input type="number" required className="input-field"
                                        placeholder='45'
                                        value={form.passMarks} onChange={e => setForm({ ...form, passMarks: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Semester</label>
                                    <select required className="input-field"
                                        value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}>
                                        <option value="">Select Semester</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Program</label>
                                    <select required className="input-field"
                                        value={form.programId} onChange={e => setForm({ ...form, programId: e.target.value })}>
                                        <option value="">Select Program</option>
                                        {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Assign Teacher</label>
                                    <select className="input-field"
                                        value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })}>
                                        <option value="">Select Teacher (Optional)</option>
                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
                                    </select>
                                </div>

                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary mr-2">Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Subject</button>
                            </div>
                        </form>
                    </div>
                </div >
            )}

            {/* Edit Assignment Modal */}
            {
                editSubject && (
                    <div className="modal-overlay">
                        <div className="modal-content assign-modal-content">
                            <div className="modal-header">
                                <h3 className="text-lg font-bold">Assign Teacher</h3>
                                <button onClick={() => setEditSubject(null)} className="text-xl font-bold">&times;</button>
                            </div>
                            <div className="modal-body py-4">
                                <p className="mb-4 text-sm text-gray-600">
                                    Assigning teacher for <strong>{editSubject.name}</strong> ({editSubject.code})
                                </p>
                                <label className="label">Select Teacher</label>
                                <select
                                    className="input-field"
                                    value={selectedTeacher}
                                    onChange={(e) => setSelectedTeacher(e.target.value)}
                                >
                                    <option value="">Select Teacher</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button onClick={() => setEditSubject(null)} className="btn btn-secondary mr-2">Cancel</button>
                                <button onClick={handleSaveAssignment} className="btn btn-primary">Save</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {
                confirmDeleteId && (
                    <div className="modal-overlay">
                        <div className="modal-content delete-modal-content">
                            <div className="modal-header">
                                <h3 className="text-lg font-bold text-red-600">Delete Subject</h3>
                                <button onClick={() => setConfirmDeleteId(null)} className="text-xl font-bold">&times;</button>
                            </div>
                            <div className="modal-body py-6">
                                <p className="text-gray-700 font-medium">Are you sure want to delete?</p>
                                <p className="text-gray-500 text-sm mt-2">It is irreversible process. The subject will be hidden from the list.</p>
                            </div>
                            <div className="modal-footer">
                                <button onClick={() => setConfirmDeleteId(null)} className="btn btn-secondary mr-2">Cancel</button>
                                <button onClick={confirmDelete} className="btn bg-red-600 text-white hover:bg-red-700">Yes, Delete</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default SubjectsTab;
