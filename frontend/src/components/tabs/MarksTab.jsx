import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './MarksTab.css';
import { Plus, Table as TableIcon, Filter } from 'lucide-react';

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

    // Bulk Entry State: { [studentId]: { obtainedMarks: '', remark: '', id: null } }
    const [marksEntry, setMarksEntry] = useState({});

    // Generate batch years (current year and past 10 years)
    const generateBatchYears = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = 0; i <= 10; i++) {
            years.push((currentYear - i).toString());
        }
        return years;
    };

    const batchYears = generateBatchYears();
    const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [marksRes, studentsRes, subjectsRes, termsRes, programsRes, profileRes] = await Promise.all([
                api.get('/marks'),
                api.get('/students'),
                api.get('/subjects'),
                api.get('/terms'),
                api.get('/programs'),
                api.get('/profile')
            ]);
            setMarks(marksRes.data);
            setAllStudents(studentsRes.data);
            setStudents(studentsRes.data);
            setSubjects(subjectsRes.data);
            setTerms(termsRes.data);
            setPrograms(programsRes.data);
            setCurrentUser(profileRes.data);
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
            {/* Filter Section */}
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
                            {batchYears.map(year => (
                                <option key={year} value={year}>{year}</option>
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
                            className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                        >
                            <option value="">Select Subject</option>
                            {subjects.map(sub => (
                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700">Term *</label>
                        <select
                            className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                            value={selectedTerm}
                            onChange={(e) => setSelectedTerm(e.target.value)}
                        >
                            <option value="">Select Term</option>
                            {terms.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
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
        </div>
    );
};

export default MarksTab;
