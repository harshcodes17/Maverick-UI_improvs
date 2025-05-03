import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Select } from '../components/ui';
import { API_URL } from '../utils/api/utils';

// Interfaces
interface QuestionBank {
  id: string;
  name: string;
  description?: string;
  standard_id: string;
  subject_id: string;
  question_count: number;
  standard_name: string;
  subject_name: string;
  created_at: string;
  updated_at: string;
}

export const QuestionBanks: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [standards, setStandards] = useState<{ id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<{ id: string; name: string }[]>([]);
  const [filterStandard, setFilterStandard] = useState<string>(searchParams.get('standard_id') || '');
  const [filterSubject, setFilterSubject] = useState<string>(searchParams.get('subject_id') || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch curriculum metadata
  useEffect(() => {
    const fetchCurriculum = async () => {
      if (!token) return;
      try {
        const [sRes, subjRes] = await Promise.all([
          fetch(`${API_URL}/curriculum/standards`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/curriculum/subjects`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (sRes.ok && subjRes.ok) {
          const standardsData = await sRes.json();
          const subjectsData = await subjRes.json();
          setStandards(standardsData);
          setSubjects(subjectsData);
          
          // Filter subjects based on selected standard if necessary
          if (filterStandard) {
            const filtered = subjectsData.filter((subject: any) => 
              subject.standard_id === filterStandard
            );
            setFilteredSubjects(filtered);
          } else {
            setFilteredSubjects(subjectsData);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchCurriculum();
  }, [token]);

  // Filter subjects when standard changes
  useEffect(() => {
    if (filterStandard) {
      const filtered = subjects.filter(subject => 
        subject.standard_id === filterStandard
      );
      setFilteredSubjects(filtered);
      
      // If the current subject doesn't belong to the selected standard, reset it
      if (filterSubject && !filtered.some(s => s.id === filterSubject)) {
        setFilterSubject('');
        updateSearchParams(filterStandard, '');
      }
    } else {
      setFilteredSubjects(subjects);
    }
  }, [filterStandard, subjects]);

  // Update URL search params when filters change
  const updateSearchParams = useCallback((standardId: string, subjectId: string) => {
    const params = new URLSearchParams();
    if (standardId) params.append('standard_id', standardId);
    if (subjectId) params.append('subject_id', subjectId);
    setSearchParams(params);
  }, [setSearchParams]);

  // Handle standard filter change
  const handleStandardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStandardId = e.target.value;
    setFilterStandard(newStandardId);
    updateSearchParams(newStandardId, filterSubject);
  };

  // Handle subject filter change
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSubjectId = e.target.value;
    setFilterSubject(newSubjectId);
    updateSearchParams(filterStandard, newSubjectId);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterStandard('');
    setFilterSubject('');
    setSearchParams({});
  };

  // Fetch question banks with optional filters
  const fetchBanks = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterStandard) params.append('standard_id', filterStandard);
      if (filterSubject) params.append('subject_id', filterSubject);
      const res = await fetch(`${API_URL}/question-banks?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load question banks');
      const data: QuestionBank[] = await res.json();
      setBanks(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, filterStandard, filterSubject]);

  // Update banks when filters change
  useEffect(() => { 
    fetchBanks(); 
  }, [fetchBanks]);

  return (
    <div className="p-3 sm:p-6 md:p-8">
      {/* Page header with responsive text sizes */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Question Banks</h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-500">
          Create and manage question banks for your assessments.
        </p>
      </div>

      {/* Action bar with filters and "Add" button */}
      <div className="bg-white shadow-sm rounded-lg p-3 sm:p-5 md:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-0">Filters</h2>
          <div className="flex items-center space-x-2">
            {(filterStandard || filterSubject) && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="mr-1 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            )}
            <Link 
              to="/question-banks/add" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              New Bank
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label htmlFor="standard-filter" className="block text-sm font-medium text-gray-700">Standard</label>
            <Select
              id="standard-filter"
              value={filterStandard}
              onChange={handleStandardChange}
              options={[{ value: '', label: 'All Standards' }, ...standards.map(s => ({ value: s.id, label: s.name }))]}
            />
          </div>
          <div>
            <label htmlFor="subject-filter" className="block text-sm font-medium text-gray-700">Subject</label>
            <Select
              id="subject-filter"
              value={filterSubject}
              onChange={handleSubjectChange}
              options={[{ value: '', label: 'All Subjects' }, ...filteredSubjects.map(s => ({ value: s.id, label: s.name }))]}
            />
            {filterStandard && filteredSubjects.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">No subjects available for the selected standard.</p>
            )}
          </div>
        </div>
      </div>

      {/* Question banks table */}
      <div className="bg-white shadow-sm rounded-lg p-3 sm:p-5 md:p-6">
        <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Results</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 rounded-md border border-red-100 text-sm text-red-800">
            {error}
          </div>
        )}
        
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          {isLoading ? (
            <div className="py-10 text-center text-gray-500">
              <svg className="animate-spin h-8 w-8 mx-auto text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-2 text-sm">Loading question banks...</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Standard</th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Subject</th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {banks.map(bank => (
                  <tr key={bank.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{bank.name}</td>
                    <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{bank.description || '-'}</td>
                    <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{bank.standard_name}</td>
                    <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden md:table-cell">{bank.subject_name}</td>
                    <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-center text-xs sm:text-sm text-gray-900">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {bank.question_count}
                      </span>
                    </td>
                    <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                      <Link 
                        to={`/question-banks/${bank.id}`} 
                        className="inline-flex items-center px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 rounded-md text-indigo-700 hover:bg-indigo-100 mr-2 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        View
                      </Link>
                      
                      <button 
                        onClick={async () => {
                          if (confirm('Delete this bank?')) {
                            await fetch(`${API_URL}/question-banks/${bank.id}`, { 
                              method: 'DELETE', 
                              headers: { Authorization: `Bearer ${token}` } 
                            });
                            fetchBanks();
                          }
                        }} 
                        className="inline-flex items-center px-2.5 py-1.5 bg-red-50 border border-red-200 rounded-md text-red-700 hover:bg-red-100 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!banks.length && (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 sm:px-6 text-center text-sm text-gray-500">
                      {filterStandard || filterSubject ? 
                        'No question banks match your filters.' : 
                        'No question banks found. Create your first question bank to get started.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionBanks;