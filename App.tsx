import React, { useState, useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import { webLlmService } from './services/webLlmService';
import { AVAILABLE_MODELS, DEFAULT_SYSTEM_PROMPT } from './constants';
import { Message, AppState } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatInput } from './components/ChatInput';
import { MessageList } from './components/MessageList';
import { ProgressBar } from './components/ProgressBar';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    messages: [],
    isLoading: false,
    isModelLoading: false,
    loadingProgress: '',
    loadingProgressValue: 0,
    selectedModel: AVAILABLE_MODELS[0].id,
    error: null,
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGPUAvailable, setIsGPUAvailable] = useState<boolean | null>(null);

  // Initialize GPU check
  useEffect(() => {
    webLlmService.isGPUAvailable().then(available => {
      setIsGPUAvailable(available);
      if (!available) {
        setState(s => ({ ...s, error: "WebGPU is not available in your browser. Please use Chrome, Edge, or a supported browser." }));
      }
    });
  }, []);

  // Handle Model Selection & Loading
  const loadModel = async (modelId: string) => {
    if (state.isModelLoading) return;

    setState(prev => ({
      ...prev,
      selectedModel: modelId,
      isModelLoading: true,
      loadingProgress: 'Initializing...',
      loadingProgressValue: 0,
      error: null
    }));

    try {
      await webLlmService.initializeEngine(modelId, (report) => {
        setState(prev => ({
          ...prev,
          loadingProgress: report.text,
          loadingProgressValue: report.progress
        }));
      });
      
      setState(prev => ({
        ...prev,
        isModelLoading: false,
        loadingProgress: 'Ready',
        loadingProgressValue: 1
      }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({
        ...prev,
        isModelLoading: false,
        error: `Failed to load model: ${err.message || 'Unknown error'}`
      }));
    }
  };

  // Initial model load trigger
  useEffect(() => {
    if (isGPUAvailable) {
        // Automatically load the first model on start if we want, or wait for user. 
        // Let's wait for user to interact or auto-load if desired. 
        // For better UX, we can just let them click, but let's auto-load the smallest efficient one to show capability?
        // Actually, large downloads without consent are bad UX. Let's wait for first message or explicit selection if we hadn't selected one.
        // However, the `Sidebar` selects the first one by default visually. Let's trigger load if user explicitly initiates or we can prompt a "Click to Load" button overlay.
        // For this demo, let's load immediately to be impressive, but maybe the smaller one? 
        // Let's just stick to user initiation logic: If they type, we load.
        // Or better: Load on mount? No, bandwidth.
        // We will just let the state sit there. 
    }
  }, [isGPUAvailable]);

  const handleSend = async (content: string) => {
    // If not loaded, load first
    if (state.loadingProgressValue !== 1 && !state.isModelLoading) {
       await loadModel(state.selectedModel);
    }
    
    // Safety check if load failed
    if (state.error) return;

    const newMessage: Message = {
      role: 'user',
      content,
      id: Date.now().toString(),
      timestamp: Date.now()
    };

    const updatedMessages = [...state.messages, newMessage];
    
    setState(prev => ({
      ...prev,
      messages: updatedMessages,
      isLoading: true
    }));

    const botMessageId = (Date.now() + 1).toString();
    // Placeholder for bot message
    let botContent = "";
    
    // Optimistic update for bot message
    setState(prev => ({
      ...prev,
      messages: [
        ...updatedMessages,
        { role: 'assistant', content: '', id: botMessageId, timestamp: Date.now() }
      ]
    }));

    await webLlmService.streamCompletion(
      // Prepend system prompt if it's the start of convo
      updatedMessages.length === 1 
        ? [{ role: 'system', content: DEFAULT_SYSTEM_PROMPT, id: 'sys', timestamp: 0 }, ...updatedMessages]
        : updatedMessages,
      (delta) => {
        botContent += delta;
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === botMessageId 
              ? { ...msg, content: botContent }
              : msg
          )
        }));
      },
      () => {
        setState(prev => ({ ...prev, isLoading: false }));
      },
      (err) => {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: "Error generating response. Check console." 
        }));
      }
    );
  };

  const handleModelSelect = async (id: string) => {
      // If we switch models, we clear chat for consistency usually, or keep history if context allows.
      // WebLLM engine unload clears context.
      if (state.selectedModel === id) return;
      
      setState(prev => ({ ...prev, messages: [], selectedModel: id }));
      await loadModel(id);
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      
      <Sidebar 
        selectedModel={state.selectedModel}
        onModelSelect={handleModelSelect}
        isModelLoading={state.isModelLoading}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col h-full relative w-full">
        {/* Header (Mobile mostly) */}
        <div className="lg:hidden flex items-center p-4 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-zinc-400 hover:text-white"
          >
            <Menu size={24} />
          </button>
          <span className="ml-2 font-semibold">LocalMind</span>
        </div>

        {/* Error Banner */}
        {state.error && (
          <div className="bg-red-900/50 border-l-4 border-red-500 p-4 m-4 rounded">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-200">{state.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Overlay */}
        <ProgressBar 
          progress={state.loadingProgress}
          value={state.loadingProgressValue}
          isVisible={state.isModelLoading}
        />

        {/* Main Chat Area */}
        <MessageList 
          messages={state.messages} 
          isStreaming={state.isLoading}
        />

        {/* Input Area */}
        <ChatInput 
          onSend={handleSend}
          isLoading={state.isLoading}
          disabled={state.isModelLoading || !isGPUAvailable}
          placeholder={state.messages.length === 0 ? "Send a message to load the model..." : "Type a message..."}
        />
      </div>
    </div>
  );
};

export default App;