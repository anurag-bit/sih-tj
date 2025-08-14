import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  CodeBracketIcon, 
  Bars3Icon 
} from '@heroicons/react/24/outline';
import GitHubModal from '../ui/GitHubModal';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);

  return (
    <>
      <header className="bg-dark-charcoal border-b border-gray-700 px-4 sm:px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Mobile menu button */}
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors duration-150"
              aria-label="Toggle navigation menu"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            
            <Link 
              to="/" 
              className="flex items-center space-x-2 sm:space-x-3 text-white hover:text-electric-blue transition-colors duration-150"
            >
              <div className="w-8 h-8 bg-electric-blue rounded-lg flex items-center justify-center flex-shrink-0">
                <MagnifyingGlassIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold truncate">
                <span className="hidden sm:inline">SIH Solver's Compass</span>
                <span className="sm:hidden">SIH Compass</span>
              </h1>
            </Link>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button 
              onClick={() => setIsGitHubModalOpen(true)}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150 text-sm sm:text-base"
            >
              <CodeBracketIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="hidden sm:inline">GitHub Integration</span>
              <span className="sm:hidden">GitHub</span>
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