import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  ChartBarIcon,
  DocumentTextIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    { to: '/', icon: HomeIcon, label: 'Home' },
    { to: '/search', icon: MagnifyingGlassIcon, label: 'Search' },
    { to: '/dashboard', icon: ChartBarIcon, label: 'Dashboard' },
    { to: '/problems', icon: DocumentTextIcon, label: 'Problems' },
  ];

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:min-h-screen
      `}>
        <div className="flex flex-col h-full">
          {/* Mobile close button */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-700">
            <span className="text-lg font-semibold text-white">Navigation</span>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors duration-150"
              aria-label="Close navigation menu"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  // Close mobile sidebar when navigating
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-150 touch-manipulation ${
                    isActive
                      ? 'bg-electric-blue text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white active:bg-gray-600'
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;