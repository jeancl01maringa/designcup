/**
 * Utilitário para lidar com os campos premium dos posts
 * 
 * Este arquivo contém funções para normalizar o acesso aos campos premium
 * (license_type e is_pro) que podem estar inacessíveis devido a inconsistências
 * entre o banco de dados PostgreSQL direto e o Supabase.
 */

import { Post } from '@shared/schema';

/**
 * Normaliza os campos premium de um post, garantindo consistência entre
 * os campos license_type e is_pro.
 * 
 * @param post O post com os campos a serem normalizados
 * @returns O mesmo post com os campos normalizados
 */
export function normalizePremiumFields(post: Post): Post {
  // Se temos o valor de license_type, confiar nele
  if (post.licenseType) {
    // Garantir que isPro seja coerente com licenseType
    post.isPro = post.licenseType === 'premium';
  } 
  // Se não temos license_type mas temos isPro, definir licenseType com base em isPro
  else if (post.isPro !== undefined && post.isPro !== null) {
    post.licenseType = post.isPro ? 'premium' : 'free';
  } 
  // Se nenhum dos campos estiver definido, definir com valores padrão
  else {
    post.isPro = false;
    post.licenseType = 'free';
  }

  return post;
}

/**
 * Garante que um post tenha os campos premium (license_type e is_pro)
 * preenchidos de forma consistente, mesmo quando o Supabase não retorna
 * esses campos devido a problemas de cache.
 * 
 * @param post O post a ser verificado e normalizado
 * @returns O post com os campos premium garantidos
 */
export function ensurePremiumFields(post: any): Post {
  // Se não tiver licenseType nem isPro, definir como não premium por padrão
  if (post.licenseType === undefined && post.isPro === undefined) {
    post.licenseType = 'free';
    post.isPro = false;
  }
  
  return normalizePremiumFields(post as Post);
}

/**
 * Verifica se um post é premium com base em seus campos.
 * Usa o campo licenseType se disponível, caso contrário usa isPro.
 * 
 * @param post O post a ser verificado
 * @returns true se o post for premium, false caso contrário
 */
export function isPostPremium(post: Post): boolean {
  // Usar o campo licenseType se disponível
  if (post.licenseType) {
    return post.licenseType === 'premium';
  }
  
  // Caso contrário, usar o campo isPro
  return !!post.isPro;
}