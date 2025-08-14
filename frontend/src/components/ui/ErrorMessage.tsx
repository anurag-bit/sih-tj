import React from 'react';
import { 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  WifiIcon,
  ServerIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import Button from './Button';

interface ErrorMessageProps {
  error: string | Error;
  title?: string;
  type?: 'error' | 'warning' | 'network' | 'server';
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  showDetails?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  title,
  type = 'error',
  onRetry,
  retryLabel = 'Try Again',
  className = '',
  showDetails = false
}) => {
  const errorMessage = error instanceof Error ? error.message : error;
  
  // Determine error type based on message if not explicitly provided
  const getErrorType = (message: string) => {
    if (message.toLowerCase().includes('network') || 
        message.toLowerCase().includes('fetch') ||
        message.toLowerCase().includes('connection')) {
      return 'network';
    }
    if (message.toLowerCase().includes('server') || 
        message.toLowerCase().includes('500') ||
        message.toLowerCase().includes('503')) {
      return 'server';
    }
    return type;
  };

  const actualType = getErrorType(errorMessage);

  const getIcon = () => {
    switch (actualType) {
      case 'network':
        return <WifiIcon className="w-6 h-6" />;
      case 'server':
        return <ServerIcon className="w-6 h-6" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-6 h-6" />;
      default:
        return <XCircleIcon className="w-6 h-6" />;
    }
  };

  const getColors = () => {
    switch (actualType) {
      case 'warning':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/20',
          icon: 'text-yellow-400',
          title: 'text-yellow-400',
          text: 'text-yellow-300'
        };
      case 'network':
        return {
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/20',
          icon: 'text-orange-400',
          title: 'text-orange-400',
          text: 'text-orange-300'
        };
      case 'server':
        return {
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/20',
          icon: 'text-purple-400',
          title: 'text-purple-400',
          text: 'text-purple-300'
        };
      default:
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/20',
          icon: 'text-red-400',
          title: 'text-red-400',
          text: 'text-red-300'
        };
    }
  };

  const getTitle = () => {
    if (title) return title;
    
    switch (actualType) {
      case 'network':
        return 'Connection Error';
      case 'server':
        return 'Server Error';
      case 'warning':
        return 'Warning';
      default:
        return 'Error';
    }
  };

  const getSuggestions = () => {
    switch (actualType) {
      case 'network':
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Wait a moment and try again'
        ];
      case 'server':
        return [
          'The server might be temporarily unavailable',
          'Try again in a few minutes',
          'Contact support if the problem persists'
        ];
      default:
        return [
          'Try refreshing the page',
          'Check your input and try again',
          'Contact support if the problem persists'
        ];
    }
  };

  const colors = getColors();

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-xl p-6 ${className}`}>
      <div className="flex items-start space-x-4">
        <div className={`flex-shrink-0 ${colors.icon}`}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-medium ${colors.title} mb-2`}>
            {getTitle()}
          </h3>
          
          <p className={`${colors.text} mb-4`}>
            {errorMessage}
          </p>

          {showDetails && error instanceof Error && error.stack && (
            <details className="mb-4">
              <summary className={`text-sm ${colors.text} cursor-pointer hover:opacity-80 mb-2`}>
                Technical Details
              </summary>
              <div className="bg-gray-900 rounded-lg p-3 text-xs text-gray-300 font-mono overflow-auto max-h-32">
                <pre className="whitespace-pre-wrap">{error.stack}</pre>
              </div>
            </details>
          )}

          <div className="space-y-3">
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <ArrowPathIcon className="w-4 h-4" />
                {retryLabel}
              </Button>
            )}

            <div className={`text-sm ${colors.text}`}>
              <p className="font-medium mb-2">What you can try:</p>
              <ul className="space-y-1">
                {getSuggestions().map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;