import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  BuildingOfficeIcon, 
  TagIcon,
  ChatBubbleLeftRightIcon,
  ScaleIcon
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

interface DetailItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}

const DetailItem: React.FC<DetailItemProps> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center text-sm text-gray-600">
    <Icon className="w-5 h-5 mr-3 text-gray-400" />
    <span className="font-medium text-gray-700 mr-2">{label}:</span>
    <span>{value}</span>
  </div>
);

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
      const cachedResults = sessionStorage.getItem('searchResults');
      if (cachedResults) {
        const results = JSON.parse(cachedResults);
        const foundProblem = results.find((p: any) => p.id === problemId);
        if (foundProblem) {
          setProblem(foundProblem);
        } else {
          setError('Problem details not found in cache. Please go back and select the problem again.');
        }
      } else {
        setError('Search cache is empty. Please go back and perform a search first.');
      }
    } catch (err) {
      setError('Failed to load problem details.');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-700';
      case 'medium': return 'text-yellow-700';
      case 'hard': return 'text-red-700';
      default: return 'text-gray-700';
    }
  };

  const handleBack = () => navigate(-1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="max-w-2xl mx-auto mt-20">
        <ErrorMessage
          error={error || 'The requested problem could not be found.'}
          title="Problem Not Found"
          onRetry={handleBack}
          retryLabel="Go Back"
        />
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Back to results</span>
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-12">
        {/* Left Pane */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
              {problem.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <DetailItem icon={BuildingOfficeIcon} label="Organization" value={problem.organization} />
              <DetailItem icon={TagIcon} label="Category" value={problem.category} />
              <DetailItem icon={ScaleIcon} label="Difficulty" value={<span className={getDifficultyColor(problem.difficulty_level)}>{problem.difficulty_level}</span>} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200/80">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Problem Description</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {problem.description}
            </p>
          </div>

          {problem.technology_stack?.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200/80">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Suggested Technologies</h2>
              <div className="flex flex-wrap gap-2">
                {problem.technology_stack.map((tech) => (
                  <span key={tech} className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Pane */}
        <div className="lg:col-span-5 mt-12 lg:mt-0">
          <div className="sticky top-24">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/80 h-[calc(100vh-12rem)] flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-sih-blue" />
                  <span>Ask the AI Assistant</span>
                </h2>
              </div>
              <div className="flex-1 min-h-0">
                <ErrorBoundary>
                  <ChatInterface
                    problemId={problem.id}
                    problemContext={`Title: ${problem.title}\n\nDescription: ${problem.description}\n\nTech Stack: ${problem.technology_stack?.join(', ')}`}
                  />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemDetailPage;