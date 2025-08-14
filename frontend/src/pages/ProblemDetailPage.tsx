import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  BuildingOfficeIcon, 
  TagIcon, 
  ClockIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import ChatInterface from '../components/ui/ChatInterface';
import ErrorMessage from '../components/ui/ErrorMessage';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorBoundary from '../components/ui/ErrorBoundary';

interface ProblemStatement {
  id: string;
  title: string;
  organization: string;
  category: string;
  description: string;
  technology_stack: string[];
  difficulty_level: string;
  created_at?: string;
}

const ProblemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<ProblemStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProblemDetails(id);
    }
  }, [id]);

  const fetchProblemDetails = async (problemId: string) => {
    setLoading(true);
    setError(null);

    try {
      // For now, we'll simulate fetching from a search result or cache
      // In a real implementation, you might have a dedicated endpoint
      // or fetch from localStorage/sessionStorage where search results are cached
      const cachedResults = sessionStorage.getItem('searchResults');
      if (cachedResults) {
        const results = JSON.parse(cachedResults);
        const foundProblem = results.find((result: any) => 
          result.problem?.id === problemId || result.id === problemId
        );
        
        if (foundProblem) {
          setProblem(foundProblem.problem || foundProblem);
        } else {
          setError('Problem not found. Please search again to view problem details.');
        }
      } else {
        setError('Problem not found. Please search again to view problem details.');
      }
    } catch (err) {
      setError('Failed to load problem details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'hard':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-300">Loading problem details...</span>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="max-w-7xl mx-auto">
        <ErrorMessage
          error={error || 'The requested problem could not be found.'}
          title="Problem Not Found"
          onRetry={() => {
            if (id) {
              fetchProblemDetails(id);
            } else {
              handleBack();
            }
          }}
          retryLabel={id ? "Try Again" : "Go Back"}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-0">
      {/* Header with Back Button */}
      <div className="flex items-center mb-4 sm:mb-6">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-150 touch-manipulation"
        >
          <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Back to Search</span>
        </button>
      </div>

      {/* Two-Pane Layout - Stack on mobile, side-by-side on desktop */}
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 min-h-[calc(100vh-10rem)] lg:h-[calc(100vh-12rem)]">
        {/* Left Pane - Problem Details */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700 overflow-y-auto lg:max-h-full">
          {/* Problem Header */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 leading-tight">
              {problem.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
              <div className="flex items-center text-gray-400 text-sm">
                <BuildingOfficeIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="truncate">{problem.organization}</span>
              </div>
              
              <div className="flex items-center text-gray-400 text-sm">
                <TagIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 flex-shrink-0" />
                <span>{problem.category}</span>
              </div>
              
              <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm border ${getDifficultyColor(problem.difficulty_level)}`}>
                {problem.difficulty_level}
              </div>
            </div>

            {problem.created_at && (
              <div className="flex items-center text-xs sm:text-sm text-gray-500">
                <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span>Added {new Date(problem.created_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Problem Description */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">Problem Description</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                {problem.description}
              </p>
            </div>
          </div>

          {/* Technology Stack */}
          {problem.technology_stack && problem.technology_stack.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">Suggested Technologies</h2>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {problem.technology_stack.map((tech, index) => (
                  <span
                    key={index}
                    className="px-2 sm:px-3 py-1 bg-gray-700 text-gray-300 text-xs sm:text-sm rounded-lg border border-gray-600"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Pane - Chat Interface */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 flex flex-col min-h-[500px] lg:min-h-0">
          {/* Chat Header */}
          <div className="p-4 sm:p-6 border-b border-gray-700">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <ChatBubbleLeftRightIcon className="w-5 h-5 sm:w-6 sm:h-6 text-electric-blue flex-shrink-0" />
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-white">Ask About This Problem</h2>
                <p className="text-xs sm:text-sm text-gray-400">
                  Get insights and clarifications about this problem statement
                </p>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 min-h-0">
            <ErrorBoundary>
              <ChatInterface 
                problemId={problem.id}
                problemContext={`Title: ${problem.title}\n\nOrganization: ${problem.organization}\n\nCategory: ${problem.category}\n\nDescription: ${problem.description}\n\nTechnology Stack: ${problem.technology_stack.join(', ')}\n\nDifficulty: ${problem.difficulty_level}`}
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemDetailPage;