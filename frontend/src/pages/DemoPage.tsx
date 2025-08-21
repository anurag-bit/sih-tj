import React from 'react';
import { PromptInputBox } from '../components/ui/ai-prompt-box';

const DemoPage: React.FC = () => {
  const handleSendMessage = (message: string, files?: File[]) => {
    console.log('Message:', message);
    console.log('Files:', files);
    
    // You could send this to your backend API
    alert(`Message sent: ${message}${files && files.length > 0 ? ` with ${files.length} file(s)` : ''}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">AI Prompt Box Demo</h1>
          <p className="text-gray-300">
            Try the enhanced chat interface with file upload, voice recording, and mode switching
          </p>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl">
          <PromptInputBox 
            onSend={handleSendMessage}
            placeholder="Try typing something, uploading an image, or using voice..."
          />
          
          <div className="mt-6 text-sm text-gray-400">
            <h3 className="font-semibold mb-2">Features:</h3>
            <ul className="space-y-1">
              <li>• <span className="text-blue-400">Search Mode:</span> Toggle to search the web</li>
              <li>• <span className="text-purple-400">Think Mode:</span> Toggle for deep thinking</li>
              <li>• <span className="text-orange-400">Canvas Mode:</span> Toggle for creative work</li>
              <li>• <span className="text-green-400">File Upload:</span> Drag & drop or click to upload images</li>
              <li>• <span className="text-red-400">Voice Recording:</span> Click the mic button to record</li>
              <li>• <span className="text-yellow-400">Auto-resize:</span> Textarea grows with content</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
