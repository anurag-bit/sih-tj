import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  ChartBarIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline';

const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', icon: HomeIcon, label: 'Home' },
    { to: '/search', icon: MagnifyingGlassIcon, label: 'Search' },
    { to: '/dashboard', icon: ChartBarIcon, label: 'Dashboard' },
    { to: '/problems', icon: DocumentTextIcon, label: 'Problems' },
  ];

  return (
    <aside className="w-64 bg-gray-800 min-h-screen p-4">
      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-150 ${
                isActive
                  ? 'bg-electric-blue text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;