# Design para Estética - Replit Project Guide

## Overview

This is a full-stack web application for a design platform called "Design para Estética" that provides premium and free design templates for esthetics professionals. The platform manages user subscriptions, content distribution, and integrates with Hotmart for payment processing.

## System Architecture

**Frontend**: React with TypeScript, using Vite as build tool and shadcn/ui for components
**Backend**: Express.js server with TypeScript
**Database**: PostgreSQL with Supabase as the managed database service
**Storage**: Supabase Storage for image and file management
**Authentication**: Custom authentication system with admin roles
**Payment Integration**: Hotmart webhook integration for subscription management

## Key Components

### Frontend Architecture (`client/`)
- **React Router** for navigation between pages
- **Components Structure**:
  - `ui/` - shadcn/ui reusable components
  - `layout/` - Header, Footer, Sidebar components
  - `home/` - ArtworkCard and home-related components
  - `admin/` - Administrative panel components
- **Pages**:
  - `Home.tsx` - Main landing page with design templates
  - `ArtDetailPage.tsx` - Individual artwork detail view
  - `Categories.tsx` - Template categories browser
  - `admin/` - Admin panel for content management
  - `account/` - User profile and subscription management
- **Hooks**: Custom hooks for authentication and post actions
- **State Management**: React Query for server state management

### Backend Architecture (`server/`)
- **Express Server** (`vite.ts`) - Main server entry point
- **Authentication** (`auth.ts`) - User authentication and session management
- **API Routes** (`routes.ts`) - All REST API endpoints
- **Database Layer** (`storage.ts`) - Database interface and queries
- **File Upload** (`supabase-upload.ts`) - Image and file upload handling

### Database Schema
**Core Tables**:
- `users` - User accounts with subscription status and admin roles
- `posts` - Design templates with premium/free licensing
- `categories` - Template categorization system
- `subscriptions` - User subscription tracking (Hotmart integration)
- `plans` - Available subscription plans
- Supporting tables for likes, saves, tags, and file formats

## Data Flow

1. **User Registration/Login**: Custom authentication with JWT tokens
2. **Content Browsing**: Public access to free templates, premium requires subscription
3. **File Upload**: Admins upload design templates via Supabase Storage
4. **Subscription Management**: Hotmart webhooks automatically manage user access
5. **Template Access**: License-based access control (free vs premium content)

## External Dependencies

### Payment Processing
- **Hotmart Integration**: Webhook endpoint `/webhook/hotmart` processes subscription events
- **Supported Events**: Purchase approval, cancellations, refunds, chargebacks
- **Automatic User Management**: Creates/updates user accounts based on purchase events

### Storage and Database
- **Supabase**: PostgreSQL database and file storage
- **Neon Database**: Alternative PostgreSQL connection (configured for WebSocket support)
- **Image Processing**: SVG generation for placeholder images

### Development Tools
- **Drizzle ORM**: Database schema management and migrations
- **TypeScript**: Full type safety across frontend and backend
- **Vite**: Development server and build tool

## Deployment Strategy

**Platform**: Replit with autoscale deployment
**Build Process**: `npm run build` compiles both client and server
**Runtime**: Node.js 20 with PostgreSQL 16 module
**Port Configuration**: Internal port 5000, external port 80
**Environment Variables**: Database URLs, Supabase keys, and API secrets

**Key Scripts**:
- Multiple database migration and setup scripts for table creation
- Image fixing and URL correction utilities
- User management and admin creation tools
- Hotmart integration testing and validation scripts

## Changelog
- June 23, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.