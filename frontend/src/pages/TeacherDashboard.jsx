import React, { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import {
    BookOpen,
    GraduationCap,
    Calendar,
    ChevronLeft,
    CheckCircle2,
    Clock,
    LayoutDashboard,
    Save,
    ChevronRight,
    ChevronUp,
    ChevronDown,
    Users,
    Sparkles,
    ArrowRight,
    RefreshCcw
} from 'lucide-react';
import { toast } from 'react-toastify';
import '../components/tabs/MarksTab.css';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
    const [terms, setTerms] = useState([]);
    const [crTerms, setCrTerms] = useState([]);
    const [teacherAssignments, setTeacherAssignments] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const [view, setView] = useState('term');
    const [selectedTerm, setSelectedTerm] = useState(null);
    const [selectedAssignment, setSelectedAssignment] = useState(null);

    const [students, setStudents] = useState([]);
    const [marksEntry, setMarksEntry] = useState({});
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Accordion Expansion State
    const [expandedSubjectId, setExpandedSubjectId] = useState(null);

    // Filter state for subject selection
    const [filterBatchId, setFilterBatchId] = useState('');
    const [filterProgramId, setFilterProgramId] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [termsRes, profileRes, crTermsRes] = await Promise.all([
                api.get('/terms'),
                api.get('/profile'),
                api.get('/cr-terms')
            ]);
            setTerms(termsRes.data);
            setCrTerms(crTermsRes.data);
            setCurrentUser(profileRes.data);
            if (profileRes.data.teacherId) {
                const assignRes = await api.get(`/teacher-subjects/teacher/${profileRes.data.teacherId}`);
                setTeacherAssignments(assignRes.data);
            }
        } catch (error) {
            console.error('Failed to fetch initial teacher data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const getAvailableTerms = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return terms.filter(term => {
            if (!term.startDate || !term.endDate) return true;
            const startDate = new Date(term.startDate);
            const endDate = new Date(term.endDate);
            const endDatePlus15 = new Date(endDate);
            endDatePlus15.setDate(endDatePlus15.getDate() + 15);
            return today >= startDate && today <= endDatePlus15;
        });
    };

    const availableTerms = useMemo(() => crTerms, [crTerms]);

    const groupedAssignments = useMemo(() => {
        const groups = {};
        teacherAssignments.forEach(asm => {
            // Defensive check: Skip assignments that are missing critical data
            if (!asm.subject || !asm.studentProgram) return;

            const batchId = asm.subject?.courseBatch?.id || 'no-batch';
            const batchYear = asm.subject?.courseBatch?.startYear || 'Unknown Revision';
            const programId = asm.studentProgram?.id || 'no-program';
            const programName = asm.studentProgram?.name || 'Unknown Program';
            if (!groups[batchId]) groups[batchId] = { year: batchYear, programs: {} };
            if (!groups[batchId].programs[programId]) groups[batchId].programs[programId] = { name: programName, assignments: [] };
            groups[batchId].programs[programId].assignments.push(asm);
        });
        return groups;
    }, [teacherAssignments]);

    const handleSelectTerm = (masterTerm) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const hasActiveSession = terms.some(t => {
            if (!t.crTerm || t.crTerm.id !== masterTerm.id) return false;
            if (!t.startDate || !t.endDate) return false;
            const start = new Date(t.startDate);
            const end = new Date(t.endDate);
            const extendedEnd = new Date(end);
            extendedEnd.setDate(extendedEnd.getDate() + 15);
            return today >= start && today <= extendedEnd;
        });

        if (!hasActiveSession) {
            toast.error("Term not created. Please contact Administrator for exam window.");
            return;
        }

        setSelectedTerm(masterTerm);
        setView('subject');
        window.scrollTo(0, 0);
    };

    const handleSubjectExpand = async (assignment) => {
        if (!assignment || !assignment.subject) {
            toast.error("Invalid assignment data");
            return;
        }

        if (expandedSubjectId === assignment.subject.id) {
            setExpandedSubjectId(null);
            return;
        }

        setExpandedSubjectId(assignment.subject.id);
        const subjId = assignment.subject.id;

        setLoadingStudents(true);
        try {
            const fetchParams = {
                programId: assignment.studentProgram?.id,
                semesterId: assignment.studentSemester?.id || assignment.studentSemester,
                courseBatchId: assignment.subject?.courseBatch?.id
            };
            console.log('Fetching students with params:', fetchParams);

            const [studentsRes, marksRes] = await Promise.all([
                api.get('/students/filter', { params: fetchParams }),
                api.get('/marks')
            ]);
            const filteredStudents = studentsRes.data;
            setStudents(filteredStudents);

            setMarksEntry(prev => {
                const next = { ...prev };
                next[subjId] = {};
                filteredStudents.forEach(student => {
                    const existingMark = marksRes.data.find(m =>
                        m.student?.id === student.id &&
                        m.subject?.id === subjId &&
                        m.term?.crTerm?.id === selectedTerm.id
                    );
                    next[subjId][student.id] = existingMark ? {
                        obtainedMarks: existingMark.obtainedMarks,
                        remark: existingMark.remark || '',
                        id: existingMark.id,
                        publishStatus: existingMark.publishStatus
                    } : { obtainedMarks: '', remark: '', id: null, publishStatus: false };
                });
                return next;
            });
        } catch (error) {
            console.error('Failed to load students/marks:', error);
            toast.error('Failed to load student roster');
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleMarkChange = (subjId, studentId, field, value) => {
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
                [studentId]: { ...prev[subjId][studentId], [field]: value }
            }
        }));
    };

    const handleSaveSubjectAll = async (subjId) => {
        const entryGroup = marksEntry[subjId];
        if (!entryGroup) return;

        const marksToSave = students.map(student => {
            const entry = entryGroup[student.id];
            if (!entry || entry.obtainedMarks === '' || entry.obtainedMarks === null) return null;
            const payload = {
                student: { id: student.id },
                subject: { id: subjId },
                term: { crTerm: { id: selectedTerm.id } },
                obtainedBy: { id: currentUser.id },
                obtainedMarks: Number(entry.obtainedMarks),
                remark: entry.remark,
                uploadedAt: new Date().toISOString()
            };
            if (entry.id) payload.id = entry.id;
            return payload;
        }).filter(Boolean);

        if (marksToSave.length === 0) { toast.info("No marks entered to save."); return; }

        try {
            await api.post('/marks/bulk', marksToSave);
            toast.success('Marks saved successfully!');
            const refreshRes = await api.get('/marks');
            const updatedMarks = refreshRes.data;
            setMarksEntry(prev => {
                const newState = { ...prev };
                students.forEach(s => {
                    const m = updatedMarks.find(mark =>
                        mark.student?.id === s.id &&
                        mark.subject?.id === subjId &&
                        mark.term?.id === selectedTerm.id
                    );
                    if (m && newState[subjId][s.id]) newState[subjId][s.id].id = m.id;
                });
                return newState;
            });
        } catch (error) {
            console.error('Failed to save marks:', error);
            toast.error('Failed to save marks');
        }
    };

    const renderAccordionSubject = (assignment) => {
        if (!assignment || !assignment.subject) return null;

        const subject = assignment.subject;
        const isExpanded = expandedSubjectId === subject.id;

        return (
            <div key={subject.id} className={`subject-accordion-item ${isExpanded ? 'expanded' : ''}`}>
                <div
                    className={`subject-accordion-header ${isExpanded ? 'subject-header-active' : ''}`}
                    onClick={() => handleSubjectExpand(assignment)}
                >
                    <div className="flex items-center gap-5">
                        <div className={`p-2.5 rounded-xl ${isExpanded ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                            <BookOpen size={20} />
                        </div>
                        <div>
                            <h5 className="font-black text-lg leading-tight">{subject.name}</h5>
                            <div className={`flex items-center gap-3 text-xs mt-1 ${isExpanded ? 'text-indigo-100' : 'text-gray-500'}`}>
                                <span className="font-bold uppercase tracking-widest">{subject.code}</span>
                                <span>&bull;</span>
                                <span className="font-bold uppercase tracking-widest">
                                    Sem {assignment.studentSemester?.semesterNumber || assignment.studentSemester?.name || assignment.studentSemester || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} className="opacity-40" />}
                </div>

                {isExpanded && (
                    <div className="p-8 animate-fadeIn">
                        {renderMarksTable(subject)}
                    </div>
                )}
            </div>
        );
    };

    const renderMarksTable = (subject) => {
        if (loadingStudents) return (
            <div className="text-center py-10">
                <RefreshCcw size={24} className="inline animate-spin text-indigo-500 mr-2" />
                <span className="text-sm font-bold text-gray-400">Loading student records...</span>
            </div>
        );

        const currentEntrySet = marksEntry[subject.id] || {};

        let savedCount = 0;
        let enteredCount = 0;
        let isPublished = false;

        students.forEach(s => {
            const entry = currentEntrySet[s.id] || {};
            if (entry.id) savedCount++;
            if (entry.obtainedMarks !== '' && entry.obtainedMarks !== null) enteredCount++;
            if (entry.publishStatus) isPublished = true;
        });

        return (
            <div className="space-y-6">
                {/* Stats & Progress */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-4">
                        <div className="bg-gray-100 px-4 py-2 rounded-xl text-sm font-bold text-gray-700">
                            Full Mark: <span className="text-indigo-600 ml-1">{subject.fullMark}</span>
                        </div>
                        <div className="bg-gray-100 px-4 py-2 rounded-xl text-sm font-bold text-gray-700">
                            Pass Mark: <span className="text-red-500 ml-1">{subject.passMarks}</span>
                        </div>
                    </div>
                    {students.length > 0 && (
                        <div className="text-sm text-gray-500 font-bold flex items-center gap-3">
                            <span className="flex items-center gap-1"><Sparkles size={14} className="text-amber-500" /> {enteredCount} / {students.length} Entered</span>
                            <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md"><CheckCircle2 size={14} /> {savedCount} Saved</span>
                        </div>
                    )}
                </div>

                <div className="modern-table-card">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th style={{ width: '80px' }}>Roll</th>
                                <th>Student Identity</th>
                                <th style={{ width: '160px' }}>Obtained Marks</th>
                                <th>Remarks</th>
                                <th style={{ width: '140px', textAlign: 'center' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-12 text-gray-400 italic font-medium">No students enrolled.</td></tr>
                            ) : (
                                students.map(student => {
                                    const entry = currentEntrySet[student.id] || {};
                                    return (
                                        <tr key={student.id}>
                                            <td className="font-bold text-gray-500">{student.rollNo}</td>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-gray-900">{student.name}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{student.gender || 'Student'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="table-input"
                                                    disabled={isPublished}
                                                    value={entry.obtainedMarks}
                                                    onChange={(e) => handleMarkChange(subject.id, student.id, 'obtainedMarks', e.target.value)}
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="table-input py-2 px-3 font-medium text-gray-600 border-none bg-gray-50 focus:bg-white"
                                                    disabled={isPublished}
                                                    value={entry.remark}
                                                    onChange={(e) => handleMarkChange(subject.id, student.id, 'remark', e.target.value)}
                                                    placeholder="-"
                                                />
                                            </td>
                                            <td align="center">
                                                <div className={`status-badge ${entry.id ? 'status-badge-saved' : 'status-badge-new'}`}>
                                                    {entry.id ? <CheckCircle2 size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                                                    <span className="text-[9px] font-black uppercase tracking-wider">{entry.id ? 'Saved' : 'Unsaved'}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                {students.length > 0 && !isPublished && (
                    <div className="flex justify-end pt-4">
                        <button className="btn-modern btn-primary px-8" onClick={() => handleSaveSubjectAll(subject.id)}>
                            <Save size={18} /> Update {subject.code}
                        </button>
                    </div>
                )}
                {isPublished && (
                    <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200 flex items-center gap-3 text-green-700">
                        <CheckCircle2 size={20} />
                        <span className="font-bold">Results for this subject have been published. Editing is restricted.</span>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="td-loading-screen">
                <div className="td-spinner"></div>
                <p className="td-loading-text">Initializing Dashboard...</p>
            </div>
        );
    }


    return (
        <div className="td-wrapper">
            {/* Breadcrumb */}
            <nav className="td-breadcrumb">
                <span className={`td-crumb ${view === 'term' ? 'td-crumb-active' : ''}`}
                    onClick={() => { setView('term'); setSelectedTerm(null); setSelectedAssignment(null); }}>
                    <LayoutDashboard size={13} /> Dashboard
                </span>
                {selectedTerm && (
                    <>
                        <ChevronRight size={12} className="td-crumb-sep" />
                        <span className={`td-crumb ${view === 'subject' ? 'td-crumb-active' : ''}`}
                            onClick={() => { setView('subject'); setSelectedAssignment(null); }}>
                            {selectedTerm.name}
                        </span>
                    </>
                )}
                {selectedAssignment && (
                    <>
                        <ChevronRight size={12} className="td-crumb-sep" />
                        <span className="td-crumb td-crumb-active">{selectedAssignment.subject.name}</span>
                    </>
                )}
            </nav>

            {/* Page Head */}
            <div className="td-page-head">
                <div>
                    <h1 className="td-page-title">
                        {view === 'term' && 'Select a Term'}
                        {view === 'subject' && `Active Evaluation — ${selectedTerm?.name}`}
                    </h1>
                    <p className="td-page-sub">
                        {view === 'term' && 'Choose an active academic term to manage student marks.'}
                        {view === 'subject' && 'Select a subject below to manage grade records.'}
                    </p>
                </div>
            </div>

            {/* ─── STEP 1: TERM SELECTION ─── */}
            {view === 'term' && (
                <div className="td-grid animate-fadeIn">
                    {availableTerms.length === 0 ? (
                        <div className="td-empty-state">
                            <Clock size={40} className="td-empty-icon" />
                            <h3>No Active Terms</h3>
                            <p>There are currently no terms open for mark entry.</p>
                        </div>
                    ) : (
                        availableTerms.map(term => (
                            <div key={term.id} className="td-term-card" onClick={() => handleSelectTerm(term)}>
                                <div className="td-term-icon">
                                    <Calendar size={22} />
                                </div>
                                <div className="td-term-body">
                                    <h3 className="td-term-name">{term.name}</h3>
                                </div>
                                <div className="td-term-arrow">
                                    <ArrowRight size={18} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ─── STEP 2: SUBJECT SELECTION (ACCORDION) ─── */}
            {view === 'subject' && (
                <div className="space-y-8 animate-fadeIn">
                    <button className="td-back-btn" onClick={() => {
                        setView('term');
                        setExpandedSubjectId(null);
                        setStudents([]);
                        setMarksEntry({});
                        setFilterBatchId('');
                        setFilterProgramId('');
                    }}>
                        <ChevronLeft size={18} /> Back to Terms
                    </button>

                    {/* Filter Card */}
                    <div className="filter-card">
                        <div className="filter-grid">
                            <div className="filter-item">
                                <label htmlFor="batchSelect">Batch</label>
                                <select
                                    id="batchSelect"
                                    className="modern-select"
                                    value={filterBatchId}
                                    onChange={e => setFilterBatchId(e.target.value)}
                                >
                                    <option value="">All Batches</option>
                                    {Object.entries(groupedAssignments).map(([batchId, batchData]) => (
                                        <option key={batchId} value={batchId}>Batch {batchData.year}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-item">
                                <label htmlFor="programSelect">Program</label>
                                <select
                                    id="programSelect"
                                    className="modern-select"
                                    value={filterProgramId}
                                    onChange={e => setFilterProgramId(e.target.value)}
                                >
                                    <option value="">All Programs</option>
                                    {Object.entries(groupedAssignments)
                                        .filter(([batchId]) => !filterBatchId || batchId === filterBatchId)
                                        .flatMap(([_, batchData]) =>
                                            Object.entries(batchData.programs).map(([programId, programData]) => ({ programId, name: programData.name }))
                                        )
                                        .reduce((acc, cur) => {
                                            if (!acc.find(p => p.programId === cur.programId)) acc.push(cur);
                                            return acc;
                                        }, [])
                                        .map(p => (
                                            <option key={p.programId} value={p.programId}>{p.name}</option>
                                        ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {Object.keys(groupedAssignments).length === 0 ? (
                        <div className="td-empty-state">
                            <BookOpen size={40} className="td-empty-icon" />
                            <h3>No Subjects Assigned</h3>
                            <p>You have no subjects assigned yet.</p>
                        </div>
                    ) : (
                        Object.entries(groupedAssignments)
                            .filter(([batchId]) => !filterBatchId || batchId === filterBatchId)
                            .map(([batchId, batchData]) => (
                                <div key={batchId} className="td-batch-group space-y-4">
                                    <div className="td-batch-header flex items-center gap-2 px-2">
                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Revision</span>
                                        <h4 className="text-sm font-black text-gray-800 uppercase tracking-tighter">Approved {batchData.year}</h4>
                                    </div>

                                    {Object.entries(batchData.programs)
                                        .filter(([programId]) => !filterProgramId || programId === filterProgramId)
                                        .map(([programId, programData]) => (
                                            <div key={programId} className="td-program-block space-y-4">
                                                <div className="td-program-label flex items-center gap-3 ml-4 mb-2">
                                                    <GraduationCap size={16} className="text-gray-300" />
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{programData.name}</span>
                                                </div>

                                                <div className="grid grid-cols-1 gap-4">
                                                    {programData.assignments.map(asm => renderAccordionSubject(asm))}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ))
                    )}
                </div>
            )}


        </div>
    );
};

export default TeacherDashboard;
