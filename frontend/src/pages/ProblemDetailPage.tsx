import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  BuildingOfficeIcon, 
  TagIcon, 
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import ChatInterface from '../components/ui/ChatInterface';

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue"></div>
          <span className="ml-3 text-gray-300">Loading problem details...</span>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
            <div>
              <h3 className="text-red-400 font-medium">Problem Not Found</h3>
              <p className="text-red-300 text-sm mt-1">
                {error || 'The requested problem could not be found.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-electric-blue/80 transition-colors duration-150"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center mb-6">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-150"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Back to Search</span>
        </button>
      </div>

      {/* Two-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-12rem)]">
        {/* Left Pane - Problem Details */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 overflow-y-auto">
          {/* Problem Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-4 leading-tight">
              {problem.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center text-gray-400">
                <BuildingOfficeIcon className="w-5 h-5 mr-2" />
                <span>{problem.organization}</span>
              </div>
              
              <div className="flex items-center text-gray-400">
                <TagIcon className="w-5 h-5 mr-2" />
                <span>{problem.category}</span>
              </div>
              
              <div className={`px-3 py-1 rounded-full text-sm border ${getDifficultyColor(problem.difficulty_level)}`}>
                {problem.difficulty_level}
              </div>
            </div>

            {problem.created_at && (
              <div className="flex items-center text-sm text-gray-500">
                <ClockIcon className="w-4 h-4 mr-1" />
                <span>Added {new Date(problem.created_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Problem Description */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Problem Description</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {problem.description}
              </p>
            </div>
          </div>

          {/* Technology Stack */}
          {problem.technology_stack && problem.technology_stack.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-3">Suggested Technologies</h2>
              <div className="flex flex-wrap gap-2">
                {problem.technology_stack.map((tech, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-lg border border-gray-600"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Pane - Chat Interface */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 flex flex-col">
          {/* Chat Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-electric-blue" />
              <div>
                <h2 className="text-lg font-semibold text-white">Ask About This Problem</h2>
                <p className="text-sm text-gray-400">
                  Get insights and clarifications about this problem statement
                </p>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 min-h-0">
            <ChatInterface 
              problemId={problem.id}
              problemContext={`Title: ${problem.title}\n\nOrganization: ${problem.organization}\n\nCategory: ${problem.category}\n\nDescription: ${problem.description}\n\nTechnology Stack: ${problem.technology_stack.join(', ')}\n\nDifficulty: ${problem.difficulty_level}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemDetailPage;