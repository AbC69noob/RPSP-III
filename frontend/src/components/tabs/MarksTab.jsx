import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import './MarksTab.css';
import {
    Plus,
    Table as TableIcon,
    Filter,
    ChevronDown,
    ChevronUp,
    BookOpen,
    GraduationCap,
    Calendar,
    Users,
    CheckCircle2,
    RefreshCcw,
    Save
} from 'lucide-react';
import { toast } from 'react-toastify';

const MarksTab = () => {
    const [marks, setMarks] = useState([]);
    const [students, setStudents] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [terms, setTerms] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [studentBatches, setStudentBatches] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [crTerms, setCrTerms] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [selectedStudentBatchId, setSelectedStudentBatchId] = useState('');
    const [selectedProgramId, setSelectedProgramId] = useState('');
    const [selectedSemesterId, setSelectedSemesterId] = useState('');
    const [selectedTermId, setSelectedTermId] = useState('');

    const [filtersApplied, setFiltersApplied] = useState(false);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Expansion states
    const [expandedSubjectId, setExpandedSubjectId] = useState(null);
    const [teacherAssignments, setTeacherAssignments] = useState([]);

    // Multi-subject state: { [subjectId]: { [studentId]: { obtainedMarks, remark, id } } }
    const [marksEntry, setMarksEntry] = useState({});

    // Grouping logic for teacher assignments
    const groupedAssignments = useMemo(() => {
        const groups = {};
        teacherAssignments.forEach(asm => {
            const batchId = asm.subject?.courseBatch?.id || 'no-revision';
            const batchYear = asm.subject?.courseBatch?.startYear || 'General';
            const programId = asm.studentProgram?.id || 'no-program';
            const programName = asm.studentProgram?.name || 'Unknown';

            if (!groups[batchId]) {
                groups[batchId] = { year: batchYear, programs: {} };
            }
            if (!groups[batchId].programs[programId]) {
                groups[batchId].programs[programId] = { name: programName, assignments: [] };
            }
            groups[batchId].programs[programId].assignments.push(asm);
        });
        return groups;
    }, [teacherAssignments]);

    const availableTerms = useMemo(() => {
        return crTerms;
    }, [crTerms]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Auto-fetch subjects for admin view when filters change
    useEffect(() => {
        if (!isTeacher && selectedStudentBatchId && selectedProgramId && selectedSemesterId) {
            fetchFilteredSubjects();
        }
    }, [selectedStudentBatchId, selectedProgramId, selectedSemesterId]);

    const isTeacher = currentUser?.role?.toLowerCase() === 'teacher';

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [marksRes, studentsRes, termsRes, programsRes, profileRes, batchesRes, semsRes, crTermsRes] = await Promise.all([
                api.get('/marks'),
                api.get('/students'),
                api.get('/terms'),
                api.get('/programs'),
                api.get('/profile'),
                api.get('/student-batches'),
                api.get('/semesters'),
                api.get('/cr-terms')
            ]);
            setMarks(marksRes.data);
            setAllStudents(studentsRes.data);
            setTerms(termsRes.data);
            setPrograms(programsRes.data);
            setCrTerms(crTermsRes.data);
            setCurrentUser(profileRes.data);
            setStudentBatches(batchesRes.data);
            setSemesters(semsRes.data.sort((a, b) => a.semesterNumber - b.semesterNumber));

            if (profileRes.data.role.toLowerCase() === 'teacher' && profileRes.data.teacherId) {
                const asmRes = await api.get(`/teacher-subjects/teacher/${profileRes.data.teacherId}`);
                setTeacherAssignments(asmRes.data);
            }
        } catch (error) {
            toast.error('Initialization failed');
        } finally {
            setLoading(false);
        }
    };

    const fetchFilteredSubjects = async () => {
        try {
            setLoadingSubjects(true);
            const batch = studentBatches.find(b => b.id === Number(selectedStudentBatchId));
            const response = await api.get('/subjects/filter', {
                params: {
                    programId: Number(selectedProgramId),
                    semesterId: Number(selectedSemesterId),
                    courseBatchId: batch?.courseBatch?.id
                }
            });
            setSubjects(response.data);
        } catch (error) {
            setSubjects([]);
        } finally {
            setLoadingSubjects(false);
        }
    };

    const handleApplyFilters = async () => {
        if (!selectedStudentBatchId || !selectedProgramId || !selectedSemesterId || !selectedTermId) {
            toast.warning('Complete filters first');
            return;
        }

        // Check for active specific term session
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const hasActiveSession = terms.some(t => {
            if (!t.crTerm || t.crTerm.id !== Number(selectedTermId)) return false;
            if (!t.startDate || !t.endDate) return false;
            const start = new Date(t.startDate);
            const end = new Date(t.endDate);
            const extendedEnd = new Date(end);
            extendedEnd.setDate(extendedEnd.getDate() + 15);
            return today >= start && today <= extendedEnd;
        });

        if (!hasActiveSession) {
            toast.error("Term not created. Please contact Administrator to create an active exam window.");
            return;
        }

        setLoadingStudents(true);
        try {
            const batch = studentBatches.find(b => b.id === Number(selectedStudentBatchId));
            const response = await api.get('/students/filter', {
                params: {
                    programId: Number(selectedProgramId),
                    semesterId: Number(selectedSemesterId),
                    courseBatchId: batch?.courseBatch?.id
                }
            });

            const filteredStudents = response.data;
            setStudents(filteredStudents);

            // Initialize all-subjects marksEntry
            const initialEntry = {};
            subjects.forEach(subject => {
                initialEntry[subject.id] = {};
                filteredStudents.forEach(student => {
                    const existing = marks.find(m =>
                        m.student?.id === student.id &&
                        m.subject?.id === subject.id &&
                        m.term?.crTerm?.id === Number(selectedTermId)
                    );
                    initialEntry[subject.id][student.id] = existing ? {
                        obtainedMarks: existing.obtainedMarks,
                        remark: existing.remark || '',
                        id: existing.id
                    } : { obtainedMarks: '', remark: '', id: null };
                });
            });

            setMarksEntry(initialEntry);
            setFiltersApplied(true);
            setExpandedSubjectId(null);
        } catch (error) {
            toast.error('Data load failed');
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleMarkChange = (subjId, studId, field, value) => {
        if (field === 'obtainedMarks' && value !== '') {
            const numValue = Number(value);
            if (numValue < 0) {
                toast.warn("Marks cannot be negative");
                return;
            }
            if (numValue > 100) {
                toast.warn("Marks cannot exceed 100");
                return;
            }
        }

        setMarksEntry(prev => ({
            ...prev,
            [subjId]: {
                ...prev[subjId],
                [studId]: { ...prev[subjId][studId], [field]: value }
            }
        }));
    };

    const handleSaveSubjectAll = async (subjectId) => {
        const entryGroup = marksEntry[subjectId];
        if (!entryGroup) return;

        const marksToSave = students.map(student => {
            const entry = entryGroup[student.id];
            if (!entry || entry.obtainedMarks === '' || entry.obtainedMarks === null) return null;

            const payload = {
                student: { id: student.id },
                subject: { id: Number(subjectId) },
                term: { crTerm: { id: Number(selectedTermId) } },
                obtainedMarks: Number(entry.obtainedMarks),
                remark: entry.remark,
            };
            if (entry.id) payload.id = entry.id;
            return payload;
        }).filter(Boolean);

        if (marksToSave.length === 0) {
            toast.info('Nothing to save');
            return;
        }

        try {
            await api.post('/marks/bulk', marksToSave);
            toast.success('Grades synchronized');
            const refresh = await api.get('/marks');
            setMarks(refresh.data);

            // Sync local IDs
            setMarksEntry(prev => {
                const updated = { ...prev };
                students.forEach(s => {
                    const match = refresh.data.find(m =>
                        m.student?.id === s.id &&
                        m.subject?.id === Number(subjectId) &&
                        m.term?.crTerm?.id === Number(selectedTermId)
                    );
                    if (match && updated[subjectId][s.id]) {
                        updated[subjectId][s.id].id = match.id;
                    }
                });
                return updated;
            });
        } catch (error) {
            toast.error('Sync failed');
        }
    };

    const handlePublishToggle = async (publish) => {
        if (!selectedStudentBatchId || !selectedProgramId || !selectedSemesterId || !selectedTermId) {
            toast.warning('Complete filters first');
            return;
        }

        const endpoint = publish ? '/marks/publish' : '/marks/unpublish';
        try {
            await api.put(endpoint, null, {
                params: {
                    programId: Number(selectedProgramId),
                    semesterId: Number(selectedSemesterId),
                    crTermId: Number(selectedTermId),
                    studentBatchId: Number(selectedStudentBatchId)
                }
            });
            toast.success(publish ? 'Results published successfully!' : 'Results unpublished.');
            // Refresh marks after publish/unpublish
            const refresh = await api.get('/marks');
            setMarks(refresh.data);
            // Also refresh marksEntry to update visibility of status
            handleApplyFilters();
        } catch (error) {
            console.error('Failed to toggle publish status:', error);
            toast.error(error.response?.data || 'Operation failed');
        }
    };

    const handleTeacherExpand = async (assignment) => {
        if (expandedSubjectId === assignment.subject.id) {
            setExpandedSubjectId(null);
            return;
        }

        if (!selectedTermId) {
            toast.warning('Select evaluation term');
            return;
        }

        setExpandedSubjectId(assignment.subject.id);
        const subjId = assignment.subject.id;

        setLoadingStudents(true);
        try {
            const response = await api.get('/students/filter', {
                params: {
                    programId: assignment.studentProgram?.id,
                    semesterId: assignment.studentSemester?.id,
                    courseBatchId: assignment.subject?.courseBatch?.id
                }
            });
            const filteredStudents = response.data;
            setStudents(filteredStudents);

            setMarksEntry(prev => {
                const next = { ...prev };
                next[subjId] = {};
                filteredStudents.forEach(s => {
                    const existing = marks.find(m =>
                        m.student?.id === s.id &&
                        m.subject?.id === subjId &&
                        m.term?.crTerm?.id === Number(selectedTermId)
                    );
                    next[subjId][s.id] = existing ? {
                        obtainedMarks: existing.obtainedMarks,
                        remark: existing.remark || '',
                        id: existing.id
                    } : { obtainedMarks: '', remark: '', id: null };
                });
                return next;
            });
        } catch (error) {
            toast.error('Roster load failed');
        } finally {
            setLoadingStudents(false);
        }
    };

    const renderAccordionSubject = (subject, fullMark) => {
        const isExpanded = expandedSubjectId === subject.id;

        return (
            <div key={subject.id} className={`subject-accordion-item ${isExpanded ? 'expanded' : ''}`}>
                <div
                    className={`subject-accordion-header ${isExpanded ? 'subject-header-active' : ''}`}
                    onClick={() => setExpandedSubjectId(isExpanded ? null : subject.id)}
                >
                    <div className="flex items-center gap-5">
                        <div className={`p-2.5 rounded-xl ${isExpanded ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                            <BookOpen size={20} />
                        </div>
                        <div>
                            <h5 className="font-black text-lg leading-tight">{subject.name}</h5>
                            <div className={`flex items-center gap-3 text-xs mt-1 ${isExpanded ? 'text-indigo-100' : 'text-gray-500'}`}>
                                <span className="font-bold uppercase tracking-widest">{subject.code}</span>
                            </div>
                        </div>
                    </div>
                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} className="opacity-40" />}
                </div>

                {isExpanded && (
                    <div className="p-8 animate-fadeIn">
                        {renderMarksTable(subject.id, fullMark, subject.passMarks)}
                    </div>
                )}
            </div>
        );
    };

    const renderMarksTable = (subjId, fullMark, passMarks) => {
        if (loadingStudents) return (
            <div className="text-center py-10">
                <RefreshCcw size={24} className="inline animate-spin text-indigo-500 mr-2" />
                <span className="text-sm font-bold text-gray-400">Loading roster...</span>
            </div>
        );

        const currentEntrySet = marksEntry[subjId] || {};

        return (
            <div className="space-y-6">
                <div className="overflow-x-auto">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th style={{ width: '80px' }}>Roll</th>
                                <th>Student Identity</th>
                                <th style={{ width: '100px' }}>Full Mark</th>
                                <th style={{ width: '100px' }}>Pass Mark</th>
                                <th style={{ width: '160px' }}>Obtained Marks</th>
                                <th>Remarks</th>
                                <th style={{ width: '140px', textAlign: 'center' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-12 text-gray-400 italic">No matches found.</td></tr>
                            ) : (
                                students.map(student => {
                                    const entry = currentEntrySet[student.id] || {};
                                    return (
                                        <tr key={student.id}>
                                            <td className="font-bold text-gray-500">{student.rollNo}</td>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-gray-900">{student.name}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">{student.gender}</span>
                                                </div>
                                            </td>
                                            <td className="font-bold text-gray-600">{fullMark}</td>
                                            <td className="font-bold text-red-600">{passMarks}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="table-input"
                                                    value={entry.obtainedMarks}
                                                    onChange={(e) => handleMarkChange(subjId, student.id, 'obtainedMarks', e.target.value)}
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="table-input py-2 px-3 font-medium text-gray-600 border-none bg-gray-50 focus:bg-white"
                                                    value={entry.remark}
                                                    onChange={(e) => handleMarkChange(subjId, student.id, 'remark', e.target.value)}
                                                    placeholder="-"
                                                />
                                            </td>
                                            <td align="center">
                                                <div className={`status-badge ${entry.id ? 'status-badge-saved' : 'status-badge-new'}`}>
                                                    {entry.id ? <CheckCircle2 size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                                                    <span className="text-[9px] font-black uppercase tracking-wider">{entry.id ? 'Saved' : 'Unsaved'}</span>
                                                </div>
                                                {entry.id && (
                                                    <div className={`mt-1 text-[8px] font-bold uppercase tracking-widest ${marks.find(m => m.id === entry.id)?.publishStatus ? 'text-green-600' : 'text-amber-500'}`}>
                                                        {marks.find(m => m.id === entry.id)?.publishStatus ? 'Published' : 'Draft'}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                {students.length > 0 && (
                    <div className="flex justify-end pt-4">
                        <button className="btn-modern btn-primary px-8" onClick={() => handleSaveSubjectAll(subjId)}>
                            <Save size={18} /> Update {subjects.find(s => s.id === subjId)?.code}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <RefreshCcw size={48} className="text-indigo-600 animate-spin mb-4" />
            <p className="text-indigo-900 font-black uppercase tracking-widest text-xs">Authenticating Academic Vault</p>
        </div>
    );

    return (
        <div className="w-full animate-fadeIn pb-20">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Grade Records</h1>
                    <p className="text-gray-500 mt-1 font-medium">Manage institutional performance data</p>
                </div>
            </div>

            {/* Admin Filters */}
            {!isTeacher && (
                <div className="filter-card">
                    <div className="filter-grid">
                        <div className="filter-item">
                            <label>Intake Batch</label>
                            <select className="modern-select" value={selectedStudentBatchId} onChange={(e) => setSelectedStudentBatchId(e.target.value)}>
                                <option value="">Select Intake</option>
                                {studentBatches.sort((a, b) => b.name.localeCompare(a.name)).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="filter-item">
                            <label>Curriculum Program</label>
                            <select className="modern-select" value={selectedProgramId} onChange={(e) => setSelectedProgramId(e.target.value)}>
                                <option value="">Select Program</option>
                                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="filter-item">
                            <label>Semester</label>
                            <select className="modern-select" value={selectedSemesterId} onChange={(e) => setSelectedSemesterId(e.target.value)}>
                                <option value="">Select Semester</option>
                                {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="filter-item">
                            <label>Examination Term</label>
                            <select className="modern-select" value={selectedTermId} onChange={(e) => setSelectedTermId(e.target.value)}>
                                <option value="">Select Term</option>
                                {availableTerms.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button className="btn-modern btn-primary" onClick={handleApplyFilters}>
                            <RefreshCcw size={18} /> Submit
                        </button>
                        {filtersApplied && <button className="btn-modern btn-secondary" onClick={() => { setFiltersApplied(false); setExpandedSubjectId(null); }}>Reset</button>}
                        {filtersApplied && (
                            <div className="flex gap-2 ml-auto">
                                <button className="btn-modern bg-green-600 text-white hover:bg-green-700" onClick={() => handlePublishToggle(true)}>
                                    <CheckCircle2 size={18} /> Publish Results
                                </button>
                                <button className="btn-modern bg-amber-600 text-white hover:bg-amber-700" onClick={() => handlePublishToggle(false)}>
                                    <RefreshCcw size={18} /> Unpublish
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Teacher Header */}
            {isTeacher && (
                <div className="filter-card bg-indigo-50/50 border-indigo-100 mb-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg"><Calendar size={24} /></div>
                            <div>
                                <h3 className="text-lg font-black text-indigo-950">Active Evaluation</h3>
                                <p className="text-sm text-indigo-600 font-medium">Select term to begin grading</p>
                            </div>
                        </div>
                        <select className="modern-select border-indigo-200" style={{ minWidth: '240px' }} value={selectedTermId} onChange={(e) => { setSelectedTermId(e.target.value); setExpandedSubjectId(null); }}>
                            <option value="">Select Evaluation Term</option>
                            {availableTerms.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Content Area */}
            {((!isTeacher && filtersApplied) || isTeacher) && (
                <div className="space-y-8 animate-fadeIn">
                    {!isTeacher && subjects.length === 0 && <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 font-bold uppercase tracking-widest text-xs">No subjects mapped to this criteria</div>}

                    {/* Render Subjects as Accordions */}
                    {isTeacher ? (
                        Object.entries(groupedAssignments).map(([batchId, batchData]) => (
                            <div key={batchId} className="space-y-4">
                                <div className="flex items-center gap-2 px-2"><span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Revision</span><h4 className="text-sm font-black text-gray-800 uppercase tracking-tighter">Approved {batchData.year}</h4></div>
                                {Object.entries(batchData.programs).map(([progId, progData]) => (
                                    <div key={progId} className="space-y-4">
                                        <div className="flex items-center gap-3 ml-4 mb-2"><GraduationCap size={16} className="text-gray-300" /><span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{progData.name}</span></div>
                                        <div className="grid grid-cols-1 gap-4">{progData.assignments.map(asm => renderAccordionSubject(asm.subject, asm.subject.fullMark))}</div>
                                    </div>
                                ))}
                            </div>
                        ))
                    ) : (
                        <div className="grid grid-cols-1 gap-4">{subjects.map(s => renderAccordionSubject(s, s.fullMark))}</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MarksTab;
