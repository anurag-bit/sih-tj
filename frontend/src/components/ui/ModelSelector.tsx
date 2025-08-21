import React from 'react';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './dropdown-menu';
import { ChevronDown, Cpu, Zap, Brain, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ChatModel {
  id: string;
  name: string;
  description: string;
  provider: string;
}

interface ModelSelectorProps {
  models: ChatModel[];
  selectedModel: ChatModel | null;
  onModelChange: (model: ChatModel) => void;
  loading?: boolean;
  className?: string;
}

// Icon mapping for different providers
const getProviderIcon = (provider: string) => {
  switch (provider.toLowerCase()) {
    case 'openai':
      return <Zap className="h-4 w-4" />;
    case 'anthropic':
      return <Brain className="h-4 w-4" />;
    case 'google':
      return <Sparkles className="h-4 w-4" />;
    default:
      return <Cpu className="h-4 w-4" />;
  }
};

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onModelChange,
  loading = false,
  className
}) => {
  if (loading) {
    return (
      <div className={cn("relative", className)}>
        <Button variant="outline" disabled className="w-full justify-between h-12 px-4">
          <div className="flex items-center space-x-3 text-gray-500">
            <div className="flex-shrink-0">
              <Cpu className="h-5 w-5 animate-pulse text-sih-blue/60" />
            </div>
            <div className="flex flex-col items-start">
              <div className="h-3 bg-gray-300 rounded w-24 animate-pulse"></div>
              <div className="h-2 bg-gray-200 rounded w-16 mt-1 animate-pulse"></div>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </Button>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className={cn("relative", className)}>
        <Button variant="outline" disabled className="w-full justify-between h-12 px-4">
          <div className="flex items-center space-x-3 text-gray-500">
            <div className="flex-shrink-0">
              <Cpu className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">No models available</span>
              <span className="text-xs text-gray-400">Check your connection</span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </Button>
      </div>
    );
  }

  // Group models by provider for better organization
  const groupedModels = models.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, ChatModel[]>);

  const handleValueChange = (value: string) => {
    const model = models.find(m => m.id === value);
    if (model) {
      onModelChange(model);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-12 px-4 hover:border-sih-blue/40 hover:bg-gradient-to-r hover:from-sih-blue/5 hover:to-sih-orange/5 hover:shadow-sm transition-all duration-200 group"
          >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              {selectedModel ? (
                <>
                  <div className="flex-shrink-0 text-sih-blue group-hover:scale-105 transition-transform duration-200">
                    {getProviderIcon(selectedModel.provider)}
                  </div>
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="font-semibold text-gray-900 truncate text-sm leading-tight">
                      {selectedModel.name}
                    </span>
                    <span className="text-xs text-gray-500 truncate leading-tight">
                      by {selectedModel.provider}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-shrink-0">
                    <Cpu className="h-5 w-5 text-gray-400 group-hover:text-sih-blue/60 transition-colors duration-200" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-gray-600 font-medium text-sm">Select AI Model</span>
                    <span className="text-xs text-gray-400">Choose your preferred model</span>
                  </div>
                </>
              )}
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 group-hover:text-sih-blue/60 transition-colors duration-200" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-96 max-h-[420px] overflow-y-auto">
          <DropdownMenuRadioGroup 
            value={selectedModel?.id || ""} 
            onValueChange={handleValueChange}
          >
            {Object.entries(groupedModels).map(([provider, providerModels], index) => (
              <React.Fragment key={provider}>
                {index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="flex items-center gap-2.5 font-bold text-gray-800 mb-1">
                  <div className="text-sih-blue">
                    {getProviderIcon(provider)}
                  </div>
                  {provider}
                </DropdownMenuLabel>
                
                <div className="space-y-1 mb-2">
                  {providerModels.map((model) => (
                    <DropdownMenuRadioItem
                      key={model.id}
                      value={model.id}
                      className="flex-col items-start py-3 px-3 hover:bg-gradient-to-r hover:from-sih-blue/8 hover:to-sih-orange/8 cursor-pointer rounded-lg mx-1 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-sih-blue/12 data-[state=checked]:to-sih-orange/12 data-[state=checked]:border-sih-blue/20"
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-semibold text-gray-900 text-sm leading-tight">
                          {model.name}
                        </span>
                        {model.id === selectedModel?.id && (
                          <div className="flex items-center space-x-1">
                            <div className="h-2 w-2 bg-sih-blue rounded-full animate-pulse" />
                            <span className="text-xs text-sih-blue font-medium">Active</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                        {model.description}
                      </p>
                    </DropdownMenuRadioItem>
                  ))}
                </div>
              </React.Fragment>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ModelSelector;
