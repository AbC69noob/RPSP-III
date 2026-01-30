import React, { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import {
    BookOpen,
    GraduationCap,
    Calendar,
    ChevronLeft,
    Table as TableIcon,
    CheckCircle2,
    Circle,
    Clock,
    LayoutDashboard,
    UserCheck
} from 'lucide-react';
import { toast } from 'react-toastify';
import '../components/tabs/MarksTab.css';
import { Save } from 'lucide-react';

const TeacherDashboard = () => {
    const [terms, setTerms] = useState([]);
    const [teacherAssignments, setTeacherAssignments] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Flow states: 'term' | 'subject' | 'marks'
    const [view, setView] = useState('term');

    // Selection states
    const [selectedTerm, setSelectedTerm] = useState(null);
    const [selectedAssignment, setSelectedAssignment] = useState(null);

    // Data states for mark entry
    const [students, setStudents] = useState([]);
    const [marks, setMarks] = useState([]);
    const [marksEntry, setMarksEntry] = useState({});
    const [loadingStudents, setLoadingStudents] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [termsRes, profileRes] = await Promise.all([
                api.get('/terms'),
                api.get('/profile')
            ]);

            setTerms(termsRes.data);
            setCurrentUser(profileRes.data);

            if (profileRes.data.teacherId) {
                const assignRes = await api.get(`/teacher-subjects/teacher/${profileRes.data.teacherId}`);
                setTeacherAssignments(assignRes.data);
            }

            // If there's an active term, we could auto-select it, but let's follow the user's "select a term" requirement
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

    const availableTerms = useMemo(() => getAvailableTerms(), [terms]);

    // Grouping logic for subjects
    const groupedAssignments = useMemo(() => {
        const groups = {};
        teacherAssignments.forEach(asm => {
            const batchId = asm.subject?.courseBatch?.id || 'no-batch';
            const batchYear = asm.subject?.courseBatch?.startYear || 'Unknown Revision';
            const programId = asm.studentProgram?.id || 'no-program';
            const programName = asm.studentProgram?.name || 'Unknown Program';

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

    const handleSelectTerm = (term) => {
        setSelectedTerm(term);
        setView('subject');
        // Scroll to top
        window.scrollTo(0, 0);
    };

    const handleSelectSubject = async (assignment) => {
        setSelectedAssignment(assignment);
        setLoadingStudents(true);
        setView('marks');
        window.scrollTo(0, 0);

        try {
            // Fetch students and existing marks in parallel
            const [studentsRes, marksRes] = await Promise.all([
                api.get('/students/filter', {
                    params: {
                        programId: assignment.studentProgram.id,
                        semester: assignment.studentSemester,
                        courseBatchId: assignment.subject?.courseBatch?.id
                    }
                }),
                api.get('/marks') // We could optimize this to filter by term/subject/etc in backend
            ]);

            const filteredStudents = studentsRes.data;
            setStudents(filteredStudents);

            // Initialize marks entry
            const initialEntryState = {};
            filteredStudents.forEach(student => {
                const existingMark = marksRes.data.find(m =>
                    m.student?.id === student.id &&
                    m.subject?.id === assignment.subject.id &&
                    m.term?.id === selectedTerm.id
                );

                initialEntryState[student.id] = {
                    obtainedMarks: existingMark ? existingMark.obtainedMarks : '',
                    remark: existingMark ? (existingMark.remark || '') : '',
                    id: existingMark ? existingMark.id : null
                };
            });
            setMarksEntry(initialEntryState);
        } catch (error) {
            console.error('Failed to load students/marks:', error);
            toast.error('Failed to load student list');
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleMarkChange = (studentId, field, value) => {
        // Prevent negative values for obtained marks
        if (field === 'obtainedMarks' && value !== '' && Number(value) < 0) {
            toast.warn("Marks cannot be negative");
            return;
        }

        setMarksEntry(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value
            }
        }));
    };

    const handleSaveAll = async () => {
        const marksToSave = students.map(student => {
            const entry = marksEntry[student.id];
            if (entry.obtainedMarks === '' || entry.obtainedMarks === null) return null;

            const payload = {
                student: { id: student.id },
                subject: { id: selectedAssignment.subject.id },
                term: { id: selectedTerm.id },
                uploadedBy: { id: currentUser.id },
                obtainedMarks: Number(entry.obtainedMarks),
                remark: entry.remark,
                uploadedAt: new Date().toISOString()
            };

            if (entry.id) payload.id = entry.id;
            return payload;
        }).filter(Boolean);

        if (marksToSave.length === 0) {
            toast.info("No marks entered to save.");
            return;
        }

        try {
            await api.post('/marks/bulk', marksToSave);
            toast.success('Marks saved successfully!');

            // Refresh local state with IDs
            const refreshRes = await api.get('/marks');
            const updatedMarks = refreshRes.data;
            setMarksEntry(prev => {
                const newState = { ...prev };
                students.forEach(s => {
                    const m = updatedMarks.find(mark =>
                        mark.student?.id === s.id &&
                        mark.subject?.id === selectedAssignment.subject.id &&
                        mark.term?.id === selectedTerm.id
                    );
                    if (m && newState[s.id]) newState[s.id].id = m.id;
                });
                return newState;
            });
        } catch (error) {
            console.error('Failed to save marks:', error);
            toast.error('Failed to save marks');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 font-medium">Initializing Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header / Breadcrumbs */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <span
                        className={`cursor-pointer hover:text-indigo-600 transition-colors flex items-center gap-1 ${view === 'term' ? 'text-indigo-600 font-bold' : ''}`}
                        onClick={() => { setView('term'); setSelectedTerm(null); setSelectedAssignment(null); }}
                    >
                        <LayoutDashboard size={14} /> Dashboard
                    </span>
                    {selectedTerm && (
                        <>
                            <span>/</span>
                            <span
                                className={`cursor-pointer hover:text-indigo-600 transition-colors ${view === 'subject' ? 'text-indigo-600 font-bold' : ''}`}
                                onClick={() => { setView('subject'); setSelectedAssignment(null); }}
                            >
                                {selectedTerm.name}
                            </span>
                        </>
                    )}
                    {selectedAssignment && (
                        <>
                            <span>/</span>
                            <span className="text-indigo-600 font-bold">
                                {selectedAssignment.subject.name}
                            </span>
                        </>
                    )}
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    {view === 'term' && "Welcome Back! Select a Term"}
                    {view === 'subject' && `Subjects for ${selectedTerm.name}`}
                    {view === 'marks' && `Marks Entry: ${selectedAssignment?.subject.name}`}
                </h1>
                <p className="text-gray-500 mt-1">
                    {view === 'term' && "Choose an active academic term to manage marks."}
                    {view === 'subject' && "Select one of your assigned subjects to enter or update marks."}
                    {view === 'marks' && `Enter marks for ${students.length} students enrolled in this course.`}
                </p>
            </div>

            {/* STEP 1: TERM SELECTION */}
            {view === 'term' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                    {availableTerms.length === 0 ? (
                        <div className="col-span-full card text-center py-12 bg-amber-50 border-amber-100">
                            <Clock size={48} className="mx-auto text-amber-500 mb-4" />
                            <h3 className="text-lg font-bold text-amber-900">No Active Terms</h3>
                            <p className="text-amber-700">There are no terms available for mark entry at this time.</p>
                        </div>
                    ) : (
                        availableTerms.map(term => (
                            <div
                                key={term.id}
                                className="group relative bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-indigo-500 transition-all cursor-pointer overflow-hidden"
                                onClick={() => handleSelectTerm(term)}
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Calendar size={80} className="text-indigo-600" />
                                </div>
                                <div className="relative z-10">
                                    <div className="bg-indigo-50 text-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <Calendar size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{term.name}</h3>
                                    <div className="space-y-1 text-sm text-gray-500">
                                        <p className="flex items-center gap-2">
                                            <Clock size={14} /> Starts: {new Date(term.startDate).toLocaleDateString()}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <CheckCircle2 size={14} /> Ends: {new Date(term.endDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="mt-6 flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                        Continue to Subjects <ChevronLeft size={16} className="rotate-180" />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* STEP 2: SUBJECT SELECTION */}
            {view === 'subject' && (
                <div className="space-y-8 animate-fadeIn">
                    <button
                        onClick={() => setView('term')}
                        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-medium transition-colors mb-4"
                    >
                        <ChevronLeft size={20} /> Back to Terms
                    </button>

                    {Object.keys(groupedAssignments).length === 0 ? (
                        <div className="card text-center py-12 text-gray-500 bg-gray-50 border-dashed">
                            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-lg">No subjects assigned to you yet.</p>
                        </div>
                    ) : (
                        Object.entries(groupedAssignments).map(([batchId, batchData]) => (
                            <div key={batchId} className="space-y-6">
                                <div className="flex items-center gap-3 bg-indigo-50 border-white border p-3 rounded-2xl shadow-sm">
                                    <div className="bg-white p-2 rounded-lg text-indigo-600 shadow-sm">
                                        <Calendar size={20} />
                                    </div>
                                    <h4 className="text-lg font-bold text-indigo-900">
                                        Course Revised on {batchData.year}
                                    </h4>
                                </div>

                                {Object.entries(batchData.programs).map(([programId, programData]) => (
                                    <div key={programId} className="ml-4 md:ml-8">
                                        <h5 className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                                            <GraduationCap size={14} /> {programData.name}
                                        </h5>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {programData.assignments.map((asm) => (
                                                <div
                                                    key={asm.id}
                                                    className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex justify-between items-center group"
                                                    onClick={() => handleSelectSubject(asm)}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="bg-gray-50 p-3 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                            <BookOpen size={20} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase text-sm tracking-wide">
                                                                {asm.subject.name}
                                                            </h4>
                                                            <p className="text-xs text-gray-500 mt-0.5 font-medium">
                                                                Code: {asm.subject.code} • Semester {asm.studentSemester}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-gray-300 group-hover:text-indigo-500 transition-colors">
                                                        <ChevronLeft size={24} className="rotate-180" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* STEP 3: MARK ENTRY */}
            {view === 'marks' && (
                <div className="space-y-6 animate-fadeIn">
                    <button
                        onClick={() => setView('subject')}
                        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-medium transition-colors mb-2"
                    >
                        <ChevronLeft size={20} /> Back to Subjects
                    </button>

                    <div className="bg-indigo-900 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                            <GraduationCap size={160} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-indigo-500/30 text-indigo-100 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-white/10">
                                    Semester {selectedAssignment.studentSemester}
                                </span>
                                <span className="text-indigo-200">•</span>
                                <span className="text-indigo-100 text-sm font-medium">{selectedAssignment.studentProgram.name}</span>
                            </div>
                            <h2 className="text-2xl font-black tracking-tight">{selectedAssignment.subject.name}</h2>
                            <p className="text-indigo-300 text-sm mt-1">{selectedAssignment.subject.code} • Revision {selectedAssignment.subject.courseBatch.startYear}</p>
                        </div>
                        <div className="flex gap-4 relative z-10 w-full md:w-auto">
                            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex-1 md:flex-none text-center min-w-[120px]">
                                <p className="text-[10px] font-bold text-indigo-300 uppercase mb-1">Total Marks</p>
                                <p className="text-2xl font-black">{selectedAssignment.subject.fullMark}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex-1 md:flex-none text-center min-w-[120px]">
                                <p className="text-[10px] font-bold text-indigo-300 uppercase mb-1">Pass Marks</p>
                                <p className="text-2xl font-black">{selectedAssignment.subject.passMarks}</p>
                            </div>
                        </div>
                    </div>

                    {loadingStudents ? (
                        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                            <p className="mt-4 text-gray-500 font-medium">Crunching student records...</p>
                        </div>
                    ) : (
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
                                            <th>Faculty Remarks</th>
                                            <th style={{ width: '140px', textAlign: 'center' }}>Sync Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-12 text-gray-400 italic">No matches found.</td>
                                            </tr>
                                        ) : (
                                            students.map((student) => {
                                                const entry = marksEntry[student.id] || {};
                                                return (
                                                    <tr key={student.id}>
                                                        <td className="font-bold text-gray-500">{student.rollNo}</td>
                                                        <td>
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-gray-900">{student.name}</span>
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase">{student.gender || 'Student'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="font-bold text-gray-600">{selectedAssignment.subject.fullMark}</td>
                                                        <td className="font-bold text-red-600">{selectedAssignment.subject.passMarks}</td>
                                                        <td>
                                                            <div className="relative">
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    className="table-input"
                                                                    placeholder="00"
                                                                    value={entry.obtainedMarks}
                                                                    onChange={(e) => handleMarkChange(student.id, 'obtainedMarks', e.target.value)}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="text"
                                                                className="table-input py-2 px-3 font-medium text-gray-600 border-none bg-gray-50 focus:bg-white"
                                                                placeholder="Note..."
                                                                value={entry.remark}
                                                                onChange={(e) => handleMarkChange(student.id, 'remark', e.target.value)}
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

                            {students.length > 0 && (
                                <div className="flex justify-end pt-4">
                                    <button
                                        className="btn-modern btn-primary px-8"
                                        onClick={handleSaveAll}
                                    >
                                        <Save size={18} /> Commit Changes
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeacherDashboard;
