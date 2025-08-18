import React, { useState, useEffect, useRef } from 'react';
import { PaperAirplaneIcon, SparklesIcon, UserIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import ErrorMessage from './ErrorMessage';
import LoadingSpinner from './LoadingSpinner';
import ModelSelector from './ModelSelector';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatModel {
  id: string;
  name: string;
  description: string;
  provider: string;
}

interface ChatInterfaceProps {
  problemId: string;
  problemContext: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ problemId, problemContext }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<ChatModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<ChatModel | null>(null);
  const [modelsLoading, setModelsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchSuggestedQuestions();
    fetchAvailableModels();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSuggestedQuestions = async () => {
    try {
      const response = await fetch('/api/chat/suggestions');
      if (response.ok) {
        const data = await response.json();
        setSuggestedQuestions(data.suggestions || []);
      }
    } catch (err) {
      console.error('Failed to fetch suggested questions:', err);
    }
  };

  const fetchAvailableModels = async () => {
    try {
      setModelsLoading(true);
      const response = await fetch('/api/chat/models');
      if (response.ok) {
        const data = await response.json();
        setAvailableModels(data.models || []);
        // Set default model if available
        if (data.models?.length > 0) {
          const defaultModel = data.models.find((m: ChatModel) => m.id === data.default_model) || data.models[0];
          setSelectedModel(defaultModel);
        }
      }
    } catch (err) {
      console.error('Failed to fetch available models:', err);
    } finally {
      setModelsLoading(false);
    }
  };

  const sendMessage = async (question: string) => {
    if (!question.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: question.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problem_id: problemId,
          problem_context: problemContext,
          user_question: question.trim(),
          model: selectedModel?.id || null
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) {
                throw new Error(data.error);
              }
              
              if (data.done) {
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, isStreaming: false }
                    : msg
                ));
                break;
              }
              
              if (data.chunk) {
                accumulatedContent += data.chunk;
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, content: accumulatedContent }
                    : msg
                ));
              }
            } catch (parseError) {
              console.error('Error parsing streaming data:', parseError);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start a Conversation</h3>
            <p className="text-gray-500 mb-6">Ask questions to get insights and guidance.</p>
            
            {suggestedQuestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 mb-3">Try asking:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestedQuestions.slice(0, 4).map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="text-left p-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 hover:text-gray-900 transition-colors duration-150 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start gap-3 max-w-[85%]`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.type === 'user' ? 'bg-sih-orange' : 'bg-gray-200'}`}>
                {message.type === 'user' ? <UserIcon className="w-4 h-4 text-white" /> : <ChatBubbleLeftIcon className="w-4 h-4 text-gray-600" />}
              </div>
              <div className={`rounded-lg px-4 py-3 ${message.type === 'user' ? 'bg-sih-orange text-white' : 'bg-gray-100 text-gray-800'}`}>
                <div className="whitespace-pre-wrap break-words text-sm">
                  {message.content}
                  {message.isStreaming && <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />}
                </div>
                <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-orange-100' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {error && (
          <ErrorMessage error={error} title="Chat Error" onRetry={() => setError(null)} retryLabel="Dismiss" />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white/80 backdrop-blur-sm">
        {/* Model Selection */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AI Model
          </label>
          <ModelSelector
            models={availableModels}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            loading={modelsLoading}
          />
        </div>
        
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sih-blue resize-none"
            disabled={isLoading}
            rows={1}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="w-10 h-10 flex-shrink-0 bg-sih-orange hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors"
          >
            {isLoading ? <LoadingSpinner size="sm" color="gray" /> : <PaperAirplaneIcon className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;