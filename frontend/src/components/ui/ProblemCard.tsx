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
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-500/10 text-green-400';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400';
      case 'hard':
        return 'bg-red-500/10 text-red-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  return (
    <div
      className={`relative bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-electric-blue/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-electric-blue/10 cursor-pointer group ${className}`}
      onClick={handleClick}
    >
      {problem.similarity_score && (
        <div className="absolute top-4 right-4">
          <span className="bg-electric-blue/20 text-electric-blue text-xs font-medium px-2.5 py-1 rounded-full">
            {Math.round(problem.similarity_score * 100)}% Match
          </span>
        </div>
      )}

      <h3 className="text-lg font-semibold text-white group-hover:text-electric-blue transition-colors duration-150 mb-2 pr-16">
        {problem.title}
      </h3>

      <p className="text-gray-400 text-sm mb-4 line-clamp-3">
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
        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
          <TagIcon className="w-3 h-3 mr-1.5" />
          {problem.category}
        </div>
      </div>
    </div>
  );
};

export default ProblemCard;
