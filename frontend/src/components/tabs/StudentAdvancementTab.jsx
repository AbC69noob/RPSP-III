import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const StudentAdvancementTab = () => {
    const [programs, setPrograms] = useState([]);
    const [studentBatches, setStudentBatches] = useState([]);
    const [semesters, setSemesters] = useState([]);

    // Filters
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedSemesterId, setSelectedSemesterId] = useState('');
    const [selectedBatch, setSelectedBatch] = useState('');

    // Loaded students
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);

    // Selection state
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);

    // Bulk Update state
    const [targetSemester, setTargetSemester] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchPrograms();
        fetchStudentBatches();
        fetchSemesters();
    }, []);

    const fetchSemesters = async () => {
        try {
            const res = await api.get('/semesters');
            setSemesters(res.data.sort((a, b) => a.semesterNumber - b.semesterNumber));
        } catch (error) {
            toast.error("Failed to load semesters");
        }
    };

    const fetchPrograms = async () => {
        try {
            const res = await api.get('/programs');
            setPrograms(res.data);
        } catch (error) {
            toast.error("Failed to load programs");
        }
    };

    const fetchStudentBatches = async () => {
        try {
            const res = await api.get('/student-batches');
            setStudentBatches(res.data);
        } catch (error) {
            toast.error("Failed to load student batches");
        }
    };

    const loadStudents = async () => {
        if (!selectedProgram || !selectedSemesterId) {
            toast.warning("Please select at least Program and Semester to load students.");
            return;
        }

        setLoading(true);
        setSelectedStudentIds([]); // clear selection
        try {
            const params = new URLSearchParams({
                programId: selectedProgram,
                semesterId: selectedSemesterId
            });
            if (selectedBatch) {
                params.append('studentBatchId', selectedBatch);
            }
            const res = await api.get(`/students/filter?${params.toString()}`);
            setStudents(res.data);
            if (res.data.length === 0) toast.info("No students found for given criteria.");
        } catch (error) {
            console.error(error);
            toast.error("Failed to load students");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedStudentIds(students.map(s => s.id));
        } else {
            setSelectedStudentIds([]);
        }
    };

    const handleSelectStudent = (id) => {
        if (selectedStudentIds.includes(id)) {
            setSelectedStudentIds(selectedStudentIds.filter(sid => sid !== id));
        } else {
            setSelectedStudentIds([...selectedStudentIds, id]);
        }
    };

    const handleAdvanceSemester = async () => {
        if (selectedStudentIds.length === 0) {
            toast.warning("No students selected!");
            return;
        }
        if (!targetSemester) {
            toast.warning("Please select a target semester to advance to.");
            return;
        }

        setUpdating(true);
        try {
            await api.put('/students/bulk-semester', {
                studentIds: selectedStudentIds,
                targetSemesterId: parseInt(targetSemester)
            });
            toast.success(`Successfully advanced ${selectedStudentIds.length} students to Semester ${targetSemester}!`);

            // Reload list
            loadStudents();
        } catch (error) {
            console.error(error);
            toast.error("Failed to advance students.");
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="card">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Bulk Student Semester Management</h2>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 items-end mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
                    <div>
                        <label className="label">Program</label>
                        <select
                            className="input-field"
                            value={selectedProgram}
                            onChange={(e) => setSelectedProgram(e.target.value)}
                        >
                            <option value="">Select Program</option>
                            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Current Semester</label>
                        <select
                            className="input-field"
                            value={selectedSemesterId}
                            onChange={(e) => setSelectedSemesterId(e.target.value)}
                        >
                            <option value="">Select Semester</option>
                            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Student Batch (Optional)</label>
                        <select
                            className="input-field"
                            value={selectedBatch}
                            onChange={(e) => setSelectedBatch(e.target.value)}
                        >
                            <option value="">Any Batch</option>
                            {studentBatches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={loadStudents}
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Load Students'}
                    </button>
                </div>

                {/* Bulk Action Bar */}
                {students.length > 0 && (
                    <div className="flex justify-between items-center bg-blue-50 p-4 rounded-md mb-4 border border-blue-100">
                        <div className="text-sm">
                            <span className="font-bold">{selectedStudentIds.length}</span> / {students.length} students selected
                        </div>
                        <div className="flex gap-3 items-center">
                            <label className="label m-0">Target Semester:</label>
                            <select
                                className="input-field"
                                style={{ width: 'auto', padding: '0.4rem 0.8rem' }}
                                value={targetSemester}
                                onChange={(e) => setTargetSemester(e.target.value)}
                            >
                                <option value="">Select Target...</option>
                                {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <button
                                onClick={handleAdvanceSemester}
                                disabled={updating || selectedStudentIds.length === 0 || !targetSemester}
                                className="btn btn-primary bg-success"
                                style={{ backgroundColor: '#10b981' }} // override gradient
                            >
                                {updating ? 'Updating...' : 'Change Semester'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="table-container shadow-sm">
                    <table>
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left w-10">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded text-primary focus:ring-primary"
                                        checked={students.length > 0 && selectedStudentIds.length === students.length}
                                        onChange={handleSelectAll}
                                        disabled={students.length === 0}
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Sem</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {students.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-4 text-gray-500">No students to display</td></tr>
                            ) : (
                                students.map(student => (
                                    <tr key={student.id} className={selectedStudentIds.includes(student.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded text-primary focus:ring-primary"
                                                checked={selectedStudentIds.includes(student.id)}
                                                onChange={() => handleSelectStudent(student.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.rollNo}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.program?.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sem {student.semester?.semesterNumber}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StudentAdvancementTab;
