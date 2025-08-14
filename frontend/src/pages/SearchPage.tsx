import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/ui/SearchBar';
import ProblemCard from '../components/ui/ProblemCard';
import ErrorMessage from '../components/ui/ErrorMessage';
import SkeletonCard from '../components/ui/SkeletonCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useApiWithRetry } from '../hooks/useRetry';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface ProblemStatement {
  id: string;
  title: string;
  organization: string;
  category: string;
  description: string;
  technology_stack: string[];
  difficulty_level: string;
  created_at?: string;
  similarity_score?: number;
}

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [problems, setProblems] = useState<ProblemStatement[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  const { apiCall, isRetrying, lastError, reset } = useApiWithRetry({
    maxAttempts: 3,
    baseDelay: 1000,
    onRetry: (attempt, error) => {
      console.log(`Search retry attempt ${attempt}:`, error.message);
    }
  });

  const query = searchParams.get('q') || '';

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setHasSearched(true);
    reset(); // Reset retry state

    try {
      const data = await apiCall('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery, limit: 20 }),
      });

      // Extract problems from SearchResult objects
      const problems = data.map((result: any) => ({
        ...result.problem,
        similarity_score: result.similarity_score
      }));
      setProblems(problems);
      
      // Cache search results for problem detail page
      sessionStorage.setItem('searchResults', JSON.stringify(problems));
    } catch (err) {
      setProblems([]);
      // Error is handled by the retry hook
    }
  };

  const handleSearch = (newQuery: string) => {
    setSearchParams({ q: newQuery });
  };

  const handleRetry = () => {
    if (query) {
      performSearch(query);
    }
  };



  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-0">
      {/* Search Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Search Problems</h1>
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
          <SearchBar 
            onSearch={handleSearch}
            loading={isRetrying}
            className="max-w-4xl mx-auto"
          />
        </div>
      </div>

      {/* Search Results */}
      <div className="space-y-6">
        {/* Results Header */}
        {hasSearched && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex items-center space-x-2">
              <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-300 text-sm sm:text-base truncate">
                {isRetrying ? 'Searching...' : `Results for "${query}"`}
              </span>
            </div>
            {!isRetrying && problems.length > 0 && (
              <span className="text-xs sm:text-sm text-gray-400">
                {problems.length} problem{problems.length !== 1 ? 's' : ''} found
              </span>
            )}
          </div>
        )}

        {/* Loading State */}
        {isRetrying && (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-300 text-sm sm:text-base">Searching for relevant problems...</span>
          </div>
        )}

        {/* Loading Skeleton */}
        {isRetrying && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} variant="problem" />
            ))}
          </div>
        )}

        {/* Error State */}
        {lastError && !isRetrying && (
          <ErrorMessage
            error={lastError}
            title="Search Failed"
            onRetry={handleRetry}
            retryLabel="Try Search Again"
            showDetails={process.env.NODE_ENV === 'development'}
          />
        )}

        {/* No Results State */}
        {hasSearched && !isRetrying && !lastError && problems.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <MagnifyingGlassIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-500 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-medium text-gray-300 mb-2">No problems found</h3>
            <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base px-4 sm:px-0">
              Try adjusting your search terms or using different keywords
            </p>
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6 max-w-md mx-auto">
              <h4 className="text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base">Search Tips:</h4>
              <ul className="text-xs sm:text-sm text-gray-300 space-y-1 sm:space-y-2 text-left">
                <li>• Use descriptive terms like "machine learning healthcare"</li>
                <li>• Try technology names like "React", "Python", "IoT"</li>
                <li>• Include domain areas like "fintech", "education", "agriculture"</li>
              </ul>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {!isRetrying && problems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {problems.map((problem) => (
              <ProblemCard
                key={problem.id}
                problem={problem}
              />
            ))}
          </div>
        )}

        {/* Initial State */}
        {!hasSearched && (
          <div className="text-center py-8 sm:py-12">
            <MagnifyingGlassIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-500 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-medium text-gray-300 mb-2">Start Your Search</h3>
            <p className="text-gray-400 text-sm sm:text-base px-4 sm:px-0">
              Enter your skills and interests above to find relevant SIH problems
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;