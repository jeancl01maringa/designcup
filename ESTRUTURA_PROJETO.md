# ESTRUTURA COMPLETA DO PROJETO - Design para Estética

## PROBLEMA ATUAL
- Erro 404 ao navegar entre formatos na página de arte individual
- Rota `/arte/:slug` estava faltando no App.tsx (CORRIGIDO)
- Sistema de navegação entre formatos precisa funcionar corretamente

## ARQUITETURA GERAL

### FRONTEND (React + TypeScript)
```
client/
├── src/
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── layout/ (Header, Footer, Sidebar)
│   │   ├── home/ (ArtworkCard, etc)
│   │   └── admin/ (PostForm, PostManager)
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── ArtDetailPage.tsx (PÁGINA PRINCIPAL DO PROBLEMA)
│   │   ├── Categories.tsx
│   │   ├── admin/ (painel administrativo)
│   │   └── account/ (perfil do usuário)
│   ├── hooks/
│   │   ├── use-auth.tsx
│   │   └── use-post-actions.tsx
│   ├── lib/
│   │   ├── queryClient.ts
│   │   ├── supabase.ts
│   │   └── protected-route.tsx
│   └── App.tsx (ROTEAMENTO PRINCIPAL)
```

### BACKEND (Express + TypeScript)
```
server/
├── auth.ts (autenticação)
├── routes.ts (todas as rotas da API)
├── storage.ts (interface com banco)
├── supabase-upload.ts (upload de imagens)
└── vite.ts (servidor principal)
```

### BANCO DE DADOS (PostgreSQL + Supabase)
```
Tabelas principais:
- users (usuários)
- posts (artes/templates)
- categories (categorias)
- plans (planos premium)
- likes, saves (interações)
- sessions (sessões)
```

## SISTEMA DE FORMATOS

### CONCEITO
- Cada formato tem ID único (ex: post 50 = Feed, post 51 = Stories)
- Formatos do mesmo grupo são conectados via `groupId`
- Navegação: `/arte/50-titulo` → `/arte/51-titulo`

### FLUXO ATUAL
1. Usuário acessa `/arte/50-xxx`
2. Sistema carrega post 50 e busca posts relacionados do mesmo grupo
3. Interface mostra outros formatos disponíveis
4. Ao clicar em outro formato, navega para `/arte/51-xxx`

### COMPONENTES ENVOLVIDOS

#### ArtDetailPage.tsx (PRINCIPAL)
- Recebe parâmetro `slug` da URL
- Extrai ID do post do slug
- Carrega dados do post via API
- Busca posts relacionados do mesmo grupo
- Renderiza interface de navegação entre formatos

#### App.tsx (ROTEAMENTO)
```tsx
<Route path="/arte/:slug" component={ArtDetailPage} />
```

#### API Endpoints
```
GET /api/admin/posts/:id - busca post individual
GET /api/admin/posts/related/:groupId - busca posts do grupo
GET /api/posts/:id/status - status de like/save
```

## PROBLEMA ESPECÍFICO DO ERRO 404

### CAUSA
- Rota `/arte/:slug` não existia no App.tsx
- Sistema tentava navegar para URL não registrada

### SOLUÇÃO APLICADA
- Adicionada rota `/arte/:slug` no App.tsx
- Mantidas rotas existentes `/artes/:slug` para compatibilidade

### NAVEGAÇÃO ENTRE FORMATOS

#### Lógica de Navegação
```tsx
// Ao clicar em formato diferente
onClick={() => {
  const formatSlug = `${format.id}-${post.title.toLowerCase()...}`;
  setLocation(`/arte/${formatSlug}`);
}}
```

#### Interface de Formatos
1. **Formato Atual**: Destacado como "Atual" no topo
2. **Outros Formatos**: Lista expansível dos formatos disponíveis
3. **Navegação por Pontos**: Pontos na imagem para alternar formatos

## ESTRUTURA DE DADOS

### Post Object
```typescript
{
  id: number,
  title: string,
  groupId: string,
  formato: string, // "Feed", "Stories", etc
  imageUrl: string,
  isPro: boolean,
  // ... outros campos
}
```

### Available Formats
```typescript
{
  id: number,
  name: string,
  formato: string,
  previewUrl: string,
  dimensions: string,
  isCurrent: boolean
}
```

## TECNOLOGIAS

### Frontend
- React 18 + TypeScript
- Wouter (roteamento)
- TanStack Query (cache/API)
- Tailwind CSS + shadcn/ui
- Lucide React (ícones)

### Backend  
- Express.js + TypeScript
- Passport.js (autenticação)
- Drizzle ORM
- Multer (upload files)

### Database & Storage
- PostgreSQL (Neon)
- Supabase (storage + auth)
- Session store

### Build & Dev
- Vite
- ESBuild
- TypeScript

## FLUXO DE AUTENTICAÇÃO
1. Login via username/password
2. Session armazenada no PostgreSQL
3. Cache no frontend via TanStack Query
4. Proteção de rotas via ProtectedRoute

## SISTEMA PREMIUM
- Usuários free vs premium
- Posts com licença comercial/pessoal
- Controle de acesso a downloads

## UPLOAD DE IMAGENS
1. Compressão automática para WebP
2. Upload para Supabase Storage
3. Organização por categorias
4. URLs públicas geradas automaticamente

## PONTOS CRÍTICOS PARA DEBUGGING

### 1. Roteamento
- Verificar se todas as rotas estão registradas em App.tsx
- Conferir parâmetros de URL (slug vs id)

### 2. API Integration
- Endpoints corretos em server/routes.ts
- Cache invalidation no frontend
- Error handling

### 3. Estado do Frontend
- useState para selectedFormat
- useEffect para carregar dados
- Condicional rendering

### 4. Navegação Entre Formatos
- Construção correta do slug
- setLocation para mudança de rota
- Atualização dos dados na nova página

## COMANDOS ÚTEIS

### Desenvolvimento
```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build       # Build de produção
```

### Database
```bash
npx tsx [script].ts  # Executa scripts de migração
```

### Debug
- Console logs no frontend e backend
- Network tab para verificar chamadas API
- React DevTools para estado dos componentes

---

**RESUMO DO ERRO atual:**
O sistema estava tentando navegar para `/arte/ID-titulo` mas essa rota não existia no App.tsx. Foi adicionada a rota necessária. Agora a navegação entre formatos deve funcionar corretamente, com cada formato tendo sua página individual mas mantendo a conexão de grupo para edição em lote.