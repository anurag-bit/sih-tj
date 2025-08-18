import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  ChartBarIcon,
  DocumentTextIcon,
  XMarkIcon,
  ChevronDoubleLeftIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const navItems = [
    { to: '/', icon: HomeIcon, label: 'Home' },
    { to: '/search', icon: MagnifyingGlassIcon, label: 'Search' },
    { to: '/dashboard', icon: ChartBarIcon, label: 'Dashboard' },
    { to: '/problems', icon: DocumentTextIcon, label: 'Problems' },
  ];

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 bg-white transform transition-all duration-300 ease-in-out flex flex-col {/* Removed h-full */}
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'w-20' : 'w-64'}
        lg:translate-x-0 border-r border-gray-200
      `}>
        <div className={`flex items-center justify-between p-4 border-b border-gray-200 ${isCollapsed ? 'lg:justify-center' : 'lg:justify-between'}`}>
          {!isCollapsed && <span className="text-lg font-semibold text-gray-800">Navigation</span>}
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-sih-blue rounded-lg lg:hidden"
            aria-label="Close navigation menu"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  onClose();
                }
              }}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-150 font-medium ${
                  isActive
                    ? 'bg-sih-blue/10 text-sih-blue'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                } ${isCollapsed ? 'justify-center' : ''}`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            <ChevronDoubleLeftIcon className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
