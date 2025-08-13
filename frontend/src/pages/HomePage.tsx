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
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          Find Your Perfect SIH Problem
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          AI-powered guidance to discover hackathon problems that match your skills and interests
        </p>
      </div>
      
      <div className="bg-gray-800 rounded-xl p-8 mb-8">
        <div className="max-w-2xl mx-auto">
          <SearchBar 
            onSearch={handleSearch}
            loading={isSearching}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-electric-blue rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold">🔍</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Semantic Search</h3>
          <p className="text-gray-300">Find problems using natural language descriptions</p>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-electric-blue rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold">🧬</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">GitHub DNA</h3>
          <p className="text-gray-300">Get recommendations based on your repositories</p>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-electric-blue rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold">💬</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">AI Chat</h3>
          <p className="text-gray-300">Discuss problems with an AI assistant</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;