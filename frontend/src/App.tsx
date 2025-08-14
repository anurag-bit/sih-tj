import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import DashboardPage from './pages/DashboardPage';
import ProblemsPage from './pages/ProblemsPage';
import ProblemDetailPage from './pages/ProblemDetailPage';
import ErrorBoundary from './components/ui/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="problems" element={<ProblemsPage />} />
          <Route path="problem/:id" element={<ProblemDetailPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;