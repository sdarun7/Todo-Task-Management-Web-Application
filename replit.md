# REST Express - Full-Stack Task Management Application

## Overview

REST Express is a modern full-stack task management web application built with React frontend and Express.js backend. The application uses a monorepo structure with TypeScript throughout, providing a type-safe development experience. It features Firebase authentication, task sharing capabilities, and real-time database operations using PostgreSQL with Drizzle ORM.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and JSX
- **Build Tool**: Vite with custom configuration for development and production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) v5 for server state management and caching
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for consistent theming
- **Form Management**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with TypeScript (ESM modules)
- **Framework**: Express.js with custom middleware for request logging
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database serverless PostgreSQL
- **Authentication**: Firebase Authentication with Admin SDK for token verification
- **API Design**: RESTful API with proper HTTP status codes and error handling

### Database Schema Design
The application uses three main database tables:
- **users**: Stores user authentication and profile data with Firebase UID mapping
- **tasks**: Main task entity with comprehensive task management fields (title, description, status, priority, due dates)
- **taskShares**: Junction table enabling task sharing between users with permission controls (view/edit)

## Key Components

### Authentication System
- **Firebase Authentication**: Multiple providers (Google, Facebook, GitHub, email/password)
- **Server-side Verification**: Firebase Admin SDK for secure token verification
- **Context Management**: React Context API for authentication state
- **Protected Routes**: Middleware for secure API endpoint access
- **User Management**: Automatic user creation and profile synchronization

### Task Management System
- **CRUD Operations**: Full Create, Read, Update, Delete functionality for tasks
- **Task Properties**: Title, description, status (todo/inprogress/completed), priority (low/medium/high), due dates
- **Search and Filter**: Multi-dimensional filtering by status, priority, and search terms
- **Real-time Updates**: Optimistic updates with TanStack Query for smooth UX

### Task Sharing System
- **Permission-based Sharing**: Share tasks with other users via email
- **Access Control**: View-only or edit permissions for shared tasks
- **Collaborative Features**: Multiple users can work on shared tasks

### UI Components
- **Design System**: shadcn/ui components for consistent interface
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Accessibility**: Built on Radix UI primitives for WCAG compliance
- **Dark Mode Support**: CSS variables for seamless theme switching

## Data Flow

1. **Authentication Flow**:
   - User authenticates via Firebase (multiple providers)
   - Frontend receives Firebase ID token
   - Token sent to backend for verification via Firebase Admin SDK
   - User record created/retrieved from PostgreSQL database
   - Session maintained client-side with automatic token refresh

2. **Task Management Flow**:
   - Frontend creates task via REST API
   - Backend validates data using Zod schemas
   - Task stored in PostgreSQL via Drizzle ORM
   - TanStack Query invalidates cache and refetches data
   - UI updates optimistically for immediate feedback

3. **Task Sharing Flow**:
   - Owner shares task by entering recipient email
   - System checks if recipient exists, creates user if needed
   - Share record created with specified permissions
   - Shared tasks appear in recipient's task list
   - Permission checks enforce view/edit access

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **Firebase**: Authentication service and user management
- **Replit**: Development environment and deployment platform

### Key Libraries
- **Frontend**: React, Vite, TanStack Query, Wouter, React Hook Form
- **Backend**: Express.js, Drizzle ORM, Firebase Admin SDK
- **UI**: shadcn/ui, Radix UI, Tailwind CSS, Lucide Icons
- **Validation**: Zod for runtime type checking and validation
- **Utilities**: date-fns for date manipulation, clsx for conditional styling

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with HMR and Express.js backend
- **Environment Variables**: DATABASE_URL, Firebase configuration
- **Database Migrations**: Drizzle Kit for schema management

### Production Build
- **Frontend**: Vite builds optimized React bundle
- **Backend**: esbuild compiles TypeScript server code
- **Static Assets**: Frontend served from Express.js in production
- **Database**: PostgreSQL connection via environment variables

### Build Commands
- `npm run dev`: Development server with hot reload
- `npm run build`: Production build for both frontend and backend
- `npm run start`: Production server
- `npm run db:push`: Apply database schema changes

## Changelog

Changelog:
- July 01, 2025. Initial setup
- July 01, 2025. Fixed database storage issues and implemented task sharing with automatic user creation
- July 01, 2025. Added WebSocket real-time functionality for live task updates

## User Preferences

Preferred communication style: Simple, everyday language.