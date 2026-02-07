import React from 'react';
import { Cpu, Zap, ShieldCheck, Database, Trash2, BrainCircuit } from 'lucide-react';
import { AVAILABLE_MODELS } from '../constants';

interface SidebarProps {
  selectedModel: string;
  onModelSelect: (id: string) => void;
  isModelLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  isMemoryEnabled: boolean;
  onToggleMemory: () => void;
  onClearMemory: () => void;
  memoryStatus: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedModel,
  onModelSelect,
  isModelLoading,
  isOpen,
  onClose,
  isMemoryEnabled,
  onToggleMemory,
  onClearMemory,
  memoryStatus
}) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Cpu className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">LocalMind</h1>
              <p className="text-xs text-zinc-500 font-medium">WebGPU Powered</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-8">
          {/* Models Section */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 px-2">
              Select Model
            </h3>
            <div className="space-y-2">
              {AVAILABLE_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    if (!isModelLoading) {
                      onModelSelect(model.id);
                      if (window.innerWidth < 1024) onClose();
                    }
                  }}
                  disabled={isModelLoading}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group relative overflow-hidden ${
                    selectedModel === model.id
                      ? 'bg-blue-600/10 border-blue-600/50 hover:bg-blue-600/20'
                      : 'bg-zinc-800/40 border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600'
                  } ${isModelLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span
                      className={`font-medium text-sm ${selectedModel === model.id ? 'text-blue-400' : 'text-zinc-200'}`}
                    >
                      {model.name}
                    </span>
                    {selectedModel === model.id && (
                      <span className="flex h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2 mb-3 leading-relaxed">
                    {model.description}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 bg-zinc-900/50 px-2 py-1 rounded">
                      <Database size={10} />
                      {model.size}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 bg-zinc-900/50 px-2 py-1 rounded">
                      <Zap size={10} />
                      {model.vram_required}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Memory Section */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 px-2">
              Semantic Memory
            </h3>
            <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BrainCircuit
                    size={16}
                    className={isMemoryEnabled ? 'text-purple-400' : 'text-zinc-500'}
                  />
                  <span className="text-sm font-medium text-zinc-200">Long-term Memory</span>
                </div>
                <button
                  onClick={onToggleMemory}
                  role="switch"
                  aria-checked={isMemoryEnabled}
                  aria-label="Toggle long-term memory"
                  className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${isMemoryEnabled ? 'bg-purple-600' : 'bg-zinc-700'}`}
                >
                  <div
                    className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform duration-200 ${isMemoryEnabled ? 'left-6' : 'left-1'}`}
                  />
                </button>
              </div>

              <p className="text-xs text-zinc-500 mb-3">
                Allows the AI to remember past conversations using a vector database.
              </p>

              {memoryStatus !== 'ready' && isMemoryEnabled && (
                <div
                  className={`text-xs mb-2 ${memoryStatus === 'error' ? 'text-red-400' : 'text-purple-400'} ${memoryStatus === 'error' ? '' : 'animate-pulse'}`}
                >
                  {memoryStatus === 'loading'
                    ? 'Loading embedding model...'
                    : memoryStatus === 'indexing'
                      ? 'Saving memory...'
                      : memoryStatus === 'searching'
                        ? 'Recalling...'
                        : memoryStatus === 'error'
                          ? 'Memory unavailable. Try enabling again.'
                          : ''}
                </div>
              )}

              <button
                onClick={onClearMemory}
                className="w-full flex items-center justify-center gap-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 py-2 rounded border border-transparent hover:border-red-900/30 transition-colors"
              >
                <Trash2 size={12} />
                Clear Memory DB
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="p-4 rounded-lg bg-emerald-900/10 border border-emerald-500/20">
              <div className="flex items-start gap-3">
                <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="text-sm font-medium text-emerald-400 mb-1">Privacy First</h4>
                  <p className="text-xs text-emerald-300/80 leading-relaxed">
                    Your chats AND semantic memory vectors are processed locally on your device. No
                    data leaves your browser.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <a
              href="https://webllm.mlc.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              Powered by WebLLM
            </a>
            <span>v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
