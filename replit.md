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

## User Preferences

Preferred communication style: Simple, everyday language.