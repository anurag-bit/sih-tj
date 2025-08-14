import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import GitHubModal from '../ui/GitHubModal';

const Header: React.FC = () => {
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);

  return (
    <>
      <header className="bg-dark-charcoal border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center space-x-3 text-white hover:text-electric-blue transition-colors duration-150"
          >
            <div className="w-8 h-8 bg-electric-blue rounded-lg flex items-center justify-center">
              <MagnifyingGlassIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">SIH Solver's Compass</h1>
          </Link>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsGitHubModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150"
            >
              <CodeBracketIcon className="w-5 h-5" />
              <span>GitHub Integration</span>
            </button>
          </div>
        </div>
      </header>

      <GitHubModal 
        isOpen={isGitHubModalOpen} 
        onClose={() => setIsGitHubModalOpen(false)} 
      />
    </>
  );
};

export default Header;