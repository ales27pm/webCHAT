# LocalMind - On-Device AI

## Overview

A React-based on-device AI application that runs AI models directly in the browser using WebLLM and Transformers.js. Features include chat with AI, image generation, and vector database for memory.

## Project Architecture

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS (local build with PostCSS)
- **AI**: @mlc-ai/web-llm, @xenova/transformers
- **Testing**: Jest + React Testing Library

## Project Structure

- `/` - Root contains main App.tsx, index.tsx, index.html
- `/components/` - React components (ChatInput, MessageList, Sidebar, ImageGeneration, ProgressBar)
- `/components/ui/` - Reusable UI components (Button)
- `/services/` - Service layer (webLlmService, imageGenerationService, memoryService, vectorDb)
- `/public/` - Static assets
- `/tests/` - Test files

## Development

- Dev server: `npm run dev` (port 5000)
- Build: `npm run build`
- Deployment: Static site (dist/ directory)

## Recent Changes

- 2026-02-07: Fixed display issues by defining `zinc` colors in Tailwind configuration and ensuring `root` element fills the viewport.
- 2026-02-07: Moved Tailwind to a local build pipeline to avoid relying on the CDN at runtime.
- 2026-02-07: Configured Vite for Replit (port 5000, allowedHosts, HMR clientPort).
