import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import CategoryChart from '../components/ui/CategoryChart';
import OrganizationChart from '../components/ui/OrganizationChart';
import WordCloud from '../components/ui/WordCloud';
import ErrorMessage from '../components/ui/ErrorMessage';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { ChartBarIcon, BuildingOfficeIcon, TagIcon, CubeIcon } from '@heroicons/react/24/outline';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
    <div className="flex items-center">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${color}-500/10 text-${color}-400`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="ml-4">
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const { stats, loading, error, refetch } = useDashboard();

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ErrorMessage
          error={error}
          title="Dashboard Loading Failed"
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          SIH Landscape Dashboard
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-400">
          Interactive insights into the Smart India Hackathon ecosystem.
        </p>
      </div>

      {loading && !stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[...Array(3)].map(i => <div key={i} className="h-32 bg-gray-800/50 rounded-xl animate-pulse" />)}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <StatCard title="Total Problems" value={stats.total_problems} icon={CubeIcon} color="blue" />
          <StatCard title="Categories" value={Object.keys(stats.categories).length} icon={ChartBarIcon} color="green" />
          <StatCard title="Organizations" value={Object.keys(stats.top_organizations).length} icon={BuildingOfficeIcon} color="purple" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
          <h2 className="text-xl font-semibold text-white mb-4">Problems by Category</h2>
          <CategoryChart data={stats?.categories || {}} loading={loading} />
        </div>
        <div className="lg:col-span-2 bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
          <h2 className="text-xl font-semibold text-white mb-4">Top Organizations</h2>
          <OrganizationChart data={stats?.top_organizations || {}} loading={loading} />
        </div>
      </div>

      <div className="mt-8 bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
        <h2 className="text-xl font-semibold text-white mb-4">Popular Keywords</h2>
        <WordCloud data={stats?.top_keywords || []} loading={loading} />
      </div>
      
      <div className="mt-12 text-center">
        <button
          onClick={refetch}
          disabled={loading}
          className="px-6 py-3 bg-electric-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150 disabled:opacity-50"
        >
          {loading ? <LoadingSpinner /> : 'Refresh Dashboard'}
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
