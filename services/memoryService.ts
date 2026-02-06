import { pipeline, env } from '@xenova/transformers';
import { vectorDb } from './vectorDb';
import { VectorDocument } from '../types';

// Skip local model checks for browser environment
env.allowLocalModels = false;
env.useBrowserCache = true;

class MemoryService {
  private static instance: MemoryService;
  private pipe: any = null;
  private modelName = 'Xenova/all-MiniLM-L6-v2';
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): MemoryService {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService();
    }
    return MemoryService.instance;
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Initialize DB
      await vectorDb.init();

      // Initialize Embedding Pipeline
      // This downloads the quantized model (~40MB) once and caches it
      this.pipe = await pipeline('feature-extraction', this.modelName);
      this.isInitialized = true;
      console.log('Memory Service Initialized');
    } catch (error) {
      console.error('Failed to initialize memory service:', error);
      throw error;
    }
  }

  private async getEmbedding(text: string): Promise<number[]> {
    if (!this.pipe) await this.init();
    
    // Generate embedding
    const output = await this.pipe(text, { pooling: 'mean', normalize: true });
    // Convert Float32Array to regular array
    return Array.from(output.data);
  }

  public async addMemory(text: string, role: 'user' | 'assistant'): Promise<void> {
    try {
      const embedding = await this.getEmbedding(text);
      const doc: VectorDocument = {
        id: crypto.randomUUID(),
        content: text,
        embedding,
        metadata: {
          role,
          timestamp: Date.now()
        }
      };
      await vectorDb.addDocument(doc);
    } catch (e) {
      console.error("Error adding memory:", e);
    }
  }

  public async retrieveContext(query: string): Promise<string> {
    try {
      const embedding = await this.getEmbedding(query);
      const results = await vectorDb.search(embedding, 3);
      
      // Filter for relevance (score > 0.4 is a decent baseline for MiniLM)
      const relevant = results.filter(r => r.score > 0.35);

      if (relevant.length === 0) return "";

      const contextString = relevant
        .map(r => `[${new Date(r.metadata.timestamp).toLocaleDateString()}] ${r.metadata.role.toUpperCase()}: ${r.content}`)
        .join('\n\n');

      return `\nRELEVANT CONTEXT FROM PAST CONVERSATIONS:\n${contextString}\n\n`;
    } catch (e) {
      console.error("Error retrieving context:", e);
      return "";
    }
  }

  public async clearMemory(): Promise<void> {
    await vectorDb.clear();
  }
}

export const memoryService = MemoryService.getInstance();