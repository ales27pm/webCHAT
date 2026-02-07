import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { ImageGeneration } from '../components/ImageGeneration';
import { imageGenerationService } from '../services/imageGenerationService';

describe('ImageGeneration', () => {
  beforeEach(() => {
    jest.spyOn(imageGenerationService, 'getStatus').mockReturnValue('ready');
    jest.spyOn(imageGenerationService, 'initialize').mockResolvedValue();
    jest.spyOn(imageGenerationService, 'generate').mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the image generation form and triggers generate', async () => {
    render(<ImageGeneration isGPUAvailable={true} />);

    expect(screen.getByText('On-device Image Generation')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Describe the image you want to generate')
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/status: ready/i)).toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: /generate image/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(imageGenerationService.generate).toHaveBeenCalled();
    });
  });
});
