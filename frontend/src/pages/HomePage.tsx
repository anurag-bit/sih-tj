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
    <div className="bg-light-bg"> {/* Removed flex-1 overflow-y-auto */}
      <div className="relative max-w-5xl mx-auto pt-20 sm:pt-24 lg:pt-32 px-4 sm:px-6">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900">
            Find Your Perfect <span className="text-sih-orange">SIH</span> Problem
          </h1>
          <p className="mt-4 sm:mt-6 text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto">
            AI-powered guidance to discover hackathon problems that match your skills and interests.
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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-gray-200/50">
              <div className={`flex items-center justify-center h-12 w-12 rounded-lg bg-sih-blue text-white mb-4`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;