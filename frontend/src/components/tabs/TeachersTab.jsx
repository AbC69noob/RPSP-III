import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import './TeachersTab.css';

const TeachersTab = () => {
    const [subjects, setSubjects] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editSubject, setEditSubject] = useState(null); // { id, name, currentTeacherId }
    const [selectedTeacher, setSelectedTeacher] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [subjectsRes, assignmentsRes, teachersRes] = await Promise.all([
                    api.get('/subjects'),
                    api.get('/teacher-subjects'),
                    api.get('/teachers')
                ]);
                setSubjects(subjectsRes.data);
                setAssignments(assignmentsRes.data);
                setTeachers(teachersRes.data);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Helper to find teacher for a subject
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
        if (!selectedTeacher) return alert('Please select a teacher');
        try {
            await api.put(`/subjects/${editSubject.id}/teacher`, { teacherId: selectedTeacher });
            alert('Teacher assigned successfully');
            setEditSubject(null);
            // Refresh logic: simplified for now, ideally re-fetch or update local state
            window.location.reload();
        } catch (error) {
            console.error('Failed to update teacher:', error);
            alert('Failed to update assignment');
        }
    };

    // Grouping Logic (Same as SubjectsTab)
    const groupedSubjects = subjects.reduce((acc, subject) => {
        const progName = subject.program?.name || 'Unassigned';
        if (!acc[progName]) acc[progName] = {};

        const semester = subject.semester || 'Unknown';
        if (!acc[progName][semester]) acc[progName][semester] = [];

        acc[progName][semester].push(subject);
        return acc;
    }, {});

    if (loading) return <div>Loading...</div>;

    return (
        <div className="card">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Subject Allocations</h3>

            <div className="space-y-8">
                {Object.entries(groupedSubjects).map(([progName, semesters]) => (
                    <div key={progName} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center mb-4">
                            <div className="h-8 w-1 bg-green-600 rounded-full mr-3"></div>
                            <h2 className="text-xl font-bold text-gray-800">{progName}</h2>
                        </div>

                        {Object.entries(semesters).map(([sem, subList]) => (
                            <div key={sem} className="ml-4 mb-6 last:mb-0">
                                <h3 className="text-md font-semibold text-gray-600 mb-2 flex items-center">
                                    <span className="bg-gray-100 px-2 py-1 rounded text-sm mr-2">Semester {sem}</span>
                                </h3>
                                <div className="table-container shadow-none border border-gray-100 rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead>
                                            <tr>
                                                <th className="py-2 px-4 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase w-24">Code</th>
                                                <th className="py-2 px-4 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">Subject Name</th>
                                                <th className="py-2 px-4 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase w-1/3">Assigned Teacher</th>
                                                <th className="py-2 px-4 bg-gray-50 text-right text-xs font-semibold text-gray-500 uppercase w-20">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {subList.map(sub => {
                                                const teacherName = getAssignedTeacherName(sub.id);
                                                return (
                                                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="py-2 px-4 text-sm font-mono text-gray-600">{sub.code}</td>
                                                        <td className="py-2 px-4 text-sm font-medium text-gray-800">{sub.name}</td>
                                                        <td className="py-2 px-4 text-sm">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${teacherName !== 'Not Assigned'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                {teacherName}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 px-4 text-right">
                                                            <button
                                                                onClick={() => handleEditClick(sub)}
                                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                                                Edit
                                                            </button>
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

            {/* Edit Modal */}
            {editSubject && (
                <div className="modal-overlay">
                    <div className="modal-content teachers-modal-content">
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
        </div>
    );
};

export default TeachersTab;
