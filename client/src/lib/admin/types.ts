import { Category, Post } from "@shared/schema";

/**
 * Interfaces e tipos usados no painel administrativo
 */

export type PostStatus = 'aprovado' | 'rascunho' | 'rejeitado';

export type OrderBy = 'asc' | 'desc';

export interface FilterOptions {
  searchTerm?: string;
  categoryId?: number;
  status?: PostStatus;
  year?: number;
  month?: number;
  dateRange?: {
    from: Date;
    to: Date;
  };
  orderBy?: {
    field: string;
    direction: OrderBy;
  };
  page?: number;
  pageSize?: number;
}

export interface TableColumn<T> {
  key: string; // Chave única da coluna
  header: string; // Texto de header
  sortable?: boolean; // Se a coluna é ordenável
  render?: (item: T) => React.ReactNode; // Renderização customizada
  width?: string; // Largura CSS - ex. "150px", "15%"
  minWidth?: string; // Largura mínima
  align?: 'left' | 'center' | 'right'; // Alinhamento do texto
  className?: string; // Classes CSS adicionais
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}

export interface FiltersState {
  search: string;
  status: PostStatus | 'all';
  category: number | 'all';
  dateOption: 'all' | 'month' | 'range';
  month: number;
  year: number;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
}

export interface PostWithCategory extends Post {
  category?: Category;
}

// Tipos de IDs para ações
export type ActionableId = number | string;
export type ActionableIds = ActionableId[];