import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BuildingOfficeIcon, TagIcon, ClockIcon } from '@heroicons/react/24/outline';

interface ProblemStatement {
  id: string;
  title: string;
  organization: string;
  category: string;
  description: string;
  technology_stack: string[];
  difficulty_level: string;
  created_at?: string;
  similarity_score?: number;
}

interface ProblemCardProps {
  problem: ProblemStatement;
  onClick?: (problem: ProblemStatement) => void;
  className?: string;
}

const ProblemCard: React.FC<ProblemCardProps> = ({
  problem,
  onClick,
  className = ''
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(problem);
    } else {
      // Default behavior: navigate to problem detail page
      navigate(`/problem/${problem.id}`);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'hard':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div
      className={`bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700 hover:border-electric-blue hover:shadow-lg hover:shadow-electric-blue/10 transition-all duration-150 cursor-pointer group touch-manipulation ${className}`}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-electric-blue transition-colors duration-150 line-clamp-2 pr-2">
            {problem.title}
          </h3>
          <div className="flex items-center mt-1 sm:mt-2 text-xs sm:text-sm text-gray-400">
            <BuildingOfficeIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
            <span className="truncate">{problem.organization}</span>
          </div>
        </div>
        {problem.similarity_score && (
          <div className="ml-2 sm:ml-4 text-right flex-shrink-0">
            <div className="text-xs text-gray-400">Match</div>
            <div className="text-xs sm:text-sm font-medium text-electric-blue">
              {Math.round(problem.similarity_score * 100)}%
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3">
        {problem.description}
      </p>

      {/* Tags and Metadata */}
      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-3 sm:mb-4">
        <div className="flex items-center">
          <TagIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-1" />
          <span className="text-xs text-gray-400">{problem.category}</span>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs border ${getDifficultyColor(problem.difficulty_level)}`}>
          {problem.difficulty_level}
        </div>
      </div>

      {/* Technology Stack */}
      {problem.technology_stack && problem.technology_stack.length > 0 && (
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {/* Show 3 on mobile, 4 on larger screens */}
          {problem.technology_stack.slice(0, 3).map((tech, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-md"
            >
              {tech}
            </span>
          ))}
          {/* Show 4th item only on larger screens */}
          {problem.technology_stack.length > 3 && problem.technology_stack[3] && (
            <span className="hidden sm:inline-block px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-md">
              {problem.technology_stack[3]}
            </span>
          )}
          {/* Show remaining count */}
          {problem.technology_stack.length > 3 && (
            <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded-md sm:hidden">
              +{problem.technology_stack.length - 3} more
            </span>
          )}
          {problem.technology_stack.length > 4 && (
            <span className="hidden sm:inline-block px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded-md">
              +{problem.technology_stack.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Created Date */}
      {problem.created_at && (
        <div className="flex items-center mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-700 text-xs text-gray-500">
          <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          <span>Added {new Date(problem.created_at).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
};

export default ProblemCard;