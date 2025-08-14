import React, { useState } from 'react';
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
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
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
    
    // Basic validation
    if (!trimmedUsername) {
      return;
    }
    
    // GitHub username validation (basic)
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9-])*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(trimmedUsername)) {
      return;
    }

    reset(); // Reset retry state
    setStep('analysis');

    try {
      // First, get the GitHub profile
      const profileData: GitHubProfile = await apiCall(`/api/github/profile/${encodeURIComponent(trimmedUsername)}`);
      setProfile(profileData);

      // Then get recommendations
      const recommendationsData: SearchResult[] = await apiCall('/api/github/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: trimmedUsername }),
      });

      setRecommendations(recommendationsData);
      setStep('recommendations');

    } catch (err) {
      setStep('input');
      // Error is handled by the retry hook
    }
  };

  const handleClose = () => {
    setUsername('');
    setProfile(null);
    setRecommendations([]);
    reset(); // Reset retry state
    setStep('input');
    onClose();
  };

  const renderInputStep = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-electric-blue rounded-full flex items-center justify-center mb-3 sm:mb-4">
          <CodeBracketIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
          GitHub Integration
        </h3>
        <p className="text-gray-300 text-xs sm:text-sm px-2 sm:px-0">
          Enter your GitHub username to get personalized problem recommendations based on your repositories
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div>
          <label htmlFor="github-username" className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
            GitHub Username
          </label>
          <input
            id="github-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your GitHub username"
            className="w-full px-3 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent text-sm sm:text-base touch-manipulation"
            disabled={isRetrying}
          />
        </div>

        {lastError && step === 'input' && (
          <ErrorMessage
            error={lastError}
            title="GitHub Profile Error"
            className="text-xs sm:text-sm"
          />
        )}

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Button
            type="submit"
            disabled={isRetrying || !username.trim()}
            className="flex-1 touch-manipulation"
          >
            {isRetrying ? 'Analyzing...' : 'Analyze Profile'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isRetrying}
            className="touch-manipulation"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );

  const renderAnalysisStep = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-electric-blue rounded-full flex items-center justify-center mb-3 sm:mb-4 animate-pulse">
          <CodeBracketIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
          Analyzing Your GitHub Profile
        </h3>
        <p className="text-gray-300 text-xs sm:text-sm px-2 sm:px-0">
          We're analyzing your repositories to understand your tech stack and interests...
        </p>
      </div>

      {profile && (
        <div className="bg-gray-800 rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div>
            <h4 className="text-white font-medium mb-1 sm:mb-2 text-sm sm:text-base">Profile Analysis</h4>
            <p className="text-gray-300 text-xs sm:text-sm">
              Found {profile.repositories.length} repositories
            </p>
          </div>

          {profile.tech_stack.length > 0 && (
            <div>
              <h5 className="text-gray-300 text-xs sm:text-sm font-medium mb-2">Detected Technologies:</h5>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {profile.tech_stack.slice(0, 10).map((tech, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-electric-blue/20 text-electric-blue text-xs rounded-full"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  );

  const renderRecommendationsStep = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-full flex items-center justify-center mb-3 sm:mb-4">
          <CodeBracketIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
          Personalized Recommendations
        </h3>
        <p className="text-gray-300 text-xs sm:text-sm px-2 sm:px-0">
          Based on your GitHub profile, here are the most relevant problem statements for you
        </p>
      </div>

      {profile && (
        <div className="bg-gray-800 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-medium text-sm sm:text-base">@{profile.username}</h4>
            <span className="text-gray-400 text-xs sm:text-sm">
              {profile.repositories.length} repos
            </span>
          </div>
          
          {profile.tech_stack.length > 0 && (
            <div>
              <h5 className="text-gray-300 text-xs sm:text-sm font-medium mb-2">Your Tech Stack:</h5>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {profile.tech_stack.slice(0, 8).map((tech, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-electric-blue/20 text-electric-blue text-xs rounded-full"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
        <h4 className="text-white font-medium text-sm sm:text-base">
          Top Recommendations ({recommendations.length})
        </h4>
        
        {recommendations.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <p className="text-gray-400 text-sm">
              No recommendations found. This could be because:
            </p>
            <ul className="text-gray-500 text-xs sm:text-sm mt-2 space-y-1">
              <li>• The profile has no public repositories</li>
              <li>• The repositories don't match any problem statements</li>
              <li>• The profile is private or doesn't exist</li>
            </ul>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {recommendations.slice(0, 5).map((result, index) => (
              <div key={result.problem.id} className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <span className="bg-electric-blue text-white text-xs px-2 py-1 rounded-full">
                    {Math.round(result.similarity_score * 100)}% match
                  </span>
                </div>
                <ProblemCard problem={result.problem} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
        <Button
          onClick={() => {
            setStep('input');
            setUsername('');
            setProfile(null);
            setRecommendations([]);
          }}
          variant="secondary"
          className="flex-1 touch-manipulation"
        >
          Try Another Profile
        </Button>
        <Button
          onClick={handleClose}
          className="flex-1 touch-manipulation"
        >
          Close
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full max-h-[95vh] bg-dark-charcoal rounded-lg shadow-xl border border-gray-700 flex flex-col">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700 flex-shrink-0">
            <Dialog.Title className="text-base sm:text-lg font-semibold text-white">
              GitHub Integration
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors duration-150 touch-manipulation"
              disabled={isRetrying}
            >
              <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
          
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
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