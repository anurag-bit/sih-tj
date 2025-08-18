import { useState, useCallback } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  loading?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Describe your skills and interests (e.g., 'machine learning for healthcare')",
  className = '',
  loading = false
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  }, [query, onSearch]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  }, [handleSubmit]);

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={loading}
          className="w-full pl-10 sm:pl-12 pr-20 sm:pr-24 py-3 sm:py-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/20 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        />
        <div className="absolute right-1 sm:right-2 top-1 sm:top-2">
          <Button 
            type="submit" 
            disabled={!query.trim() || loading}
            className="px-3 sm:px-6 py-2 sm:py-2 flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
          >
            {loading && <LoadingSpinner size="sm" color="gray" />}
            <span className="hidden sm:inline">{loading ? 'Searching...' : 'Search'}</span>
            <span className="sm:hidden">{loading ? '...' : 'Go'}</span>
          </Button>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;