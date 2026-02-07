import React, { useState, useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import { webLlmService } from './services/webLlmService';
import { memoryService } from './services/memoryService';
import { AVAILABLE_MODELS, DEFAULT_SYSTEM_PROMPT } from './constants';
import { Message, AppState } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatInput } from './components/ChatInput';
import { MessageList } from './components/MessageList';
import { ProgressBar } from './components/ProgressBar';
import { ImageGeneration } from './components/ImageGeneration';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    messages: [],
    isLoading: false,
    isModelLoading: false,
    loadingProgress: '',
    loadingProgressValue: 0,
    selectedModel: AVAILABLE_MODELS[0].id,
    error: null,
    isMemoryEnabled: true,
    memoryStatus: 'idle'
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGPUAvailable, setIsGPUAvailable] = useState<boolean | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMemoryEnabledRef = useRef(state.isMemoryEnabled);
  const [activeView, setActiveView] = useState<'chat' | 'image'>('chat');

  // Initialize services
  useEffect(() => {
    webLlmService.isGPUAvailable().then((available) => {
      setIsGPUAvailable(available);
      if (!available) {
        setState((s) => ({ ...s, error: 'WebGPU is not available. Please use Chrome/Edge.' }));
      }
    });

    // Initialize memory service silently
    if (isMemoryEnabledRef.current) {
      setState((s) => ({ ...s, memoryStatus: 'loading' }));
      memoryService
        .init()
        .then(() => {
          setState((s) => ({ ...s, memoryStatus: 'ready' }));
        })
        .catch((err) => {
          console.error('Memory init failed', err);
          setState((s) => ({ ...s, memoryStatus: 'error', isMemoryEnabled: false }));
        });
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Handle Model Selection & Loading
  const loadModel = async (modelId: string) => {
    if (state.isModelLoading) return;

    setState((prev) => ({
      ...prev,
      selectedModel: modelId,
      isModelLoading: true,
      loadingProgress: 'Initializing Model...',
      loadingProgressValue: 0,
      error: null
    }));

    try {
      await webLlmService.initializeEngine(modelId, (report) => {
        setState((prev) => ({
          ...prev,
          loadingProgress: report.text,
          loadingProgressValue: report.progress
        }));
      });

      setState((prev) => ({
        ...prev,
        isModelLoading: false,
        loadingProgress: 'Ready',
        loadingProgressValue: 1
      }));
    } catch (err: any) {
      console.error(err);
      setState((prev) => ({
        ...prev,
        isModelLoading: false,
        error: `Failed to load model: ${err.message || 'Unknown error'}`
      }));
    }
  };

  const handleSend = async (content: string) => {
    if (state.isLoading) return;
    // 1. Ensure Model is Loaded
    if (state.loadingProgressValue !== 1 && !state.isModelLoading) {
      await loadModel(state.selectedModel);
    }
    if (state.error) return;

    // 2. Prepare Context (RAG)
    let systemMessage = DEFAULT_SYSTEM_PROMPT;

    if (state.isMemoryEnabled) {
      setState((s) => ({ ...s, memoryStatus: 'searching' }));
      try {
        const context = await memoryService.retrieveContext(content);
        if (context) {
          systemMessage += `\n\n${context}\nInstructions: Use the RELEVANT CONTEXT above to answer the user's question if applicable.`;
        }
      } catch (e) {
        console.error('Context retrieval failed', e);
      }
      setState((s) => ({ ...s, memoryStatus: 'ready' }));
    }

    // 3. Update UI with User Message
    const newMessage: Message = {
      role: 'user',
      content,
      id: Date.now().toString(),
      timestamp: Date.now()
    };

    const updatedMessages = [...state.messages, newMessage];

    setState((prev) => ({
      ...prev,
      messages: updatedMessages,
      isLoading: true
    }));

    // 4. Stream Response
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const botMessageId = (Date.now() + 1).toString();
    let fullBotResponse = '';

    setState((prev) => ({
      ...prev,
      messages: [
        ...updatedMessages,
        { role: 'assistant', content: '', id: botMessageId, timestamp: Date.now() }
      ]
    }));

    await webLlmService.streamCompletion(
      [{ role: 'system', content: systemMessage, id: 'sys', timestamp: 0 }, ...updatedMessages],
      (delta) => {
        fullBotResponse += delta;
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === botMessageId ? { ...msg, content: fullBotResponse } : msg
          )
        }));
      },
      async () => {
        setState((prev) => ({ ...prev, isLoading: false }));

        // 5. Save to Memory (Index)
        if (state.isMemoryEnabled && fullBotResponse) {
          setState((s) => ({ ...s, memoryStatus: 'indexing' }));
          // Index user query
          await memoryService.addMemory(content, 'user');
          // Index assistant response
          await memoryService.addMemory(fullBotResponse, 'assistant');
          setState((s) => ({ ...s, memoryStatus: 'ready' }));
        }
      },
      (err) => {
        if ((err as Error)?.name === 'AbortError') {
          setState((prev) => ({ ...prev, isLoading: false }));
          return;
        }
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Error generating response. Check console.'
        }));
      },
      abortControllerRef.current.signal
    );
  };

  const handleModelSelect = async (id: string) => {
    if (state.selectedModel === id) return;
    setState((prev) => ({ ...prev, messages: [], selectedModel: id }));
    await loadModel(id);
  };

  const handleToggleMemory = () => {
    const newVal = !state.isMemoryEnabled;
    setState((prev) => ({
      ...prev,
      isMemoryEnabled: newVal,
      memoryStatus: newVal ? 'loading' : 'idle'
    }));
    if (newVal) {
      memoryService
        .init()
        .then(() => setState((s) => ({ ...s, memoryStatus: 'ready' })))
        .catch((err) => {
          console.error('Memory init failed', err);
          setState((s) => ({ ...s, memoryStatus: 'error', isMemoryEnabled: false }));
        });
    }
  };

  const handleClearMemory = async () => {
    if (
      confirm('Are you sure you want to clear the entire memory database? This cannot be undone.')
    ) {
      await memoryService.clearMemory();
      alert('Memory database cleared.');
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setState((prev) => ({ ...prev, isLoading: false }));
  };

  return (
    <div className="flex h-full w-full bg-zinc-950 text-zinc-100 overflow-hidden m-0 p-0 border-0">
      <Sidebar
        selectedModel={state.selectedModel}
        onModelSelect={handleModelSelect}
        isModelLoading={state.isModelLoading}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isMemoryEnabled={state.isMemoryEnabled}
        onToggleMemory={handleToggleMemory}
        onClearMemory={handleClearMemory}
        memoryStatus={state.memoryStatus}
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

        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 bg-zinc-900/80">
          <div className="flex gap-2">
            {(['chat', 'image'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeView === view
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {view === 'chat' ? 'Chat' : 'Image'}
              </button>
            ))}
          </div>
          <span className="text-xs text-zinc-500">
            {activeView === 'chat' ? 'Text conversations' : 'Stable Diffusion'}
          </span>
        </div>

        {activeView === 'chat' ? (
          <>
            {/* Main Chat Area */}
            <MessageList messages={state.messages} isStreaming={state.isLoading} />

            {/* Input Area */}
            <ChatInput
              onSend={handleSend}
              onStop={handleStop}
              isLoading={state.isLoading}
              disabled={state.isModelLoading || isGPUAvailable === false}
              placeholder={
                state.isLoading
                  ? 'Generating...'
                  : state.memoryStatus === 'searching'
                    ? 'Recalling memory...'
                    : state.memoryStatus === 'indexing'
                      ? 'Memorizing...'
                      : 'Type a message...'
              }
            />
          </>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {isGPUAvailable === null ? (
              <div className="p-6 text-sm text-zinc-400">Checking WebGPU support...</div>
            ) : (
              <ImageGeneration isGPUAvailable={isGPUAvailable} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
