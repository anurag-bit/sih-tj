import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { 
  Home, 
  Search, 
  BarChart3, 
  FileText, 
  Github,
  Compass,
  Target
} from 'lucide-react';
import { Sidebar, SidebarBody, SidebarLink } from '../ui/sidebar';
import { motion } from 'framer-motion';
import ErrorBoundary from '../ui/ErrorBoundary';
import GitHubModal from '../ui/GitHubModal';

const AppLayout: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  
  const links = [
    {
      label: "Home",
      href: "/",
      icon: <Home className="h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Search Problems",
      href: "/search",
      icon: <Search className="h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <BarChart3 className="h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "All Problems",
      href: "/problems",
      icon: <FileText className="h-5 w-5 flex-shrink-0" />,
    },
  ];

  const handleGitHubDNAClick = () => {
    setIsGitHubModalOpen(true);
  };

  return (
    <>
      <div className="h-screen bg-gradient-to-br from-gray-50 via-white to-sih-blue/5 font-inter flex flex-col md:flex-row w-full overflow-hidden">
        <Sidebar open={open} setOpen={setOpen}>
          <SidebarBody className="justify-between gap-10">
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              <div className="font-normal flex space-x-3 items-center text-sm py-2 relative z-20 h-12">
                <div className="h-8 w-8 bg-gradient-to-br from-sih-orange to-sih-blue rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm">
                  <Compass className="h-4 w-4 text-white" />
                </div>
                <motion.div
                  animate={{
                    display: open ? "flex" : "none",
                    opacity: open ? 1 : 0,
                  }}
                  transition={{
                    opacity: { duration: 0.2, ease: "easeInOut" },
                    display: { duration: 0 }
                  }}
                  className="flex flex-col justify-center min-w-0 flex-1"
                >
                  <span className="font-bold text-gray-800 whitespace-nowrap leading-tight text-sm">
                    Solver's Compass
                  </span>
                  <span className="text-xs text-sih-blue font-medium whitespace-nowrap leading-tight">
                    Smart India Hackathon
                  </span>
                </motion.div>
              </div>
              <div className="mt-8 flex flex-col gap-2">
                {links.map((link, idx) => (
                  <SidebarLink key={idx} link={link} />
                ))}
                {/* GitHub DNA Button */}
                <button
                  onClick={handleGitHubDNAClick}
                  className="flex items-center justify-start gap-3 group/sidebar py-3 px-3 rounded-xl hover:bg-gradient-to-r hover:from-sih-blue/10 hover:to-sih-orange/10 transition-all duration-200 hover:shadow-sm text-left w-full"
                >
                  <div className="text-gray-600 group-hover/sidebar:text-sih-blue transition-colors">
                    <Github className="h-5 w-5 flex-shrink-0" />
                  </div>
                  <motion.span
                    animate={{
                      display: open ? "inline-block" : "none",
                      opacity: open ? 1 : 0,
                    }}
                    className="text-gray-700 font-medium text-sm group-hover/sidebar:translate-x-1 group-hover/sidebar:text-gray-900 transition duration-200 whitespace-pre inline-block !p-0 !m-0"
                  >
                    GitHub DNA
                  </motion.span>
                </button>
              </div>
            </div>
            <div className="border-t border-gray-200/50 pt-4">
              <SidebarLink
                link={{
                  label: "SIH Solver",
                  href: "#",
                  icon: (
                    <div className="h-7 w-7 bg-gradient-to-br from-sih-orange to-sih-blue rounded-full flex-shrink-0 flex items-center justify-center">
                      <Target className="h-4 w-4 text-white" />
                    </div>
                  ),
                }}
              />
            </div>
          </SidebarBody>
        </Sidebar>
        
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8 bg-white/80 backdrop-blur-sm min-h-full">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
      
      {/* GitHub Modal */}
      <GitHubModal 
        isOpen={isGitHubModalOpen} 
        onClose={() => setIsGitHubModalOpen(false)} 
      />
    </>
  );
};

// SIH-themed Logo Components
export default AppLayout;
