// Simple test file to verify components work
import React from 'react';
import SearchBar from './components/ui/SearchBar';
import ProblemCard from './components/ui/ProblemCard';

const TestComponents: React.FC = () => {
  const sampleProblem = {
    id: '1',
    title: 'AI-Based Traffic Management System',
    organization: 'Ministry of Transport',
    category: 'Software',
    description: 'Develop an intelligent traffic management system using AI and machine learning to optimize traffic flow in urban areas. The system should analyze real-time traffic data and provide dynamic routing suggestions.',
    technology_stack: ['Python', 'TensorFlow', 'OpenCV', 'React'],
    difficulty_level: 'Medium',
    created_at: '2024-01-15T10:00:00Z',
    similarity_score: 0.85
  };

  const handleSearch = (query: string) => {
    console.log('Search query:', query);
  };

  const handleProblemClick = (problem: any) => {
    console.log('Problem clicked:', problem.title);
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">SearchBar Component</h2>
        <SearchBar onSearch={handleSearch} />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">ProblemCard Component</h2>
        <div className="max-w-md">
          <ProblemCard problem={sampleProblem} onClick={handleProblemClick} />
        </div>
      </div>
    </div>
  );
};

export default TestComponents;