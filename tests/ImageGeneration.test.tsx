import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { ImageGeneration } from '../components/ImageGeneration';
import { imageGenerationService } from '../services/imageGenerationService';

jest.mock('../services/imageGenerationService', () => ({
  imageGenerationService: {
    getStatus: jest.fn(() => 'ready'),
    initialize: jest.fn(() => Promise.resolve()),
    generate: jest.fn(() => Promise.resolve())
  }
}));

describe('ImageGeneration', () => {
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
