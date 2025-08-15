import React, { useState, useEffect, useRef } from 'react';
import { 
  PaperAirplaneIcon, 
  SparklesIcon,
  UserIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import ErrorMessage from './ErrorMessage';
import LoadingSpinner from './LoadingSpinner';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchSuggestedQuestions();
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

    // Create assistant message placeholder for streaming
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
          user_question: question.trim()
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
                // Streaming complete
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
      // Remove the failed assistant message
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
    <div className="flex flex-col h-full">
      {/* Messages Area */}
  <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 pb-20 sm:pb-6">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <SparklesIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">Start a Conversation</h3>
            <p className="text-gray-400 mb-6">
              Ask questions about this problem statement to get insights and guidance
            </p>
            
            {/* Suggested Questions */}
            {suggestedQuestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 mb-3">Try asking:</p>
                <div className="grid gap-2">
                  {suggestedQuestions.slice(0, 4).map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 hover:text-white transition-colors duration-150"
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
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] sm:max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-2 sm:ml-3' : 'mr-2 sm:mr-3'}`}>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user' 
                    ? 'bg-electric-blue' 
                    : 'bg-gray-600'
                }`}>
                  {message.type === 'user' ? (
                    <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  ) : (
                    <ChatBubbleLeftIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div className={`rounded-lg px-3 py-2 sm:px-4 sm:py-3 ${
                message.type === 'user'
                  ? 'bg-electric-blue text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}>
                <div className="whitespace-pre-wrap break-words text-sm sm:text-base">
                  {message.content}
                  {message.isStreaming && (
                    <span className="inline-block w-2 h-4 sm:h-5 bg-current ml-1 animate-pulse" />
                  )}
                </div>
                <div className={`text-xs mt-1 sm:mt-2 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Error Message */}
        {error && (
          <ErrorMessage
            error={error}
            title="Chat Error"
            onRetry={() => {
              setError(null);
              // Optionally retry the last message
            }}
            retryLabel="Dismiss"
            className="mx-4"
          />
        )}

        <div ref={messagesEndRef} />
      </div>

  {/* Input Area */}
  <div className="border-t border-gray-700 p-3 sm:p-4 sticky bottom-0 bg-gray-800/95 backdrop-blur supports-[backdrop-filter]:bg-gray-800/80">
        <form onSubmit={handleSubmit} className="flex space-x-2 sm:space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about this problem..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 sm:px-4 sm:py-3 text-white placeholder-gray-400 focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue resize-none min-h-[44px] sm:min-h-[48px] max-h-[120px] text-sm sm:text-base touch-manipulation"
              disabled={isLoading}
              rows={1}
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="flex-shrink-0 bg-electric-blue hover:bg-electric-blue/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 sm:p-3 rounded-lg transition-colors duration-150 touch-manipulation"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              <PaperAirplaneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </form>
        
        {/* Quick Suggestions */}
        {messages.length > 0 && suggestedQuestions.length > 0 && (
          <div className="mt-2 sm:mt-3 pb-[env(safe-area-inset-bottom)]">
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {suggestedQuestions.slice(0, 3).map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-xs px-2 py-1 sm:px-3 sm:py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-full transition-colors duration-150 touch-manipulation"
                  disabled={isLoading}
                >
                  {question.length > 40 ? question.substring(0, 40) + '...' : question}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;