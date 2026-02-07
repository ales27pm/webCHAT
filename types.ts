export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id: string;
  timestamp: number;
}

export interface AppState {
  messages: Message[];
  isLoading: boolean;
  isModelLoading: boolean;
  loadingProgress: string;
  loadingProgressValue: number; // 0 to 1
  selectedModel: string;
  error: string | null;
  isMemoryEnabled: boolean;
  memoryStatus: 'idle' | 'loading' | 'indexing' | 'searching' | 'ready' | 'error';
}

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  size: string;
  vram_required: string;
}

export interface InitProgressReport {
  progress: number;
  text: string;
  timeElapsed: number;
}

export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    role: 'user' | 'assistant';
    timestamp: number;
  };
}

export interface SearchResult extends VectorDocument {
  score: number;
}
