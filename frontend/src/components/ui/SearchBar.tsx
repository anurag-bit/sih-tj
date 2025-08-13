import React, { useState, useCallback } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Button from './Button';

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
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={loading}
          className="w-full pl-12 pr-24 py-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/20 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="absolute right-2 top-2">
          <Button 
            type="submit" 
            disabled={!query.trim() || loading}
            className="px-6"
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;