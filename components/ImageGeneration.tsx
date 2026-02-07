import React, { useEffect, useState } from 'react';
import { imageGenerationService } from '../services/imageGenerationService';
import { Button } from './ui/Button';

interface ImageGenerationProps {
  isGPUAvailable: boolean;
}

interface ImageGenerationControlsProps {
  status: string;
  isGPUAvailable: boolean;
  isGenerating: boolean;
  error: string | null;
  onGenerate: () => void;
}

const ImageGenerationControls: React.FC<ImageGenerationControlsProps> = ({
  status,
  isGPUAvailable,
  isGenerating,
  error,
  onGenerate
}) => {
  const canGenerate = status === 'ready' && isGPUAvailable && !isGenerating;

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
        <label className="text-xs uppercase tracking-wide text-zinc-500">Prompt</label>
        <input
          id="inputPrompt"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100"
          defaultValue="A photo of an astronaut riding a horse on mars"
          placeholder="Describe the image you want to generate"
        />
        <label className="text-xs uppercase tracking-wide text-zinc-500">Negative prompt</label>
        <input
          id="negativePrompt"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100"
          placeholder="Optional: what to avoid"
        />
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-zinc-300">
            Scheduler
            <select
              id="schedulerId"
              className="mt-2 w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100"
              defaultValue="0"
            >
              <option value="0">Multi-step DPM Solver (20 steps)</option>
              <option value="1">PNDM (50 steps)</option>
            </select>
          </label>
          <label className="text-sm text-zinc-300">
            Render intermediate steps
            <select
              id="vaeCycle"
              className="mt-2 w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100"
              defaultValue="-1"
            >
              <option value="-1">No</option>
              <option value="2">Run VAE every two UNet steps after step 10</option>
            </select>
          </label>
        </div>

        <div className="flex flex-col gap-2 text-xs text-zinc-400">
          <span id="gpu-tracker-label">GPU status will appear here.</span>
          <span id="progress-tracker-label">Progress updates will appear here.</span>
          <progress
            id="progress-tracker-progress"
            className="w-full h-2 rounded overflow-hidden"
            max={100}
            value={0}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={onGenerate}
            disabled={!canGenerate}
          >
            {isGenerating ? 'Generating...' : 'Generate image'}
          </Button>
          <span className="text-xs text-zinc-500">
            Status: {status === 'ready' ? 'Ready' : status === 'loading' ? 'Loading' : status}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700/50 p-4 rounded-lg text-sm text-red-200">
          {error}
        </div>
      )}
    </div>
  );
};

const ImageCanvas: React.FC = () => (
  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col items-center gap-4">
    <canvas id="canvas" width={512} height={512} className="rounded-lg w-full" />
    <p className="text-xs text-zinc-500 text-center">
      Generated images are rendered on-device. Keep this tab open during generation.
    </p>
  </div>
);

export const ImageGeneration: React.FC<ImageGenerationProps> = ({ isGPUAvailable }) => {
  const [status, setStatus] = useState(imageGenerationService.getStatus());
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (isGPUAvailable === false) {
      setStatus('error');
      setError('WebGPU is unavailable in this browser.');
      return () => {
        isMounted = false;
      };
    }

    if (isGPUAvailable !== true) {
      setStatus('idle');
      setError(null);
      return () => {
        isMounted = false;
      };
    }

    setStatus('loading');
    setError(null);
    imageGenerationService
      .initialize()
      .then(() => {
        if (isMounted) setStatus('ready');
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Image generation initialization failed', err);
          setStatus('error');
          setError('Unable to initialize image generation. Please try again later.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isGPUAvailable]);

  const handleGenerate = async () => {
    setError(null);
    setIsGenerating(true);
    try {
      await imageGenerationService.generate();
    } catch (err) {
      console.error('Image generation failed', err);
      setError('Image generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-white">On-device Image Generation</h2>
        <p className="text-sm text-zinc-400 max-w-2xl">
          Generate images locally in your browser using WebGPU. The first run downloads model
          weights (~7GB). Subsequent runs are faster thanks to caching.
        </p>
      </div>

      {!isGPUAvailable && (
        <div className="bg-red-900/40 border border-red-700/50 p-4 rounded-lg text-sm text-red-200">
          WebGPU is required for image generation. Please use a compatible browser like Chrome or
          Edge.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ImageGenerationControls
          status={status}
          isGPUAvailable={isGPUAvailable}
          isGenerating={isGenerating}
          error={error}
          onGenerate={handleGenerate}
        />
        <ImageCanvas />
      </div>
    </div>
  );
};
