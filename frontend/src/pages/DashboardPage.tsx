import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import CategoryChart from '../components/ui/CategoryChart';
import OrganizationChart from '../components/ui/OrganizationChart';
import WordCloud from '../components/ui/WordCloud';
import ErrorMessage from '../components/ui/ErrorMessage';
import SkeletonCard from '../components/ui/SkeletonCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { ChartBarIcon, BuildingOfficeIcon, TagIcon } from '@heroicons/react/24/outline';

const DashboardPage: React.FC = () => {
  const { stats, loading, error, refetch } = useDashboard();

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">SIH Landscape Dashboard</h1>
        <ErrorMessage
          error={error}
          title="Dashboard Loading Failed"
          onRetry={refetch}
          retryLabel="Reload Dashboard"
          showDetails={process.env.NODE_ENV === 'development'}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-0">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">SIH Landscape Dashboard</h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Explore the Smart India Hackathon problem landscape with interactive visualizations
        </p>
        {stats && (
          <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-300">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="hidden sm:inline">Total Problems:</span>
              <span className="sm:hidden">Problems:</span>
              {stats.total_problems}
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Categories: {Object.keys(stats.categories).length}
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="hidden sm:inline">Organizations:</span>
              <span className="sm:hidden">Orgs:</span>
              {Object.keys(stats.top_organizations).length}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Categories Chart */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <ChartBarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
            <h2 className="text-lg sm:text-xl font-semibold text-white">Problems by Category</h2>
          </div>
          <CategoryChart 
            data={stats?.categories || {}} 
            loading={loading}
          />
        </div>

        {/* Organizations Chart */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <BuildingOfficeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
            <h2 className="text-lg sm:text-xl font-semibold text-white">Top Organizations</h2>
          </div>
          <OrganizationChart 
            data={stats?.top_organizations || {}} 
            loading={loading}
          />
        </div>
      </div>

      {/* Word Cloud */}
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <TagIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
            <h2 className="text-lg sm:text-xl font-semibold text-white">Popular Keywords & Technologies</h2>
          </div>
          <span className="text-sm text-gray-400">
            ({stats?.top_keywords?.length || 0} keywords)
          </span>
        </div>
        <WordCloud 
          data={stats?.top_keywords || []} 
          loading={loading}
        />
      </div>

      {/* Refresh Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={refetch}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-150 flex items-center gap-2"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" color="white" />
              Loading...
            </>
          ) : (
            'Refresh Data'
          )}
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;