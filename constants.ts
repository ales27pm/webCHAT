import { ModelConfig } from './types';

// We manually curate this list to ensure good UX (descriptions, size estimates),
// but the IDs MUST match those in @mlc-ai/web-llm's prebuiltAppConfig.
export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 1B",
    description: "Extremely fast and lightweight. Best for mobile/older devices.",
    size: "880 MB",
    vram_required: "1.5 GB"
  },
  {
    id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    name: "Qwen 2.5 0.5B",
    description: "Ultra-compact. Fastest option available.",
    size: "560 MB",
    vram_required: "1 GB"
  },
  {
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 3B",
    description: "Meta's balanced small model. Great mix of speed and reasoning.",
    size: "2.1 GB",
    vram_required: "3 GB"
  },
  {
    id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    name: "Qwen 2.5 1.5B",
    description: "Alibaba's powerful small model. Outperforms many larger models.",
    size: "1.3 GB",
    vram_required: "2.5 GB"
  },
  {
    id: "Phi-3.5-mini-instruct-q4f16_1-MLC",
    name: "Phi 3.5 Mini",
    description: "Microsoft's highly efficient small model. Fast and surprisingly capable.",
    size: "3.2 GB",
    vram_required: "4 GB"
  },
  {
    id: "Gemma-2-2b-it-q4f16_1-MLC",
    name: "Gemma 2 2B",
    description: "Google's lightweight open model. Very fast, good for basic tasks.",
    size: "1.8 GB",
    vram_required: "2 GB"
  },
  {
    id: "Llama-3.1-8B-Instruct-q4f32_1-MLC",
    name: "Llama 3.1 8B",
    description: "Meta's strong open model. Excellent reasoning and general capabilities.",
    size: "6.4 GB",
    vram_required: "8 GB"
  },
  {
    id: "Mistral-7B-Instruct-v0.3-q4f16_1-MLC",
    name: "Mistral 7B v0.3",
    description: "Strong all-rounder with good instruction following.",
    size: "4.8 GB",
    vram_required: "6 GB"
  }
];

export const DEFAULT_SYSTEM_PROMPT = "You are a helpful, respectful, and honest AI assistant running locally on the user's device. You prioritize privacy and concise, accurate answers.";