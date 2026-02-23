import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './SubjectsTab.css';
import { toast } from 'react-toastify';
import {
    Plus,
    Trash2,
    Calendar,
    GraduationCap,
    User,
    CheckCircle2
} from 'lucide-react';

const SubjectsTab = () => {
    const [subjects, setSubjects] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [courseBatches, setCourseBatches] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [assignments, setAssignments] = useState([]);

    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [showRevisionModal, setShowRevisionModal] = useState(false);
    const [editSubject, setEditSubject] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [loading, setLoading] = useState(false);

    const [subjectForm, setSubjectForm] = useState({
        code: '',
        name: '',
        fullMark: '',
        passMarks: '',
        semesterId: '',
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
            const [s, p, t, a, b, sem] = await Promise.all([
                api.get('/subjects'),
                api.get('/programs'),
                api.get('/teachers'),
                api.get('/teacher-subjects'),
                api.get('/course-batches'),
                api.get('/semesters')
            ]);
            setSubjects(s.data);
            setPrograms(p.data);
            setTeachers(t.data);
            setAssignments(a.data);
            setCourseBatches(b.data);
            setSemesters(sem.data.sort((x, y) => x.semesterNumber - y.semesterNumber));
        } catch {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const getAssignedTeacherId = (id) =>
        assignments.find(a => a.subject?.id === id)?.teacher?.id || '';

    const getAssignedTeacherName = (id) =>
        assignments.find(a => a.subject?.id === id)?.teacher?.name || 'Needs Instructor';

    const handleOpenSubjectModal = (batchId, programId) => {
        setSubjectForm({
            code: '',
            name: '',
            fullMark: '',
            passMarks: '',
            semesterId: '',
            programId,
            courseBatchId: batchId,
            teacherId: ''
        });
        setShowSubjectModal(true);
    };

    const handleCreateRevision = async (e) => {
        e.preventDefault();
        try {
            await api.post('/course-batches', {
                startYear: Number(revisionForm.startYear),
                description: revisionForm.description
            });
            toast.success('Course Batch created');
            setShowRevisionModal(false);
            setRevisionForm({ startYear: '', description: '' });
            fetchData();
        } catch {
            toast.error('Failed to create revision');
        }
    };

    const handleCreateSubject = async (e) => {
        e.preventDefault();
        try {
            await api.post('/subjects', {
                ...subjectForm,
                fullMark: Number(subjectForm.fullMark),
                passMarks: Number(subjectForm.passMarks),
                semesterId: Number(subjectForm.semesterId),
                programId: Number(subjectForm.programId),
                courseBatchId: Number(subjectForm.courseBatchId),
                teacherId: subjectForm.teacherId ? Number(subjectForm.teacherId) : null
            });
            toast.success('Subject added');
            setSubjectForm(prev => ({ ...prev, code: '', name: '', teacherId: '' }));
            fetchData();
        } catch {
            toast.error('Failed to create subject');
        }
    };

    const handleSaveAssignment = async () => {
        if (!selectedTeacher) return toast.warning('Select teacher');
        try {
            await api.put(`/subjects/${editSubject.id}/teacher`, { teacherId: selectedTeacher });
            toast.success('Teacher assigned');
            setEditSubject(null);
            fetchData();
        } catch {
            toast.error('Assignment failed');
        }
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/subjects/${confirmDeleteId}`);
            toast.success('Subject deleted');
            setConfirmDeleteId(null);
            fetchData();
        } catch {
            toast.error('Delete failed');
        }
    };

    return (
        <div className="w-full animate-fadeIn">
            <div className="header-row">
                <div>
                    <h1 className="page-title">Curriculum Revisions</h1>
                    <p className="page-subtitle">Manage subject catalogs</p>
                </div>
                <button
                    className="primary-btn"
                    onClick={() => setShowRevisionModal(true)}
                >
                    <Plus size={18} /> New Course Revision
                </button>
            </div>

            <div className="content-wrapper">
                {courseBatches
                    .sort((a, b) => b.startYear - a.startYear)
                    .map(batch => (
                        <div key={batch.id} className="batch-card">
                            <div className="batch-header-gradient">
                                <Calendar size={20} />
                                <div>
                                    <h2>Revised on {batch.startYear}</h2>
                                    <p>{batch.description || 'General Revision'}</p>
                                </div>
                            </div>

                            <div className="batch-content">
                                {programs.map(prog => {
                                    const list = subjects.filter(
                                        s => s.courseBatch?.id === batch.id && s.program?.id === prog.id
                                    );
                                    const bySem = list.reduce((a, s) => {
                                        const semKey = s.semester?.name || 'Unknown';
                                        a[semKey] = a[semKey] || [];
                                        a[semKey].push(s);
                                        return a;
                                    }, {});

                                    return (
                                        <div key={prog.id}>
                                            <div className="program-header">
                                                <h3>
                                                    <GraduationCap size={18} /> {prog.name}
                                                </h3>
                                                <button
                                                    className="add-subject-btn"
                                                    onClick={() => handleOpenSubjectModal(batch.id, prog.id)}
                                                >
                                                    <Plus size={14} /> Add Subject
                                                </button>
                                            </div>

                                            {Object.entries(bySem).map(([sem, subs]) => (
                                                <div key={sem}>
                                                    <span className="semester-label">Semester {sem}</span>
                                                    <div className="subject-grid">
                                                        {subs.map(sub => (
                                                            <div key={sub.id} className="modern-subject-card">
                                                                <div className="action-overlay">
                                                                    <button onClick={() => {
                                                                        setEditSubject(sub);
                                                                        setSelectedTeacher(getAssignedTeacherId(sub.id));
                                                                    }}>
                                                                        <Plus size={14} />
                                                                    </button>
                                                                    <button onClick={() => setConfirmDeleteId(sub.id)}>
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>

                                                                <span className="subject-code-badge">{sub.code}</span>
                                                                <h4 className="subject-name-text">{sub.name}</h4>

                                                                <div className="subject-footer">
                                                                    <div className="subject-stats-row">
                                                                        <span>FM {sub.fullMark}</span>
                                                                        <span>PM {sub.passMarks}</span>
                                                                    </div>
                                                                    <div className={`teacher-badge ${getAssignedTeacherId(sub.id) ? 'teacher-assigned' : 'teacher-unassigned'}`}>
                                                                        <User size={12} />
                                                                        {getAssignedTeacherName(sub.id)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
            </div>

            {/* Modals */}
            {
                showRevisionModal && (
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
                )
            }

            {
                showSubjectModal && (
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
                                        <input required className="input-field" placeholder="Programming"
                                            value={subjectForm.name}
                                            onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Full Marks *</label>
                                        <input
                                            type="number"
                                            min="0"
                                            required
                                            className="input-field"
                                            placeholder="100"
                                            value={subjectForm.fullMark}
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (val !== '' && Number(val) < 0) {
                                                    toast.warn("Marks cannot be negative");
                                                    return;
                                                }
                                                setSubjectForm({ ...subjectForm, fullMark: val });
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Pass Marks *</label>
                                        <input
                                            type="number"
                                            min="0"
                                            required
                                            className="input-field"
                                            placeholder="40"
                                            value={subjectForm.passMarks}
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (val !== '' && Number(val) < 0) {
                                                    toast.warn("Marks cannot be negative");
                                                    return;
                                                }
                                                setSubjectForm({ ...subjectForm, passMarks: val });
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Semester *</label>
                                        <select required className="input-field"
                                            value={subjectForm.semesterId}
                                            onChange={e => setSubjectForm({ ...subjectForm, semesterId: e.target.value })}>
                                            <option value="">Select</option>
                                            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Assign Teacher</label>
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
                )
            }

            {
                editSubject && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '400px' }}>
                            <div className="modal-header">
                                <h3 className="text-lg font-bold">Assign Teacher</h3>
                                <button onClick={() => setEditSubject(null)} className="text-xl font-bold">&times;</button>
                            </div>
                            <div className="modal-body py-4">
                                <p className="mb-4 text-sm text-gray-600">Assigning for <strong>{editSubject.name}</strong></p>
                                <label className="label">Select Teacher</label>
                                <select className="input-field" value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}>
                                    <option value="">Select Teacher</option>
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
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

            {
                confirmDeleteId && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '400px' }}>
                            <div className="modal-header">
                                <h3 className="text-lg font-bold text-red-600">Delete Subject</h3>
                                <button onClick={() => setConfirmDeleteId(null)} className="text-xl font-bold">&times;</button>
                            </div>
                            <div className="modal-body py-6">
                                <p className="text-gray-700 font-medium">Are you sure want to delete?</p>
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
