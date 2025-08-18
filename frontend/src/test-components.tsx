import { useState } from 'react';
import ErrorBoundary from './components/ui/ErrorBoundary';
import ErrorMessage from './components/ui/ErrorMessage';
import LoadingSpinner from './components/ui/LoadingSpinner';
import SkeletonCard from './components/ui/SkeletonCard';
import { useRetry } from './hooks/useRetry';

// Component that throws an error for testing ErrorBoundary
interface ErrorThrowingComponentProps {
  shouldThrow: boolean;
}

const ErrorThrowingComponent: React.FC<ErrorThrowingComponentProps> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error for ErrorBoundary');
  }
  return <div className="text-green-400">Component working correctly!</div>;
};

// Component to test retry mechanism
const RetryTestComponent: React.FC = () => {
  const [shouldFail, setShouldFail] = useState(true);
  const { execute, isRetrying, attemptCount, lastError } = useRetry({
    maxAttempts: 3,
    baseDelay: 500,
    onRetry: (attempt, error) => {
      console.log(`Retry attempt ${attempt}:`, error.message);
    }
  });

  const testFunction = async () => {
    if (shouldFail && attemptCount < 2) {
      throw new Error(`Simulated failure (attempt ${attemptCount + 1})`);
    }
    return 'Success!';
  };

  const handleTest = async () => {
    try {
      const result = await execute(testFunction);
      console.log('Result:', result);
    } catch (error) {
      console.error('Final error:', error);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-white font-semibold">Retry Mechanism Test</h3>
      <div className="space-y-2">
        <button
          onClick={handleTest}
          disabled={isRetrying}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-600"
        >
          {isRetrying ? `Testing... (Attempt ${attemptCount})` : 'Test Retry'}
        </button>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={shouldFail}
            onChange={(e) => setShouldFail(e.target.checked)}
          />
          <span className="text-gray-300">Simulate failures</span>
        </label>
      </div>
      {lastError && (
        <div className="text-red-400 text-sm">
          Last error: {lastError.message}
        </div>
      )}
    </div>
  );
};

// Main test component
const TestComponents: React.FC = () => {
  const [showError, setShowError] = useState(false);

  return (
    <div className="min-h-screen bg-dark-charcoal p-8 space-y-8">
      <h1 className="text-3xl font-bold text-white mb-8">Error Handling & Loading States Test</h1>
      
      {/* Error Boundary Test */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Error Boundary Test</h2>
        <div className="space-y-4">
          <button
            onClick={() => setShowError(!showError)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            {showError ? 'Hide Error' : 'Trigger Error'}
          </button>
          <ErrorBoundary>
            <ErrorThrowingComponent shouldThrow={showError} />
          </ErrorBoundary>
        </div>
      </div>

      {/* Error Message Test */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Error Message Components</h2>
        <div className="space-y-4">
          <ErrorMessage
            error="This is a test network error"
            type="network"
            onRetry={() => console.log('Retry clicked')}
          />
          <ErrorMessage
            error="This is a test server error"
            type="server"
            onRetry={() => console.log('Retry clicked')}
          />
          <ErrorMessage
            error="This is a test warning"
            type="warning"
          />
        </div>
      </div>

      {/* Loading Spinner Test */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Loading Spinners</h2>
        <div className="flex items-center space-x-8">
          <div className="text-center">
            <LoadingSpinner size="sm" />
            <p className="text-gray-300 text-sm mt-2">Small</p>
          </div>
          <div className="text-center">
            <LoadingSpinner size="md" />
            <p className="text-gray-300 text-sm mt-2">Medium</p>
          </div>
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-300 text-sm mt-2">Large</p>
          </div>
          <div className="text-center">
            <LoadingSpinner size="xl" />
            <p className="text-gray-300 text-sm mt-2">Extra Large</p>
          </div>
        </div>
      </div>

      {/* Skeleton Cards Test */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Skeleton Loading States</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard variant="problem" />
          <SkeletonCard variant="dashboard" />
          <SkeletonCard variant="chat" />
        </div>
      </div>

      {/* Retry Hook Test */}
      <div className="bg-gray-800 rounded-xl p-6">
        <RetryTestComponent />
      </div>
    </div>
  );
};

export default TestComponents;