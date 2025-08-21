import React, { useState, useEffect, useRef } from 'react';
import { SparklesIcon, UserIcon, ChatBubbleLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import ErrorMessage from './ErrorMessage';
import ModelSelector from './ModelSelector';
import DocumentsPanel from './DocumentsPanel';
import { PromptInputBox } from './ai-prompt-box';
import { docgenApi } from '../../services/docgen';
import { SummaryResponse, PlanResponse, DesignResponse, FullResponse } from '../../schemas/docgen';

type GeneratedDoc = SummaryResponse | PlanResponse | DesignResponse | FullResponse;
type DocGenScope = "summary" | "plan" | "design" | "full";

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<ChatModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<ChatModel | null>(null);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [isDocGenEnabled, setIsDocGenEnabled] = useState(false);
  const [docGenScope, setDocGenScope] = useState<DocGenScope>('summary');
  const [generatedDoc, setGeneratedDoc] = useState<GeneratedDoc | null>(null);
  const [includeDiagrams, setIncludeDiagrams] = useState<boolean>(true);
  const [isDocGenLoading, setIsDocGenLoading] = useState(false);
  const [docGenError, setDocGenError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    if (!question.trim() || isLoading || isDocGenLoading) return;

    if (isDocGenEnabled) {
      handleDocGen(question);
    } else {
      handleChat(question);
    }
  };

  const handleDocGen = async (user_prompt: string) => {
    setIsDocGenLoading(true);
    setDocGenError(null);
    setGeneratedDoc(null);

    const payload: any = {
      title: "User-initiated Generation",
      description: problemContext,
      user_prompt: user_prompt,
      model: selectedModel?.id,
    };
    if (docGenScope === 'full') {
      payload.prompts = ['exec_summary', 'solution_plan', 'system_design'];
    }

    let result;
    switch (docGenScope) {
      case 'summary':
        result = await docgenApi.generateSummary(payload);
        break;
      case 'plan':
        result = await docgenApi.generatePlan(payload);
        break;
      case 'design':
        result = await docgenApi.generateDesign(payload);
        break;
      case 'full':
        result = await docgenApi.generateFull(payload);
        break;
    }

    if (result.success) {
      setGeneratedDoc(result.data);
    } else {
      setDocGenError(result.error);
    }

    setIsDocGenLoading(false);
  };

  const handleChat = async (question: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: question.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    // Input clearing is handled by PromptInputBox internally
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

    // Abort if the stream takes too long
    let timeoutId: number | undefined;
    const controller = new AbortController();
    try {
      timeoutId = window.setTimeout(() => controller.abort(), 60000);

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_id: problemId,
          problem_context: problemContext,
          user_question: question.trim(),
          model: selectedModel?.id || null
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`Chat request failed: ${response.statusText}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body reader available');

      // Backend streams plain text chunks (no SSE). Append directly.
      let accumulatedContent = '';
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;
        setMessages(prev => prev.map(msg => msg.id === assistantMessageId ? { ...msg, content: accumulatedContent } : msg));
      }
      // Mark stream complete
      setMessages(prev => prev.map(msg => msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
    } finally {
      if (typeof timeoutId !== 'undefined') window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

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

      {/* Document Panel */}
  <DocumentsPanel doc={generatedDoc} isLoading={isDocGenLoading} error={docGenError} showDiagrams={includeDiagrams} />

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

        {/* DocGen Controls */}
        <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <label htmlFor="docgen-toggle" className="flex items-center cursor-pointer">
              <DocumentTextIcon className="w-5 h-5 mr-2 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Generate Document</span>
            </label>
            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
              <input
                type="checkbox"
                name="docgen-toggle"
                id="docgen-toggle"
                checked={isDocGenEnabled}
                onChange={() => setIsDocGenEnabled(!isDocGenEnabled)}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
              />
              <label htmlFor="docgen-toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
            </div>
          </div>
          {isDocGenEnabled && (
            <div className="mt-3">
              <label htmlFor="docgen-scope" className="block text-sm font-medium text-gray-700 mb-1">
                Scope
              </label>
              <select
                id="docgen-scope"
                value={docGenScope}
                onChange={(e) => setDocGenScope(e.target.value as DocGenScope)}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sih-blue"
              >
                <option value="summary">Summary</option>
                <option value="plan">Plan</option>
                <option value="design">Design</option>
                <option value="full">Full Document</option>
              </select>
              <div className="mt-3 flex items-center gap-2">
                <input id="docgen-diagrams" type="checkbox" checked={includeDiagrams} onChange={(e) => setIncludeDiagrams(e.target.checked)} />
                <label htmlFor="docgen-diagrams" className="text-sm text-gray-700">Render diagrams (if provided)</label>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <PromptInputBox 
            onSend={(message: string, files?: File[]) => {
              // Handle files if needed (for future image support)
              if (files && files.length > 0) {
                console.log('Files uploaded:', files);
              }
              sendMessage(message);
            }}
            isLoading={isLoading}
            placeholder="Ask a question about this problem statement..."
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;