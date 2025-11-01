# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript + Vite application named "aiemailtemplate-web". It's a minimal React application setup with modern tooling and hot module replacement (HMR).

**Package Manager**: This project uses Bun as the package manager. Always use `bun` commands instead of `npm` or `yarn`.

## Development Commands

- `bun run dev` - Start development server with hot reload
- `bun run build` - Build the application (runs TypeScript compilation followed by Vite build)
- `bun run lint` - Run ESLint to check code quality
- `bun run preview` - Preview the production build locally
- `bun add <package>` - Add a new dependency
- `bun add -d <package>` - Add a new dev dependency

## Architecture

**Frontend Framework**: React 19.1.1 with TypeScript
**Build Tool**: Vite (using rolldown-vite variant for performance)
**Bundler**: SWC for Fast Refresh via @vitejs/plugin-react-swc
**Styling**: Tailwind CSS v4
**Routing**: React Router v7
**Data Fetching**: TanStack Query v5 (React Query)
**Code Editor**: Monaco Editor
**Email Rendering**: React Email (@react-email/components)
**State Management**: Zustand (for generation state)

**JSX-First Architecture**:
- Email templates are stored as JSX source code (single source of truth)
- Backend automatically extracts `props_schema` from JSX for template variables
- No JSON structure (`json_state`) is used - JSX is parsed directly
- Live preview renders JSX using React Email components
- Code editor is the primary editing interface

**Project Structure**:
- `src/` - Source code directory
  - `main.tsx` - Application entry point with providers (QueryProvider, BrowserRouter)
  - `App.tsx` - Main application component with route definitions
  - `providers/` - Provider components for global state
    - `QueryProvider.tsx` - TanStack Query configuration and provider
  - `pages/` - Page components for routes
    - `Home.tsx` - Generation interface with AI-powered template creation
    - `EmailDetail.tsx` - Email editor with code editor and live preview
  - `components/` - React components
    - `email/` - Email-related components (EmailActions, etc.)
    - `email-editor/` - Code editor and preview (CodeEditor, LivePreview, EmailIframeRenderer)
    - `generation/` - Generation UI components
    - `layout/` - Layout components (Sidebar, etc.)
  - `lib/` - Core utilities and API client
    - `api.ts` - API client with jsx_source/props_schema transformations
    - `generationManager.ts` - SSE-based generation manager
  - `store/` - Zustand stores
    - `generationStore.ts` - Generation state management
  - `types/` - TypeScript type definitions
    - `email.ts` - Email type with jsxSource and propsSchema (no jsonStructure)
    - `project.ts` - Project types
    - `api.ts` - API response types
  - `utils/` - Helper utilities
  - `App.css` - Component-specific styles
  - `index.css` - Global styles
  - `assets/` - Static assets
- `public/` - Public static files
- `docs/` - Documentation and migration plans

**Configuration Files**:
- `tsconfig.json` - Root TypeScript config that references app and node configs
- `tsconfig.app.json` - TypeScript config for application code
- `tsconfig.node.json` - TypeScript config for build tools
- `vite.config.ts` - Vite configuration with React SWC plugin
- `eslint.config.js` - ESLint configuration with React hooks and TypeScript rules

## Key Technical Details

- Uses React 19.1.1 with the latest createRoot API and StrictMode
- TypeScript configuration is split between app and build tool contexts
- ESLint is configured for TypeScript files with React-specific rules including react-hooks and react-refresh
- The project uses Vite's rolldown variant for improved build performance
- No test framework is currently configured
- Hot Module Replacement (HMR) is enabled for development
