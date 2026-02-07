declare global {
  interface Window {
    tvmjsGlobalEnv?: {
      getTokenizer?: (name: string) => Promise<unknown>;
      asyncOnGenerate?: () => Promise<void>;
    };
  }
}

const TOKENIZER_MODULE_URL = 'https://websd.mlc.ai/dist/tokenizers-wasm/tokenizers_wasm.js';
const TVM_RUNTIME_URL = 'https://websd.mlc.ai/dist/tvmjs_runtime.wasi.js';
const TVM_BUNDLE_URL = 'https://websd.mlc.ai/dist/tvmjs.bundle.js';
const STABLE_DIFFUSION_URL = 'https://websd.mlc.ai/dist/stable_diffusion.js';

type ImageGenerationStatus = 'idle' | 'loading' | 'ready' | 'error';

class ImageGenerationService {
  private status: ImageGenerationStatus = 'idle';
  private initPromise: Promise<void> | null = null;

  public getStatus() {
    return this.status;
  }

  private loadScript(id: string, src: string) {
    const existing = document.getElementById(id);
    if (existing) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = () => {
        script.remove();
        reject(new Error(`Failed to load script: ${src}`));
      };
      document.body.appendChild(script);
    });
  }

  private async ensureTokenizer() {
    if (!window.tvmjsGlobalEnv) {
      window.tvmjsGlobalEnv = {};
    }
    if (window.tvmjsGlobalEnv.getTokenizer) return;

    const tokenizerModule = await import(/* @vite-ignore */ TOKENIZER_MODULE_URL);
    await tokenizerModule.default();
    window.tvmjsGlobalEnv.getTokenizer = async (name: string) => {
      const response = await fetch(`https://huggingface.co/${name}/raw/main/tokenizer.json`);
      if (!response.ok) {
        throw new Error('Failed to fetch tokenizer');
      }
      const jsonText = await response.text();
      return new tokenizerModule.TokenizerWasm(jsonText);
    };
  }

  public async initialize() {
    if (this.status === 'ready') return;
    if (this.initPromise) return this.initPromise;

    this.status = 'loading';
    this.initPromise = (async () => {
      if (typeof window === 'undefined') {
        throw new Error('Image generation requires a browser environment.');
      }

      await this.loadScript('tvmjs-runtime', TVM_RUNTIME_URL);
      await this.loadScript('tvmjs-bundle', TVM_BUNDLE_URL);
      await this.ensureTokenizer();
      await this.loadScript('stable-diffusion', STABLE_DIFFUSION_URL);
      this.status = 'ready';
    })().catch((error) => {
      console.error('Failed to initialize image generation', error);
      this.status = 'error';
      throw error;
    });

    return this.initPromise;
  }

  public async generate() {
    if (this.status === 'idle') {
      await this.initialize();
    }
    if (this.status !== 'ready' || !window.tvmjsGlobalEnv?.asyncOnGenerate) {
      throw new Error('Image generation is not ready. Please wait for initialization.');
    }
    await window.tvmjsGlobalEnv.asyncOnGenerate();
  }
}

export const imageGenerationService = new ImageGenerationService();
