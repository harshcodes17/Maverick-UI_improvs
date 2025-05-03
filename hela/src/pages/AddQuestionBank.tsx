import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { questionApi, curriculumApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Standard, Subject, QuestionBank } from '../utils/api/types';
import { API_URL } from '../utils/api/utils';

const AddQuestionBank: React.FC = () => {
  const { bankId } = useParams<{ bankId: string }>();
  const [description, setDescription] = useState('');
  const [standardId, setStandardId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  
  const navigate = useNavigate();
  const { token } = useAuth();

  // Load standards on component mount and check if we're editing
  useEffect(() => {
    if (token) {
      fetchStandards();
      
      // Check if we're in edit mode
      if (bankId) {
        setIsEdit(true);
        fetchBankDetails();
      }
    }
  }, [token, bankId]);

  // Load subjects when standard changes
  useEffect(() => {
    if (standardId && token) {
      fetchSubjects(standardId);
      if (!isEdit) {
        setSubjectId('');
      }
    }
  }, [standardId, token, isEdit]);

  // Fetch bank details if in edit mode
  const fetchBankDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/question-banks/${bankId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load question bank details');
      }
      
      const bank: QuestionBank = await response.json();
      
      // Set form fields
      setDescription(bank.description || '');
      setStandardId(bank.standard_id);
      
      // Fetch subjects for this standard, then set the subject
      await fetchSubjects(bank.standard_id);
      setSubjectId(bank.subject_id);
      
    } catch (err: any) {
      console.error('Error fetching bank details:', err);
      setError(err?.message || 'Failed to load question bank details');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch standards
  const fetchStandards = async () => {
    setIsLoading(true);
    try {
      const response = await curriculumApi.getStandards(token!);
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setStandards(response.data);
      }
    } catch (err) {
      console.error('Error fetching standards:', err);
      setError('Failed to load standards');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch subjects for a standard
  const fetchSubjects = async (stdId: string) => {
    setIsLoading(true);
    try {
      const response = await curriculumApi.getSubjects(stdId, token!);
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setSubjects(response.data);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!token) {
      setError('Authentication required. Please log in again.');
      setIsLoading(false);
      return;
    }

    try {
      let response;
      
      if (isEdit) {
        // Update existing question bank
        response = await fetch(`${API_URL}/question-banks/${bankId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ description })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to update question bank');
        }
      } else {
        // Create new question bank
        response = await questionApi.createQuestionBank({ 
          description, 
          standard_id: standardId,
          subject_id: subjectId 
        }, token);
        
        if (response.error) {
          setError(response.error);
          setIsLoading(false);
          return;
        }
      }
      
      // Redirect back to question banks list
      navigate('/question-banks');
      
    } catch (err: any) {
      console.error('Error saving question bank:', err);
      setError(err?.message || 'An error occurred while saving the question bank.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-6 md:p-8">
      {/* Page header with responsive text sizes */}
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Question Bank' : 'Add New Question Bank'}
          </h1>
          <button
            onClick={() => navigate(isEdit ? `/question-banks/${bankId}` : '/question-banks')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>
        <p className="mt-1 text-xs sm:text-sm text-gray-500">
          {isEdit 
            ? 'Update the details of this question bank.' 
            : 'Create a new question bank for organizing your questions.'}
        </p>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-3 sm:p-5 md:p-6">
        {/* Information alert - only show for new banks */}
        {!isEdit && (
          <div className="mb-6 p-3 sm:p-4 bg-blue-50 rounded-md border border-blue-100">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  The name of the question bank will be automatically generated from the selected standard and subject.
                </p>
              </div>
            </div>
          </div>
        )}
          
        <form onSubmit={handleSubmit}>
          {/* Error display */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 rounded-md border border-red-100">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form fields */}
          <div className="space-y-5">
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                rows={3}
                placeholder="Enter a description for this question bank"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Standard - disabled in edit mode */}
              <div>
                <label htmlFor="standard" className="block text-sm font-medium text-gray-700 required">
                  Standard
                </label>
                <select
                  id="standard"
                  name="standard"
                  value={standardId}
                  onChange={(e) => setStandardId(e.target.value)}
                  required
                  disabled={isEdit || isLoading}
                  className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Standard</option>
                  {standards.map((standard) => (
                    <option key={standard.id} value={standard.id}>
                      {standard.name}
                    </option>
                  ))}
                </select>
                {isEdit && (
                  <p className="mt-1 text-xs text-gray-500">
                    Standard cannot be changed after creation.
                  </p>
                )}
              </div>

              {/* Subject - disabled in edit mode */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 required">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  required
                  disabled={!standardId || isEdit || isLoading}
                  className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                {isEdit && (
                  <p className="mt-1 text-xs text-gray-500">
                    Subject cannot be changed after creation.
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Form actions */}
          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(isEdit ? `/question-banks/${bankId}` : '/question-banks')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isEdit ? 'Saving...' : 'Creating...'}
                </>
              ) : (isEdit ? 'Save Changes' : 'Create Question Bank')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddQuestionBank;