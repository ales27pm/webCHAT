import { VectorDocument, SearchResult } from '../types';

const DB_NAME = 'LocalMind_VectorDB';
const STORE_NAME = 'vectors';
const DB_VERSION = 1;

// Simple Cosine Similarity
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class VectorDb {
  private db: IDBDatabase | null = null;

  public async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  public async addDocument(doc: VectorDocument): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(doc);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  public async search(queryEmbedding: number[], topK: number = 3): Promise<SearchResult[]> {
    if (!this.db) await this.init();
    
    // For small-medium datasets (<10k), a full scan in JS is fast enough.
    // For larger, we'd need an IVF index or similar, but keeping it simple for "on-device".
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const docs = request.result as VectorDocument[];
        const results: SearchResult[] = docs
          .map(doc => ({
            ...doc,
            score: cosineSimilarity(queryEmbedding, doc.embedding)
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, topK);
        
        resolve(results);
      };
    });
  }

  public async clear(): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  public async getCount(): Promise<number> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

export const vectorDb = new VectorDb();