import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import ErrorBoundary from '../ui/ErrorBoundary';

const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="min-h-screen bg-light-bg font-inter flex flex-col"> {/* Added flex flex-col */}
      <Header onToggleSidebar={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden"> {/* Added flex-1 overflow-hidden */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={closeSidebar} 
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 transition-all duration-300 overflow-y-auto ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}> {/* Added overflow-y-auto */}
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
