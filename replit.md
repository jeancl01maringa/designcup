# Design para Estética - Sistema de Modelos

## Overview

Design para Estética é uma plataforma web para designers e profissionais de estética que oferece modelos editáveis em múltiplos formatos (Feed, Stories, Cartaz, etc.) para criação de conteúdo visual. O sistema combina uma arquitetura frontend-backend robusta com integração ao Supabase para storage e autenticação, além de integração com a Hotmart para gestão de assinaturas premium.

## System Architecture

A aplicação utiliza uma arquitetura full-stack moderna:

**Frontend**: React 18 + TypeScript com Vite como bundler, implementando components baseados em shadcn/ui para uma interface consistente e responsiva.

**Backend**: Express.js com TypeScript servindo uma API REST robusta, incluindo autenticação baseada em sessão, upload de arquivos, e webhooks para integração com serviços externos.

**Database**: PostgreSQL hospedado no Neon, com Drizzle ORM para type-safety e migrations. O Supabase é usado como camada adicional para storage de arquivos e algumas operações de dados.

**Storage**: Supabase Storage para imagens de posts, perfis e logos, com buckets públicos configurados para acesso direto.

## Key Components

### Frontend Architecture
- **Pages**: Componentes de página principal (Home, ArtDetailPage, Categories, Admin)
- **Components**: Sistema modular com UI components (shadcn), layout components, e components específicos para admin e home
- **Hooks**: Custom hooks para autenticação (`use-auth`) e ações de posts (`use-post-actions`)
- **Routing**: React Router implementado em App.tsx para navegação SPA

### Backend Architecture
- **API Routes**: Sistema de rotas RESTful em `server/routes.ts` cobrindo autenticação, CRUD de posts, categorias, usuários e uploads
- **Authentication**: Sistema de autenticação baseado em sessão com hashing de senhas usando scrypt
- **File Upload**: Sistema robusto de upload com compressão de imagens e múltiplos formatos suportados
- **Webhook Integration**: Endpoint dedicado para webhooks da Hotmart gerenciando assinaturas automáticas

### Data Models
- **Users**: Gestão completa de usuários com tipos (free/premium), dados de assinatura e perfis
- **Posts**: Sistema flexível de posts com suporte a múltiplos formatos, agrupamento por `group_id`, e campos premium
- **Categories**: Sistema hierárquico de categorias com contagem automática de posts
- **Subscriptions**: Gestão de assinaturas integrada com Hotmart para controle de acesso premium

## Data Flow

1. **Autenticação**: Login via email/senha → Validação no backend → Criação de sessão → Estado global via React Context
2. **Navegação de Conteúdo**: Home page → Lista de posts com filtros → Detalhes do post → Múltiplos formatos por grupo
3. **Upload de Conteúdo**: Admin interface → Upload de imagem → Compressão automática → Storage no Supabase → Criação de post no PostgreSQL
4. **Gestão Premium**: Webhook Hotmart → Validação de assinatura → Atualização automática de tipo de usuário → Controle de acesso a conteúdo premium

## External Dependencies

### Core Infrastructure
- **Supabase**: Storage de arquivos, algumas operações de dados, e potencial expansão para real-time features
- **Neon PostgreSQL**: Database principal hospedado na nuvem com conexões serverless
- **Hotmart**: Integração completa para gestão de assinaturas e pagamentos automáticos

### Development Tools
- **Drizzle ORM**: Type-safe database operations com support para migrations automáticas
- **TanStack Query**: Gerenciamento de estado servidor com cache inteligente e synchronização automática
- **shadcn/ui**: Sistema de componentes consistente baseado em Radix UI e Tailwind CSS

### File Processing
- **browser-image-compression**: Compressão automática de imagens no cliente para otimização de performance
- **Multer**: Middleware para upload de arquivos no servidor com validação de tipos

## Deployment Strategy

A aplicação está configurada para deployment no Replit com as seguintes características:

- **Build Process**: Vite para bundling otimizado do frontend
- **Runtime**: Node.js 20 com hot-reload em desenvolvimento
- **Database**: Conexão automática ao Neon PostgreSQL via DATABASE_URL
- **Environment**: Configuração via variáveis de ambiente para Supabase, Hotmart e database
- **Scaling**: Configuração para autoscale baseado em demanda

## Changelog

Changelog:
- June 23, 2025. Initial setup
- June 23, 2025. Updated Assinaturas page table structure per user request: Status, Origem, Criado em, Expira em, Transação, Ações (3-dot menu). Removed price column from display while maintaining full Hotmart plan data capture in backend.
- June 23, 2025. Fixed critical Hotmart webhook bug: corrected user creation API to only use valid database fields, implemented proper password hashing with scrypt, and verified complete webhook functionality for both purchase approval and cancellation flows.
- June 23, 2025. Implemented corrected Hotmart webhook following user's documented model: plan data, expiration dates, and transaction codes now come directly from Hotmart webhook dispatches rather than local configurations. Webhook captures real Hotmart plan details including name, price, currency, and transaction ID for complete subscription management.
- June 24, 2025. Completed comprehensive Brevo email automation integration: automated welcome emails for new users, purchase confirmations via Hotmart webhook, cancellation notifications, admin alerts for new users and sales, automatic contact list management, and professional HTML email templates. System includes error handling and logging while maintaining platform functionality if email service is unavailable.
- June 25, 2025. Implemented community-based lesson rating system: replaced individual localStorage ratings with database-persisted community ratings. System now calculates average ratings across all users for each lesson, stores ratings and comments in lesson_ratings/lesson_comments tables, and displays real-time community averages with rating counts. Also removed "Módulo principal" and "Mostrar turmas" labels from admin modules page per user request.
- July 1, 2025. Enhanced homepage design: updated main title gradient from brown (#AA5E2F to #C8763A) to vibrant orange gradient (#F84930 to #F8A441) matching the platform logo colors. This improves visual consistency and brand alignment across the homepage hero section.
- July 1, 2025. Updated premium branding consistency: replaced star icons with crown icons throughout the platform to better symbolize premium features. Created custom favicon with crown design using brand gradient colors (#F84930 to #F8A441) for professional visual identity. Removed emoji icons from section headers for cleaner, more professional appearance.
- July 1, 2025. Enhanced category section mobile UX: fixed horizontal scroll instability by removing infinite scroll loop, implemented proper scroll boundaries and touch controls, corrected border clipping issues by adjusting container padding. Categories now navigate smoothly without "samba" effect on mobile devices.
- July 1, 2025. Applied brand gradient to premium buttons: updated all "Assine o Premium" buttons across Header, ArtDetailPage, and UserDropdownMenu to use logo colors (#F84830 to #F8A441) for consistent premium branding throughout the platform.
- July 1, 2025. Implemented comprehensive UTM campaign tracking system: added utm_campaign field to traffic_investments table, updated API routes for UTM data capture, enhanced monetization dashboard with UTM performance analytics. Users can now track ROAS per specific campaign (e.g., facebook_ads_botox, google_ads_harmonizacao) for granular advertising performance analysis.
- July 2, 2025. Fixed mobile UX issues: removed premium button from mobile header and relocated to hamburger menu for cleaner interface. Eliminated vertical scrolling interference in categories section by removing touchAction and overscrollBehavior properties that were causing "swaying" effect during page scroll.
- July 2, 2025. Resolved lesson video player title duplication issue: removed broken desktop JSX structure in LessonViewPage that was causing duplicate titles. Repositioned mobile lesson action controls (rating, completion, navigation) from sidebar to main content area below video player for better UX. Created clean, single responsive layout that works properly on both mobile and desktop.
- July 2, 2025. Implemented complete "Ferramentas Úteis" (Useful Tools) system: created database schema with tools and tool_categories tables, built public tools page with search and filtering, developed admin management interface with CRUD operations and image upload support, added navigation links to main menu and admin sidebar. Tools now feature blue buttons matching Canva edit style, rounded image placeholders, and consistent branding with gray titles instead of orange gradients.
- July 8, 2025. Enhanced search functionality across platform: implemented comprehensive post filtering system in admin panel with search by title/ID, category, format, license type, and visibility filters. Extended ID-based search capability to all public search components (SearchSection, MobileSearchBar, Categories page). Users can now search by exact post ID numbers in addition to text search, with automatic navigation to post pages when numeric IDs are detected. Fixed database column reference from "format_id" to "formato" for proper filtering functionality. Corrected ID-based navigation to use `/preview/:id` route instead of `/post/:id` for proper post access.
- July 10, 2025. Fixed critical category routing issue: some categories from home page (HOF, Labial, Laser, Sobrancelhas) were showing "not found" due to incomplete category mapping in ArtworkGrid component. Updated hardcoded category map to include all existing categories (IDs 10-13) with correct slug mappings, ensuring all category links from home page properly display their posts.
- July 10, 2025. Cleaned up category filter displays in TodasArtesOptimized page: removed unnecessary "(0)" post count indicators from category dropdown options in both desktop and mobile filter interfaces. Category dropdowns now show only clean category names without confusing zero-count numbers.

## User Preferences

Preferred communication style: Simple, everyday language.
User expresses frustration with credit consumption due to technical issues - prioritize working solutions over extensive debugging.