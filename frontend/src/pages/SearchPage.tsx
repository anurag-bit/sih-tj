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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          Search Problems
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-600">
          Find problem statements that match your skills and interests.
        </p>
      </div>

      <div className="sticky top-4 bg-light-bg/80 backdrop-blur-lg z-10 py-4 mb-8 rounded-xl">
        <div className="max-w-2xl mx-auto">
          <SearchBar 
            onSearch={handleSearch}
            loading={isRetrying}
            placeholder="Search by keywords, technologies, or domains..."
          />
        </div>
      </div>

      <div>
        {isRetrying ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Results for "{query}"
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {problems.map((problem) => (
                  <ProblemCard key={problem.id} problem={problem} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <MagnifyingGlassIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Results Found</h3>
              <p className="text-gray-600">
                Try adjusting your search terms or using different keywords.
              </p>
            </div>
          )
        ) : (
          <div className="text-center py-16">
            <MagnifyingGlassIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Start Your Search</h3>
            <p className="text-gray-600">
              Enter your skills and interests above to find relevant SIH problems.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;