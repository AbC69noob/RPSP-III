import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import './SubjectsTab.css';
import { toast } from 'react-toastify';
import { Plus, Trash2, Edit2 } from 'lucide-react';

const SubjectsTab = () => {
    const [subjects, setSubjects] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [courseBatches, setCourseBatches] = useState([]);
    const [assignments, setAssignments] = useState([]);

    // Modals
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [showRevisionModal, setShowRevisionModal] = useState(false);
    const [editSubject, setEditSubject] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [loading, setLoading] = useState(false);

    // Forms
    const [subjectForm, setSubjectForm] = useState({
        code: '',
        name: '',
        fullMark: '',
        passMarks: '',
        semester: '',
        programId: '',
        courseBatchId: '',
        teacherId: ''
    });

    const [revisionForm, setRevisionForm] = useState({
        startYear: '',
        description: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [subjectsRes, programsRes, teachersRes, assignmentsRes, batchesRes] = await Promise.all([
                api.get('/subjects'),
                api.get('/programs'),
                api.get('/teachers'),
                api.get('/teacher-subjects'),
                api.get('/course-batches')
            ]);
            setSubjects(subjectsRes.data);
            setPrograms(programsRes.data);
            setTeachers(teachersRes.data);
            setAssignments(assignmentsRes.data);
            setCourseBatches(batchesRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers for Course Revision ---
    const handleCreateRevision = async (e) => {
        e.preventDefault();
        try {
            await api.post('/course-batches', {
                startYear: Number(revisionForm.startYear),
                description: revisionForm.description
            });
            toast.success('Course Batch created successfully');
            setShowRevisionModal(false);
            setRevisionForm({ startYear: '', description: '' });
            fetchData();
        } catch (error) {
            console.error('Failed to create revision:', error);
            toast.error(error.response?.data || 'Failed to create revision');
        }
    };

    // --- Handlers for Subject ---
    const handleOpenSubjectModal = (courseBatchId, programId) => {
        setSubjectForm({
            ...subjectForm,
            courseBatchId: courseBatchId,
            programId: programId,
            code: '',
            name: '',
            fullMark: '',
            passMarks: '',
            semester: '',
            teacherId: ''
        });
        setShowSubjectModal(true);
    };

    const handleCreateSubject = async (e) => {
        e.preventDefault();
        try {
            await api.post('/subjects', {
                ...subjectForm,
                fullMark: Number(subjectForm.fullMark),
                passMarks: Number(subjectForm.passMarks),
                semester: Number(subjectForm.semester),
                programId: Number(subjectForm.programId),
                courseBatchId: Number(subjectForm.courseBatchId),
                teacherId: subjectForm.teacherId ? Number(subjectForm.teacherId) : null
            });
            toast.success('Subject created successfully!');
            setShowSubjectModal(false);
            fetchData();
        } catch (error) {
            console.error('Failed to create subject:', error);
            toast.error('Failed to create subject');
        }
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
            fetchData();
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
            fetchData();
        } catch (error) {
            console.error('Failed to delete subject:', error);
            toast.error('Failed to delete subject');
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

    // --- Helpers ---
    const getBatchName = (batch) => {
        if (!batch) return 'Unknown Batch';
        return `Batch ${batch.startYear} ${batch.description ? `(${batch.description})` : ''}`;
    };

    // Grouping Logic: CourseBatch -> Program -> Semester
    // We iterate courseBatches to maintain order and structure
    // But grouping logic might be inverted: Batch (Year/Remarks) -> Program is cleaner? 
    // Actually, CourseBatch IS linked to a specific Program.
    // So distinct Batches are essentially (Program + Year).
    // Let's group by "Batch Year + Remarks" ? Or just iterate CourseBatches as top level sections.
    // CourseBatch entity has `program`.
    // So 2021 Fall might have batches for BE Computer, BE Civil etc.
    // Let's group by Batch Year first? No, CourseBatch IS the revision entity.

    // Group subjects by CourseBatch ID
    const subjectsByBatch = subjects.reduce((acc, sub) => {
        const bid = sub.courseBatch?.id || 'unassigned';
        if (!acc[bid]) acc[bid] = [];
        acc[bid].push(sub);
        return acc;
    }, {});

    return (
        <div className="card w-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 m-0">Subjects Management</h3>
                    <p className="text-sm text-gray-500 mt-1">Manage curriculum revisions and subjects</p>
                </div>
                <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowRevisionModal(true)}>
                    <Plus size={18} />
                    Create Course Revision
                </button>
            </div>

            {/* List of Course Batches */}
            <div className="space-y-8">
                {courseBatches.length === 0 && (
                    <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        No course revisions found. Create one to get started.
                    </div>
                )}

                {courseBatches.sort((a, b) => b.startYear - a.startYear).map(batch => {
                    // Determine which programs to show for this batch
                    // If batch has specific program, show only that. Else show ALL programs.
                    const programsForBatch = batch.program ? [batch.program] : programs;

                    return (
                        <div key={batch.id} className="batch-section bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
                            {/* Batch Header */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Batch {batch.startYear} <span className="text-sm font-normal text-gray-500">({batch.description || 'No description'})</span>
                                </h2>
                            </div>

                            <div className="p-6 space-y-8">
                                {programsForBatch.map(prog => {
                                    // Filter subjects for this Batch AND this Program
                                    const batchSubjects = subjects.filter(s =>
                                        s.courseBatch?.id === batch.id && s.program?.id === prog.id
                                    );

                                    // Group by Semester
                                    const subjectsBySemester = batchSubjects.reduce((acc, sub) => {
                                        const sem = sub.semester || 0;
                                        if (!acc[sem]) acc[sem] = [];
                                        acc[sem].push(sub);
                                        return acc;
                                    }, {});

                                    return (
                                        <div key={prog.id} className="program-section">
                                            {/* Program Header */}
                                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                                <h3 className="text-lg font-bold text-indigo-700">{prog.name}</h3>
                                                <button
                                                    className="btn btn-sm btn-dark flex items-center gap-1 bg-gray-800 text-white hover:bg-gray-900 px-3 py-1.5 rounded-lg text-sm"
                                                    onClick={() => handleOpenSubjectModal(batch.id, prog.id)}
                                                >
                                                    <Plus size={16} />
                                                    Add subject
                                                </button>
                                            </div>

                                            {/* Semester Blocks */}
                                            <div className="space-y-6">
                                                {/* Ensure we show at least distinct semesters or a placeholder if empty? 
                                                    User design shows "Semester 1", "Semester 2". 
                                                    If no data, maybe we don't show all semesters? 
                                                    The design implies specific semesters are shown.
                                                    Let's iterate semesters 1-8 for completeness or just active ones?
                                                    Reference image shows "Semester 1", "Semester 2".
                                                    Let's show existing semesters. If none, show "No subjects".
                                                */}
                                                {Object.keys(subjectsBySemester).length === 0 ? (
                                                    <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-400 text-sm">
                                                        No subjects added for {prog.name} in this revision.
                                                    </div>
                                                ) : (
                                                    Object.entries(subjectsBySemester).sort((a, b) => Number(a[0]) - Number(b[0])).map(([sem, subList]) => (
                                                        <div key={sem} className="semester-block">
                                                            <h4 className="font-semibold text-gray-700 mb-2">Semester {sem}</h4>
                                                            <div className="semester-content bg-gray-100 rounded-lg p-4 min-h-[80px]">
                                                                {/* Subject List Grid */}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                    {subList.map(sub => {
                                                                        const teacherName = getAssignedTeacherName(sub.id);
                                                                        const hasTeacher = getAssignedTeacherId(sub.id);

                                                                        return (
                                                                            <div key={sub.id} className="subject-card bg-white border border-gray-200 rounded p-3 shadow-sm hover:shadow-md transition-shadow group relative">
                                                                                <div className="flex justify-between items-start">
                                                                                    <div>
                                                                                        <div className="text-xs font-mono text-gray-500">{sub.code}</div>
                                                                                        <div className="font-medium text-gray-900">{sub.name}</div>
                                                                                    </div>
                                                                                    {/* Actions */}
                                                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-white rounded border border-gray-100 shadow-sm">
                                                                                        <button onClick={() => handleEditClick(sub)} className="p-1 hover:text-indigo-600"><Edit2 size={14} /></button>
                                                                                        <button onClick={() => handleDeleteClick(sub.id)} className="p-1 hover:text-red-600"><Trash2 size={14} /></button>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                                                                                    <span>FM: {sub.fullMark} | PM: {sub.passMarks}</span>
                                                                                    <span className={`px-1.5 py-0.5 rounded ${hasTeacher ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                                        {hasTeacher ? teacherName : 'No Teacher'}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Create Course Revision Modal */}
            {showRevisionModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3 className="text-lg font-bold">Create Course Revision</h3>
                            <button onClick={() => setShowRevisionModal(false)} className="text-2xl font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleCreateRevision} className="modal-body space-y-4">
                            <div className="form-group">
                                <label className="label">Start Year *</label>
                                <input type="number" required className="input-field" placeholder="2023"
                                    value={revisionForm.startYear}
                                    onChange={e => setRevisionForm({ ...revisionForm, startYear: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="label">Description</label>
                                <textarea className="input-field" rows="3" placeholder="e.g., Updated curriculum as per 2023 guidelines"
                                    value={revisionForm.description}
                                    onChange={e => setRevisionForm({ ...revisionForm, description: e.target.value })}
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowRevisionModal(false)} className="btn btn-secondary mr-2">Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Revision</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Subject Modal */}
            {showSubjectModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h3 className="text-lg font-bold">Add Subject</h3>
                            <button onClick={() => setShowSubjectModal(false)} className="text-2xl font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleCreateSubject} className="modal-body space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Subject Code *</label>
                                    <input required className="input-field" placeholder="CSC-101"
                                        value={subjectForm.code}
                                        onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label">Subject Name *</label>
                                    <input required className="input-field" placeholder="Introduction to Programming"
                                        value={subjectForm.name}
                                        onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Full Marks *</label>
                                    <input type="number" required className="input-field" placeholder="100"
                                        value={subjectForm.fullMark}
                                        onChange={e => setSubjectForm({ ...subjectForm, fullMark: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label">Pass Marks *</label>
                                    <input type="number" required className="input-field" placeholder="40"
                                        value={subjectForm.passMarks}
                                        onChange={e => setSubjectForm({ ...subjectForm, passMarks: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Semester *</label>
                                    <select required className="input-field"
                                        value={subjectForm.semester}
                                        onChange={e => setSubjectForm({ ...subjectForm, semester: e.target.value })}>
                                        <option value="">Select Semester</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Assign Teacher (Optional)</label>
                                    <select className="input-field"
                                        value={subjectForm.teacherId}
                                        onChange={e => setSubjectForm({ ...subjectForm, teacherId: e.target.value })}>
                                        <option value="">Unassigned</option>
                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowSubjectModal(false)} className="btn btn-secondary mr-2">Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Subject</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Assignment Modal */}
            {editSubject && (
                <div className="modal-overlay">
                    <div className="modal-content assign-modal-content"> // Using existing class for styling if needed
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
            )}

            {/* Delete Confirmation Modal */}
            {confirmDeleteId && (
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
            )}
        </div>
    );
};

export default SubjectsTab;
