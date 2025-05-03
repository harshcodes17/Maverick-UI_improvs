import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { questionApi } from '../utils/api';
import { Question, QuestionBank } from '../utils/api/types';
import { AddQuestionsToBank, ManualQuestionForm, CreateQuestion } from '../components/curriculum';
import { API_URL } from '../utils/api/utils';

const QuestionBankDetail: React.FC = () => {
  const { bankId } = useParams<{ bankId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddQuestionsModal, setShowAddQuestionsModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'questions' | 'create' | 'upload'>('questions');
  
  // Fetch bank details and questions
  useEffect(() => {
    if (!bankId || !token) return;
    
    const fetchBankDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch bank details
        const bankResponse = await fetch(`${API_URL}/question-banks/${bankId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!bankResponse.ok) {
          throw new Error('Failed to load question bank');
        }
        
        const bankData = await bankResponse.json();
        setBank(bankData);
        
        // Fetch questions in bank
        const questionsResponse = await questionApi.getQuestionsInBank(bankId, token);
        if (questionsResponse.error) {
          console.error('Error fetching questions:', questionsResponse.error);
        } else if (questionsResponse.data) {
          setQuestions(questionsResponse.data);
        }
      } catch (e: Error | unknown) {
        console.error('Error loading bank details:', e);
        setError(e instanceof Error ? e.message : 'Failed to load question bank details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBankDetails();
  }, [bankId, token]);
  
  // Handle removing a question from the bank
  const handleRemoveQuestion = async (questionId: string) => {
    if (!confirm('Remove this question from the bank?')) return;
    
    try {
      const response = await questionApi.removeQuestionFromBank(bankId!, questionId, token!);
      
      if (response.error) {
        setError(response.error);
      } else {
        // Update questions list after removal
        setQuestions(prevQuestions => prevQuestions.filter(q => q.id !== questionId));
      }
    } catch (e: Error | unknown) {
      setError(e instanceof Error ? e.message : 'Failed to remove question');
    }
  };
  
  // Handle successful adding of questions
  const handleAddQuestionsSuccess = async () => {
    if (!bankId || !token) return;
    
    try {
      const response = await questionApi.getQuestionsInBank(bankId, token);
      if (response.data) {
        setQuestions(response.data);
      }
    } catch (e) {
      console.error('Error refreshing questions:', e);
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-3 sm:p-6 md:p-8">
        <div className="flex justify-center items-center h-64">
          <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-3 sm:p-6 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-2">{error}</p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/question-banks')}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Back to Question Banks
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-3 sm:p-6 md:p-8">
      {/* Breadcrumbs and nav */}
      <nav className="mb-5 flex justify-between items-center">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link to="/question-banks" className="text-indigo-600 hover:text-indigo-900">
              Question Banks
            </Link>
          </li>
          <li className="text-gray-500">/</li>
          <li className="text-gray-500 truncate max-w-xs">{bank?.name}</li>
        </ol>
        <Link 
          to="/question-banks" 
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Banks
        </Link>
      </nav>
      
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{bank?.name}</h1>
          {bank?.description && (
            <p className="mt-1 text-sm text-gray-500">{bank.description}</p>
          )}
        </div>
        
        {/* <div className="flex items-center gap-3">
          <Link
            to={`/question-banks/${bankId}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </Link>
        </div> */}
      </div>
      
      {/* Bank metadata */}
      <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Standard</h3>
            <p className="mt-1 text-sm text-gray-900">{bank?.standard_name}</p>
          </div>
          
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</h3>
            <p className="mt-1 text-sm text-gray-900">{bank?.subject_name}</p>
          </div>
          
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</h3>
            <p className="mt-1 text-sm font-semibold text-indigo-600">{questions.length}</p>
          </div>
          
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created</h3>
            <p className="mt-1 text-sm text-gray-900">
              {bank?.created_at ? new Date(bank.created_at).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('questions')}
            className={`${
              activeTab === 'questions'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Questions ({questions.length})
          </button>
<button
            onClick={() => setActiveTab('create')}
            className={`${
              activeTab === 'create'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Create New
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`${
              activeTab === 'upload'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Upload & Extract
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {activeTab === 'questions' && (
          <>
            <div className="border-b border-gray-200 px-4 py-5 sm:px-6 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Questions</h2>
              {/* <button
                onClick={() => setShowAddQuestionsModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Existing Questions
              </button> */}
            </div>
            
            {/* Existing questions list */}
            {questions.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No questions</h3>
                <p className="mt-1 text-sm text-gray-500">This question bank doesn't have any questions yet.</p>
                <div className="mt-6 space-x-3">
                  <button
                    onClick={() => setActiveTab('create')}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Create New Question
                  </button>
                  {/* <button
                    onClick={() => setShowAddQuestionsModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add Existing Questions
                  </button> */}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Question
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Difficulty
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Marks
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {questions.map((question) => (
                      <tr key={question.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div 
                            className="text-sm text-gray-900 line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: question.question_text }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{question.question_type_name}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            question.difficulty_level === 'easy' ? 'bg-green-100 text-green-800' :
                            question.difficulty_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {question.difficulty_level.charAt(0).toUpperCase() + question.difficulty_level.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {question.marks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link 
                            to={`/questions/${question.id}`}
                            className="inline-flex items-center px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 rounded-md text-indigo-700 hover:bg-indigo-100 mr-2 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                            View
                          </Link>
                          <button 
                            onClick={() => handleRemoveQuestion(question.id)} 
                            className="inline-flex items-center px-2.5 py-1.5 bg-red-50 border border-red-200 rounded-md text-red-700 hover:bg-red-100 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        {activeTab === 'create' && (
          <div className="p-6">
            <ManualQuestionForm 
              bankId={bankId} 
              standardId={bank?.standard_id}
              subjectId={bank?.subject_id}
              onQuestionCreated={() => {
                setActiveTab('questions');
                handleAddQuestionsSuccess();
              }}
            />
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="p-6">
            <CreateQuestion 
              bankId={bankId}
              standardId={bank?.standard_id}
              subjectId={bank?.subject_id}
              onQuestionsAdded={() => {
                setActiveTab('questions');
                handleAddQuestionsSuccess();
              }}
            />
          </div>
        )}
      </div>
      
      {/* Add Questions Modal */}
      <AddQuestionsToBank 
        isOpen={showAddQuestionsModal}
        bankId={bankId!}
        bankName={bank?.name}
        onClose={() => setShowAddQuestionsModal(false)}
        onSuccess={handleAddQuestionsSuccess}
      />
    </div>
  );
};

export default QuestionBankDetail;