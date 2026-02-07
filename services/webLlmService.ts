import {
  CreateMLCEngine,
  MLCEngine,
  InitProgressCallback,
  prebuiltAppConfig
} from '@mlc-ai/web-llm';
import { Message } from '../types';

// Singleton instance to prevent multiple engines being created in development hot-reloads
let engineInstance: MLCEngine | null = null;

export class WebLlmService {
  private static instance: WebLlmService;

  private constructor() {}

  public static getInstance(): WebLlmService {
    if (!WebLlmService.instance) {
      WebLlmService.instance = new WebLlmService();
    }
    return WebLlmService.instance;
  }

  public async initializeEngine(
    modelId: string,
    progressCallback: InitProgressCallback
  ): Promise<void> {
    try {
      if (engineInstance) {
        // If switching models, we might want to reload.
        // For simplicity, we'll reload the engine if the model ID changes or just re-create it.
        await engineInstance.unload();
      }

      // We use prebuiltAppConfig to ensure we have the latest model definitions and URLs
      // directly from the library's repository configuration.
      engineInstance = await CreateMLCEngine(modelId, {
        initProgressCallback: progressCallback,
        appConfig: prebuiltAppConfig,
        logLevel: 'INFO'
      });
    } catch (error) {
      console.error('Failed to initialize WebLLM engine:', error);
      throw error;
    }
  }

  public async streamCompletion(
    messages: Message[],
    onUpdate: (chunk: string) => void,
    onFinish: () => void,
    onError: (err: any) => void,
    abortSignal?: AbortSignal
  ): Promise<void> {
    if (!engineInstance) {
      onError(new Error('Engine not initialized'));
      return;
    }

    try {
      // Convert app messages to WebLLM format
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const chunks = await engineInstance.chat.completions.create({
        messages: history as any,
        stream: true,
        temperature: 0.7,
        signal: abortSignal
      } as any);

      for await (const chunk of chunks) {
        if (abortSignal?.aborted) {
          const abortError = new DOMException('Generation aborted', 'AbortError');
          onError(abortError);
          return;
        }
        const delta = chunk.choices[0]?.delta.content || '';
        onUpdate(delta);
      }

      if (abortSignal?.aborted) {
        const abortError = new DOMException('Generation aborted', 'AbortError');
        onError(abortError);
        return;
      }

      onFinish();
    } catch (error) {
      console.error('Streaming error:', error);
      onError(error);
    }
  }

  public async isGPUAvailable(): Promise<boolean> {
    // Fix: Cast navigator to any to access gpu property which might not be in standard types yet
    if (!(navigator as any).gpu) {
      return false;
    }
    try {
      // Fix: Cast navigator to any to access gpu property
      const adapter = await (navigator as any).gpu.requestAdapter();
      return !!adapter;
    } catch {
      return false;
    }
  }
}

export const webLlmService = WebLlmService.getInstance();
