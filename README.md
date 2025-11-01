# AI Email Template Generator - Frontend

A React-based email template editor with AI-powered generation and JSX code editing capabilities.

## Overview

This is the frontend application for the AI Email Template Generator, a tool that helps users create, edit, and manage email templates using AI and JSX code editing.

**Key Features:**
- AI-powered email template generation via natural language prompts
- JSX code editor with Monaco for direct template editing
- Live preview of email templates using React Email
- Project organization with brand context
- Variable extraction from JSX templates using props_schema
- Streaming generation with real-time progress feedback

**Package Manager:** This project uses [Bun](https://bun.sh) as the package manager.

## Architecture

**JSX-First Design:**

The application uses a JSX-first architecture where:
- Email templates are stored and edited as JSX source code
- The backend parses JSX and automatically extracts a `props_schema` that defines template variables
- No JSON structure (`json_state`) is stored - JSX is the single source of truth
- Live preview renders JSX directly using React Email components

**Tech Stack:**
- **Frontend:** React 19.1.1 + TypeScript + Vite
- **Styling:** Tailwind CSS v4
- **Routing:** React Router v7
- **Data Fetching:** TanStack Query v5
- **Code Editor:** Monaco Editor
- **Email Rendering:** React Email (@react-email/components)
- **State Management:** Zustand (for generation state)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.0 or higher)
- Node.js 18+ (for compatibility)

### Installation

```bash
# Install dependencies
bun install
```

### Development

```bash
# Start development server
bun run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
# Build for production
bun run build
```

### Preview Production Build

```bash
# Preview production build locally
bun run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── email/          # Email-related components
│   ├── email-editor/   # Code editor and preview
│   ├── generation/     # Generation UI components
│   └── layout/         # Layout components (Sidebar, etc.)
├── lib/                # Core utilities and API client
│   ├── api.ts          # API client with jsx_source/props_schema support
│   └── generationManager.ts  # SSE-based generation manager
├── pages/              # Route pages
│   ├── Home.tsx        # Generation interface
│   └── EmailDetail.tsx # Email editor with code/preview tabs
├── store/              # Zustand stores
│   └── generationStore.ts  # Generation state management
├── types/              # TypeScript type definitions
│   ├── email.ts        # Email type with jsxSource and propsSchema
│   ├── project.ts      # Project types
│   └── api.ts          # API response types
└── utils/              # Helper utilities
```

## Email Template Format

Templates are stored as JSX source code using React Email components:

```jsx
import { Html, Head, Body, Container, Heading, Text, Button } from '@react-email/components'

export default function Email({ firstName, companyName }) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Heading>Welcome {firstName}!</Heading>
          <Text>Thanks for joining {companyName}.</Text>
          <Button href="https://example.com">Get Started</Button>
        </Container>
      </Body>
    </Html>
  )
}
```

**Props Schema:**

The backend automatically extracts a `props_schema` from the JSX template:

```json
{
  "firstName": { "type": "string", "required": true },
  "companyName": { "type": "string", "required": true }
}
```

This schema is used to:
- Display variables in the UI
- Validate data when rendering templates
- Power the public API for template rendering

## API Integration

The frontend integrates with the backend API using:

- **Email endpoints:** Create, read, update, delete email templates
- **Generation endpoint:** Stream AI-generated templates via SSE
- **Project endpoints:** Manage projects with brand context

**Key API Mappings:**

| Frontend (camelCase) | Backend (snake_case) |
|---------------------|---------------------|
| `jsxSource`         | `jsx_source`        |
| `propsSchema`       | `props_schema`      |
| `meta.subject`      | `subject`           |
| `meta.previewText`  | `preview`           |

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for full API details.

## Development Notes

### Note on Canvas/Block Editor Removal

Previous versions of this application included a visual block editor (canvas mode). This has been removed in favor of the JSX code editor as the primary editing interface. The JSX-first approach provides:
- Direct control over template structure
- Better support for complex layouts
- Easier integration with React Email ecosystem
- Single source of truth (no JSON↔JSX conversion)

### Code Style

- Use TypeScript for all new code
- Follow React 19 best practices (no deprecated APIs)
- Use TanStack Query for all API calls
- Prefer functional components with hooks

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Additional Documentation

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Backend API reference
- **[CLAUDE.md](./CLAUDE.md)** - Development guidelines for Claude Code
- **[docs/plans/](./docs/plans/)** - Implementation plans and migration guides
