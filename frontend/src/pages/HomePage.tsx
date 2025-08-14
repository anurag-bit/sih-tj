import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/ui/SearchBar';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    // Navigate to search page with query parameter
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setIsSearching(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
          Find Your Perfect SIH Problem
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 px-4 sm:px-0">
          AI-powered guidance to discover hackathon problems that match your skills and interests
        </p>
      </div>
      
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
        <div className="max-w-2xl mx-auto">
          <SearchBar 
            onSearch={handleSearch}
            loading={isSearching}
            placeholder="Describe your skills and interests (e.g., 'machine learning for healthcare')"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-electric-blue rounded-lg mx-auto mb-3 sm:mb-4 flex items-center justify-center">
            <span className="text-white font-bold text-lg sm:text-xl">🔍</span>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Semantic Search</h3>
          <p className="text-sm sm:text-base text-gray-300">Find problems using natural language descriptions</p>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-electric-blue rounded-lg mx-auto mb-3 sm:mb-4 flex items-center justify-center">
            <span className="text-white font-bold text-lg sm:text-xl">🧬</span>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2">GitHub DNA</h3>
          <p className="text-sm sm:text-base text-gray-300">Get recommendations based on your repositories</p>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 text-center sm:col-span-2 lg:col-span-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-electric-blue rounded-lg mx-auto mb-3 sm:mb-4 flex items-center justify-center">
            <span className="text-white font-bold text-lg sm:text-xl">💬</span>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2">AI Chat</h3>
          <p className="text-sm sm:text-base text-gray-300">Discuss problems with an AI assistant</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;