import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, CodeBracketIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from './Button';
import ProblemCard from './ProblemCard';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [recommendations, setRecommendations] = useState<SearchResult[]>([]);
  const [step, setStep] = useState<'input' | 'analysis' | 'recommendations'>('input');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    
    // Basic validation
    if (!trimmedUsername) {
      setError('Please enter a GitHub username');
      return;
    }
    
    // GitHub username validation (basic)
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9-])*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(trimmedUsername)) {
      setError('Please enter a valid GitHub username (alphanumeric characters and hyphens only)');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('analysis');

    try {
      // First, get the GitHub profile
      const profileResponse = await fetch(`/api/github/profile/${encodeURIComponent(username.trim())}`);
      
      if (!profileResponse.ok) {
        let errorMessage = 'Failed to fetch GitHub profile';
        try {
          const errorData = await profileResponse.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // If we can't parse the error response, use status-based messages
          if (profileResponse.status === 404) {
            errorMessage = `GitHub user '${username}' not found. Please check the username and try again.`;
          } else if (profileResponse.status === 429) {
            errorMessage = 'GitHub API rate limit exceeded. Please try again in a few minutes.';
          } else if (profileResponse.status >= 500) {
            errorMessage = 'GitHub service is temporarily unavailable. Please try again later.';
          }
        }
        throw new Error(errorMessage);
      }

      const profileData: GitHubProfile = await profileResponse.json();
      setProfile(profileData);

      // Then get recommendations
      const recommendationsResponse = await fetch('/api/github/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (!recommendationsResponse.ok) {
        let errorMessage = 'Failed to get recommendations';
        try {
          const errorData = await recommendationsResponse.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          if (recommendationsResponse.status >= 500) {
            errorMessage = 'Recommendation service is temporarily unavailable. Please try again later.';
          }
        }
        throw new Error(errorMessage);
      }

      const recommendationsData: SearchResult[] = await recommendationsResponse.json();
      setRecommendations(recommendationsData);
      setStep('recommendations');

    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUsername('');
    setProfile(null);
    setRecommendations([]);
    setError(null);
    setStep('input');
    onClose();
  };

  const renderInputStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-electric-blue rounded-full flex items-center justify-center mb-4">
          <CodeBracketIcon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          GitHub Integration
        </h3>
        <p className="text-gray-300 text-sm">
          Enter your GitHub username to get personalized problem recommendations based on your repositories
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="github-username" className="block text-sm font-medium text-gray-300 mb-2">
            GitHub Username
          </label>
          <input
            id="github-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your GitHub username"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-900/20 border border-red-700 rounded-lg">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div className="flex space-x-3">
          <Button
            type="submit"
            disabled={loading || !username.trim()}
            className="flex-1"
          >
            {loading ? 'Analyzing...' : 'Analyze Profile'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );

  const renderAnalysisStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-electric-blue rounded-full flex items-center justify-center mb-4 animate-pulse">
          <CodeBracketIcon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Analyzing Your GitHub Profile
        </h3>
        <p className="text-gray-300 text-sm">
          We're analyzing your repositories to understand your tech stack and interests...
        </p>
      </div>

      {profile && (
        <div className="bg-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">Profile Analysis</h4>
            <p className="text-gray-300 text-sm">
              Found {profile.repositories.length} repositories
            </p>
          </div>

          {profile.tech_stack.length > 0 && (
            <div>
              <h5 className="text-gray-300 text-sm font-medium mb-2">Detected Technologies:</h5>
              <div className="flex flex-wrap gap-2">
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue"></div>
      </div>
    </div>
  );

  const renderRecommendationsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-4">
          <CodeBracketIcon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Personalized Recommendations
        </h3>
        <p className="text-gray-300 text-sm">
          Based on your GitHub profile, here are the most relevant problem statements for you
        </p>
      </div>

      {profile && (
        <div className="bg-gray-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-medium">@{profile.username}</h4>
            <span className="text-gray-400 text-sm">
              {profile.repositories.length} repositories analyzed
            </span>
          </div>
          
          {profile.tech_stack.length > 0 && (
            <div>
              <h5 className="text-gray-300 text-sm font-medium mb-2">Your Tech Stack:</h5>
              <div className="flex flex-wrap gap-2">
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

      <div className="space-y-4 max-h-96 overflow-y-auto">
        <h4 className="text-white font-medium">
          Top Recommendations ({recommendations.length})
        </h4>
        
        {recommendations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">
              No recommendations found. This could be because:
            </p>
            <ul className="text-gray-500 text-sm mt-2 space-y-1">
              <li>• The profile has no public repositories</li>
              <li>• The repositories don't match any problem statements</li>
              <li>• The profile is private or doesn't exist</li>
            </ul>
          </div>
        ) : (
          <div className="space-y-3">
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

      <div className="flex space-x-3">
        <Button
          onClick={() => {
            setStep('input');
            setUsername('');
            setProfile(null);
            setRecommendations([]);
          }}
          variant="secondary"
          className="flex-1"
        >
          Try Another Profile
        </Button>
        <Button
          onClick={handleClose}
          className="flex-1"
        >
          Close
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-dark-charcoal rounded-lg shadow-xl border border-gray-700">
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <Dialog.Title className="text-lg font-semibold text-white">
              GitHub Integration
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors duration-150"
              disabled={loading}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6">
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