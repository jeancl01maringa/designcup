/**
 * Utilitário para gerenciar os campos de premium/licença nos posts
 * 
 * Este módulo fornece funções para garantir que os campos license_type e is_pro
 * sejam corretamente interpretados, mesmo quando há discrepância entre o PostgreSQL
 * e o Supabase.
 */

import { Post } from "@shared/schema";

/**
 * Normaliza os campos license_type e is_pro de um post
 * Lida com diferentes nomenclaturas e garante valores consistentes
 * 
 * @param post O objeto post a ser normalizado
 * @returns O mesmo objeto, mas com campos premium normalizados
 */
export function normalizePremiumFields(post: any): Post {
  if (!post) return post;
  
  // Garantir valores padrão para os campos premium
  const licenseType = post.license_type || post.licenseType || 'free';
  const isPro = typeof post.is_pro !== 'undefined' ? post.is_pro : 
               typeof post.isPro !== 'undefined' ? post.isPro : false;
  
  // Se licenseType está definido como premium, isPro deve ser true
  const normalizedIsPro = licenseType === 'premium' ? true : isPro;
  
  // Se isPro é true, licenseType deve ser premium
  const normalizedLicenseType = normalizedIsPro ? 'premium' : 'free';
  
  // Atualizar objeto no formato que a aplicação espera (camelCase)
  post.licenseType = normalizedLicenseType;
  post.isPro = normalizedIsPro;
  
  // Garantir que também temos os campos no formato do banco (snake_case)
  post.license_type = normalizedLicenseType;
  post.is_pro = normalizedIsPro;
  
  return post as Post;
}

/**
 * Adiciona os campos de licença premium padrão se estiverem ausentes
 * 
 * @param post O objeto post para garantir que tenha campos premium
 * @param defaultPremium Se true, define como premium por padrão
 * @returns O post com campos premium garantidos
 */
export function ensurePremiumFields(post: any, defaultPremium: boolean = false): Post {
  if (!post) return post;
  
  // Definir valores padrão se não existirem
  if (typeof post.licenseType === 'undefined' && typeof post.license_type === 'undefined') {
    post.licenseType = defaultPremium ? 'premium' : 'free';
  }
  
  if (typeof post.isPro === 'undefined' && typeof post.is_pro === 'undefined') {
    post.isPro = defaultPremium;
  }
  
  // Normalizar para garantir consistência
  return normalizePremiumFields(post);
}

/**
 * Extrai estado premium de um post mesmo quando os campos estão ausentes
 * Útil para renderização condicional na interface
 * 
 * @param post O objeto post para verificar
 * @returns true se o post é premium, false caso contrário
 */
export function isPostPremium(post: any): boolean {
  if (!post) return false;
  
  // Verificar todas as possíveis fontes da informação
  return (
    post.isPro === true || 
    post.is_pro === true || 
    post.licenseType === 'premium' || 
    post.license_type === 'premium'
  );
}

/**
 * Prepara um objeto post para envio via API
 * Garante que os campos premium estejam no formato correto
 * 
 * @param post O objeto post a ser preparado
 * @returns O post pronto para envio
 */
export function preparePostForApi(post: any): any {
  if (!post) return post;
  
  // Normalizar campos premium
  const normalizedPost = normalizePremiumFields(post);
  
  // Remover duplicidades para evitar confusão
  const { isPro, licenseType, ...rest } = normalizedPost;
  
  // Retornar no formato adequado para a API
  return {
    ...rest,
    is_pro: isPro,
    license_type: licenseType
  };
}