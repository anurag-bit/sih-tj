// (No import needed for React here)
import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { CpuChipIcon } from '@heroicons/react/24/outline';

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
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onModelChange,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="relative">
        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg animate-pulse">
          <CpuChipIcon className="w-5 h-5 text-gray-400" />
          <div className="h-4 bg-gray-300 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg text-gray-500 text-sm">
        <CpuChipIcon className="w-5 h-5" />
        <span>No models available</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <Listbox value={selectedModel} onChange={onModelChange}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-sm border border-gray-300 focus:border-sih-blue focus:outline-none focus:ring-1 focus:ring-sih-blue sm:text-sm">
            <div className="flex items-center space-x-2">
              <CpuChipIcon className="w-5 h-5 text-gray-500" />
              <div className="flex-1 min-w-0">
                {selectedModel ? (
                  <div>
                    <span className="font-medium text-gray-900">
                      {selectedModel.name}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      by {selectedModel.provider}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-500">Select a model</span>
                )}
              </div>
            </div>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {models.map((model) => (
                <Listbox.Option
                  key={model.id}
                  className={({ active }: { active: boolean }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-sih-blue/10 text-sih-blue' : 'text-gray-900'
                    }`
                  }
                  value={model}
                >
                  {({ selected }: { selected: boolean }) => (
                    <>
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-medium ${
                              selected ? 'text-sih-blue' : 'text-gray-900'
                            }`}
                          >
                            {model.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {model.provider}
                          </span>
                        </div>
                        <span className="mt-1 text-sm text-gray-600">
                          {model.description}
                        </span>
                      </div>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sih-blue">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
};

export default ModelSelector;
