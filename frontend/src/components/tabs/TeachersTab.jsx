import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import './TeachersTab.css';
import { toast } from 'react-toastify';

const TeachersTab = () => {
    // Data states
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [courseBatches, setCourseBatches] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [selectedBatch, setSelectedBatch] = useState('');
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');

    // Selection states
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [subjectsRes, teachersRes, programsRes, assignmentsRes, courseBatchesRes] = await Promise.all([
                api.get('/subjects'),
                api.get('/teachers'),
                api.get('/programs'),
                api.get('/teacher-subjects'),
                api.get('/course-batches')
            ]);
            setSubjects(subjectsRes.data);
            setTeachers(teachersRes.data);
            setPrograms(programsRes.data);
            setAssignments(assignmentsRes.data);
            setCourseBatches(courseBatchesRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // Get sorted course revisions
    const sortedCourseBatches = [...courseBatches].sort((a, b) => b.startYear - a.startYear);

    // Get the teacher ID assigned to a subject (if any)
    const getAssignedTeacherId = (subjectId) => {
        const assignment = assignments.find(a => a.subject?.id === subjectId);
        return assignment ? assignment.teacher?.id : null;
    };

    // Check if subject is assigned to a different teacher (not the selected one)
    const isAssignedToOtherTeacher = (subjectId) => {
        const assignedTeacherId = getAssignedTeacherId(subjectId);
        // If not assigned at all, return false
        if (!assignedTeacherId) return false;
        // If assigned to the selected teacher, return false (we want to show it)
        if (selectedTeacher && assignedTeacherId === Number(selectedTeacher)) return false;
        // Otherwise, it's assigned to a different teacher
        return true;
    };

    // Filter subjects based on selections
    const filteredSubjects = subjects.filter(subject => {
        // Hide subjects assigned to OTHER teachers (not the selected teacher)
        if (isAssignedToOtherTeacher(subject.id)) return false;

        // Apply Course Revision filter
        if (selectedBatch && subject.courseBatch?.id !== Number(selectedBatch)) return false;

        // Apply program filter
        if (selectedProgram && subject.program?.id !== Number(selectedProgram)) return false;

        // Apply semester filter
        if (selectedSemester && subject.semester !== Number(selectedSemester)) return false;

        return true;
    });

    // Handle individual checkbox
    const handleCheckboxChange = (subjectId) => {
        setSelectedSubjects(prev => {
            if (prev.includes(subjectId)) {
                return prev.filter(id => id !== subjectId);
            } else {
                return [...prev, subjectId];
            }
        });
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedSubjects([]);
        } else {
            setSelectedSubjects(filteredSubjects.map(s => s.id));
        }
        setSelectAll(!selectAll);
    };

    // Update selectAll state when individual selections change
    useEffect(() => {
        if (filteredSubjects.length > 0 && selectedSubjects.length === filteredSubjects.length) {
            setSelectAll(true);
        } else {
            setSelectAll(false);
        }
    }, [selectedSubjects, filteredSubjects]);

    // Auto-check subjects already assigned to the selected teacher
    useEffect(() => {
        if (!selectedTeacher) {
            return;
        }

        // Recalculate filtered subjects inside the effect to avoid dependency issues
        const filtered = subjects.filter(subject => {
            // Hide subjects assigned to OTHER teachers
            const assignedTeacherId = getAssignedTeacherId(subject.id);
            if (assignedTeacherId && assignedTeacherId !== Number(selectedTeacher)) {
                return false;
            }

            // Apply filters
            if (selectedBatch && subject.courseBatch?.id !== Number(selectedBatch)) return false;
            if (selectedProgram && subject.program?.id !== Number(selectedProgram)) return false;
            if (selectedSemester && subject.semester !== Number(selectedSemester)) return false;

            return true;
        });

        const alreadyAssignedSubjects = filtered
            .filter(subject => {
                const assignedTeacherId = getAssignedTeacherId(subject.id);
                return assignedTeacherId && assignedTeacherId === Number(selectedTeacher);
            })
            .map(subject => subject.id);

        // Only update if there are assigned subjects and they're not already selected
        if (alreadyAssignedSubjects.length > 0) {
            setSelectedSubjects(prev => {
                // Check if we need to add any new IDs
                const needsUpdate = alreadyAssignedSubjects.some(id => !prev.includes(id));
                if (!needsUpdate) {
                    return prev; // No change needed
                }

                const newSelection = [...prev];
                alreadyAssignedSubjects.forEach(id => {
                    if (!newSelection.includes(id)) {
                        newSelection.push(id);
                    }
                });
                return newSelection;
            });
        }
    }, [selectedTeacher, selectedBatch, selectedProgram, selectedSemester, subjects, assignments]);

    // Handle bulk assignment
    const handleBulkAssign = async () => {
        if (!selectedTeacher) {
            toast.warning('Please select a teacher first');
            return;
        }

        if (selectedSubjects.length === 0) {
            toast.warning('Please select at least one subject');
            return;
        }

        try {
            const promises = [];

            // Get list of subjects already assigned to this teacher
            const alreadyAssignedSubjects = filteredSubjects
                .filter(subject => {
                    const assignedTeacherId = getAssignedTeacherId(subject.id);
                    return assignedTeacherId && assignedTeacherId === Number(selectedTeacher);
                })
                .map(subject => subject.id);

            // Determine which subjects need to be assigned and which need to be unassigned
            selectedSubjects.forEach(subjectId => {
                if (alreadyAssignedSubjects.includes(subjectId)) {
                    // Subject is still selected, so keep it assigned (no action needed)
                    // Do nothing - already assigned and staying assigned
                } else {
                    // Subject is newly selected, so assign it
                    promises.push(
                        api.put(`/subjects/${subjectId}/teacher`, { teacherId: Number(selectedTeacher) })
                    );
                }
            });

            // Unassign subjects that were previously assigned but are now unchecked
            alreadyAssignedSubjects.forEach(subjectId => {
                if (!selectedSubjects.includes(subjectId)) {
                    // Subject was assigned but is now unchecked, so unassign it
                    promises.push(
                        api.delete(`/subjects/${subjectId}/teacher`)
                    );
                }
            });

            if (promises.length === 0) {
                toast.info('No changes to make');
                return;
            }

            await Promise.all(promises);

            const assignCount = selectedSubjects.filter(id => !alreadyAssignedSubjects.includes(id)).length;
            const unassignCount = alreadyAssignedSubjects.filter(id => !selectedSubjects.includes(id)).length;

            let message = 'Successfully updated teacher assignments';
            if (assignCount > 0 && unassignCount > 0) {
                message = `Assigned ${assignCount} and unassigned ${unassignCount} subject(s)`;
            } else if (assignCount > 0) {
                message = `Assigned ${assignCount} subject(s)`;
            } else if (unassignCount > 0) {
                message = `Unassigned ${unassignCount} subject(s)`;
            }

            toast.success(message);

            // Clear selections
            setSelectedSubjects([]);
            setSelectAll(false);

            // Refresh data
            await fetchData();
        } catch (error) {
            console.error('Failed to assign/unassign subjects:', error);
            toast.error('Failed to update subjects. Please try again.');
        }
    };

    // Handle remove all assignments for selected teacher
    const handleRemoveAllAssignments = async () => {
        if (!selectedTeacher) {
            toast.warning('Please select a teacher first');
            return;
        }

        // Get all subjects assigned to this teacher
        const assignedToThisTeacher = subjects
            .filter(subject => {
                const assignedTeacherId = getAssignedTeacherId(subject.id);
                return assignedTeacherId && assignedTeacherId === Number(selectedTeacher);
            })
            .map(subject => subject.id);

        if (assignedToThisTeacher.length === 0) {
            toast.info('No subjects assigned to this teacher');
            return;
        }

        const confirmRemove = window.confirm(
            `Are you sure you want to remove all ${assignedToThisTeacher.length} subject(s) assigned to this teacher?`
        );

        if (!confirmRemove) return;

        try {
            const promises = assignedToThisTeacher.map(subjectId =>
                api.delete(`/subjects/${subjectId}/teacher`)
            );

            await Promise.all(promises);

            toast.success(`Successfully removed ${assignedToThisTeacher.length} subject(s) from this teacher`);

            // Clear selections
            setSelectedSubjects([]);
            setSelectAll(false);

            // Refresh data
            await fetchData();
        } catch (error) {
            console.error('Failed to remove assignments:', error);
            toast.error('Failed to remove subject assignments. Please try again.');
        }
    };

    // Reset filters
    const handleResetFilters = () => {
        setSelectedBatch('');
        setSelectedProgram('');
        setSelectedSemester('');
        setSelectedSubjects([]);
        setSelectAll(false);
    };

    if (loading) return <div className="card">Loading...</div>;

    const showSubjects = selectedBatch || selectedProgram || selectedSemester;

    return (
        <div className="card">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Course allocation</h3>

            {/* Filter Section */}
            <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm mb-6">
                <h4 className="text-md font-semibold text-gray-700 mb-4">Select Filters</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {/* Teacher Dropdown */}
                    <div>
                        <label className="label">Teacher <span className="text-red-500">*</span></label>
                        <select
                            className="input-field"
                            value={selectedTeacher}
                            onChange={(e) => setSelectedTeacher(e.target.value)}
                        >
                            <option value="">Select Teacher</option>
                            {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Course Revision Dropdown */}
                    <div>
                        <label className="label">Select Revised Course On</label>
                        <select
                            className="input-field"
                            value={selectedBatch}
                            onChange={(e) => setSelectedBatch(e.target.value)}
                        >
                            <option value="">All Revisions</option>
                            {sortedCourseBatches.map(batch => (
                                <option key={batch.id} value={batch.id}>Revised on {batch.startYear}</option>
                            ))}
                        </select>
                    </div>

                    {/* Program Dropdown */}
                    <div>
                        <label className="label">Program</label>
                        <select
                            className="input-field"
                            value={selectedProgram}
                            onChange={(e) => setSelectedProgram(e.target.value)}
                        >
                            <option value="">All Programs</option>
                            {programs.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Semester Dropdown */}
                    <div>
                        <label className="label">Semester</label>
                        <select
                            className="input-field"
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(e.target.value)}
                        >
                            <option value="">All Semesters</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleResetFilters}
                        className="btn btn-secondary"
                    >
                        Reset Filters
                    </button>
                    {selectedTeacher && (
                        <button
                            onClick={handleRemoveAllAssignments}
                            className="btn bg-red-500 hover:bg-red-600 text-white"
                        >
                            Remove All Assignments
                        </button>
                    )}
                </div>
            </div>

            {/* Subject List */}
            {showSubjects && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 border-b border-gray-200">
                        <h4 className="text-md font-semibold text-gray-700">
                            Available Subjects ({filteredSubjects.length})
                        </h4>
                        {selectedTeacher && (
                            <p className="text-sm text-gray-500 mt-1">
                                Showing unassigned subjects and subjects already assigned to the selected teacher
                            </p>
                        )}
                    </div>

                    {filteredSubjects.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No subjects found matching the selected filters.
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="py-3 px-4 text-left w-12">
                                                <input
                                                    type="checkbox"
                                                    checked={selectAll}
                                                    onChange={handleSelectAll}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                            </th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase w-24">Code</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">Subject Name</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase w-32">Course Revision</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase w-40">Program</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase w-24">Semester</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase w-32">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredSubjects.map(subject => {
                                            const assignedTeacherId = getAssignedTeacherId(subject.id);
                                            const isAlreadyAssigned = assignedTeacherId && selectedTeacher && assignedTeacherId === Number(selectedTeacher);

                                            return (
                                                <tr key={subject.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSubjects.includes(subject.id)}
                                                            onChange={() => handleCheckboxChange(subject.id)}
                                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                        />
                                                    </td>
                                                    <td className="py-3 px-4 text-sm font-mono text-gray-600">{subject.code}</td>
                                                    <td className="py-3 px-4 text-sm font-medium text-gray-800">{subject.name}</td>
                                                    <td className="py-3 px-4 text-sm text-gray-600">{subject.courseBatch?.startYear ? `Revised on ${subject.courseBatch.startYear}` : 'N/A'}</td>
                                                    <td className="py-3 px-4 text-sm text-gray-600">{subject.program?.name || 'N/A'}</td>
                                                    <td className="py-3 px-4 text-sm text-gray-600">{subject.semester}</td>
                                                    <td className="py-3 px-4 text-sm">
                                                        {isAlreadyAssigned ? (
                                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                Already Assigned
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                                Unassigned
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Assignment Button */}
                            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                                <div className="text-sm text-gray-600">
                                    {selectedSubjects.length > 0 && (
                                        <span className="font-medium">{selectedSubjects.length} subject(s) selected</span>
                                    )}
                                </div>
                                <button
                                    onClick={handleBulkAssign}
                                    disabled={!selectedTeacher || selectedSubjects.length === 0}
                                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Assign to Teacher
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {!showSubjects && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <p className="text-blue-800 text-sm">
                        Please select at least one filter (Batch, Program, or Semester) to view unassigned subjects.
                    </p>
                </div>
            )}
        </div>
    );
};

export default TeachersTab;
