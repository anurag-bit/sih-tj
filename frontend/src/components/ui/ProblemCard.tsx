import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BuildingOfficeIcon, TagIcon } from '@heroicons/react/24/outline';

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
      navigate(`/problem/${problem.id}`);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-200/80 cursor-pointer group ${className}`}
      onClick={handleClick}
    >
      <h3 className="text-lg font-bold text-gray-900 group-hover:text-sih-orange transition-colors duration-150 mb-2">
        {problem.title}
      </h3>

      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {problem.description}
      </p>

      <div className="flex items-center text-sm text-gray-500 mb-4">
        <BuildingOfficeIcon className="w-4 h-4 mr-2 flex-shrink-0" />
        <span className="truncate">{problem.organization}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getDifficultyColor(problem.difficulty_level)}`}>
          {problem.difficulty_level}
        </div>
        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <TagIcon className="w-3 h-3 mr-1.5" />
          {problem.category}
        </div>
      </div>
    </div>
  );
};

export default ProblemCard;