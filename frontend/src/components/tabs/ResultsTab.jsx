import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './ResultsTab.css';
import { RefreshCcw, Search, GraduationCap, Users, Calendar, Table as TableIcon } from 'lucide-react';
import { toast } from 'react-toastify';

const ResultsTab = () => {
    const [results, setResults] = useState([]);
    const [terms, setTerms] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [studentBatches, setStudentBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Filter states
    const [selectedStudentBatchId, setSelectedStudentBatchId] = useState('');
    const [selectedProgramId, setSelectedProgramId] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [selectedTermId, setSelectedTermId] = useState('');

    const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setInitialLoading(true);
        try {
            const [termsRes, programsRes, batchesRes] = await Promise.all([
                api.get('/terms'),
                api.get('/programs'),
                api.get('/student-batches')
            ]);
            setTerms(termsRes.data);
            setPrograms(programsRes.data);
            setStudentBatches(batchesRes.data);
        } catch (error) {
            toast.error('Failed to load initial data');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleLoadResults = async () => {
        if (!selectedStudentBatchId || !selectedProgramId || !selectedSemester || !selectedTermId) {
            toast.warning('Please select all filters');
            return;
        }

        setLoading(true);
        try {
            const response = await api.get('/marks/search', {
                params: {
                    programId: selectedProgramId,
                    semester: selectedSemester,
                    termId: selectedTermId,
                    studentBatchId: selectedStudentBatchId
                }
            });
            setResults(response.data);
            if (response.data.length === 0) {
                toast.info('No results found for these criteria');
            }
        } catch (error) {
            toast.error('Failed to load results');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    // Extract unique subject names from results to create table headers
    const allSubjects = Array.from(
        new Set(
            results.flatMap(student => Object.keys(student.marks))
        )
    ).sort();

    const calculatePercentage = (obtained, full) => {
        if (!full || full === 0) return 0;
        return ((obtained / full) * 100).toFixed(2);
    };

    if (initialLoading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
                <p>Loading filter criteria...</p>
            </div>
        );
    }

    return (
        <div className="results-container animate-fadeIn">
            <div className="results-header">
                <div className="flex items-center gap-3">
                    <TableIcon className="text-indigo-600" size={32} />
                    <h1>Academic Results</h1>
                </div>
                <p>Comprehensive student performance overview</p>
            </div>

            <div className="results-filters">
                <div className="filters-grid">
                    <div className="filter-group">
                        <label><Users size={14} className="inline mr-1" /> Student Batch</label>
                        <select
                            className="results-select"
                            value={selectedStudentBatchId}
                            onChange={(e) => setSelectedStudentBatchId(e.target.value)}
                        >
                            <option value="">Select Batch</option>
                            {studentBatches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label><GraduationCap size={14} className="inline mr-1" /> Program</label>
                        <select
                            className="results-select"
                            value={selectedProgramId}
                            onChange={(e) => setSelectedProgramId(e.target.value)}
                        >
                            <option value="">Select Program</option>
                            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label><TableIcon size={14} className="inline mr-1" /> Semester</label>
                        <select
                            className="results-select"
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(e.target.value)}
                        >
                            <option value="">Select Semester</option>
                            {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label><Calendar size={14} className="inline mr-1" /> Term</label>
                        <select
                            className="results-select"
                            value={selectedTermId}
                            onChange={(e) => setSelectedTermId(e.target.value)}
                        >
                            <option value="">Select Term</option>
                            {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button
                        className="btn-load"
                        onClick={handleLoadResults}
                        disabled={loading}
                    >
                        {loading ? <RefreshCcw className="animate-spin" size={18} /> : <Search size={18} />}
                        Load Results
                    </button>
                </div>
            </div>

            {results.length > 0 ? (
                <div className="results-table-container">
                    <table className="results-table">
                        <thead>
                            <tr>
                                <th>Roll No</th>
                                <th>Student Name</th>
                                {allSubjects.map(sub => (
                                    <th key={sub} className="text-center">{sub}</th>
                                ))}
                                <th className="text-center">Total</th>
                                <th className="text-center">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map(student => {
                                const percentage = calculatePercentage(student.totalObtained, student.totalFull);
                                const isPass = percentage >= 40; // Assuming 40% is pass criteria

                                return (
                                    <tr key={student.studentId}>
                                        <td className="roll-no">{student.rollNo}</td>
                                        <td>
                                            <div className="student-info">
                                                <span className="student-name">{student.studentName}</span>
                                            </div>
                                        </td>
                                        {allSubjects.map(sub => {
                                            const mark = student.marks[sub];
                                            if (!mark) return <td key={sub} className="text-center text-gray-400">-</td>;

                                            const obtained = mark.obtained;
                                            const pass = mark.pass;
                                            const full = mark.full;

                                            return (
                                                <td key={sub} className="mark-cell">
                                                    <span className={`mark-obtained ${obtained >= pass ? 'pass' : 'fail'}`}>
                                                        {obtained}
                                                    </span>
                                                    <span className="mark-details">/{full}</span>
                                                </td>
                                            );
                                        })}
                                        <td className="total-cell text-center">
                                            {student.totalObtained}
                                            <span className="mark-details">/{student.totalFull}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className={`percentage-badge ${isPass ? 'percentage-pass' : 'percentage-fail'}`}>
                                                {percentage}%
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : !loading && (
                <div className="no-results">
                    <TableIcon size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Select filters and click "Load Results" to view performance data.</p>
                </div>
            )}
        </div>
    );
};

export default ResultsTab;
