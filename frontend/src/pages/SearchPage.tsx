import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/ui/SearchBar';
import ProblemCard from '../components/ui/ProblemCard';
import SkeletonCard from '../components/ui/SkeletonCard';
import ErrorMessage from '../components/ui/ErrorMessage';
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
  });

  const query = searchParams.get('q') || '';

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setHasSearched(true);
    reset();

    try {
      const data = await apiCall('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, limit: 20 }),
      });

      const problems = data.map((result: any) => ({
        ...result.problem,
        similarity_score: result.similarity_score
      }));
      setProblems(problems);
      
      sessionStorage.setItem('searchResults', JSON.stringify(problems));
    } catch (err) {
      setProblems([]);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-sih-orange/10 to-sih-blue/10 border border-sih-orange/20 mb-4">
          <MagnifyingGlassIcon className="h-4 w-4 text-sih-blue mr-2" />
          <span className="text-sm font-medium text-sih-blue">Problem Search</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-sih-blue to-sih-orange bg-clip-text text-transparent sm:text-4xl">
          Discover Your Perfect Challenge
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-600">
          Find SIH problem statements that align with your skills, interests, and passion.
        </p>
      </div>

      <div className="relative mb-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden backdrop-blur-lg">
          <div className="p-6">
            <SearchBar 
              onSearch={handleSearch}
              loading={isRetrying}
              placeholder="Search by keywords, technologies, or domains..."
            />
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div>
        {isRetrying ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : lastError ? (
          <ErrorMessage
            error={lastError}
            title="Search Failed"
            onRetry={handleRetry}
          />
        ) : hasSearched ? (
          problems.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-sih-blue bg-clip-text text-transparent">
                  Results for "{query}"
                </h2>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="bg-sih-blue/10 text-sih-blue px-3 py-1 rounded-full">
                    {problems.length} problems found
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {problems.map((problem) => (
                  <ProblemCard key={problem.id} problem={problem} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <div className="bg-gradient-to-br from-sih-orange/10 to-sih-blue/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <MagnifyingGlassIcon className="w-8 h-8 text-sih-blue" />
              </div>
              <h3 className="text-2xl font-semibold bg-gradient-to-r from-gray-900 to-sih-blue bg-clip-text text-transparent mb-3">No Results Found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Try adjusting your search terms, using different keywords, or exploring broader topics.
              </p>
            </div>
          )
        ) : (
          <div className="text-center py-20">
            <div className="bg-gradient-to-br from-sih-orange/10 to-sih-blue/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <MagnifyingGlassIcon className="w-8 h-8 text-sih-orange" />
            </div>
            <h3 className="text-2xl font-semibold bg-gradient-to-r from-sih-orange to-sih-blue bg-clip-text text-transparent mb-3">Start Your Discovery</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Enter your skills and interests above to find relevant SIH problems that match your expertise.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;