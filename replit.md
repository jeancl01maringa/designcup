# Design para Estética - Sistema de Modelos

## Overview
Design para Estética is a web platform for designers and aesthetics professionals, offering editable templates in multiple formats (Feed, Stories, Poster, etc.) for visual content creation. It combines a robust frontend-backend architecture with Supabase integration for storage and authentication, and Hotmart integration for premium subscription management. The project's vision is to provide a comprehensive tool that streamlines content creation for aesthetics professionals, leveraging market potential for visual marketing in this sector.

## User Preferences
Preferred communication style: Simple, everyday language.
User expresses frustration with credit consumption due to technical issues - prioritize working solutions over extensive debugging.

## System Architecture
The application uses a modern full-stack architecture.

**UI/UX Decisions:**
- Uses `shadcn/ui` for consistent and responsive components.
- The main title gradient on the homepage is a vibrant orange gradient (#F84930 to #F8A441).
- Premium features are symbolized by crown icons instead of stars, with a custom crown favicon using brand gradient colors.
- Premium buttons across the platform use the logo colors (#F84830 to #F8A441).
- Login/register pages feature a centralized modal layout with aesthetic background images, a centered white modal, and the official logo. Buttons use brand gradient colors.
- Category section mobile UX is optimized for smooth scrolling without "samba" effect.
- "Useful Tools" display blue buttons, rounded image placeholders, and gray titles for consistent branding.

**Technical Implementations:**
- **Frontend**: React 18 + TypeScript with Vite. Uses React Router for SPA navigation. Implements custom hooks for authentication and post actions.
- **Backend**: Express.js with TypeScript, providing a RESTful API for authentication, CRUD operations on posts, categories, users, and file uploads.
- **Authentication**: Session-based authentication with password hashing using `scrypt`.
- **File Upload**: Advanced system with automatic format conversion - images (PNG/JPG) to WebP for optimization, and videos/GIFs (MP4/GIF) to WebM for fast web previews using FFmpeg with VP8 codec and optimized settings for lightweight streaming.
- **Data Flow**: Login via email/password, content navigation, admin interface for content upload (image compression, Supabase storage, PostgreSQL post creation), and Hotmart webhook for premium subscription management.
- **Data Models**: Comprehensive management for Users (free/premium, subscription data), Posts (multiple formats, `group_id`, premium fields), Categories (hierarchical, post count), and Subscriptions (integrated with Hotmart).
- **Search Functionality**: Enhanced post filtering in the admin panel and public search components, supporting search by title/ID, category, format, license type, and visibility.
- **Feed Display**: Optimized home feed limited to 8 lines of posts, ensuring balanced distribution across columns. Anti-duplication logic prioritizes "Cartaz" format. Feed filtering includes "Em alta" (randomized), "Recentes" (newest), and "Antigos" (oldest).

**System Design Choices:**
- **Database**: PostgreSQL hosted on Neon with Drizzle ORM for type-safety and migrations.
- **Storage**: Supabase Storage for images (posts, profiles, logos) with public buckets.
- **Webhook Integration**: Dedicated endpoint for Hotmart webhooks to manage automatic subscriptions and trigger email automations via Brevo.
- **Email Automation**: Integration with Brevo for automated welcome emails, purchase confirmations, cancellation notifications, and admin alerts using template system with dynamic parameters.
- **Community Features**: Lesson rating system with database-persisted community ratings, average calculation, and storage of comments.
- **Analytics**: Comprehensive UTM campaign tracking system for granular advertising performance analysis and Facebook Pixel integration for conversion tracking and customer behavior analytics (PageView, Search, ViewContent, Purchase events).

## External Dependencies
- **Supabase**: File storage and data operations.
- **Neon PostgreSQL**: Primary cloud-hosted database.
- **Hotmart**: Full integration for subscription and payment management, including webhooks for automated user access control.
- **Drizzle ORM**: Type-safe database operations and migrations.
- **TanStack Query**: Server state management with caching.
- **shadcn/ui**: UI component library based on Radix UI and Tailwind CSS.
- **browser-image-compression**: Client-side image compression.
- **Multer**: Server-side middleware for file uploads.
- **Brevo**: Email automation and contact list management.
- **Facebook Pixel**: Web analytics service for tracking user behavior and conversions.
```