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

**Project Structure**:
- `src/` - Source code directory
  - `main.tsx` - Application entry point with providers (QueryProvider, BrowserRouter)
  - `App.tsx` - Main application component with route definitions
  - `providers/` - Provider components for global state
    - `QueryProvider.tsx` - TanStack Query configuration and provider
  - `pages/` - Page components for routes
    - `Home.tsx` - Home page
    - `About.tsx` - About page
  - `App.css` - Component-specific styles
  - `index.css` - Global styles
  - `assets/` - Static assets (React logo, etc.)
- `public/` - Public static files (Vite logo)

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
