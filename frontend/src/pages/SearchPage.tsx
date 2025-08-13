import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/ui/SearchBar';
import ProblemCard from '../components/ui/ProblemCard';
import { MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const query = searchParams.get('q') || '';

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery, limit: 20 }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      // Extract problems from SearchResult objects
      const problems = data.map((result: any) => ({
        ...result.problem,
        similarity_score: result.similarity_score
      }));
      setProblems(problems);
      
      // Cache search results for problem detail page
      sessionStorage.setItem('searchResults', JSON.stringify(problems));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
      setProblems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (newQuery: string) => {
    setSearchParams({ q: newQuery });
  };



  return (
    <div className="max-w-6xl mx-auto">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-6">Search Problems</h1>
        <div className="bg-gray-800 rounded-xl p-6">
          <SearchBar 
            onSearch={handleSearch}
            loading={loading}
            className="max-w-4xl mx-auto"
          />
        </div>
      </div>

      {/* Search Results */}
      <div className="space-y-6">
        {/* Results Header */}
        {hasSearched && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              <span className="text-gray-300">
                {loading ? 'Searching...' : `Results for "${query}"`}
              </span>
            </div>
            {!loading && problems.length > 0 && (
              <span className="text-sm text-gray-400">
                {problems.length} problem{problems.length !== 1 ? 's' : ''} found
              </span>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue"></div>
            <span className="ml-3 text-gray-300">Searching for relevant problems...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
              <div>
                <h3 className="text-red-400 font-medium">Search Error</h3>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* No Results State */}
        {hasSearched && !loading && !error && problems.length === 0 && (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-300 mb-2">No problems found</h3>
            <p className="text-gray-400 mb-6">
              Try adjusting your search terms or using different keywords
            </p>
            <div className="bg-gray-800 rounded-xl p-6 max-w-md mx-auto">
              <h4 className="text-white font-medium mb-3">Search Tips:</h4>
              <ul className="text-sm text-gray-300 space-y-2 text-left">
                <li>• Use descriptive terms like "machine learning healthcare"</li>
                <li>• Try technology names like "React", "Python", "IoT"</li>
                <li>• Include domain areas like "fintech", "education", "agriculture"</li>
              </ul>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {!loading && problems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-300 mb-2">Start Your Search</h3>
            <p className="text-gray-400">
              Enter your skills and interests above to find relevant SIH problems
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;