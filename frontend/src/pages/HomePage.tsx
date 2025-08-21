import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/ui/SearchBar';
import { MagnifyingGlassIcon, CodeBracketIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setIsSearching(false);
  };

  const features = [
    {
      icon: MagnifyingGlassIcon,
      title: 'Semantic Search',
      description: 'Go beyond keywords. Find problem statements that match the meaning and context of your ideas.',
    },
    {
      icon: CodeBracketIcon,
      title: 'GitHub DNA Analysis',
      description: 'Get hyper-personalized recommendations by letting us analyze your public GitHub repositories.',
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Interactive AI Chat',
      description: 'Dive deep into any problem statement. Ask questions and get clarifications from an AI assistant.',
    },
  ];

  return (
    <div className="bg-transparent min-h-screen">
      <div className="relative max-w-6xl mx-auto pt-8 sm:pt-16 lg:pt-20 px-4 sm:px-6">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-sih-orange/10 to-sih-blue/10 border border-sih-orange/20 mb-6">
            <span className="text-sm font-medium text-sih-blue">Welcome to SIH Solver's Compass</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-sih-blue to-sih-orange bg-clip-text text-transparent">
            Find Your Perfect SIH Problem
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            AI-powered guidance to discover Smart India Hackathon problems that match your skills, interests, and passion.
          </p>
        </div>

        <div className="mt-10 sm:mt-12 max-w-2xl mx-auto">
          <SearchBar 
            onSearch={handleSearch}
            loading={isSearching}
            placeholder="Describe your skills and interests..."
          />
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/90 transition-all duration-300 border border-gray-200/30 hover:border-sih-blue/20 hover:shadow-lg group">
              <div className={`flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-sih-orange to-sih-blue text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-sih-blue transition-colors">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-sih-blue/5 to-sih-orange/5 border border-sih-blue/10">
            <span className="text-sm text-gray-600">
              🚀 Empowering students to solve India's challenges through innovative technology
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;