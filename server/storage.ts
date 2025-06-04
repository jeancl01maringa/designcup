import { 
  users, type User, type InsertUser,
  artworks, type Artwork, type InsertArtwork,
  favorites, type Favorite, type InsertFavorite,
  userArtworks, type UserArtwork, type InsertUserArtwork,
  categories, type Category, type InsertCategory,
  posts, type Post, type InsertPost,
  plans, type Plan, type InsertPlan,
  tags, type Tag, type InsertTag,
  postTags, type PostTag,
  postStatusEnum
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, like, or, desc } from "drizzle-orm";
import { supabase } from "./supabase-client";
import { normalizePremiumFields, ensurePremiumFields, isPostPremium } from "./utils/post-premium-handler";

// Função utilitária para gerar slugs a partir de um nome
function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Espaços para hífens
    .replace(/[^\w-]+/g, '') // Remove caracteres não-palavra
    .replace(/--+/g, '-') // Múltiplos hífens para um único
    .replace(/^-+/, '') // Remove hífens do início
    .replace(/-+$/, ''); // Remove hífens do final
}

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(id: number, data: { username: string; email: string }): Promise<User>;
  updateUserProfileImage(id: number, imageUrl: string): Promise<User>;
  
  // Artwork methods
  getArtworks(): Promise<Artwork[]>;
  getArtworkById(id: number): Promise<Artwork | undefined>;
  searchArtworks(query: string): Promise<Artwork[]>;
  getArtworksByCategory(category: string): Promise<Artwork[]>;
  createArtwork(artwork: InsertArtwork): Promise<Artwork>;
  
  // Favorite methods
  getFavoritesByUserId(userId: number): Promise<Artwork[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: number, artworkId: number): Promise<void>;
  
  // UserArtwork methods
  getUserArtworksByUserId(userId: number): Promise<Artwork[]>;
  addUserArtwork(userArtwork: InsertUserArtwork): Promise<UserArtwork>;
  
  // Category methods (for admin panel)
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<{ success: boolean; postsUpdated: number }>;
  
  // Post methods (for admin panel)
  getPosts(filters?: {
    searchTerm?: string;
    categoryId?: number;
    status?: string;
    month?: number;
    year?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Post[]>;
  getPostById(id: number): Promise<Post | undefined>;
  getPostsByGroupId(groupId: string): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, post: Partial<InsertPost>): Promise<Post>;
  deletePost(id: number): Promise<void>;
  updatePostStatus(ids: number[], status: 'aprovado' | 'rascunho' | 'rejeitado'): Promise<void>;
  
  // Plan methods (for admin panel)
  getPlans(showInactive?: boolean): Promise<Plan[]>; 
  getPlanById(id: number): Promise<Plan | undefined>;
  createPlan(plan: InsertPlan): Promise<Plan>;
  updatePlan(id: number, plan: Partial<InsertPlan>): Promise<Plan>;
  deletePlan(id: number): Promise<void>;
  togglePlanStatus(id: number, isActive: boolean): Promise<Plan>;
  
  // Tag methods (for SEO management)
  getTags(): Promise<Tag[]>;
  getTagById(id: number): Promise<Tag | undefined>;
  getTagBySlug(slug: string): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;
  updateTag(id: number, tag: Partial<InsertTag>): Promise<Tag>;
  deleteTag(id: number): Promise<void>;
  toggleTagStatus(id: number, isActive: boolean): Promise<Tag>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    try {
      console.log("DATABASE getUser - Buscando usuário com ID:", id);
      
      // Tentar primeiro no PostgreSQL direto (onde estão os dados reais)
      const result = await pool.query(`
        SELECT id, username, email, password, is_admin, created_at, telefone, profile_image, tipo, plano_id, data_vencimento, active
        FROM users 
        WHERE id = $1 OR (username = 'admin' AND $1 = 2)
        LIMIT 1
      `, [id]);

      if (!result.rows || result.rows.length === 0) {
        console.log(`DATABASE getUser - Nenhum usuário encontrado com ID ${id} no PostgreSQL`);
        return undefined;
      }

      const data = result.rows[0];
      
      // Log para depuração
      console.log("DATABASE getUser - Dados brutos do usuário:", JSON.stringify(data));
      
      console.log("DATABASE getUser - is_admin raw value:", data.is_admin, "tipo:", typeof data.is_admin);
      
      // Converter os dados para o formato do User
      const user: User = {
        id: data.id,
        username: data.username,
        email: data.email,
        password: data.password,
        isAdmin: Boolean(data.is_admin),
        telefone: data.telefone || null,
        profileImage: data.profile_image || null,
        createdAt: new Date(data.created_at),
        tipo: data.tipo || 'free',
        plano_id: data.plano_id || null,
        data_vencimento: data.data_vencimento ? new Date(data.data_vencimento) : null,
        active: Boolean(data.active)
      };

      console.log("DATABASE getUser - isAdmin convertido:", user.isAdmin);
      
      return user;
    } catch (error) {
      console.error("DATABASE getUser - Exceção:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      console.log("DATABASE getUserByUsername - Buscando usuário com username:", username);
      
      // Usar PostgreSQL direto (mesma fonte que getUser)
      const result = await pool.query(`
        SELECT id, username, email, password, is_admin, created_at, telefone, profile_image, tipo, plano_id, data_vencimento, active
        FROM users 
        WHERE username = $1
        LIMIT 1
      `, [username]);

      if (!result.rows || result.rows.length === 0) {
        console.log(`DATABASE getUserByUsername - Nenhum usuário encontrado com username ${username} no PostgreSQL`);
        return undefined;
      }

      const data = result.rows[0];
      
      // Log para depuração
      console.log("DATABASE getUserByUsername - Dados brutos do usuário:", JSON.stringify(data));
      
      console.log("DATABASE getUserByUsername - is_admin raw value:", data.is_admin, "tipo:", typeof data.is_admin);
      
      // Converter os dados para o formato do User
      const user: User = {
        id: data.id,
        username: data.username,
        email: data.email,
        password: data.password,
        isAdmin: Boolean(data.is_admin),
        telefone: data.telefone || null,
        profileImage: data.profile_image || null,
        createdAt: new Date(data.created_at),
        tipo: data.tipo || 'free',
        plano_id: data.plano_id || null,
        data_vencimento: data.data_vencimento ? new Date(data.data_vencimento) : null,
        active: Boolean(data.active)
      };

      console.log("DATABASE getUserByUsername - isAdmin convertido:", user.isAdmin);
      
      return user;
    } catch (error) {
      console.error("DATABASE getUserByUsername - Exceção:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      console.log("DATABASE getUserByEmail - Buscando usuário com email:", email);
      
      // Usar PostgreSQL direto (mesma fonte que getUser)
      const result = await pool.query(`
        SELECT id, username, email, password, is_admin, created_at, telefone, profile_image, tipo, plano_id, data_vencimento, active
        FROM users 
        WHERE email = $1
        LIMIT 1
      `, [email]);

      if (!result.rows || result.rows.length === 0) {
        console.log(`DATABASE getUserByEmail - Nenhum usuário encontrado com email ${email} no PostgreSQL`);
        return undefined;
      }

      const data = result.rows[0];
      
      // Log para depuração
      console.log("DATABASE getUserByEmail - Dados brutos do usuário:", JSON.stringify(data));
      
      console.log("DATABASE getUserByEmail - is_admin raw value:", data.is_admin, "tipo:", typeof data.is_admin);
      
      // Converter os dados para o formato do User
      const user: User = {
        id: data.id,
        username: data.username,
        email: data.email,
        password: data.password,
        isAdmin: Boolean(data.is_admin),
        telefone: data.telefone || null,
        profileImage: data.profile_image || null,
        createdAt: new Date(data.created_at),
        tipo: data.tipo || 'free',
        plano_id: data.plano_id || null,
        data_vencimento: data.data_vencimento ? new Date(data.data_vencimento) : null,
        active: Boolean(data.active)
      };

      console.log("DATABASE getUserByEmail - isAdmin convertido:", user.isAdmin);
      
      return user;
    } catch (error) {
      console.error("DATABASE getUserByEmail - Exceção:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      console.log("DATABASE createUser - Recebendo dados:", JSON.stringify(insertUser));
      
      // Mapear isAdmin para is_admin no banco de dados
      const dbUser = {
        username: insertUser.username,
        email: insertUser.email,
        password: insertUser.password,
        is_admin: insertUser.isAdmin || false,
      };
      
      console.log("DATABASE createUser - Enviando para o banco:", JSON.stringify(dbUser));
      
      // Usar a API do Supabase para criar o usuário
      const { data, error } = await supabase
        .from('users')
        .insert(dbUser)
        .select()
        .single();
      
      if (error) {
        console.error("DATABASE createUser - Erro ao criar usuário:", error.message);
        throw new Error(`Erro ao criar usuário: ${error.message}`);
      }
      
      console.log("DATABASE createUser - Resultado do banco:", JSON.stringify(data));
      
      // Converter is_admin para boolean usando o mesmo método
      const isAdmin = data.is_admin === true || data.is_admin === 't';
      console.log("DATABASE createUser - isAdmin convertido:", isAdmin);
      
      // Mapear para o formato esperado pela aplicação
      const user: User = {
        id: data.id,
        username: data.username,
        email: data.email,
        password: data.password,
        isAdmin: isAdmin,
        createdAt: new Date(data.created_at)
      };
      
      return user;
    } catch (error) {
      console.error("DATABASE createUser - Exceção:", error);
      throw error;
    }
  }

  async updateUserProfile(id: number, data: { username: string; email: string }): Promise<User> {
    try {
      console.log(`DATABASE updateUserProfile - Atualizando perfil do usuário ID: ${id}`);
      
      // Usar a mesma conexão que funciona na autenticação
      const result = await pool.query(`
        UPDATE users 
        SET username = $1, email = $2
        WHERE id = $3
        RETURNING id, username, email, is_admin, created_at, telefone, profile_image, tipo, plano_id, data_vencimento, active
      `, [data.username, data.email, id]);

      if (!result.rows || result.rows.length === 0) {
        throw new Error('Usuário não encontrado para atualização');
      }

      const userData = result.rows[0];
      const user: User = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        password: '', // Não retornar senha
        isAdmin: userData.is_admin || false,
        telefone: userData.telefone || null,
        profileImage: userData.profile_image || null,
        createdAt: new Date(userData.created_at),
        tipo: userData.tipo || 'free',
        plano_id: userData.plano_id || null,
        data_vencimento: userData.data_vencimento ? new Date(userData.data_vencimento) : null,
        active: userData.active || true
      };

      console.log(`DATABASE updateUserProfile - Perfil atualizado com sucesso para usuário ID: ${id}`);
      return user;
    } catch (error) {
      console.error("DATABASE updateUserProfile - Erro:", error);
      throw error;
    }
  }

  async updateUserProfileImage(id: number, imageUrl: string): Promise<User> {
    try {
      console.log(`DATABASE updateUserProfileImage - Atualizando foto do usuário ID: ${id}`);
      
      // Usar a mesma conexão que funciona na autenticação
      const result = await pool.query(`
        UPDATE users 
        SET profile_image = $1
        WHERE id = $2
        RETURNING id, username, email, is_admin, created_at, telefone, profile_image, tipo, plano_id, data_vencimento, active
      `, [imageUrl, id]);

      if (!result.rows || result.rows.length === 0) {
        throw new Error('Usuário não encontrado para atualização de foto');
      }

      const userData = result.rows[0];
      const user: User = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        password: '', // Não retornar senha
        isAdmin: userData.is_admin || false,
        telefone: userData.telefone || null,
        profileImage: userData.profile_image || null,
        createdAt: new Date(userData.created_at),
        tipo: userData.tipo || 'free',
        plano_id: userData.plano_id || null,
        data_vencimento: userData.data_vencimento ? new Date(userData.data_vencimento) : null,
        active: userData.active || true
      };

      console.log(`DATABASE updateUserProfileImage - Foto atualizada com sucesso para usuário ID: ${id}`);
      return user;
    } catch (error) {
      console.error("DATABASE updateUserProfileImage - Erro:", error);
      throw error;
    }
  }
  
  async getArtworks(): Promise<Artwork[]> {
    try {
      console.log("DATABASE getArtworks - Buscando todas as artes");
      
      const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("DATABASE getArtworks - Erro ao buscar artes:", error.message);
        return [];
      }
      
      if (!data || data.length === 0) {
        console.log("DATABASE getArtworks - Nenhuma arte encontrada");
        return [];
      }
      
      // Mapear os dados do Supabase para o formato esperado pela aplicação
      const result = data.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        imageUrl: item.image_url,
        format: item.format,
        isPro: item.is_pro,
        category: item.category,
        createdAt: new Date(item.created_at)
      }));
      
      console.log(`DATABASE getArtworks - Encontradas ${result.length} artes`);
      return result;
    } catch (error) {
      console.error("DATABASE getArtworks - Exceção:", error);
      return [];
    }
  }
  
  async getArtworkById(id: number): Promise<Artwork | undefined> {
    try {
      console.log("DATABASE getArtworkById - Buscando arte com ID:", id);
      
      const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error("DATABASE getArtworkById - Erro ao buscar arte:", error.message);
        return undefined;
      }
      
      if (!data) {
        console.log(`DATABASE getArtworkById - Nenhuma arte encontrada com ID ${id}`);
        return undefined;
      }
      
      // Mapear os dados do Supabase para o formato esperado pela aplicação
      const artwork: Artwork = {
        id: data.id,
        title: data.title,
        description: data.description,
        imageUrl: data.image_url,
        format: data.format,
        isPro: data.is_pro,
        category: data.category,
        createdAt: new Date(data.created_at)
      };
      
      console.log(`DATABASE getArtworkById - Arte encontrada: ${artwork.title}`);
      return artwork;
    } catch (error) {
      console.error("DATABASE getArtworkById - Exceção:", error);
      return undefined;
    }
  }
  
  async searchArtworks(query: string): Promise<Artwork[]> {
    try {
      console.log("DATABASE searchArtworks - Buscando artes com query:", query);
      const lowerQuery = query.toLowerCase();
      
      // Usando a função ilike do Supabase para busca case-insensitive
      const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .or(`title.ilike.%${lowerQuery}%,description.ilike.%${lowerQuery}%,category.ilike.%${lowerQuery}%`);
        
      if (error) {
        console.error("DATABASE searchArtworks - Erro ao buscar artes:", error.message);
        return [];
      }
      
      if (!data || data.length === 0) {
        console.log(`DATABASE searchArtworks - Nenhuma arte encontrada com a query "${query}"`);
        return [];
      }
      
      // Mapear os dados do Supabase para o formato esperado pela aplicação
      const result = data.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        imageUrl: item.image_url,
        format: item.format,
        isPro: item.is_pro,
        category: item.category,
        createdAt: new Date(item.created_at)
      }));
      
      console.log(`DATABASE searchArtworks - Encontradas ${result.length} artes`);
      return result;
    } catch (error) {
      console.error("DATABASE searchArtworks - Exceção:", error);
      return [];
    }
  }
  
  async getArtworksByCategory(category: string): Promise<Artwork[]> {
    try {
      console.log("DATABASE getArtworksByCategory - Buscando artes da categoria:", category);
      
      const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("DATABASE getArtworksByCategory - Erro ao buscar artes:", error.message);
        return [];
      }
      
      if (!data || data.length === 0) {
        console.log(`DATABASE getArtworksByCategory - Nenhuma arte encontrada na categoria "${category}"`);
        return [];
      }
      
      // Mapear os dados do Supabase para o formato esperado pela aplicação
      const result = data.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        imageUrl: item.image_url,
        format: item.format,
        isPro: item.is_pro,
        category: item.category,
        createdAt: new Date(item.created_at)
      }));
      
      console.log(`DATABASE getArtworksByCategory - Encontradas ${result.length} artes na categoria "${category}"`);
      return result;
    } catch (error) {
      console.error("DATABASE getArtworksByCategory - Exceção:", error);
      return [];
    }
  }
  
  async createArtwork(insertArtwork: InsertArtwork): Promise<Artwork> {
    try {
      console.log("DATABASE createArtwork - Recebendo dados:", JSON.stringify(insertArtwork));
      
      // Mapear campos para formato do Supabase (snake_case)
      const dbArtwork = {
        title: insertArtwork.title,
        description: insertArtwork.description,
        image_url: insertArtwork.imageUrl,
        format: insertArtwork.format,
        is_pro: insertArtwork.isPro,
        category: insertArtwork.category
      };
      
      console.log("DATABASE createArtwork - Enviando para o banco:", JSON.stringify(dbArtwork));
      
      // Usar a API do Supabase para criar a artwork
      const { data, error } = await supabase
        .from('artworks')
        .insert(dbArtwork)
        .select()
        .single();
      
      if (error) {
        console.error("DATABASE createArtwork - Erro ao criar artwork:", error.message);
        throw new Error(`Erro ao criar artwork: ${error.message}`);
      }
      
      console.log("DATABASE createArtwork - Resultado do banco:", JSON.stringify(data));
      
      // Mapear para o formato esperado pela aplicação
      const artwork: Artwork = {
        id: data.id,
        title: data.title,
        description: data.description,
        imageUrl: data.image_url,
        format: data.format,
        isPro: data.is_pro,
        category: data.category,
        createdAt: new Date(data.created_at)
      };
      
      return artwork;
    } catch (error) {
      console.error("DATABASE createArtwork - Exceção:", error);
      throw error;
    }
  }
  
  async getFavoritesByUserId(userId: number): Promise<Artwork[]> {
    try {
      console.log("DATABASE getFavoritesByUserId - Buscando favoritos do usuário:", userId);
      
      // Usando o Supabase com uma query com join para buscar os favoritos
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          artworkId,
          artworks (
            id,
            title,
            description,
            image_url,
            format,
            is_pro,
            category,
            created_at
          )
        `)
        .eq('userId', userId);
        
      if (error) {
        console.error("DATABASE getFavoritesByUserId - Erro ao buscar favoritos:", error.message);
        return [];
      }
      
      if (!data || data.length === 0) {
        console.log(`DATABASE getFavoritesByUserId - Nenhum favorito encontrado para o usuário ${userId}`);
        return [];
      }
      
      // Mapear os dados do Supabase para o formato esperado pela aplicação
      const result = data
        .filter(item => item.artworks) // Filtrar apenas os itens que têm artworks
        .map(item => ({
          id: item.artworks.id,
          title: item.artworks.title,
          description: item.artworks.description,
          imageUrl: item.artworks.image_url,
          format: item.artworks.format,
          isPro: item.artworks.is_pro,
          category: item.artworks.category,
          createdAt: new Date(item.artworks.created_at)
        }));
      
      console.log(`DATABASE getFavoritesByUserId - Encontrados ${result.length} favoritos para o usuário ${userId}`);
      return result;
    } catch (error) {
      console.error("DATABASE getFavoritesByUserId - Exceção:", error);
      return [];
    }
  }
  
  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    try {
      console.log("DATABASE addFavorite - Adicionando favorito:", JSON.stringify(favorite));
      
      // Converter para o formato do Supabase (snake_case)
      const dbFavorite = {
        user_id: favorite.userId,
        artwork_id: favorite.artworkId
      };
      
      // Usar a API do Supabase para inserir o favorito
      const { data, error } = await supabase
        .from('favorites')
        .insert(dbFavorite)
        .select()
        .single();
      
      if (error) {
        console.error("DATABASE addFavorite - Erro ao adicionar favorito:", error.message);
        throw new Error(`Erro ao adicionar favorito: ${error.message}`);
      }
      
      console.log("DATABASE addFavorite - Favorito adicionado com sucesso:", JSON.stringify(data));
      
      // Mapear para o formato esperado pela aplicação
      const result: Favorite = {
        id: data.id,
        userId: data.user_id,
        artworkId: data.artwork_id,
        createdAt: new Date(data.created_at)
      };
      
      return result;
    } catch (error) {
      console.error("DATABASE addFavorite - Exceção:", error);
      throw error;
    }
  }
  
  async removeFavorite(userId: number, artworkId: number): Promise<void> {
    try {
      console.log(`DATABASE removeFavorite - Removendo favorito do usuário ${userId}, artwork ${artworkId}`);
      
      // Usar a API do Supabase para remover o favorito
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('artwork_id', artworkId);
      
      if (error) {
        console.error("DATABASE removeFavorite - Erro ao remover favorito:", error.message);
        throw new Error(`Erro ao remover favorito: ${error.message}`);
      }
      
      console.log(`DATABASE removeFavorite - Favorito removido com sucesso`);
    } catch (error) {
      console.error("DATABASE removeFavorite - Exceção:", error);
      throw error;
    }
  }
  
  async getUserArtworksByUserId(userId: number): Promise<Artwork[]> {
    try {
      console.log("DATABASE getUserArtworksByUserId - Buscando artes do usuário:", userId);
      
      // Usando o Supabase com uma query com join para buscar as artes do usuário
      const { data, error } = await supabase
        .from('user_artworks')
        .select(`
          artworkId,
          artworks (
            id,
            title,
            description,
            image_url,
            format,
            is_pro,
            category,
            created_at
          )
        `)
        .eq('userId', userId)
        .order('usedAt', { ascending: false });
        
      if (error) {
        console.error("DATABASE getUserArtworksByUserId - Erro ao buscar artes do usuário:", error.message);
        return [];
      }
      
      if (!data || data.length === 0) {
        console.log(`DATABASE getUserArtworksByUserId - Nenhuma arte encontrada para o usuário ${userId}`);
        return [];
      }
      
      // Mapear os dados do Supabase para o formato esperado pela aplicação
      const result = data
        .filter(item => item.artworks) // Filtrar apenas os itens que têm artworks
        .map(item => ({
          id: item.artworks.id,
          title: item.artworks.title,
          description: item.artworks.description,
          imageUrl: item.artworks.image_url,
          format: item.artworks.format,
          isPro: item.artworks.is_pro,
          category: item.artworks.category,
          createdAt: new Date(item.artworks.created_at)
        }));
      
      console.log(`DATABASE getUserArtworksByUserId - Encontradas ${result.length} artes para o usuário ${userId}`);
      return result;
    } catch (error) {
      console.error("DATABASE getUserArtworksByUserId - Exceção:", error);
      return [];
    }
  }
  
  async addUserArtwork(userArtwork: InsertUserArtwork): Promise<UserArtwork> {
    try {
      console.log("DATABASE addUserArtwork - Adicionando arte para o usuário:", JSON.stringify(userArtwork));
      
      // Verificar se a entrada já existe
      const { data: existingEntry, error: checkError } = await supabase
        .from('user_artworks')
        .select()
        .eq('userId', userArtwork.userId)
        .eq('artworkId', userArtwork.artworkId)
        .maybeSingle();
      
      if (checkError) {
        console.error("DATABASE addUserArtwork - Erro ao verificar arte existente:", checkError.message);
        throw new Error(`Erro ao verificar arte existente: ${checkError.message}`);
      }
      
      let data;
      
      if (existingEntry) {
        // Atualizar a entrada existente com a nova data de uso
        const { data: updatedData, error: updateError } = await supabase
          .from('user_artworks')
          .update({ usedAt: new Date() })
          .eq('id', existingEntry.id)
          .select()
          .single();
        
        if (updateError) {
          console.error("DATABASE addUserArtwork - Erro ao atualizar arte existente:", updateError.message);
          throw new Error(`Erro ao atualizar arte existente: ${updateError.message}`);
        }
        
        data = updatedData;
        console.log("DATABASE addUserArtwork - Arte existente atualizada:", JSON.stringify(data));
      } else {
        // Criar uma nova entrada
        const dbUserArtwork = {
          user_id: userArtwork.userId,
          artwork_id: userArtwork.artworkId,
          used_at: new Date()
        };
        
        const { data: newData, error: insertError } = await supabase
          .from('user_artworks')
          .insert(dbUserArtwork)
          .select()
          .single();
        
        if (insertError) {
          console.error("DATABASE addUserArtwork - Erro ao adicionar nova arte:", insertError.message);
          throw new Error(`Erro ao adicionar nova arte: ${insertError.message}`);
        }
        
        data = newData;
        console.log("DATABASE addUserArtwork - Nova arte adicionada:", JSON.stringify(data));
      }
      
      // Mapear para o formato esperado pela aplicação
      const result: UserArtwork = {
        id: data.id,
        userId: data.user_id,
        artworkId: data.artwork_id,
        usedAt: new Date(data.used_at)
      };
      
      return result;
    } catch (error) {
      console.error("DATABASE addUserArtwork - Exceção:", error);
      throw error;
    }
  }
  
  // Category methods (for admin panel)
  async getCategories(): Promise<Category[]> {
    try {
      console.log("DATABASE getCategories - Buscando todas as categorias");
      
      // Usar PostgreSQL direto para evitar problemas de cache
      const query = `
        SELECT id, name, description, slug, image_url, is_active, created_at
        FROM categories
        ORDER BY name
      `;
      
      const result = await pool.query(query);
      
      if (!result.rows || result.rows.length === 0) {
        console.log("DATABASE getCategories - Nenhuma categoria encontrada");
        return [];
      }
      
      // Mapear os dados para o formato esperado pela aplicação
      const categories: Category[] = result.rows.map(item => {
        // Converter is_active para boolean explicitamente (pode vir como 't' do PostgreSQL)
        const isActive = item.is_active === true || item.is_active === 't';
        console.log(`Categoria ${item.id} (${item.name}): is_active = ${item.is_active}, isActive = ${isActive}`);
        
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          slug: item.slug || slugify(item.name), // Gera slug se não existir
          imageUrl: item.image_url,
          isActive: isActive,
          createdAt: new Date(item.created_at)
        };
      });
      
      console.log(`DATABASE getCategories - Encontradas ${categories.length} categorias`);
      return categories;
    } catch (error) {
      console.error("DATABASE getCategories - Exceção:", error);
      return [];
    }
  }

  async getActiveCategories(): Promise<Category[]> {
    try {
      console.log("DATABASE getActiveCategories - Buscando apenas categorias ativas");
      
      // Usar a API do Supabase para buscar apenas categorias ativas
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error("DATABASE getActiveCategories - Erro ao buscar categorias ativas:", error.message);
        return [];
      }
      
      if (!data || data.length === 0) {
        console.log("DATABASE getActiveCategories - Nenhuma categoria ativa encontrada");
        return [];
      }
      
      // Mapear os dados do Supabase para o formato esperado pela aplicação
      const categories: Category[] = data.map(item => {
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          slug: item.slug || slugify(item.name),
          imageUrl: item.image_url,
          isActive: true, // Todos são ativos nesta query
          createdAt: new Date(item.created_at)
        };
      });
      
      console.log(`DATABASE getActiveCategories - Encontradas ${categories.length} categorias ativas`);
      return categories;
    } catch (error) {
      console.error("DATABASE getActiveCategories - Exceção:", error);
      return [];
    }
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    try {
      console.log("DATABASE getCategoryById - Buscando categoria com ID:", id);
      
      // Usar a API do Supabase para buscar a categoria pelo ID
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error("DATABASE getCategoryById - Erro ao buscar categoria:", error.message);
        return undefined;
      }
      
      if (!data) {
        console.log(`DATABASE getCategoryById - Categoria com ID ${id} não encontrada`);
        return undefined;
      }
      
      // Mapear os dados do Supabase para o formato esperado pela aplicação
      // Converter is_active para boolean explicitamente
      const isActive = data.is_active === true || data.is_active === 't';
      console.log(`Categoria ${data.id} (${data.name}): is_active = ${data.is_active}, isActive = ${isActive}`);
      
      const category: Category = {
        id: data.id,
        name: data.name,
        description: data.description,
        slug: data.slug || slugify(data.name), // Gera slug se não existir
        imageUrl: data.image_url,
        isActive: isActive,
        createdAt: new Date(data.created_at)
      };
      
      console.log(`DATABASE getCategoryById - Categoria encontrada: ${category.name}`);
      return category;
    } catch (error) {
      console.error("DATABASE getCategoryById - Exceção:", error);
      return undefined;
    }
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    try {
      console.log("DATABASE createCategory - Criando categoria:", JSON.stringify(category));
      
      // Mapear campos para formato do Supabase (snake_case)
      const dbCategory = {
        name: category.name,
        slug: category.slug || slugify(category.name),
        description: category.description,
        image_url: category.imageUrl,
        is_active: category.isActive !== undefined ? category.isActive : true
      };
      
      // Usar a API do Supabase para criar a categoria
      const { data, error } = await supabase
        .from('categories')
        .insert(dbCategory)
        .select()
        .single();
      
      if (error) {
        console.error("DATABASE createCategory - Erro ao criar categoria:", error.message);
        throw new Error(`Erro ao criar categoria: ${error.message}`);
      }
      
      // Mapear para o formato esperado pela aplicação
      // Converter is_active para boolean explicitamente
      const isActive = data.is_active === true || data.is_active === 't';
      
      const result: Category = {
        id: data.id,
        name: data.name,
        description: data.description,
        slug: data.slug || slugify(data.name), // Gera slug se não existir
        imageUrl: data.image_url,
        isActive: isActive,
        createdAt: new Date(data.created_at)
      };
      
      console.log(`DATABASE createCategory - Categoria criada com sucesso: ${result.name}`);
      return result;
    } catch (error) {
      console.error("DATABASE createCategory - Exceção:", error);
      throw error;
    }
  }
  
  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    try {
      console.log("DATABASE updateCategory - Atualizando categoria:", id, JSON.stringify(category));
      
      // Usar PostgreSQL direto para evitar problemas de cache do Supabase
      const setParts: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (category.name !== undefined) {
        setParts.push(`name = $${paramIndex++}`);
        values.push(category.name);
      }
      if (category.description !== undefined) {
        setParts.push(`description = $${paramIndex++}`);
        values.push(category.description);
      }
      if (category.imageUrl !== undefined) {
        setParts.push(`image_url = $${paramIndex++}`);
        values.push(category.imageUrl);
      }
      if (category.slug !== undefined) {
        setParts.push(`slug = $${paramIndex++}`);
        values.push(category.slug);
      }
      if (category.isActive !== undefined) {
        setParts.push(`is_active = $${paramIndex++}`);
        values.push(category.isActive);
      }
      
      if (setParts.length === 0) {
        throw new Error('Nenhum campo fornecido para atualização');
      }
      
      values.push(id); // ID vai por último
      
      const query = `
        UPDATE categories 
        SET ${setParts.join(', ')} 
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      console.log("DATABASE updateCategory - Query SQL:", query);
      console.log("DATABASE updateCategory - Valores:", values);
      
      const result = await pool.query(query, values);
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error(`Categoria com ID ${id} não encontrada`);
      }
      
      const data = result.rows[0];
      
      // Mapear para o formato esperado pela aplicação
      const isActive = data.is_active === true || data.is_active === 't';
      
      const updatedCategory: Category = {
        id: data.id,
        name: data.name,
        description: data.description,
        slug: data.slug || slugify(data.name),
        imageUrl: data.image_url,
        isActive: isActive,
        createdAt: new Date(data.created_at)
      };
      
      console.log(`DATABASE updateCategory - Categoria atualizada com sucesso: ${updatedCategory.name}`);
      return updatedCategory;
    } catch (error) {
      console.error("DATABASE updateCategory - Exceção:", error);
      throw error;
    }
  }
  
  async deleteCategory(id: number): Promise<{ success: boolean; postsUpdated: number }> {
    try {
      console.log("DATABASE deleteCategory - Excluindo categoria com ID:", id);
      let postsUpdated = 0;
      
      // Verificar se existem posts usando esta categoria no PostgreSQL direto
      try {
        console.log(`DATABASE deleteCategory - Verificando posts relacionados à categoria ${id} via PostgreSQL direto`);
        
        const checkResult = await pool.query(
          'SELECT COUNT(*) FROM posts WHERE category_id = $1',
          [id]
        );
        
        postsUpdated = parseInt(checkResult.rows[0].count);
        console.log(`DATABASE deleteCategory - Encontrados ${postsUpdated} posts associados à categoria ${id}`);
        
        if (postsUpdated > 0) {
          console.log(`DATABASE deleteCategory - Atualizando ${postsUpdated} posts para category_id = NULL`);
          
          // Atualizar todos os posts relacionados, definindo category_id como NULL
          try {
            // Via PostgreSQL direto (mais confiável)
            await pool.query(
              'UPDATE posts SET category_id = NULL WHERE category_id = $1',
              [id]
            );
            console.log(`DATABASE deleteCategory - Posts atualizados com sucesso via PostgreSQL direto`);
            
            // Sincronizar com Supabase
            try {
              const { error: updateError } = await supabase
                .from('posts')
                .update({ category_id: null })
                .eq('category_id', id);
                
              if (updateError) {
                console.warn(`DATABASE deleteCategory - Erro ao atualizar posts via Supabase: ${updateError.message}`);
              } else {
                console.log(`DATABASE deleteCategory - Posts também atualizados via Supabase`);
              }
            } catch (supabaseUpdateError) {
              console.warn("DATABASE deleteCategory - Erro ao atualizar posts via Supabase:", supabaseUpdateError);
            }
          } catch (updateError) {
            console.error("DATABASE deleteCategory - Erro ao atualizar posts:", updateError);
            throw new Error(`Erro ao atualizar os posts relacionados: ${updateError.message}`);
          }
        }
      } catch (checkError: any) {
        // Se o erro for específico sobre posts, propagar
        if (checkError.message && checkError.message.includes('Erro ao atualizar os posts')) {
          throw checkError;
        }
        
        // Caso contrário, é um erro na consulta de verificação
        console.warn("DATABASE deleteCategory - Erro ao verificar posts relacionados via PostgreSQL:", checkError);
        
        // Tentar verificar via Supabase como plano B
        try {
          const { data: postsWithCategory, error: supabaseCheckError } = await supabase
            .from('posts')
            .select('id')
            .eq('category_id', id);
            
          if (!supabaseCheckError && postsWithCategory && postsWithCategory.length > 0) {
            postsUpdated = postsWithCategory.length;
            console.log(`DATABASE deleteCategory - Atualizando ${postsUpdated} posts via Supabase`);
            
            const { error: updateError } = await supabase
              .from('posts')
              .update({ category_id: null })
              .eq('category_id', id);
              
            if (updateError) {
              console.error(`DATABASE deleteCategory - Erro ao atualizar posts via Supabase: ${updateError.message}`);
              throw new Error(`Erro ao atualizar os posts relacionados: ${updateError.message}`);
            }
            
            console.log(`DATABASE deleteCategory - Posts atualizados com sucesso via Supabase`);
          }
        } catch (supabaseError) {
          console.warn("DATABASE deleteCategory - Também falhou ao verificar/atualizar posts via Supabase:", supabaseError);
          // Se os dois métodos de verificação/atualização falharem, prosseguir com cautela
        }
      }
      
      // Com os posts já atualizados, agora podemos excluir a categoria
      try {
        console.log("DATABASE deleteCategory - Tentando excluir via PostgreSQL direto");
        await pool.query('DELETE FROM categories WHERE id = $1', [id]);
        console.log("DATABASE deleteCategory - Categoria excluída com sucesso via PostgreSQL direto");
        
        // Se foi bem-sucedido com PostgreSQL, sincronizar com Supabase
        try {
          await supabase
            .from('categories')
            .delete()
            .eq('id', id);
          console.log("DATABASE deleteCategory - Categoria também excluída no Supabase");
        } catch (syncError) {
          // Não falhar se a sincronização com Supabase falhar
          console.warn("DATABASE deleteCategory - Não foi possível sincronizar exclusão com Supabase:", syncError);
        }
        
        return { success: true, postsUpdated };
      } catch (pgError: any) {
        // Mesmo com os posts atualizados para null, ainda pode haver restrição
        if (pgError.message && pgError.message.includes('violates foreign key constraint')) {
          console.error("DATABASE deleteCategory - Erro de restrição de chave estrangeira no PostgreSQL:", pgError.message);
          throw new Error(`Não foi possível excluir a categoria devido a restrições de chave estrangeira.`);
        }
        
        console.error("DATABASE deleteCategory - Erro ao excluir via PostgreSQL:", pgError);
        
        // Se falhar com PostgreSQL, tentar com Supabase como último recurso
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error("DATABASE deleteCategory - Também falhou ao excluir via Supabase:", error.message);
          throw new Error(`Erro ao excluir categoria: ${error.message}`);
        }
        
        console.log(`DATABASE deleteCategory - Categoria excluída com sucesso via Supabase`);
        return { success: true, postsUpdated };
      }
    } catch (error) {
      console.error("DATABASE deleteCategory - Exceção:", error);
      throw error;
    }
  }
  
  // Post methods (for admin panel)
  async getPosts(filters?: {
    searchTerm?: string;
    categoryId?: number;
    status?: string;
    month?: number;
    year?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Post[]> {
    try {
      console.log("DATABASE getPosts - Buscando posts com filtros:", JSON.stringify(filters || {}));
      
      // Definir variável para armazenar posts
      let postsData: any[] = [];
      
      // Tentar via Supabase primeiro
      try {
        // Construir a query base para o Supabase
        // Usar select('*') em vez de selecionar campos específicos para maior compatibilidade
        let query = supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });
        
        // Aplicar filtros se existirem
        if (filters) {
          if (filters.searchTerm) {
            // Usando ilike para busca case-insensitive
            const searchTerm = `%${filters.searchTerm}%`;
            query = query.or(
              `title.ilike.${searchTerm},description.ilike.${searchTerm},unique_code.ilike.${searchTerm}`
            );
          }
          
          if (filters.categoryId) {
            query = query.eq('category_id', filters.categoryId);
          }
          
          if (filters.status) {
            query = query.eq('status', filters.status);
          }
          
          if (filters.month && filters.year) {
            // Filtrar por mês e ano específicos (este filtro é mais complexo no Supabase REST API)
            const startDate = new Date(filters.year, filters.month - 1, 1).toISOString();
            const endDate = new Date(filters.year, filters.month, 0).toISOString();
            query = query
              .gte('created_at', startDate)
              .lte('created_at', endDate);
          } else if (filters.startDate && filters.endDate) {
            // Filtrar por intervalo de datas
            query = query
              .gte('created_at', filters.startDate.toISOString())
              .lte('created_at', filters.endDate.toISOString());
          }
        }
        
        // Executar a query
        const { data, error } = await query;
        
        if (error) {
          console.warn("DATABASE getPosts - Erro ao buscar posts via Supabase:", error.message);
          // Não retornar ainda, vamos tentar com PostgreSQL direto
        } else if (data && data.length > 0) {
          postsData = data;
          console.log(`DATABASE getPosts - Encontrados ${data.length} posts via Supabase API`);
        }
      } catch (supabaseError) {
        console.warn("DATABASE getPosts - Exceção ao acessar Supabase:", supabaseError);
      }
      
      // Se não encontrou via Supabase, tentar com PostgreSQL direto
      if (postsData.length === 0) {
        try {
          console.log("DATABASE getPosts - Tentando buscar via PostgreSQL direto");
          
          // Construir consulta SQL base
          let sql = `SELECT * FROM posts`;
          const sqlParams: any[] = [];
          const conditions: string[] = [];
          
          // Aplicar filtros para PostgreSQL
          if (filters) {
            // Filtro de texto para pesquisa
            if (filters.searchTerm) {
              const searchTerm = `%${filters.searchTerm}%`;
              conditions.push(`(title ILIKE $${sqlParams.length + 1} OR description ILIKE $${sqlParams.length + 1} OR unique_code ILIKE $${sqlParams.length + 1})`);
              sqlParams.push(searchTerm);
            }
            
            // Filtro de categoria
            if (filters.categoryId) {
              conditions.push(`category_id = $${sqlParams.length + 1}`);
              sqlParams.push(filters.categoryId);
            }
            
            // Filtro de status
            if (filters.status) {
              conditions.push(`status = $${sqlParams.length + 1}`);
              sqlParams.push(filters.status);
            }
            
            // Filtro de data
            if (filters.month && filters.year) {
              const startDate = new Date(filters.year, filters.month - 1, 1);
              const endDate = new Date(filters.year, filters.month, 0);
              conditions.push(`created_at >= $${sqlParams.length + 1} AND created_at <= $${sqlParams.length + 2}`);
              sqlParams.push(startDate, endDate);
            } else if (filters.startDate && filters.endDate) {
              conditions.push(`created_at >= $${sqlParams.length + 1} AND created_at <= $${sqlParams.length + 2}`);
              sqlParams.push(filters.startDate, filters.endDate);
            }
          }
          
          // Adicionar as condições à consulta SQL se houver alguma
          if (conditions.length > 0) {
            sql += ` WHERE ${conditions.join(' AND ')}`;
          }
          
          // Adicionar ordenação
          sql += ` ORDER BY created_at DESC`;
          
          // Executar a consulta
          const result = await pool.query(sql, sqlParams);
          
          if (result.rows && result.rows.length > 0) {
            postsData = result.rows;
            console.log(`DATABASE getPosts - Encontrados ${result.rows.length} posts via PostgreSQL direto`);
          }
        } catch (pgError) {
          console.error("DATABASE getPosts - Erro ao buscar via PostgreSQL:", pgError);
        }
      }
      
      // Se não encontrou posts por nenhum método
      if (postsData.length === 0) {
        console.log("DATABASE getPosts - Nenhum post encontrado com os filtros especificados");
        return [];
      }
      
      // Mapear os dados para o formato esperado pela aplicação
      // e normalizar os campos premium
      const result = postsData.map(post => {
        // Mapear campos básicos
        const rawPost = {
          id: post.id,
          title: post.title,
          description: post.description || "",
          imageUrl: post.image_url,
          uniqueCode: post.unique_code,
          categoryId: post.category_id,
          status: post.status,
          createdAt: new Date(post.created_at),
          publishedAt: post.published_at ? new Date(post.published_at) : null,
          // Campos adicionais com fallbacks
          formato: post.formato || null,
          groupId: post.group_id || null,
          tituloBase: post.titulo_base || post.title, // Usar o título como fallback
          isPro: post.is_pro,
          licenseType: post.license_type,
          canvaUrl: post.canva_url || null,
          formatoData: post.formato_data || null,
          tags: post.tags || [],
          formats: post.formats || [],
          formatData: post.format_data || null,
          isVisible: post.is_visible !== false // se for null ou undefined, assume true
        };
        
        // Normalizar campos premium
        return ensurePremiumFields(rawPost);
      });
      
      console.log(`DATABASE getPosts - Normalizados ${result.length} posts`);
      return result;
    } catch (error) {
      console.error("DATABASE getPosts - Exceção:", error);
      return [];
    }
  }
  
  async getPostById(id: number): Promise<Post | undefined> {
    try {
      console.log("DATABASE getPostById - Buscando post com ID:", id);
      
      // Tentar via Supabase primeiro
      let post: any;
      try {
        // Usar select('*') em vez de selecionar campos específicos para maior compatibilidade
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) {
          console.warn("DATABASE getPostById - Erro ao buscar post via Supabase:", error.message);
          // Não retornar ainda, vamos tentar com PostgreSQL direto
        } else if (data) {
          post = data;
          console.log("DATABASE getPostById - Post encontrado via Supabase API");
        }
      } catch (supabaseError) {
        console.warn("DATABASE getPostById - Exceção ao acessar Supabase:", supabaseError);
      }
      
      // Se não encontrou via Supabase, tentar com PostgreSQL direto
      if (!post) {
        try {
          console.log("DATABASE getPostById - Tentando buscar via PostgreSQL direto");
          
          // Conexão direta com PostgreSQL
          const result = await pool.query(`
            SELECT * FROM posts WHERE id = $1 LIMIT 1
          `, [id]);
          
          if (result.rows && result.rows.length > 0) {
            post = result.rows[0];
            console.log("DATABASE getPostById - Post encontrado via PostgreSQL direto");
          }
        } catch (pgError) {
          console.error("DATABASE getPostById - Erro ao buscar via PostgreSQL:", pgError);
        }
      }
      
      // Se não encontrou por nenhum método
      if (!post) {
        console.log(`DATABASE getPostById - Post com ID ${id} não encontrado`);
        return undefined;
      }
      
      // Mapear para o formato esperado pela aplicação com valores padrão 
      const rawPost = {
        id: post.id,
        title: post.title,
        description: post.description || "",
        imageUrl: post.image_url,
        uniqueCode: post.unique_code,
        categoryId: post.category_id,
        status: post.status,
        createdAt: new Date(post.created_at),
        publishedAt: post.published_at ? new Date(post.published_at) : null,
        // Novos campos com fallbacks
        formato: post.formato || null,
        groupId: post.group_id || null,
        tituloBase: post.titulo_base || post.title, // Usar o título como fallback
        // Campos premium serão normalizados pelo utilitário
        isPro: post.is_pro,
        licenseType: post.license_type,
        canvaUrl: post.canva_url || null,
        formatoData: post.formato_data || null,
        tags: post.tags || [],
        formats: post.formats || [],
        formatData: post.format_data || null,
        isVisible: post.is_visible !== false // se for null ou undefined, assume true
      };
      
      // Normalizar os campos premium do post (garante consistência)
      const result = ensurePremiumFields(rawPost);
      
      console.log(`DATABASE getPostById - Post normalizado: ${result.title}, Premium: ${isPostPremium(result)}`);
      return result;
    } catch (error) {
      console.error("DATABASE getPostById - Exceção:", error);
      return undefined;
    }
  }
  
  async getPostsByGroupId(groupId: string): Promise<Post[]> {
    try {
      console.log("DATABASE getPostsByGroupId - Buscando posts do grupo:", groupId);
      
      if (!groupId) {
        console.warn("DATABASE getPostsByGroupId - ID do grupo não fornecido");
        return [];
      }
      
      // Definir variável para armazenar posts
      let postsData: any[] = [];
      
      // Tentar via Supabase primeiro
      try {
        // Usar select('*') em vez de selecionar campos específicos
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('group_id', groupId)
          .order('id', { ascending: true });
          
        if (error) {
          console.warn("DATABASE getPostsByGroupId - Erro ao buscar posts via Supabase:", error.message);
          // Não retornar ainda, vamos tentar com PostgreSQL direto
        } else if (data && data.length > 0) {
          postsData = data;
          console.log(`DATABASE getPostsByGroupId - Encontrados ${data.length} posts via Supabase API`);
        }
      } catch (supabaseError) {
        console.warn("DATABASE getPostsByGroupId - Exceção ao acessar Supabase:", supabaseError);
      }
      
      // Se não encontrou via Supabase, tentar com PostgreSQL direto
      if (postsData.length === 0) {
        try {
          console.log("DATABASE getPostsByGroupId - Tentando buscar via PostgreSQL direto");
          
          // Conexão direta com PostgreSQL
          const result = await pool.query(`
            SELECT * FROM posts WHERE group_id = $1 ORDER BY id ASC
          `, [groupId]);
          
          if (result.rows && result.rows.length > 0) {
            postsData = result.rows;
            console.log(`DATABASE getPostsByGroupId - Encontrados ${result.rows.length} posts via PostgreSQL direto`);
          }
        } catch (pgError) {
          console.error("DATABASE getPostsByGroupId - Erro ao buscar via PostgreSQL:", pgError);
        }
      }
      
      // Se não encontrou posts por nenhum método
      if (postsData.length === 0) {
        console.log(`DATABASE getPostsByGroupId - Nenhum post encontrado no grupo ${groupId}`);
        return [];
      }
      
      // Mapear os dados para o formato esperado pela aplicação
      // e aplicar o utilitário para normalizar os campos premium
      const result = postsData.map(post => {
        // Mapear campos básicos
        const rawPost = {
          id: post.id,
          title: post.title,
          description: post.description || "",
          imageUrl: post.image_url,
          uniqueCode: post.unique_code,
          categoryId: post.category_id,
          status: post.status,
          createdAt: new Date(post.created_at),
          publishedAt: post.published_at ? new Date(post.published_at) : null,
          // Novos campos com fallbacks
          formato: post.formato || null,
          groupId: post.group_id || null,
          tituloBase: post.titulo_base || post.title, // Usar title como fallback
          // Campos premium serão normalizados pelo utilitário
          isPro: post.is_pro,
          licenseType: post.license_type,
          canvaUrl: post.canva_url || null,
          formatoData: post.formato_data || null,
          tags: post.tags || [],
          formats: post.formats || [],
          formatData: post.format_data || null,
          isVisible: post.is_visible !== false // se for null ou undefined, assume true
        };
        
        // Normalizar campos premium
        return ensurePremiumFields(rawPost);
      });
      
      console.log(`DATABASE getPostsByGroupId - Normalizados ${result.length} posts do grupo ${groupId}`);
      return result;
    } catch (error) {
      console.error("DATABASE getPostsByGroupId - Exceção:", error);
      return [];
    }
  }
  
  async createPost(post: InsertPost): Promise<Post> {
    try {
      console.log("DATABASE createPost - Criando novo post:", JSON.stringify(post));
      
      // Verificar se a categoria existe no Supabase antes de continuar
      if (post.categoryId) {
        console.log(`DATABASE createPost - Verificando se a categoria com ID ${post.categoryId} existe`);
        try {
          const { data: categoryData, error: categoryError } = await supabase
            .from('categories')
            .select('*')
            .eq('id', post.categoryId)
            .single();
            
          if (categoryError || !categoryData) {
            console.warn(`DATABASE createPost - Categoria com ID ${post.categoryId} não encontrada no Supabase`);
            console.log("DATABASE createPost - Tentando usar categoria padrão (ID 6 - Corporal)");
            post.categoryId = 6; // Usar a categoria Corporal com ID 6 que sabemos que existe
          } else {
            console.log(`DATABASE createPost - Categoria com ID ${post.categoryId} encontrada no Supabase:`, categoryData);
            
            // Verificar se a categoria existe no PostgreSQL direto e criar se não existir
            try {
              console.log(`DATABASE createPost - Verificando se categoria ID ${post.categoryId} existe no PostgreSQL`);
              const checkResult = await pool.query('SELECT id FROM categories WHERE id = $1', [post.categoryId]);
              
              if (checkResult.rows.length === 0) {
                console.log(`DATABASE createPost - Categoria ID ${post.categoryId} não existe no PostgreSQL, criando...`);
                
                // Criar tabela categories se não existir
                await pool.query(`
                  CREATE TABLE IF NOT EXISTS categories (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    slug TEXT,
                    description TEXT,
                    image_url TEXT,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                  )
                `);
                
                // Inserir a categoria no PostgreSQL
                await pool.query(`
                  INSERT INTO categories (id, name, slug, description, image_url, is_active, created_at)
                  VALUES ($1, $2, $3, $4, $5, $6, $7)
                  ON CONFLICT (id) DO NOTHING
                `, [
                  categoryData.id,
                  categoryData.name,
                  categoryData.slug || '',
                  categoryData.description || '',
                  categoryData.image_url || null,
                  categoryData.is_active !== false, // Se for null ou undefined, assume true
                  categoryData.created_at || new Date()
                ]);
                
                console.log(`DATABASE createPost - Categoria ID ${post.categoryId} criada no PostgreSQL`);
              } else {
                console.log(`DATABASE createPost - Categoria ID ${post.categoryId} já existe no PostgreSQL`);
              }
            } catch (pgCategoryError) {
              console.error(`DATABASE createPost - Erro ao verificar/criar categoria ID ${post.categoryId} no PostgreSQL:`, pgCategoryError);
              console.log("DATABASE createPost - Usando categoria padrão (ID 6 - Corporal)");
              post.categoryId = 6; // Usar a categoria Corporal com ID 6 que sabemos que existe
            }
          }
        } catch (categoryCheckError) {
          console.error("DATABASE createPost - Erro ao verificar categoria:", categoryCheckError);
          console.log("DATABASE createPost - Usando categoria padrão (ID 6 - Corporal)");
          post.categoryId = 6; // Usar a categoria Corporal com ID 6 que sabemos que existe
        }
      }
      
      // Mapear do formato da aplicação para o formato do PostgreSQL
      const dbPost: any = {
        title: post.title,
        description: post.description,
        image_url: post.imageUrl,
        unique_code: post.uniqueCode,
        category_id: post.categoryId,
        status: post.status || 'rascunho',
        published_at: post.publishedAt ? post.publishedAt.toISOString() : null
      };
      
      // Adicionar os novos campos para suporte a múltiplos formatos
      if (post.formato) dbPost.formato = post.formato;
      if (post.groupId) dbPost.group_id = post.groupId;
      if (post.tituloBase) dbPost.titulo_base = post.tituloBase;
      if (post.canvaUrl) dbPost.canva_url = post.canvaUrl;
      if (post.formatoData) dbPost.formato_data = post.formatoData;
      if (post.formatData) dbPost.format_data = post.formatData;
      
      // Definir licenseType e isPro (garantir consistência)
      if (post.licenseType) {
        dbPost.license_type = post.licenseType;
        dbPost.is_pro = post.licenseType === 'premium';
      } else if (post.isPro !== undefined) {
        dbPost.is_pro = post.isPro;
        dbPost.license_type = post.isPro ? 'premium' : 'free';
      }
      
      // Visibilidade no feed
      if (post.isVisible !== undefined) {
        dbPost.is_visible = post.isVisible;
      }
      
      // Campos de array
      if (post.tags && Array.isArray(post.tags)) {
        dbPost.tags = post.tags;
      }
      
      if (post.formats && Array.isArray(post.formats)) {
        dbPost.formats = post.formats;
      }
      
      console.log("DATABASE createPost - Dados completos a serem enviados:", dbPost);
      
      // Tentar criar o post no Supabase primeiro
      try {
        console.log("DATABASE createPost - Tentando criar post via Supabase");
        
        const { data: supabaseData, error: supabaseError } = await supabase
          .from('posts')
          .insert(dbPost)
          .select()
          .single();
          
        if (supabaseError) {
          console.warn("DATABASE createPost - Erro ao criar post via Supabase:", supabaseError.message);
          // Se falhar com Supabase, tentamos com PostgreSQL direto
        } else if (supabaseData) {
          console.log(`DATABASE createPost - Post criado com ID: ${supabaseData.id} via Supabase`);
          
          // Mapear para o formato esperado pela aplicação
          const postResult: Post = {
            id: supabaseData.id,
            title: supabaseData.title,
            description: supabaseData.description || "",
            imageUrl: supabaseData.image_url,
            uniqueCode: supabaseData.unique_code,
            categoryId: supabaseData.category_id,
            status: supabaseData.status,
            createdAt: new Date(supabaseData.created_at),
            publishedAt: supabaseData.published_at ? new Date(supabaseData.published_at) : null,
            formato: supabaseData.formato,
            formatData: supabaseData.format_data,
            groupId: supabaseData.group_id,
            tituloBase: supabaseData.titulo_base,
            // Normalizar campos premium
            isPro: supabaseData.is_pro,
            licenseType: supabaseData.license_type,
            canvaUrl: supabaseData.canva_url,
            formatoData: supabaseData.formato_data,
            isVisible: supabaseData.is_visible !== false,
            tags: supabaseData.tags || [],
            formats: supabaseData.formats || []
          };
          
          // Aplicar normalização para campos premium
          const normalizedPost = ensurePremiumFields(postResult);
          return normalizedPost;
        }
      } catch (supabaseCreateError) {
        console.error("DATABASE createPost - Exceção ao criar post via Supabase:", supabaseCreateError);
      }
      
      // Se chegarmos aqui, Supabase falhou ou retornou erro. Tentar com PostgreSQL direto
      console.log("DATABASE createPost - Usando PostgreSQL diretamente para criação de post");
      
      // Construir consulta SQL para inserção
      const fields = Object.keys(dbPost);
      const values = Object.values(dbPost);
      const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
      
      const sql = `
        INSERT INTO posts (${fields.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      console.log("DATABASE createPost - Executando SQL:", sql);
      console.log("DATABASE createPost - Campos:", fields);
      
      try {
        const result = await pool.query(sql, values);
        
        if (result.rows.length === 0) {
          throw new Error('Erro ao criar post via PostgreSQL: nenhum dado retornado');
        }
        
        const data = result.rows[0];
        
        // Mapear para o formato esperado pela aplicação
        const postResult: Post = {
          id: data.id,
          title: data.title,
          description: data.description || "",
          imageUrl: data.image_url,
          uniqueCode: data.unique_code,
          categoryId: data.category_id,
          status: data.status,
          createdAt: new Date(data.created_at),
          publishedAt: data.published_at ? new Date(data.published_at) : null,
          formato: data.formato,
          formatData: data.format_data,
          groupId: data.group_id,
          tituloBase: data.titulo_base,
          isPro: !!data.is_pro,
          licenseType: data.license_type || 'free',
          canvaUrl: data.canva_url,
          formatoData: data.formato_data,
          isVisible: data.is_visible !== false,
          tags: data.tags || [],
          formats: data.formats || []
        };
        
        console.log(`DATABASE createPost - Post criado com ID: ${postResult.id} via PostgreSQL direto`);
        
        // Tentar sincronizar com Supabase imediatamente
        try {
          const supabaseData = {
            id: postResult.id,
            title: postResult.title,
            description: postResult.description,
            image_url: postResult.imageUrl,
            unique_code: postResult.uniqueCode,
            category_id: postResult.categoryId,
            status: postResult.status,
            created_at: postResult.createdAt,
            license_type: postResult.licenseType || 'free',
            is_pro: postResult.isPro || false,
            is_visible: postResult.isVisible !== false,
            tags: postResult.tags || [],
            formats: postResult.formats || []
          };

          const { error: syncError } = await supabase
            .from('posts')
            .upsert(supabaseData, { onConflict: 'id' });

          if (!syncError) {
            console.log(`DATABASE createPost - Post ${postResult.id} sincronizado com Supabase`);
          }
        } catch (syncError) {
          console.log(`DATABASE createPost - Aviso: Sincronização com Supabase falhou:`, syncError);
        }
        
        return postResult;
      } catch (pgError) {
        console.error("DATABASE createPost - Erro PostgreSQL:", pgError);
        throw new Error(`Erro ao criar post: ${pgError.message}`);
      }
    } catch (error) {
      console.error("DATABASE createPost - Exceção:", error);
      throw error;
    }
  }
  
  async updatePost(id: number, post: Partial<InsertPost>): Promise<Post> {
    try {
      console.log(`DATABASE updatePost - Atualizando post com ID ${id}:`, JSON.stringify(post));
      
      // Verificar se a categoria existe no Supabase antes de continuar
      if (post.categoryId) {
        console.log(`DATABASE updatePost - Verificando se a categoria com ID ${post.categoryId} existe`);
        try {
          const { data: categoryData, error: categoryError } = await supabase
            .from('categories')
            .select('*')
            .eq('id', post.categoryId)
            .single();
            
          if (categoryError || !categoryData) {
            console.warn(`DATABASE updatePost - Categoria com ID ${post.categoryId} não encontrada no Supabase`);
            console.log("DATABASE updatePost - Tentando usar categoria padrão (ID 6 - Corporal)");
            post.categoryId = 6; // Usar a categoria Corporal com ID 6 que sabemos que existe
          } else {
            console.log(`DATABASE updatePost - Categoria com ID ${post.categoryId} encontrada no Supabase:`, categoryData);
            
            // Verificar se a categoria existe no PostgreSQL direto e criar se não existir
            try {
              console.log(`DATABASE updatePost - Verificando se categoria ID ${post.categoryId} existe no PostgreSQL`);
              const checkResult = await pool.query('SELECT id FROM categories WHERE id = $1', [post.categoryId]);
              
              if (checkResult.rows.length === 0) {
                console.log(`DATABASE updatePost - Categoria ID ${post.categoryId} não existe no PostgreSQL, criando...`);
                
                // Criar tabela categories se não existir
                await pool.query(`
                  CREATE TABLE IF NOT EXISTS categories (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    slug TEXT,
                    description TEXT,
                    image_url TEXT,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                  )
                `);
                
                // Inserir a categoria no PostgreSQL
                await pool.query(`
                  INSERT INTO categories (id, name, slug, description, image_url, is_active, created_at)
                  VALUES ($1, $2, $3, $4, $5, $6, $7)
                  ON CONFLICT (id) DO NOTHING
                `, [
                  categoryData.id,
                  categoryData.name,
                  categoryData.slug || '',
                  categoryData.description || '',
                  categoryData.image_url || null,
                  categoryData.is_active !== false, // Se for null ou undefined, assume true
                  categoryData.created_at || new Date()
                ]);
                
                console.log(`DATABASE updatePost - Categoria ID ${post.categoryId} criada no PostgreSQL`);
              } else {
                console.log(`DATABASE updatePost - Categoria ID ${post.categoryId} já existe no PostgreSQL`);
              }
            } catch (pgCategoryError) {
              console.error(`DATABASE updatePost - Erro ao verificar/criar categoria ID ${post.categoryId} no PostgreSQL:`, pgCategoryError);
              console.log("DATABASE updatePost - Usando categoria padrão (ID 6 - Corporal)");
              post.categoryId = 6; // Usar a categoria Corporal com ID 6 que sabemos que existe
            }
          }
        } catch (categoryCheckError) {
          console.error("DATABASE updatePost - Erro ao verificar categoria:", categoryCheckError);
          console.log("DATABASE updatePost - Usando categoria padrão (ID 6 - Corporal)");
          post.categoryId = 6; // Usar a categoria Corporal com ID 6 que sabemos que existe
        }
      }
      
      // Mapear do formato da aplicação para o formato do PostgreSQL
      const dbPost: any = {};
      
      if (post.title !== undefined) dbPost.title = post.title;
      if (post.description !== undefined) dbPost.description = post.description;
      if (post.imageUrl !== undefined) dbPost.image_url = post.imageUrl;
      if (post.uniqueCode !== undefined) dbPost.unique_code = post.uniqueCode;
      if (post.categoryId !== undefined) dbPost.category_id = post.categoryId;
      if (post.status !== undefined) dbPost.status = post.status;
      
      // Campos para suporte a múltiplos formatos
      if (post.formato !== undefined) dbPost.formato = post.formato;
      if (post.formatData !== undefined) dbPost.format_data = post.formatData;
      if (post.groupId !== undefined) dbPost.group_id = post.groupId;
      if (post.tituloBase !== undefined) dbPost.titulo_base = post.tituloBase;
      if (post.canvaUrl !== undefined) dbPost.canva_url = post.canvaUrl;
      if (post.formatoData !== undefined) dbPost.formato_data = post.formatoData;
      
      // Campos de array
      if (post.tags && Array.isArray(post.tags)) {
        dbPost.tags = post.tags;
      }
      
      if (post.formats && Array.isArray(post.formats)) {
        dbPost.formats = post.formats;
      }
      
      // Verificar se há campos de licença e atualizar todos que forem necessários
      if (post.licenseType !== undefined) {
        // Armazenar o licenseType como string (premium ou free)
        dbPost.license_type = post.licenseType;
        
        // O campo is_pro é usado para indicar conteúdo premium
        if (post.isPro !== undefined) {
          // Se foi explicitamente fornecido, usar o valor diretamente
          dbPost.is_pro = post.isPro;
        } else {
          // Caso contrário, considerar premium se licenseType for 'premium'
          dbPost.is_pro = post.licenseType === 'premium';
        }
        
        console.log(`DATABASE updatePost - Atualizando licença: license_type=${dbPost.license_type}, is_pro=${dbPost.is_pro}`);
      } else if (post.isPro !== undefined) {
        // Se apenas isPro foi fornecido, atualizar apenas esse campo
        dbPost.is_pro = post.isPro;
        console.log(`DATABASE updatePost - Atualizando apenas is_pro=${dbPost.is_pro}`);
      }
      
      // Visibilidade no feed
      if (post.isVisible !== undefined) {
        dbPost.is_visible = post.isVisible;
        console.log(`DATABASE updatePost - Atualizando is_visible=${dbPost.is_visible}`);
      }
      
      // Tentar primeiro atualizar via Supabase
      console.log("DATABASE updatePost - Tentando atualizar post via Supabase primeiro");
      
      // Tentar atualizar via Supabase
      try {
        const { data: supabaseData, error: supabaseError } = await supabase
          .from('posts')
          .update(dbPost)
          .eq('id', id)
          .select()
          .single();
          
        if (supabaseError) {
          console.warn("DATABASE updatePost - Erro ao atualizar via Supabase:", supabaseError.message);
          // Se falhar, tentamos com PostgreSQL direto
        } else if (supabaseData) {
          console.log(`DATABASE updatePost - Post atualizado com sucesso via Supabase`);
          
          // Mapear para o formato esperado pela aplicação
          const postResult: Post = {
            id: supabaseData.id,
            title: supabaseData.title,
            description: supabaseData.description || "",
            imageUrl: supabaseData.image_url,
            uniqueCode: supabaseData.unique_code,
            categoryId: supabaseData.category_id,
            status: supabaseData.status,
            createdAt: new Date(supabaseData.created_at),
            publishedAt: supabaseData.published_at ? new Date(supabaseData.published_at) : null,
            formato: supabaseData.formato,
            formatData: supabaseData.format_data,
            groupId: supabaseData.group_id,
            tituloBase: supabaseData.titulo_base,
            isPro: !!supabaseData.is_pro,
            licenseType: supabaseData.license_type || 'free',
            canvaUrl: supabaseData.canva_url,
            formatoData: supabaseData.formato_data,
            isVisible: supabaseData.is_visible !== false,
            tags: supabaseData.tags || [],
            formats: supabaseData.formats || []
          };
          
          // Aplicar normalização para campos premium
          const normalizedPost = ensurePremiumFields(postResult);
          
          // Agora vamos tentar fazer o mesmo update no PostgreSQL direto como fallback
          // para garantir consistência, mas sem falhar se não encontrar
          try {
            // Construir consulta SQL para atualização
            const setClauses = Object.keys(dbPost).map((key, i) => `${key} = $${i + 1}`).join(', ');
            const values = [...Object.values(dbPost), id];
            
            const sql = `
              UPDATE posts 
              SET ${setClauses} 
              WHERE id = $${values.length}
            `;
            
            await pool.query(sql, values);
            console.log(`DATABASE updatePost - Post também atualizado no PostgreSQL direto como fallback`);
          } catch (pgFallbackError) {
            console.warn("DATABASE updatePost - Aviso: Falha ao sincronizar com PostgreSQL direto:", pgFallbackError);
            // Não falhar aqui, pois o update no Supabase já funcionou
          }
          
          return normalizedPost;
        }
      } catch (supabaseUpdateError) {
        console.error("DATABASE updatePost - Exceção ao atualizar via Supabase:", supabaseUpdateError);
      }
      
      // Se chegamos aqui, Supabase falhou ou retornou erro
      console.log("DATABASE updatePost - Tentando agora com PostgreSQL direto");
      
      // Construir consulta SQL para atualização
      const setClauses = Object.keys(dbPost).map((key, i) => `${key} = $${i + 1}`).join(', ');
      const values = [...Object.values(dbPost), id];
      
      const sql = `
        UPDATE posts 
        SET ${setClauses} 
        WHERE id = $${values.length}
        RETURNING *
      `;
      
      console.log("DATABASE updatePost - Executando SQL:", sql);
      console.log("DATABASE updatePost - Campos para atualização:", Object.keys(dbPost));
      
      try {
        const result = await pool.query(sql, values);
        
        if (result.rows.length === 0) {
          // Se não encontrou no PostgreSQL direto, tente buscar do Supabase para ver se existe lá
          console.log(`DATABASE updatePost - Post com ID ${id} não encontrado no PostgreSQL, verificando no Supabase`);
          
          const { data: existingPost, error: fetchError } = await supabase
            .from('posts')
            .select('*')
            .eq('id', id)
            .single();
            
          if (fetchError || !existingPost) {
            throw new Error(`Post com ID ${id} não encontrado em nenhuma base de dados`);
          }
          
          // Se encontrou no Supabase, sincronizar com PostgreSQL usando INSERT ON CONFLICT
          console.log(`DATABASE updatePost - Post com ID ${id} encontrado no Supabase, sincronizando com PostgreSQL`);
          
          // Obter a estrutura correta da tabela posts no PostgreSQL primeiro
          try {
            const tableStructureQuery = `
              SELECT column_name 
              FROM information_schema.columns 
              WHERE table_name = 'posts'
            `;
            
            const tableStructure = await pool.query(tableStructureQuery);
            const validColumns = tableStructure.rows.map(row => row.column_name);
            
            console.log(`DATABASE updatePost - Colunas válidas na tabela posts do PostgreSQL:`, validColumns);
            
            // Criar o post no PostgreSQL apenas com campos válidos
            const fullPost = {
              ...existingPost,
              ...dbPost
            };
            
            // Converter campos para formato correto do PostgreSQL
            const pgPost: any = {};
            
            // Mapeamento manual de campos conhecidos que possam diferir entre Supabase e PostgreSQL
            const fieldMappings: {[key: string]: string} = {
              // Mapear quaisquer campos que tenham nomes diferentes
              // Exemplo: 'conteudo': 'content'
            };
            
            for (const [key, value] of Object.entries(fullPost)) {
              // Transformar chaves em snake_case
              const pgKey = key.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
              
              // Verificar se o campo existe na tabela do PostgreSQL
              if (validColumns.includes(pgKey) || validColumns.includes(fieldMappings[pgKey])) {
                const finalKey = fieldMappings[pgKey] || pgKey;
                pgPost[finalKey] = value;
              }
            }
            
            // Garantir que os campos essenciais estejam presentes
            if (!pgPost.id) pgPost.id = id;
            if (!pgPost.title && existingPost.title) pgPost.title = existingPost.title;
            if (!pgPost.description && existingPost.description) pgPost.description = existingPost.description;
            if (!pgPost.image_url && existingPost.image_url) pgPost.image_url = existingPost.image_url;
            if (!pgPost.category_id && existingPost.category_id) pgPost.category_id = existingPost.category_id;
            if (!pgPost.status) pgPost.status = 'aprovado';
            if (!pgPost.created_at) pgPost.created_at = new Date().toISOString();
            
            // Garantir que unique_code existe (campo obrigatório)
            if (!pgPost.unique_code) {
              if (existingPost.unique_code) {
                pgPost.unique_code = existingPost.unique_code;
              } else {
                // Gerar um unique_code baseado no ID e timestamp
                pgPost.unique_code = `${id}-${Date.now().toString(36)}`;
                console.log(`DATABASE updatePost - Gerando unique_code: ${pgPost.unique_code} para post ${id}`);
              }
            }
            
            // Definir explicitamente os campos de licença premium
            pgPost.license_type = dbPost.license_type || (existingPost.is_pro ? 'premium' : 'free');
            pgPost.is_pro = dbPost.is_pro !== undefined ? dbPost.is_pro : !!existingPost.is_pro;
            
            // Filtrar apenas os campos que existem na tabela
            const validPgPost: any = {};
            for (const [key, value] of Object.entries(pgPost)) {
              if (validColumns.includes(key)) {
                validPgPost[key] = value;
              }
            }
            
            // Construir consulta SQL para inserção com ON CONFLICT para evitar duplicatas
            const insertFields = Object.keys(validPgPost);
            const insertValues = Object.values(validPgPost);
            const insertPlaceholders = insertFields.map((_, i) => `$${i + 1}`).join(', ');
            
            // Campos para atualização em caso de conflito (exceto id e unique_code)
            const updateFields = insertFields.filter(field => field !== 'id' && field !== 'unique_code');
            const updateClauses = updateFields.map(field => `${field} = EXCLUDED.${field}`).join(', ');
            
            const insertSql = `
              INSERT INTO posts (${insertFields.join(', ')})
              VALUES (${insertPlaceholders})
              ON CONFLICT (unique_code) DO UPDATE SET ${updateClauses}
              RETURNING *
            `;
            
            console.log(`DATABASE updatePost - Campos a inserir/atualizar no PostgreSQL:`, insertFields);
            
            // Executar a inserção/atualização
            const insertResult = await pool.query(insertSql, insertValues);
            const data = insertResult.rows[0];
            
            // Mapear para o formato esperado pela aplicação
            const postResult: Post = {
              id: data.id,
              title: data.title,
              description: data.description || "",
              imageUrl: data.image_url,
              uniqueCode: data.unique_code,
              categoryId: data.category_id,
              status: data.status,
              createdAt: new Date(data.created_at),
              publishedAt: data.published_at ? new Date(data.published_at) : null,
              formato: data.formato,
              formatData: data.format_data,
              groupId: data.group_id,
              tituloBase: data.titulo_base,
              isPro: !!data.is_pro,
              licenseType: data.license_type || 'free',
              canvaUrl: data.canva_url,
              formatoData: data.formato_data,
              isVisible: data.is_visible !== false,
              tags: data.tags || [],
              formats: data.formats || []
            };
            
            console.log(`DATABASE updatePost - Post sincronizado entre Supabase e PostgreSQL`);
            return postResult;
          } catch (schemaError) {
            console.error(`DATABASE updatePost - Erro ao obter estrutura da tabela:`, schemaError);
            
            // Criar um post básico com apenas os campos essenciais
            const minimalPost = {
              id,
              title: existingPost.title || 'Sem título',
              description: existingPost.description || '',
              image_url: existingPost.image_url || '',
              category_id: existingPost.category_id || 2,
              status: 'aprovado',
              created_at: new Date().toISOString(),
              license_type: dbPost.license_type || (existingPost.is_pro ? 'premium' : 'free'),
              is_pro: dbPost.is_pro !== undefined ? dbPost.is_pro : !!existingPost.is_pro
            };
            
            // Construir consulta SQL para inserção simplificada
            const insertFieldsMin = Object.keys(minimalPost);
            const insertValuesMin = Object.values(minimalPost);
            const insertPlaceholdersMin = insertFieldsMin.map((_, i) => `$${i + 1}`).join(', ');
            
            const insertSqlMin = `
              INSERT INTO posts (${insertFieldsMin.join(', ')})
              VALUES (${insertPlaceholdersMin})
              RETURNING *
            `;
            
            // Executar a inserção simplificada
            const insertResult = await pool.query(insertSqlMin, insertValuesMin);
            const data = insertResult.rows[0];
            
            // Mapear para o formato esperado pela aplicação
            const postResult: Post = {
              id: data.id,
              title: data.title,
              description: data.description || "",
              imageUrl: data.image_url,
              uniqueCode: data.unique_code || '',
              categoryId: data.category_id,
              status: data.status,
              createdAt: new Date(data.created_at),
              publishedAt: data.published_at ? new Date(data.published_at) : null,
              formato: data.formato || '',
              formatData: data.format_data || null,
              groupId: data.group_id || '',
              tituloBase: data.titulo_base || '',
              isPro: !!data.is_pro,
              licenseType: data.license_type || 'free',
              canvaUrl: data.canva_url || '',
              formatoData: data.formato_data || null,
              isVisible: data.is_visible !== false,
              tags: data.tags || [],
              formats: data.formats || []
            };
            
            console.log(`DATABASE updatePost - Post sincronizado com dados mínimos entre Supabase e PostgreSQL`);
            return postResult;
          }
        }
        
        const data = result.rows[0];
        
        // Mapear para o formato esperado pela aplicação
        const postResult: Post = {
          id: data.id,
          title: data.title,
          description: data.description || "",
          imageUrl: data.image_url,
          uniqueCode: data.unique_code,
          categoryId: data.category_id,
          status: data.status,
          createdAt: new Date(data.created_at),
          publishedAt: data.published_at ? new Date(data.published_at) : null,
          formato: data.formato,
          formatData: data.format_data,
          groupId: data.group_id,
          tituloBase: data.titulo_base,
          isPro: !!data.is_pro,
          licenseType: data.license_type || 'free',
          canvaUrl: data.canva_url,
          formatoData: data.formato_data,
          isVisible: data.is_visible !== false,
          tags: data.tags || [],
          formats: data.formats || []
        };
        
        console.log(`DATABASE updatePost - Post atualizado: ${postResult.title} via PostgreSQL direto`);
        return postResult;
      } catch (pgError) {
        console.error("DATABASE updatePost - Erro PostgreSQL:", pgError);
        throw new Error(`Erro ao atualizar post: ${pgError.message}`);
      }
    } catch (error) {
      console.error("DATABASE updatePost - Exceção:", error);
      throw error;
    }
  }
  
  async deletePost(id: number): Promise<void> {
    try {
      console.log(`DATABASE deletePost - Excluindo post com ID: ${id}`);
      
      // Tentar excluir primeiro do Supabase
      console.log("DATABASE deletePost - Tentando excluir do Supabase primeiro");
      
      try {
        const { error: supabaseError } = await supabase
          .from('posts')
          .delete()
          .eq('id', id);
          
        if (supabaseError) {
          console.warn("DATABASE deletePost - Erro ao excluir do Supabase:", supabaseError.message);
          // Se falhar, continuamos com PostgreSQL
        } else {
          console.log(`DATABASE deletePost - Post com ID ${id} excluído com sucesso do Supabase`);
        }
      } catch (supabaseDeleteError) {
        console.error("DATABASE deletePost - Exceção ao excluir do Supabase:", supabaseDeleteError);
      }
      
      // Excluir do PostgreSQL direto também (mesmo que Supabase tenha funcionado)
      console.log("DATABASE deletePost - Excluindo do PostgreSQL direto");
      
      const sql = `DELETE FROM posts WHERE id = $1`;
      
      try {
        const result = await pool.query(sql, [id]);
        
        if (result.rowCount === 0) {
          console.log(`DATABASE deletePost - Post com ID ${id} não encontrado no PostgreSQL direto (provavelmente já foi excluído ou nunca existiu)`);
        } else {
          console.log(`DATABASE deletePost - Post com ID ${id} excluído com sucesso do PostgreSQL direto`);
        }
      } catch (pgError: any) {
        console.error("DATABASE deletePost - Erro ao excluir do PostgreSQL:", pgError);
        // Não falhar aqui se o Supabase já excluiu
      }
      
      // Sucesso se chegamos até aqui (pelo menos uma das exclusões funcionou)
      console.log(`DATABASE deletePost - Post com ID ${id} excluído com sucesso`);
    } catch (error) {
      console.error("DATABASE deletePost - Exceção:", error);
      throw error;
    }
  }
  
  async updatePostStatus(ids: number[], status: 'aprovado' | 'rascunho' | 'rejeitado'): Promise<void> {
    try {
      console.log(`DATABASE updatePostStatus - Atualizando status para ${status} nos posts:`, ids);
      
      // Definir dados para atualização
      let updateData: any = { status };
      
      // Se for para aprovar, definir a data de publicação
      if (status === 'aprovado') {
        updateData.published_at = new Date().toISOString();
      }
      
      // Primeiro tentar atualizar via Supabase
      console.log("DATABASE updatePostStatus - Tentando atualizar status via Supabase");
      let successCount = 0;
      
      try {
        // Atualizar posts individualmente (Supabase não suporta .in para update)
        for (const id of ids) {
          const { error } = await supabase
            .from('posts')
            .update(updateData)
            .eq('id', id);
            
          if (!error) {
            successCount++;
          }
        }
        
        console.log(`DATABASE updatePostStatus - ${successCount} de ${ids.length} posts atualizados via Supabase`);
      } catch (supabaseError) {
        console.error("DATABASE updatePostStatus - Erro ao atualizar via Supabase:", supabaseError);
      }
      
      // Também atualizar via PostgreSQL direto para garantir consistência
      console.log("DATABASE updatePostStatus - Usando PostgreSQL direto para atualização de status");
      
      // Criar placeholder IDs para a consulta SQL
      const idPlaceholders = ids.map((_, i) => `$${i + 2}`).join(', ');
      
      const sql = `
        UPDATE posts 
        SET status = $1${status === 'aprovado' ? ', published_at = $' + (ids.length + 2) : ''}
        WHERE id IN (${idPlaceholders})
      `;
      
      // Montar array de parâmetros com status no início, seguido pelos IDs
      const params = [status, ...ids];
      
      // Adicionar data de publicação se necessário
      if (status === 'aprovado') {
        params.push(updateData.published_at);
      }
      
      try {
        const result = await pool.query(sql, params);
        
        console.log(`DATABASE updatePostStatus - Status atualizado para ${status} em ${result.rowCount} posts via PostgreSQL direto`);
      } catch (pgError: any) {
        console.error("DATABASE updatePostStatus - Erro PostgreSQL:", pgError);
        
        // Se Supabase atualizou pelo menos alguns posts, não falhar
        if (successCount > 0) {
          console.log(`DATABASE updatePostStatus - Continuando, pois ${successCount} posts foram atualizados via Supabase`);
        } else {
          throw new Error(`Erro ao atualizar status dos posts: ${pgError.message}`);
        }
      }
      
      console.log(`DATABASE updatePostStatus - Atualização de status concluída para ${ids.length} posts`);
    } catch (error) {
      console.error("DATABASE updatePostStatus - Exceção:", error);
      throw error;
    }
  }
  
  // Seed the database with sample artworks
  async seedDatabase() {
    // Check if artworks already exist
    const existingArtworks = await db.select().from(artworks);
    
    if (existingArtworks.length === 0) {
      const sampleArtworks: InsertArtwork[] = [
        {
          title: "Segredos de uma Pele Radiante",
          description: "Dicas para um cuidado perfeito da pele",
          imageUrl: "https://images.unsplash.com/photo-1596704017454-7a8b113978b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&h=1350&q=80",
          format: "portrait",
          isPro: true,
          category: "pele"
        },
        {
          title: "5 mitos sobre o uso de protetor solar",
          description: "Verdades e mentiras sobre proteção solar",
          imageUrl: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&h=1350&q=80",
          format: "portrait",
          isPro: true,
          category: "proteção"
        },
        {
          title: "Seu primeiro Botox?",
          description: "O que você precisa saber antes do procedimento",
          imageUrl: "https://images.unsplash.com/photo-1526045612212-70caf35c14df?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&h=1350&q=80",
          format: "portrait",
          isPro: true,
          category: "botox"
        },
        {
          title: "Drenagem linfática",
          description: "Benefícios e procedimentos para tratamento estético",
          imageUrl: "https://images.unsplash.com/photo-1615148758079-574a78a2f8ad?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&h=1080&q=80",
          format: "square",
          isPro: true,
          category: "drenagem"
        },
        {
          title: "Cuidados sem fazer cirurgia",
          description: "Tratamentos não invasivos para beleza",
          imageUrl: "https://images.unsplash.com/photo-1526280503902-dedeea979a6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&h=1080&q=80",
          format: "square",
          isPro: true,
          category: "tratamentos"
        },
        {
          title: "Protocolos para limpeza de pele",
          description: "Guia completo para esteticistas",
          imageUrl: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&h=1350&q=80",
          format: "portrait",
          isPro: true,
          category: "limpeza"
        },
        {
          title: "Hidratação profunda",
          description: "Técnicas para hidratação da pele",
          imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&h=1350&q=80",
          format: "portrait",
          isPro: true,
          category: "hidratação"
        },
        {
          title: "Massagem modeladora",
          description: "Técnicas e benefícios para o corpo",
          imageUrl: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&h=1080&q=80",
          format: "square",
          isPro: true,
          category: "massagem"
        },
        {
          title: "Rejuvenescimento facial",
          description: "Procedimentos para diminuir marcas de expressão",
          imageUrl: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&h=1350&q=80",
          format: "portrait",
          isPro: true,
          category: "rejuvenescimento"
        }
      ];
      
      // Insert sample artworks
      await db.insert(artworks).values(sampleArtworks);

      // Create admin user if it doesn't exist
      const adminUsername = "admin";
      const adminEmail = "jean.maringa@hotmail.com";
      const [existingAdmin] = await db.select().from(users).where(eq(users.username, adminUsername));
      
      if (!existingAdmin) {
        // Import necessary modules for password hashing
        const { scrypt, randomBytes } = await import('crypto');
        const { promisify } = await import('util');
        const scryptAsync = promisify(scrypt);
        
        // Hash the password
        const salt = randomBytes(16).toString("hex");
        const derivedKey = await scryptAsync("admin123", salt, 64) as Buffer;
        const hashedPassword = `${derivedKey.toString("hex")}.${salt}`;
        
        // Create admin user
        await db.insert(users).values({
          username: adminUsername,
          email: adminEmail,
          password: hashedPassword,
          is_admin: true
        });
        
        console.log("Admin user created with username 'admin' and password 'admin123'");
      }
    }
  }
  
  // Implementação dos métodos de gerenciamento de planos
  async getPlans(showInactive: boolean = false): Promise<Plan[]> {
    try {
      console.log("DATABASE getPlans - Buscando planos", showInactive ? "incluindo inativos" : "apenas ativos");
      
      // Primeiro tentamos com Supabase
      try {
        let query = supabase.from('plans').select('*');
        
        if (!showInactive) {
          query = query.eq('is_active', true);
        }
        
        const { data, error } = await query.order('id');
        
        if (error) {
          console.error("DATABASE getPlans - Erro ao buscar planos via Supabase:", error.message);
          throw new Error("Falha ao buscar planos via Supabase");
        }
        
        if (data) {
          console.log(`DATABASE getPlans - Encontrados ${data.length} planos via Supabase`);
          
          // Mapear os dados para o formato esperado
          return data.map((plan) => ({
            id: plan.id,
            name: plan.name,
            periodo: plan.periodo,
            valor: plan.valor,
            isActive: plan.is_active,
            isPrincipal: plan.is_principal,
            isGratuito: plan.is_gratuito,
            codigoHotmart: plan.codigo_hotmart,
            urlHotmart: plan.url_hotmart,
            beneficios: plan.beneficios,
            createdAt: new Date(plan.created_at)
          }));
        }
      } catch (supabaseError) {
        console.error("DATABASE getPlans - Exceção ao acessar Supabase:", supabaseError);
      }
      
      // Se falhar com Supabase, tentamos diretamente com PostgreSQL
      console.log("DATABASE getPlans - Tentando buscar planos com PostgreSQL direto");
      
      try {
        let query = `
          SELECT * FROM plans
        `;
        
        if (!showInactive) {
          query += ` WHERE is_active = true`;
        }
        
        query += ` ORDER BY id`;
        
        const result = await pool.query(query);
        
        if (result && result.rows) {
          console.log(`DATABASE getPlans - Encontrados ${result.rows.length} planos via PostgreSQL`);
          
          // Mapear os dados para o formato esperado
          return result.rows.map((plan) => ({
            id: plan.id,
            name: plan.name,
            periodo: plan.periodo,
            valor: plan.valor,
            isActive: plan.is_active,
            isPrincipal: plan.is_principal,
            isGratuito: plan.is_gratuito,
            codigoHotmart: plan.codigo_hotmart,
            urlHotmart: plan.url_hotmart,
            beneficios: plan.beneficios,
            createdAt: new Date(plan.created_at)
          }));
        }
      } catch (pgError) {
        console.error("DATABASE getPlans - Erro ao buscar planos via PostgreSQL:", pgError);
      }
      
      // Se chegou aqui, nenhum dos métodos funcionou
      console.warn("DATABASE getPlans - Nenhum plano encontrado ou erro em ambas as fontes de dados");
      return [];
    } catch (error) {
      console.error("DATABASE getPlans - Exceção geral:", error);
      return [];
    }
  }
  
  async getPlanById(id: number): Promise<Plan | undefined> {
    try {
      console.log("DATABASE getPlanById - Buscando plano com ID:", id);
      
      // Primeiro tentamos com Supabase
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        
        if (error) {
          console.error("DATABASE getPlanById - Erro ao buscar plano via Supabase:", error.message);
          throw new Error("Falha ao buscar plano via Supabase");
        }
        
        if (data) {
          console.log("DATABASE getPlanById - Plano encontrado via Supabase");
          
          // Mapear os dados para o formato esperado
          return {
            id: data.id,
            name: data.name,
            periodo: data.periodo,
            valor: data.valor,
            isActive: data.is_active,
            isPrincipal: data.is_principal,
            isGratuito: data.is_gratuito,
            codigoHotmart: data.codigo_hotmart,
            urlHotmart: data.url_hotmart,
            beneficios: data.beneficios,
            createdAt: new Date(data.created_at)
          };
        }
      } catch (supabaseError) {
        console.error("DATABASE getPlanById - Exceção ao acessar Supabase:", supabaseError);
      }
      
      // Se falhar com Supabase, tentamos diretamente com PostgreSQL
      console.log("DATABASE getPlanById - Tentando buscar plano com PostgreSQL direto");
      
      try {
        const query = `
          SELECT * FROM plans
          WHERE id = $1
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result && result.rows && result.rows.length > 0) {
          console.log("DATABASE getPlanById - Plano encontrado via PostgreSQL");
          const plan = result.rows[0];
          
          // Mapear os dados para o formato esperado
          return {
            id: plan.id,
            name: plan.name,
            periodo: plan.periodo,
            valor: plan.valor,
            isActive: plan.is_active,
            isPrincipal: plan.is_principal,
            isGratuito: plan.is_gratuito,
            codigoHotmart: plan.codigo_hotmart,
            urlHotmart: plan.url_hotmart,
            beneficios: plan.beneficios,
            createdAt: new Date(plan.created_at)
          };
        }
      } catch (pgError) {
        console.error("DATABASE getPlanById - Erro ao buscar plano via PostgreSQL:", pgError);
      }
      
      // Se chegou aqui, nenhum dos métodos funcionou
      console.warn(`DATABASE getPlanById - Plano com ID ${id} não encontrado ou erro em ambas as fontes de dados`);
      return undefined;
    } catch (error) {
      console.error("DATABASE getPlanById - Exceção geral:", error);
      return undefined;
    }
  }
  
  async createPlan(insertPlan: InsertPlan): Promise<Plan> {
    try {
      console.log("DATABASE createPlan - Dados para inserção:", JSON.stringify(insertPlan));
      
      // Mapear para o formato do banco
      const dbPlan = {
        name: insertPlan.name,
        periodo: insertPlan.periodo,
        valor: insertPlan.valor,
        is_active: insertPlan.isActive ?? true,
        is_principal: insertPlan.isPrincipal ?? false,
        is_gratuito: insertPlan.isGratuito ?? false,
        codigo_hotmart: insertPlan.codigoHotmart,
        url_hotmart: insertPlan.urlHotmart,
        beneficios: insertPlan.beneficios
      };
      
      // Primeiro tentamos com Supabase
      try {
        const { data, error } = await supabase
          .from('plans')
          .insert(dbPlan)
          .select()
          .single();
        
        if (error) {
          console.error("DATABASE createPlan - Erro ao inserir plano via Supabase:", error.message);
          throw new Error("Falha ao inserir plano via Supabase");
        }
        
        if (data) {
          console.log("DATABASE createPlan - Plano criado via Supabase:", data.id);
          
          // Mapear para o formato esperado pela aplicação
          return {
            id: data.id,
            name: data.name,
            periodo: data.periodo,
            valor: data.valor,
            isActive: data.is_active,
            isPrincipal: data.is_principal,
            isGratuito: data.is_gratuito,
            codigoHotmart: data.codigo_hotmart,
            urlHotmart: data.url_hotmart,
            beneficios: data.beneficios,
            createdAt: new Date(data.created_at)
          };
        }
      } catch (supabaseError) {
        console.error("DATABASE createPlan - Exceção ao acessar Supabase:", supabaseError);
      }
      
      // Se falhar com Supabase, tentamos diretamente com PostgreSQL
      console.log("DATABASE createPlan - Tentando inserir plano com PostgreSQL direto");
      
      try {
        const query = `
          INSERT INTO plans (
            name, periodo, valor, is_active, is_principal, is_gratuito,
            codigo_hotmart, url_hotmart, beneficios
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
          ) RETURNING *
        `;
        
        const values = [
          dbPlan.name,
          dbPlan.periodo,
          dbPlan.valor,
          dbPlan.is_active,
          dbPlan.is_principal,
          dbPlan.is_gratuito,
          dbPlan.codigo_hotmart,
          dbPlan.url_hotmart,
          dbPlan.beneficios
        ];
        
        const result = await pool.query(query, values);
        
        if (result && result.rows && result.rows.length > 0) {
          console.log("DATABASE createPlan - Plano criado via PostgreSQL:", result.rows[0].id);
          const plan = result.rows[0];
          
          // Mapear para o formato esperado pela aplicação
          return {
            id: plan.id,
            name: plan.name,
            periodo: plan.periodo,
            valor: plan.valor,
            isActive: plan.is_active,
            isPrincipal: plan.is_principal,
            isGratuito: plan.is_gratuito,
            codigoHotmart: plan.codigo_hotmart,
            urlHotmart: plan.url_hotmart,
            beneficios: plan.beneficios,
            createdAt: new Date(plan.created_at)
          };
        }
      } catch (pgError) {
        console.error("DATABASE createPlan - Erro ao inserir plano via PostgreSQL:", pgError);
      }
      
      // Se chegou aqui, nenhum dos métodos funcionou
      throw new Error("Falha ao criar plano: ambos os métodos de inserção falharam");
    } catch (error) {
      console.error("DATABASE createPlan - Exceção geral:", error);
      throw error;
    }
  }
  
  async updatePlan(id: number, updatePlan: Partial<InsertPlan>): Promise<Plan> {
    try {
      console.log("DATABASE updatePlan - Atualizando plano #" + id + ":", JSON.stringify(updatePlan));
      
      // Mapear para o formato do banco
      const dbPlan: Record<string, any> = {};
      
      if (updatePlan.name !== undefined) dbPlan.name = updatePlan.name;
      if (updatePlan.periodo !== undefined) dbPlan.periodo = updatePlan.periodo;
      if (updatePlan.valor !== undefined) dbPlan.valor = updatePlan.valor;
      if (updatePlan.isActive !== undefined) dbPlan.is_active = updatePlan.isActive;
      if (updatePlan.isPrincipal !== undefined) dbPlan.is_principal = updatePlan.isPrincipal;
      if (updatePlan.isGratuito !== undefined) dbPlan.is_gratuito = updatePlan.isGratuito;
      if (updatePlan.codigoHotmart !== undefined) dbPlan.codigo_hotmart = updatePlan.codigoHotmart;
      if (updatePlan.urlHotmart !== undefined) dbPlan.url_hotmart = updatePlan.urlHotmart;
      if (updatePlan.beneficios !== undefined) dbPlan.beneficios = updatePlan.beneficios;
      
      // Se não há nada para atualizar, buscar o plano atual
      if (Object.keys(dbPlan).length === 0) {
        console.log("DATABASE updatePlan - Nenhum campo para atualizar, buscando plano atual");
        const currentPlan = await this.getPlanById(id);
        if (!currentPlan) {
          throw new Error(`Plano com ID ${id} não encontrado`);
        }
        return currentPlan;
      }
      
      // Primeiro tentamos com Supabase
      try {
        const { data, error } = await supabase
          .from('plans')
          .update(dbPlan)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error("DATABASE updatePlan - Erro ao atualizar plano via Supabase:", error.message);
          throw new Error("Falha ao atualizar plano via Supabase");
        }
        
        if (data) {
          console.log("DATABASE updatePlan - Plano atualizado via Supabase");
          
          // Mapear para o formato esperado pela aplicação
          return {
            id: data.id,
            name: data.name,
            periodo: data.periodo,
            valor: data.valor,
            isActive: data.is_active,
            isPrincipal: data.is_principal,
            isGratuito: data.is_gratuito,
            codigoHotmart: data.codigo_hotmart,
            urlHotmart: data.url_hotmart,
            beneficios: data.beneficios,
            createdAt: new Date(data.created_at)
          };
        }
      } catch (supabaseError) {
        console.error("DATABASE updatePlan - Exceção ao acessar Supabase:", supabaseError);
      }
      
      // Se falhar com Supabase, tentamos diretamente com PostgreSQL
      console.log("DATABASE updatePlan - Tentando atualizar plano com PostgreSQL direto");
      
      try {
        // Construir a query dinamicamente com base nos campos a serem atualizados
        const setClause = Object.keys(dbPlan)
          .map((key, index) => `${key} = $${index + 1}`)
          .join(', ');
        
        const values = [...Object.values(dbPlan), id];
        
        const query = `
          UPDATE plans 
          SET ${setClause} 
          WHERE id = $${values.length}
          RETURNING *
        `;
        
        console.log("Executando query: ", query, values);
        
        const result = await pool.query(query, values);
        
        if (result && result.rows && result.rows.length > 0) {
          console.log("DATABASE updatePlan - Plano atualizado via PostgreSQL");
          const plan = result.rows[0];
          
          // Mapear para o formato esperado pela aplicação
          return {
            id: plan.id,
            name: plan.name,
            periodo: plan.periodo,
            valor: plan.valor,
            isActive: plan.is_active,
            isPrincipal: plan.is_principal,
            isGratuito: plan.is_gratuito,
            codigoHotmart: plan.codigo_hotmart,
            urlHotmart: plan.url_hotmart,
            beneficios: plan.beneficios,
            createdAt: new Date(plan.created_at)
          };
        }
      } catch (pgError) {
        console.error("DATABASE updatePlan - Erro ao atualizar plano via PostgreSQL:", pgError);
      }
      
      // Se chegou aqui, nenhum dos métodos funcionou
      throw new Error(`Falha ao atualizar plano com ID ${id}: ambos os métodos falharam`);
    } catch (error) {
      console.error("DATABASE updatePlan - Exceção geral:", error);
      throw error;
    }
  }
  
  async deletePlan(id: number): Promise<void> {
    try {
      console.log("DATABASE deletePlan - Excluindo plano #" + id);
      
      // Primeiro tentamos com Supabase
      try {
        const { error } = await supabase
          .from('plans')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error("DATABASE deletePlan - Erro ao excluir plano via Supabase:", error.message);
          throw new Error("Falha ao excluir plano via Supabase");
        }
        
        console.log("DATABASE deletePlan - Plano excluído com sucesso via Supabase");
        return;
      } catch (supabaseError) {
        console.error("DATABASE deletePlan - Exceção ao acessar Supabase:", supabaseError);
      }
      
      // Se falhar com Supabase, tentamos diretamente com PostgreSQL
      console.log("DATABASE deletePlan - Tentando excluir plano com PostgreSQL direto");
      
      try {
        const query = `
          DELETE FROM plans 
          WHERE id = $1
        `;
        
        await pool.query(query, [id]);
        
        console.log("DATABASE deletePlan - Plano excluído com sucesso via PostgreSQL");
        return;
      } catch (pgError) {
        console.error("DATABASE deletePlan - Erro ao excluir plano via PostgreSQL:", pgError);
      }
      
      // Se chegou aqui, nenhum dos métodos funcionou
      throw new Error(`Falha ao excluir plano com ID ${id}: ambos os métodos falharam`);
    } catch (error) {
      console.error("DATABASE deletePlan - Exceção geral:", error);
      throw error;
    }
  }
  
  async togglePlanStatus(id: number, isActive: boolean): Promise<Plan> {
    try {
      console.log(`DATABASE togglePlanStatus - ${isActive ? 'Ativando' : 'Desativando'} plano #${id}`);
      
      // Primeiro tentamos com Supabase
      try {
        const { data, error } = await supabase
          .from('plans')
          .update({ is_active: isActive })
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error("DATABASE togglePlanStatus - Erro ao atualizar status via Supabase:", error.message);
          throw new Error("Falha ao atualizar status via Supabase");
        }
        
        if (data) {
          console.log("DATABASE togglePlanStatus - Status atualizado via Supabase");
          
          // Mapear para o formato esperado pela aplicação
          return {
            id: data.id,
            name: data.name,
            periodo: data.periodo,
            valor: data.valor,
            isActive: data.is_active,
            isPrincipal: data.is_principal,
            isGratuito: data.is_gratuito,
            codigoHotmart: data.codigo_hotmart,
            urlHotmart: data.url_hotmart,
            beneficios: data.beneficios,
            createdAt: new Date(data.created_at)
          };
        }
      } catch (supabaseError) {
        console.error("DATABASE togglePlanStatus - Exceção ao acessar Supabase:", supabaseError);
      }
      
      // Se falhar com Supabase, tentamos diretamente com PostgreSQL
      console.log("DATABASE togglePlanStatus - Tentando atualizar status com PostgreSQL direto");
      
      try {
        const query = `
          UPDATE plans 
          SET is_active = $1 
          WHERE id = $2
          RETURNING *
        `;
        
        const result = await pool.query(query, [isActive, id]);
        
        if (result && result.rows && result.rows.length > 0) {
          console.log("DATABASE togglePlanStatus - Status atualizado via PostgreSQL");
          const plan = result.rows[0];
          
          // Mapear para o formato esperado pela aplicação
          return {
            id: plan.id,
            name: plan.name,
            periodo: plan.periodo,
            valor: plan.valor,
            isActive: plan.is_active,
            isPrincipal: plan.is_principal,
            isGratuito: plan.is_gratuito,
            codigoHotmart: plan.codigo_hotmart,
            urlHotmart: plan.url_hotmart,
            beneficios: plan.beneficios,
            createdAt: new Date(plan.created_at)
          };
        }
      } catch (pgError) {
        console.error("DATABASE togglePlanStatus - Erro ao atualizar status via PostgreSQL:", pgError);
      }
      
      // Se chegou aqui, nenhum dos métodos funcionou
      throw new Error(`Falha ao atualizar status do plano com ID ${id}: ambos os métodos falharam`);
    } catch (error) {
      console.error("DATABASE togglePlanStatus - Exceção geral:", error);
      throw error;
    }
  }
  
  // Implementação dos métodos de gerenciamento de tags
  
  async getTags(): Promise<Tag[]> {
    try {
      console.log("DATABASE getTags - Buscando todas as tags");
      
      // Tentar primeiro com Supabase
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });
        
      if (error) {
        console.error("DATABASE getTags - Erro ao buscar tags via Supabase:", error.message);
        // Tentar com PostgreSQL direto se o Supabase falhar
        try {
          console.log("DATABASE getTags - Tentando via PostgreSQL após falha no Supabase");
          const result = await pool.query(
            'SELECT * FROM tags ORDER BY name ASC'
          );
          
          return result.rows.map(tag => ({
            id: tag.id,
            name: tag.name,
            slug: tag.slug,
            description: tag.description,
            isActive: tag.is_active === true || tag.is_active === 't',
            count: tag.count || 0,
            createdAt: new Date(tag.created_at)
          }));
        } catch (pgError) {
          console.error("DATABASE getTags - Erro também no PostgreSQL:", pgError);
          return [];
        }
      }
      
      if (!data) {
        console.log("DATABASE getTags - Nenhuma tag encontrada");
        return [];
      }
      
      // Mapear para o formato esperado pela aplicação
      return data.map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
        isActive: tag.is_active === true || tag.is_active === 't',
        count: tag.count || 0,
        createdAt: new Date(tag.created_at)
      }));
    } catch (error) {
      console.error("DATABASE getTags - Exceção:", error);
      return [];
    }
  }
  
  async getTagById(id: number): Promise<Tag | undefined> {
    try {
      console.log(`DATABASE getTagById - Buscando tag com ID ${id}`);
      
      // Tentar primeiro com Supabase
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error("DATABASE getTagById - Erro ao buscar tag via Supabase:", error.message);
        // Tentar com PostgreSQL direto se o Supabase falhar
        try {
          console.log("DATABASE getTagById - Tentando via PostgreSQL após falha no Supabase");
          const result = await pool.query(
            'SELECT * FROM tags WHERE id = $1',
            [id]
          );
          
          if (result.rows.length === 0) {
            return undefined;
          }
          
          const tag = result.rows[0];
          return {
            id: tag.id,
            name: tag.name,
            slug: tag.slug,
            description: tag.description,
            isActive: tag.is_active === true || tag.is_active === 't',
            count: tag.count || 0,
            createdAt: new Date(tag.created_at)
          };
        } catch (pgError) {
          console.error("DATABASE getTagById - Erro também no PostgreSQL:", pgError);
          return undefined;
        }
      }
      
      if (!data) {
        console.log(`DATABASE getTagById - Tag com ID ${id} não encontrada`);
        return undefined;
      }
      
      // Mapear para o formato esperado pela aplicação
      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        isActive: data.is_active === true || data.is_active === 't',
        count: data.count || 0,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error("DATABASE getTagById - Exceção:", error);
      return undefined;
    }
  }
  
  async getTagBySlug(slug: string): Promise<Tag | undefined> {
    try {
      console.log(`DATABASE getTagBySlug - Buscando tag com slug "${slug}"`);
      
      // Tentar primeiro com Supabase
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('slug', slug)
        .single();
        
      if (error) {
        console.error("DATABASE getTagBySlug - Erro ao buscar tag via Supabase:", error.message);
        // Tentar com PostgreSQL direto se o Supabase falhar
        try {
          console.log("DATABASE getTagBySlug - Tentando via PostgreSQL após falha no Supabase");
          const result = await pool.query(
            'SELECT * FROM tags WHERE slug = $1',
            [slug]
          );
          
          if (result.rows.length === 0) {
            return undefined;
          }
          
          const tag = result.rows[0];
          return {
            id: tag.id,
            name: tag.name,
            slug: tag.slug,
            description: tag.description,
            isActive: tag.is_active === true || tag.is_active === 't',
            count: tag.count || 0,
            createdAt: new Date(tag.created_at)
          };
        } catch (pgError) {
          console.error("DATABASE getTagBySlug - Erro também no PostgreSQL:", pgError);
          return undefined;
        }
      }
      
      if (!data) {
        console.log(`DATABASE getTagBySlug - Tag com slug "${slug}" não encontrada`);
        return undefined;
      }
      
      // Mapear para o formato esperado pela aplicação
      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        isActive: data.is_active === true || data.is_active === 't',
        count: data.count || 0,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error("DATABASE getTagBySlug - Exceção:", error);
      return undefined;
    }
  }
  
  async createTag(tag: InsertTag): Promise<Tag> {
    try {
      console.log("DATABASE createTag - Criando nova tag:", tag);
      
      // Mapear os campos para o formato do banco
      const dbTag = {
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
        is_active: tag.isActive === undefined ? true : tag.isActive,
        count: 0
      };
      
      // Tentar primeiro com Supabase
      const { data, error } = await supabase
        .from('tags')
        .insert(dbTag)
        .select()
        .single();
        
      if (error) {
        console.error("DATABASE createTag - Erro ao criar tag via Supabase:", error.message);
        // Tentar com PostgreSQL direto se o Supabase falhar
        try {
          console.log("DATABASE createTag - Tentando via PostgreSQL após falha no Supabase");
          const result = await pool.query(
            'INSERT INTO tags (name, slug, description, is_active, count) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [tag.name, tag.slug, tag.description, tag.isActive === undefined ? true : tag.isActive, 0]
          );
          
          const newTag = result.rows[0];
          return {
            id: newTag.id,
            name: newTag.name,
            slug: newTag.slug,
            description: newTag.description,
            isActive: newTag.is_active === true || newTag.is_active === 't',
            count: newTag.count || 0,
            createdAt: new Date(newTag.created_at)
          };
        } catch (pgError) {
          console.error("DATABASE createTag - Erro também no PostgreSQL:", pgError);
          throw new Error(`Erro ao criar tag: ${error.message}`);
        }
      }
      
      // Mapear para o formato esperado pela aplicação
      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        isActive: data.is_active === true || data.is_active === 't',
        count: data.count || 0,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error("DATABASE createTag - Exceção:", error);
      throw error;
    }
  }
  
  async updateTag(id: number, tagUpdate: Partial<InsertTag>): Promise<Tag> {
    try {
      console.log(`DATABASE updateTag - Atualizando tag ${id}:`, tagUpdate);
      
      // Mapear os campos para o formato do banco
      const dbTagUpdate: any = {};
      if (tagUpdate.name !== undefined) dbTagUpdate.name = tagUpdate.name;
      if (tagUpdate.slug !== undefined) dbTagUpdate.slug = tagUpdate.slug;
      if (tagUpdate.description !== undefined) dbTagUpdate.description = tagUpdate.description;
      if (tagUpdate.isActive !== undefined) dbTagUpdate.is_active = tagUpdate.isActive;
      
      // Tentar primeiro com Supabase
      const { data, error } = await supabase
        .from('tags')
        .update(dbTagUpdate)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error("DATABASE updateTag - Erro ao atualizar tag via Supabase:", error.message);
        // Tentar com PostgreSQL direto se o Supabase falhar
        try {
          console.log("DATABASE updateTag - Tentando via PostgreSQL após falha no Supabase");
          
          // Construir a consulta SQL dinamicamente com base nos campos presentes
          const fields = Object.keys(dbTagUpdate);
          
          if (fields.length === 0) {
            // Se não houver campos para atualizar, apenas retornar a tag atual
            const getResult = await pool.query('SELECT * FROM tags WHERE id = $1', [id]);
            
            if (getResult.rows.length === 0) {
              throw new Error(`Tag com ID ${id} não encontrada`);
            }
            
            const tag = getResult.rows[0];
            return {
              id: tag.id,
              name: tag.name,
              slug: tag.slug,
              description: tag.description,
              isActive: tag.is_active === true || tag.is_active === 't',
              count: tag.count || 0,
              createdAt: new Date(tag.created_at)
            };
          }
          
          const placeholders = fields.map((field, index) => `${field} = $${index + 1}`);
          const values = fields.map(field => dbTagUpdate[field]);
          
          const query = `UPDATE tags SET ${placeholders.join(', ')} WHERE id = $${fields.length + 1} RETURNING *`;
          const result = await pool.query(query, [...values, id]);
          
          if (result.rows.length === 0) {
            throw new Error(`Tag com ID ${id} não encontrada`);
          }
          
          const updatedTag = result.rows[0];
          return {
            id: updatedTag.id,
            name: updatedTag.name,
            slug: updatedTag.slug,
            description: updatedTag.description,
            isActive: updatedTag.is_active === true || updatedTag.is_active === 't',
            count: updatedTag.count || 0,
            createdAt: new Date(updatedTag.created_at)
          };
        } catch (pgError) {
          console.error("DATABASE updateTag - Erro também no PostgreSQL:", pgError);
          throw new Error(`Erro ao atualizar tag: ${error.message}`);
        }
      }
      
      // Mapear para o formato esperado pela aplicação
      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        isActive: data.is_active === true || data.is_active === 't',
        count: data.count || 0,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error("DATABASE updateTag - Exceção:", error);
      throw error;
    }
  }
  
  async deleteTag(id: number): Promise<void> {
    try {
      console.log(`DATABASE deleteTag - Excluindo tag ${id}`);
      
      // Tentar primeiro com Supabase
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("DATABASE deleteTag - Erro ao excluir tag via Supabase:", error.message);
        // Tentar com PostgreSQL direto se o Supabase falhar
        try {
          console.log("DATABASE deleteTag - Tentando via PostgreSQL após falha no Supabase");
          await pool.query('DELETE FROM tags WHERE id = $1', [id]);
        } catch (pgError) {
          console.error("DATABASE deleteTag - Erro também no PostgreSQL:", pgError);
          throw new Error(`Erro ao excluir tag: ${error.message}`);
        }
      }
    } catch (error) {
      console.error("DATABASE deleteTag - Exceção:", error);
      throw error;
    }
  }
  
  async toggleTagStatus(id: number, isActive: boolean): Promise<Tag> {
    try {
      console.log(`DATABASE toggleTagStatus - Alternando status da tag ${id} para ${isActive ? 'ativo' : 'inativo'}`);
      
      // Usar método PATCH do Supabase
      const { data, error } = await supabase
        .from('tags')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error("DATABASE toggleTagStatus - Erro ao alternar status via Supabase:", error.message);
        // Se falhar no Supabase, tentar diretamente via PostgreSQL
        try {
          console.log("DATABASE toggleTagStatus - Tentando via PostgreSQL após falha no Supabase");
          const result = await pool.query(
            'UPDATE tags SET is_active = $1 WHERE id = $2 RETURNING *',
            [isActive, id]
          );
          
          if (result.rows.length === 0) {
            throw new Error(`Tag com ID ${id} não encontrada`);
          }
          
          const tagData = result.rows[0];
          return {
            id: tagData.id,
            name: tagData.name,
            slug: tagData.slug,
            description: tagData.description,
            isActive: tagData.is_active === true || tagData.is_active === 't',
            count: tagData.count || 0,
            createdAt: new Date(tagData.created_at)
          };
        } catch (pgError) {
          console.error("DATABASE toggleTagStatus - Erro também no PostgreSQL:", pgError);
          throw new Error(`Erro ao alternar status da tag: ${error.message}`);
        }
      }
      
      // Mapear para o formato esperado pela aplicação
      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        isActive: data.is_active === true || data.is_active === 't',
        count: data.count || 0,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error("DATABASE toggleTagStatus - Exceção:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();

// Função para garantir que a tabela de tags e post_tags existam
export async function ensureTagTablesExist() {
  try {
    console.log("Verificando a existência das tabelas de tags...");
    
    // Verificar se a tabela já existe
    try {
      const checkTableResult = await pool.query(`
        SELECT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'tags'
        );
      `);
      
      if (checkTableResult.rows[0].exists) {
        console.log('Tabela tags já existe no banco de dados');
        return;
      }
    } catch (checkError) {
      console.error('Erro ao verificar se tabela tags existe:', checkError);
      // Continuar mesmo com erro na verificação
    }
    
    console.log("Criando tabelas de tags...");
    
    // Criar a tabela de tags e post_tags
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
      
      -- Criar a tabela de relacionamento entre posts e tags (muitos para muitos)
      CREATE TABLE IF NOT EXISTS public.post_tags (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        UNIQUE(post_id, tag_id)
      );
      
      -- Adicionar índices para melhorar performance
      CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);
      CREATE INDEX IF NOT EXISTS idx_tags_slug ON public.tags(slug);
      CREATE INDEX IF NOT EXISTS idx_tags_is_active ON public.tags(is_active);
      CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON public.post_tags(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON public.post_tags(tag_id);
      
      -- Função para atualizar o contador de tags
      CREATE OR REPLACE FUNCTION update_tag_count() RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          UPDATE public.tags SET count = count + 1 WHERE id = NEW.tag_id;
        ELSIF TG_OP = 'DELETE' THEN
          UPDATE public.tags SET count = count - 1 WHERE id = OLD.tag_id;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Criar triggers para manter o contador de tags atualizado
      DROP TRIGGER IF EXISTS trig_update_tag_count_insert ON public.post_tags;
      CREATE TRIGGER trig_update_tag_count_insert
        AFTER INSERT ON public.post_tags
        FOR EACH ROW
        EXECUTE FUNCTION update_tag_count();
        
      DROP TRIGGER IF EXISTS trig_update_tag_count_delete ON public.post_tags;
      CREATE TRIGGER trig_update_tag_count_delete
        AFTER DELETE ON public.post_tags
        FOR EACH ROW
        EXECUTE FUNCTION update_tag_count();
    `;
    
    await pool.query(createTableQuery);
    console.log("Tabelas de tags criadas com sucesso!");
    
    // Inserir tags de exemplo
    const insertExampleTags = async () => {
      console.log("Inserindo tags de exemplo...");
      const exampleTags = [
        { name: 'Beleza', slug: 'beleza', description: 'Conteúdos relacionados à beleza', is_active: true },
        { name: 'Estética', slug: 'estetica', description: 'Conteúdos sobre tratamentos estéticos', is_active: true },
        { name: 'Skincare', slug: 'skincare', description: 'Cuidados com a pele', is_active: true },
        { name: 'Limpeza de Pele', slug: 'limpeza-de-pele', description: 'Procedimentos de limpeza facial', is_active: true },
        { name: 'Botox', slug: 'botox', description: 'Conteúdos sobre aplicação de botox', is_active: true },
        { name: 'Promoções', slug: 'promocoes', description: 'Promoções especiais', is_active: true }
      ];
      
      const insertTagsQuery = `
        INSERT INTO public.tags (name, slug, description, is_active)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (slug) DO UPDATE
        SET name = EXCLUDED.name,
            description = EXCLUDED.description,
            is_active = EXCLUDED.is_active
        RETURNING id, name, slug
      `;
      
      for (const tag of exampleTags) {
        try {
          const result = await pool.query(insertTagsQuery, [
            tag.name,
            tag.slug,
            tag.description,
            tag.is_active
          ]);
          
          if (result.rows.length > 0) {
            console.log(`Tag inserida: ${result.rows[0].name} (${result.rows[0].slug})`);
          }
        } catch (error) {
          console.error(`Erro ao inserir tag ${tag.name}:`, error);
        }
      }
    };
    
    await insertExampleTags();
    console.log("Processo de criação de tabelas de tags concluído!");
    
  } catch (error) {
    console.error("Erro ao criar tabelas de tags:", error);
  }
}
