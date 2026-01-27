import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './MarksTab.css';
import { Plus, Table as TableIcon, Filter, ChevronDown, ChevronUp, BookOpen, GraduationCap, Calendar } from 'lucide-react';

const MarksTab = () => {
    const [marks, setMarks] = useState([]);
    const [students, setStudents] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [terms, setTerms] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [selectedBatch, setSelectedBatch] = useState('');
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('');

    const [filtersApplied, setFiltersApplied] = useState(false);
    const [batches, setBatches] = useState([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    // Teacher specific states
    const [teacherAssignments, setTeacherAssignments] = useState([]);
    const [expandedSubject, setExpandedSubject] = useState(null); // subjectId
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Bulk Entry State: { [studentId]: { obtainedMarks: '', remark: '', id: null } }
    const [marksEntry, setMarksEntry] = useState({});

    const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

    // Helper function to filter terms based on current date
    const getAvailableTerms = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

        return terms.filter(term => {
            if (!term.startDate || !term.endDate) return true; // Show terms without dates

            const startDate = new Date(term.startDate);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(term.endDate);
            endDate.setHours(0, 0, 0, 0);

            // Add 15 days to end date
            const endDatePlus15 = new Date(endDate);
            endDatePlus15.setDate(endDatePlus15.getDate() + 15);

            // Show term if current date is >= startDate and <= endDate + 15 days
            return today >= startDate && today <= endDatePlus15;
        });
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Dynamic Subject Filtering - triggered when batch, program, or semester changes
    useEffect(() => {
        if (selectedBatch && selectedProgram && selectedSemester) {
            fetchFilteredSubjects();
        } else {
            setSubjects([]);
            setSelectedSubject('');
        }
    }, [selectedBatch, selectedProgram, selectedSemester]);

    const fetchTeacherAssignments = async (teacherId) => {
        try {
            const response = await api.get(`/teacher-subjects/teacher/${teacherId}`);
            setTeacherAssignments(response.data);
        } catch (error) {
            console.error('Failed to fetch teacher assignments:', error);
        }
    };

    const handleExpandSubject = async (assignment) => {
        if (expandedSubject === assignment.subject.id) {
            setExpandedSubject(null);
            setStudents([]);
            setMarksEntry({});
            return;
        }

        if (!selectedTerm) {
            alert('Please select a term first');
            return;
        }

        const resolvedBatch = assignment.studentBatch || assignment.subject?.batch;
        if (!resolvedBatch) {
            alert('This subject assignment is missing a Batch. Please ask admin to set batch for the subject/assignment.');
            return;
        }

        setExpandedSubject(assignment.subject.id);
        setSelectedSubject(assignment.subject.id);
        setSelectedBatch(resolvedBatch);
        setSelectedProgram(assignment.studentProgram?.id);
        setSelectedSemester(assignment.studentSemester);

        setStudents([]);
        try {
            setLoadingStudents(true);
            
            // Validate required parameters
            if (!assignment.studentProgram?.id || !assignment.studentSemester) {
                console.error('Missing required assignment data:', {
                    programId: assignment.studentProgram?.id,
                    semester: assignment.studentSemester,
                    batch: resolvedBatch
                });
                alert('This subject assignment is missing required data (Program or Semester). Please ask admin to complete the assignment details.');
                setLoadingStudents(false);
                return;
            }
            
            // Use batch range logic: find students from previous batch to current batch
            let response;
            if (assignment.studentBatch) {
                // Get previous batch for range filtering
                try {
                    const previousBatchResponse = await api.get('/subjects/previous-batches', {
                        params: {
                            programId: assignment.studentProgram.id,
                            semester: assignment.studentSemester,
                            currentBatch: assignment.studentBatch
                        }
                    });
                    
                    const previousBatches = previousBatchResponse.data;
                    const fromBatch = previousBatches.length > 0 ? previousBatches[0] : assignment.studentBatch;
                    
                    console.log('Using batch range:', fromBatch, 'to', assignment.studentBatch);
                    
                    response = await api.get('/students/filter-by-range', {
                        params: {
                            fromBatch: fromBatch,
                            toBatch: assignment.studentBatch,
                            programId: assignment.studentProgram.id,
                            semester: assignment.studentSemester
                        }
                    });
                } catch (batchError) {
                    console.warn('Failed to get previous batches, using exact batch match:', batchError);
                    // Fallback to exact batch match
                    response = await api.get('/students/filter', {
                        params: {
                            batch: assignment.studentBatch,
                            programId: assignment.studentProgram.id,
                            semester: assignment.studentSemester
                        }
                    });
                }
            } else {
                // Fallback to exact batch match if no studentBatch in assignment
                response = await api.get('/students/filter', {
                    params: {
                        batch: resolvedBatch,
                        programId: assignment.studentProgram.id,
                        semester: assignment.studentSemester
                    }
                });
            }
            const filteredStudents = response.data;
            console.log('Fetched students:', filteredStudents);
            setStudents(filteredStudents);
            
            if (filteredStudents.length === 0) {
                console.warn('No students found for criteria:', {
                    batch: resolvedBatch,
                    programId: assignment.studentProgram.id,
                    semester: assignment.studentSemester
                });
            }

            // Initialize marks entry state
            const initialEntryState = {};
            filteredStudents.forEach(student => {
                const existingMark = marks.find(m =>
                    m.student?.id === student.id &&
                    m.subject?.id === assignment.subject.id &&
                    m.term?.id === Number(selectedTerm)
                );

                if (existingMark) {
                    initialEntryState[student.id] = {
                        obtainedMarks: existingMark.obtainedMarks,
                        remark: existingMark.remark || '',
                        id: existingMark.id
                    };
                } else {
                    initialEntryState[student.id] = {
                        obtainedMarks: '',
                        remark: '',
                        id: null
                    };
                }
            });
            setMarksEntry(initialEntryState);
        } catch (error) {
            console.error('Failed to fetch students:', error);
            console.error('Request parameters were:', {
                batch: resolvedBatch,
                programId: assignment.studentProgram?.id,
                semester: assignment.studentSemester
            });
            alert('Failed to load students. Please check the console for details.');
        } finally {
            setLoadingStudents(false);
        }
    };

    const fetchFilteredSubjects = async () => {
        try {
            setLoadingSubjects(true);
            console.log('Fetching subjects for batch:', selectedBatch, 'program:', selectedProgram, 'semester:', selectedSemester);
            const response = await api.get('/subjects/filter', {
                params: {
                    batch: selectedBatch,
                    programId: Number(selectedProgram),
                    semester: Number(selectedSemester)
                }
            });
            console.log('Fetched subjects:', response.data);
            setSubjects(response.data);
            // If the currently selected subject is not in the new list, clear it
            if (selectedSubject && !response.data.find(s => s.id === Number(selectedSubject))) {
                setSelectedSubject('');
            }
        } catch (error) {
            console.error('Failed to fetch filtered subjects:', error);
            setSubjects([]);
        } finally {
            setLoadingSubjects(false);
        }
    };

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [marksRes, studentsRes, termsRes, programsRes, profileRes, batchesRes] = await Promise.all([
                api.get('/marks'),
                api.get('/students'),
                api.get('/terms'),
                api.get('/programs'),
                api.get('/profile'),
                api.get('/students/batches')
            ]);
            setMarks(marksRes.data);
            setAllStudents(studentsRes.data);
            setStudents(studentsRes.data);
            setTerms(termsRes.data);
            setPrograms(programsRes.data);
            setCurrentUser(profileRes.data);
            setBatches(batchesRes.data);

            if (profileRes.data.role.toLowerCase() === 'teacher' && profileRes.data.teacherId) {
                fetchTeacherAssignments(profileRes.data.teacherId);
            }
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = () => {
        if (!selectedBatch || !selectedProgram || !selectedSemester || !selectedSubject || !selectedTerm) {
            alert('Please select Batch, Program, Semester, Subject, and Term');
            return;
        }

        // Filter students based on selection
        const filteredStudents = allStudents.filter(student => {
            return (
                student.batch === selectedBatch &&
                student.program?.id === Number(selectedProgram) &&
                student.semester === Number(selectedSemester)
            );
        });

        setStudents(filteredStudents);

        // Initialize marks entry state
        const initialEntryState = {};
        filteredStudents.forEach(student => {
            // Check if mark already exists for this student, subject, and term
            const existingMark = marks.find(m =>
                m.student?.id === student.id &&
                m.subject?.id === Number(selectedSubject) &&
                m.term?.id === Number(selectedTerm)
            );

            if (existingMark) {
                initialEntryState[student.id] = {
                    obtainedMarks: existingMark.obtainedMarks,
                    remark: existingMark.remark || '',
                    id: existingMark.id // Keep ID for updates if supported, or just to know it exists
                };
            } else {
                initialEntryState[student.id] = {
                    obtainedMarks: '',
                    remark: '',
                    id: null
                };
            }
        });

        setMarksEntry(initialEntryState);
        setFiltersApplied(true);
    };

    const handleResetFilters = () => {
        setSelectedBatch('');
        setSelectedProgram('');
        setSelectedSemester('');
        setSelectedSubject('');
        setSelectedTerm('');
        setStudents([]);
        setMarksEntry({});
        setFiltersApplied(false);
    };

    const handleMarkChange = (studentId, field, value) => {
        setMarksEntry(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value
            }
        }));
    };

    const handleSaveAll = async () => {
        try {
            const marksToSave = students.map(student => {
                const entry = marksEntry[student.id];
                // Only save if marks are entered
                if (entry.obtainedMarks === '' || entry.obtainedMarks === null) return null;

                const payload = {
                    student: { id: student.id },
                    subject: { id: Number(selectedSubject) },
                    term: { id: Number(selectedTerm) },
                    uploadedBy: { id: currentUser.id },
                    obtainedMarks: Number(entry.obtainedMarks),
                    remark: entry.remark,
                    uploadedAt: new Date().toISOString()
                };

                // If updating existing mark, include ID (backend needs to handle update logic usually, 
                // but save() in JPA handles merge if ID exists. However, we are sending a list to saveAll.
                // If ID is present, it updates.
                if (entry.id) {
                    payload.id = entry.id;
                }

                return payload;
            }).filter(Boolean); // Remove nulls

            if (marksToSave.length === 0) {
                alert("No marks entered to save.");
                return;
            }

            await api.post('/marks/bulk', marksToSave);
            alert('Marks saved successfully!');

            // Refresh marks data
            const refreshMarks = await api.get('/marks');
            setMarks(refreshMarks.data);

            // Optionally refresh the entry state IDs if new records were created, but simple re-apply filter logic is safer to sync IDs
            // For now just re-running the initialization logic with new marks:
            // But we need to keep the filtered view.

            // Re-map IDs for newly created marks to avoid creating duplicates if saved again immediately without refresh
            // Simply re-fetching marks and re-initializing the entry IDs would be robust.
            const updatedMarks = refreshMarks.data;
            setMarksEntry(prev => {
                const newState = { ...prev };
                students.forEach(s => {
                    const m = updatedMarks.find(m =>
                        m.student?.id === s.id &&
                        m.subject?.id === Number(selectedSubject) &&
                        m.term?.id === Number(selectedTerm)
                    );
                    if (m && newState[s.id]) {
                        newState[s.id].id = m.id;
                    }
                });
                return newState;
            });

        } catch (error) {
            console.error('Failed to save marks:', error);
            alert('Failed to save marks.');
        }
    };

    return (
        <div className="space-y-6 w-full">
            {/* Teacher View: Subject List with Expansion */}
            {currentUser?.role?.toLowerCase() === 'teacher' && (
                <div className="space-y-4">
                    <div className="card bg-indigo-50 border-indigo-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-indigo-900 flex items-center">
                                    <Calendar size={20} className="mr-2" /> Select Term
                                </h3>
                                <p className="text-sm text-indigo-700">Select a term to view or enter marks for your assigned subjects.</p>
                            </div>
                            <div className="w-full md:w-64">
                                <select
                                    className="w-full border border-indigo-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm bg-white font-medium"
                                    value={selectedTerm}
                                    onChange={(e) => {
                                        setSelectedTerm(e.target.value);
                                        setExpandedSubject(null);
                                        setStudents([]);
                                        setMarksEntry({});
                                    }}
                                >
                                    <option value="">Select Term</option>
                                    {getAvailableTerms().map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <h3 className="text-md font-bold text-gray-700 uppercase tracking-wider flex items-center mt-2 px-1">
                            <BookOpen size={18} className="mr-2" /> Your Assigned Subjects
                        </h3>
                        {teacherAssignments.length === 0 ? (
                            <div className="card text-center py-10 text-gray-500 bg-gray-50 border-dashed">
                                <p>No subjects assigned to you yet.</p>
                            </div>
                        ) : (
                            teacherAssignments.map((assignment) => (
                                <div key={assignment.id} className={`subject-accordion-item ${expandedSubject === assignment.subject.id ? 'expanded' : ''}`}>
                                    <div
                                        className={`flex items-center justify-between p-4 cursor-pointer transition-all ${expandedSubject === assignment.subject.id ? 'bg-indigo-600 text-white rounded-t-lg' : 'bg-white hover:bg-gray-50 border rounded-lg shadow-sm'}`}
                                        onClick={() => handleExpandSubject(assignment)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${expandedSubject === assignment.subject.id ? 'bg-white/20' : 'bg-indigo-100 text-indigo-600'}`}>
                                                <BookOpen size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-md">{assignment.subject.name} ({assignment.subject.code})</h4>
                                                <div className={`flex items-center gap-3 text-xs mt-1 ${expandedSubject === assignment.subject.id ? 'text-indigo-100' : 'text-gray-500'}`}>
                                                    <span className="flex items-center gap-1"><GraduationCap size={14} /> {assignment.studentProgram?.name}</span>
                                                    <span>•</span>
                                                    <span>Batch: {assignment.studentBatch}</span>
                                                    <span>•</span>
                                                    <span>Semester: {assignment.studentSemester}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            {expandedSubject === assignment.subject.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </div>

                                    {expandedSubject === assignment.subject.id && (
                                        <div className="bg-white border-x border-b rounded-b-lg p-6 animate-fadeIn">
                                            {!selectedTerm ? (
                                                <div className="text-center py-6 text-amber-600">
                                                    Please select a term above to view students.
                                                </div>
                                            ) : loadingStudents ? (
                                                <div className="text-center py-10">
                                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                                                    <p className="mt-2 text-gray-500">Loading student list...</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                                                        <h5 className="font-bold text-gray-700 flex items-center">
                                                            <TableIcon size={18} className="mr-2" /> Student List
                                                        </h5>
                                                        <span className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
                                                            {students.length} Students
                                                        </span>
                                                    </div>

                                                    <div className="table-container border rounded-lg overflow-hidden">
                                                        <table className="w-full">
                                                            <thead className="bg-gray-50 border-b">
                                                                <tr>
                                                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">Roll No</th>
                                                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">Student Name</th>
                                                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">Obtained Marks</th>
                                                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">Remark</th>
                                                                    <th className="py-3 px-4 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {students.length === 0 ? (
                                                                    <tr>
                                                                        <td colSpan="5" className="py-10 text-center text-gray-500 italic">No students found matching this criteria.</td>
                                                                    </tr>
                                                                ) : (
                                                                    students.map((student) => {
                                                                        const entry = marksEntry[student.id] || {};
                                                                        return (
                                                                            <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                                                                <td className="py-4 px-4 text-sm font-medium text-gray-600">{student.rollNo}</td>
                                                                                <td className="py-4 px-4 text-sm font-bold text-gray-900">{student.name}</td>
                                                                                <td className="py-2 px-4">
                                                                                    <div className="relative">
                                                                                        <input
                                                                                            type="number"
                                                                                            step="0.01"
                                                                                            className="w-32 border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                                                            placeholder="0.00"
                                                                                            value={entry.obtainedMarks}
                                                                                            onChange={(e) => handleMarkChange(student.id, 'obtainedMarks', e.target.value)}
                                                                                        />
                                                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">/ {assignment.subject.fullMark}</span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-2 px-4">
                                                                                    <input
                                                                                        type="text"
                                                                                        className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                                                        placeholder="Optional remark"
                                                                                        value={entry.remark}
                                                                                        onChange={(e) => handleMarkChange(student.id, 'remark', e.target.value)}
                                                                                    />
                                                                                </td>
                                                                                <td className="py-4 px-4 text-center">
                                                                                    {entry.id ? (
                                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                                                                                            Saved
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                                                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5"></span>
                                                                                            New
                                                                                        </span>
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
                                                        <div className="flex justify-end pt-4 border-t">
                                                            <button
                                                                className="btn btn-primary shadow-lg shadow-indigo-100 flex items-center gap-2"
                                                                onClick={handleSaveAll}
                                                            >
                                                                <TableIcon size={18} /> Save All Marks
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Admin View: Original Filters and Table (Hidden for Teachers) */}
            {currentUser?.role?.toLowerCase() !== 'teacher' && (
                <>
                    <div className="card">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <Filter size={20} className="mr-2" /> Select Criteria
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700">Batch *</label>
                                <select
                                    className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={selectedBatch}
                                    onChange={(e) => setSelectedBatch(e.target.value)}
                                >
                                    <option value="">Select Batch</option>
                                    {batches.map(batch => (
                                        <option key={batch} value={batch}>{batch}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700">Program *</label>
                                <select
                                    className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={selectedProgram}
                                    onChange={(e) => setSelectedProgram(e.target.value)}
                                >
                                    <option value="">Select Program</option>
                                    {programs.map(prog => (
                                        <option key={prog.id} value={prog.id}>{prog.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700">Semester *</label>
                                <select
                                    className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={selectedSemester}
                                    onChange={(e) => setSelectedSemester(e.target.value)}
                                >
                                    <option value="">Select Semester</option>
                                    {semesters.map(sem => (
                                        <option key={sem} value={sem}>Semester {sem}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700">Subject *</label>
                                <select
                                    className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    disabled={!selectedBatch || !selectedProgram || !selectedSemester || loadingSubjects || subjects.length === 0}
                                >
                                    <option value="">
                                        {loadingSubjects ? 'Loading subjects...' : subjects.length === 0 && selectedBatch && selectedProgram && selectedSemester ? 'No subjects available' : 'Select Subject'}
                                    </option>
                                    {subjects.map(sub => (
                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                    ))}
                                </select>
                                {selectedBatch && selectedProgram && selectedSemester && subjects.length > 0 && (
                                    <p className="text-xs text-green-600 mt-1">✓ {subjects.length} subject(s) available for selected batch</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700">Term *</label>
                                <select
                                    className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={selectedTerm}
                                    onChange={(e) => setSelectedTerm(e.target.value)}
                                >
                                    <option value="">Select Term</option>
                                    {getAvailableTerms().map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                {getAvailableTerms().length < terms.length && (
                                    <p className="text-xs text-amber-600 mt-1">⚠ Only active terms are shown</p>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="btn btn-primary"
                                onClick={handleApplyFilters}
                            >
                                Load Students
                            </button>
                            {filtersApplied && (
                                <button
                                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                                    onClick={handleResetFilters}
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                    {/* Bulk Entry Table */}
                    {filtersApplied && (
                        <div className="card">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                    <TableIcon size={20} className="mr-2" /> Enter Marks
                                </h3>
                                <div className="text-sm text-gray-600 text-right">
                                    <span className="block">Subject: <strong>{subjects.find(s => s.id === Number(selectedSubject))?.name}</strong></span>
                                    <span className="block">Term: <strong>{terms.find(t => t.id === Number(selectedTerm))?.name}</strong></span>
                                </div>
                            </div>

                            <div className="table-container">
                                {students.length === 0 ? (
                                    <p className="text-center py-8 text-gray-500">No students found for criteria.</p>
                                ) : (
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">Roll No</th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">Student Name</th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">Obtained Marks</th>
                                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">Remark</th>
                                                <th className="py-3 px-4 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {students.map((student) => {
                                                const entry = marksEntry[student.id] || {};
                                                return (
                                                    <tr key={student.id} className="hover:bg-gray-50">
                                                        <td className="py-4 px-4 text-sm text-gray-600">{student.rollNo}</td>
                                                        <td className="py-4 px-4 text-sm font-medium text-gray-900">{student.name}</td>
                                                        <td className="py-2 px-4">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                className="w-32 border border-gray-300 rounded p-1 outline-none focus:ring-2 focus:ring-indigo-500"
                                                                placeholder="Marks"
                                                                value={entry.obtainedMarks}
                                                                onChange={(e) => handleMarkChange(student.id, 'obtainedMarks', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="py-2 px-4">
                                                            <input
                                                                type="text"
                                                                className="w-full border border-gray-300 rounded p-1 outline-none focus:ring-2 focus:ring-indigo-500"
                                                                placeholder="Remark"
                                                                value={entry.remark}
                                                                onChange={(e) => handleMarkChange(student.id, 'remark', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="py-4 px-4 text-center">
                                                            {entry.id ? (
                                                                <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                                                                    Saved
                                                                </span>
                                                            ) : (
                                                                <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">
                                                                    New
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {students.length > 0 && (
                                <div className="mt-6 flex justify-end">
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleSaveAll}
                                    >
                                        Save All Marks
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {!filtersApplied && (
                        <div className="card">
                            <p className="text-center text-gray-500 py-8">
                                Please select all criteria above to start entering marks.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div >
    );
};

export default MarksTab;
