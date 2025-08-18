import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CodeBracketIcon, 
  Bars3Icon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import GitHubModal from '../ui/GitHubModal';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);

  return (
    <>
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 px-4 sm:px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 text-gray-500 hover:text-sih-blue rounded-lg"
              aria-label="Toggle navigation menu"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            
            <Link 
              to="/" 
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-sih-blue rounded-lg flex items-center justify-center flex-shrink-0">
                <MagnifyingGlassIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">
                Solver's Compass
              </h1>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsGitHubModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-sih-orange text-white rounded-lg hover:bg-opacity-90 transition-all duration-150 text-sm font-medium"
            >
              <CodeBracketIcon className="w-5 h-5" />
              <span>GitHub DNA</span>
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
