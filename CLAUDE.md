# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start Next.js development server (runs on http://localhost:3000 or next available port)
- `npm run build` - Build the production version of the application
- `npm start` - Start production server (after build)
- `npm run lint` - Run ESLint to check code quality

### Database Operations
- `npx prisma generate` - Generate Prisma client from schema (run after schema changes)
- `npx prisma db push` - Push schema changes to database without migrations (for development)
- `npx prisma migrate dev` - Create and apply a new migration
- `npx prisma studio` - Open Prisma Studio to view/edit database

### Testing
- Run the dev server and test at `http://localhost:3000`
- Test API endpoints:
  - GET `/api/sessions` - List all sessions
  - GET `/api/sessions/[id]` - Get specific session with PRD
  - POST `/api/prd/generate` - Generate new PRD (body: `{ "idea": "..." }`)

## Architecture Overview

This is a **Next.js 16** application using App Router architecture that generates Product Requirements Documents (PRDs) using AI.

### Tech Stack
- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: SQLite with Prisma ORM (v5)
- **AI Integration**: Zhipu AI GLM-4.6 model
- **Validation**: Zod for type-safe API validation

### Directory Structure
```
app/                    # Next.js App Router (pages and API routes)
  api/
    prd/generate/     # PRD generation endpoint
    sessions/          # Session management endpoints
    sessions/[id]/      # Get single session with PRD
components/
  prd/               # PRD-specific components (PRDViewer)
  ui/                 # Reusable UI components (Button, Card, etc.)
lib/
  ai.ts               # Zhipu AI integration layer
  db.ts               # Database operations (Prisma)
  prompts/             # AI prompt templates
  utils.ts            # Utility functions
prisma/
  schema.prisma        # Database schema definition
types/
  prd.ts              # TypeScript type definitions
```

### Key Architecture Patterns

#### API Routes
All backend logic is in Next.js API routes under `app/api/`. Routes use:
- Zod schemas for request validation
- Prisma for database operations
- Consistent JSON response format: `{ success: boolean, data?: T, error?: string }`
- Next.js 16: `params` is a Promise - use `await params` to access route parameters

#### Database Layer (`lib/db.ts`)
- Prisma Client is imported from `@prisma/client` (not from generated path)
- All database operations are exported as async functions
- Models: Session, Message, PRD, AnalysisLog
- JSON fields (features, targetUsers, etc.) store complex nested structures as strings

#### AI Integration (`lib/ai.ts`)
- Wrapper around Zhipu AI API (GLM-4.6 model)
- `chatCompletion()` - Full API call with options
- `chat()` - Simplified interface for common use cases
- `chatStream()` - Async generator for streaming responses
- Environment variable: `ZHIPU_API_KEY` must be set in `.env.local`

#### Prompt Engineering (`lib/prompts/`)
- `PRD_GENERATION_PROMPT(idea)` - Main PRD generation template
- `SYSTEM_PROMPT` - Defines AI role and output format
- Strict JSON schema ensures consistent AI output

#### Frontend (`app/page.tsx`)
- Single-page application with sidebar and main content area
- Uses React hooks for state management
- `PRDViewer` component displays generated PRDs
- Error handling with toast-style messages

### Data Flow

1. User inputs product idea → POST `/api/prd/generate`
2. API validates input (Zod) → Creates Session in DB
3. API calls Zhipu AI with structured prompt
4. AI returns JSON PRD → API parses and saves to DB
5. Frontend displays PRD using `PRDViewer` component
6. Session history maintained via `/api/sessions`

### Important Notes

- **Prisma Version**: Currently using Prisma v5 (v7 caused compatibility issues)
- **Database URL**: Set in `.env.local` as `DATABASE_URL=file:./dev.db`
- **Next.js 16**: Route params are now Promises - always use `await params`
- **Zhipu AI**: Requires valid API key in environment variables
- **JSON Storage**: Complex PRD fields stored as JSON strings in SQLite, parsed on retrieval
