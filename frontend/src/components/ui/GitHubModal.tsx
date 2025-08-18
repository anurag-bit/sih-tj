import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import Button from './Button';
import ProblemCard from './ProblemCard';
import ErrorMessage from './ErrorMessage';
import LoadingSpinner from './LoadingSpinner';
import { useApiWithRetry } from '../../hooks/useRetry';

interface Repository {
  name: string;
  description: string | null;
  topics: string[];
  readme_content: string | null;
  language: string | null;
}

interface GitHubProfile {
  username: string;
  repositories: Repository[];
  tech_stack: string[];
}

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

interface SearchResult {
  problem: ProblemStatement;
  similarity_score: number;
}

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GitHubModal: React.FC<GitHubModalProps> = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState('');
  const [_profile, setProfile] = useState<GitHubProfile | null>(null);
  const [recommendations, setRecommendations] = useState<SearchResult[]>([]);
  const [step, setStep] = useState<'input' | 'analysis' | 'recommendations'>('input');
  
  const { apiCall, isRetrying, lastError, reset } = useApiWithRetry({
    maxAttempts: 3,
    baseDelay: 1000,
    onRetry: (attempt, error) => {
      console.log(`GitHub API retry attempt ${attempt}:`, error.message);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    
    if (!trimmedUsername) return;
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9-])*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(trimmedUsername)) return;

    reset();
    setStep('analysis');

    try {
      const profileData: GitHubProfile = await apiCall(`/api/github/profile/${encodeURIComponent(trimmedUsername)}`);
      setProfile(profileData);

      const recommendationsData: SearchResult[] = await apiCall('/api/github/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUsername }),
      });

      setRecommendations(recommendationsData);
      setStep('recommendations');

    } catch (err) {
      setStep('input');
    }
  };

  const handleClose = () => {
    setUsername('');
    setProfile(null);
    setRecommendations([]);
    reset();
    setStep('input');
    onClose();
  };

  const renderInputStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-sih-blue/10 text-sih-blue rounded-full flex items-center justify-center mb-4">
          <CodeBracketIcon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          GitHub Integration
        </h3>
        <p className="text-gray-600 text-sm">
          Enter your GitHub username to get personalized problem recommendations.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="github-username" className="block text-sm font-medium text-gray-700 mb-2">
            GitHub Username
          </label>
          <input
            id="github-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g., anuragisinsane"
            className="input-field"
            disabled={isRetrying}
          />
        </div>

        {lastError && step === 'input' && (
          <ErrorMessage
            error={lastError}
            title="GitHub Profile Error"
          />
        )}

        <div className="flex flex-col sm:flex-row-reverse gap-3">
          <Button
            type="submit"
            disabled={isRetrying || !username.trim()}
            className="w-full sm:w-auto"
          >
            {isRetrying ? 'Analyzing...' : 'Analyze Profile'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isRetrying}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );

  const renderAnalysisStep = () => (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-12 h-12 bg-sih-blue/10 text-sih-blue rounded-full flex items-center justify-center mb-4 animate-pulse">
        <CodeBracketIcon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Analyzing Your GitHub Profile
      </h3>
      <p className="text-gray-600 text-sm">
        We're analyzing your repositories to understand your tech stack...
      </p>
      <div className="flex justify-center pt-4">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  );

  const renderRecommendationsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-sih-green/10 text-sih-green rounded-full flex items-center justify-center mb-4">
          <CodeBracketIcon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Personalized Recommendations
        </h3>
        <p className="text-gray-600 text-sm">
          Based on your GitHub profile, here are some relevant problem statements.
        </p>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto p-1">
        {recommendations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No recommendations found.</p>
          </div>
        ) : (
          recommendations.slice(0, 5).map((result) => (
            <ProblemCard key={result.problem.id} problem={result.problem} />
          ))
        )}
      </div>

      <div className="flex flex-col sm:flex-row-reverse gap-3">
        <Button
          onClick={handleClose}
          className="w-full sm:w-auto"
        >
          Close
        </Button>
        <Button
          onClick={() => setStep('input')}
          variant="secondary"
          className="w-full sm:w-auto"
        >
          Try Another Profile
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full max-h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              GitHub Integration
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-800"
              disabled={isRetrying}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto">
            {step === 'input' && renderInputStep()}
            {step === 'analysis' && renderAnalysisStep()}
            {step === 'recommendations' && renderRecommendationsStep()}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default GitHubModal;
