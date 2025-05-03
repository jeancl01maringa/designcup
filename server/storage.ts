import { 
  users, type User, type InsertUser,
  artworks, type Artwork, type InsertArtwork,
  favorites, type Favorite, type InsertFavorite,
  userArtworks, type UserArtwork, type InsertUserArtwork,
  categories, type Category, type InsertCategory,
  posts, type Post, type InsertPost,
  postStatusEnum
} from "@shared/schema";
import { db } from "./db";
import { eq, like, or, desc } from "drizzle-orm";
import { supabase } from "./supabase-client";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  deleteCategory(id: number): Promise<void>;
  
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
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, post: Partial<InsertPost>): Promise<Post>;
  deletePost(id: number): Promise<void>;
  updatePostStatus(ids: number[], status: 'aprovado' | 'rascunho' | 'rejeitado'): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    try {
      console.log("DATABASE getUser - Buscando usuário com ID:", id);
      
      // Tentar primeiro verificar quantos registros existem com esse ID
      const { data: checkData, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', id);
        
      if (checkError) {
        console.error("DATABASE getUser - Erro ao verificar usuário:", checkError.message);
        return undefined;
      }
      
      if (!checkData || checkData.length === 0) {
        console.log(`DATABASE getUser - Nenhum usuário encontrado com ID ${id}`);
        return undefined;
      }
      
      if (checkData.length > 1) {
        console.warn(`DATABASE getUser - Múltiplos usuários encontrados com ID ${id}, usando o primeiro`);
      }
      
      // Pegar o primeiro registro encontrado
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .limit(1)
        .maybeSingle();
        
      if (error) {
        console.error("DATABASE getUser - Erro ao buscar dados do usuário:", error.message);
        return undefined;
      }
      
      if (!data) {
        console.log("DATABASE getUser - Dados do usuário não encontrados");
        return undefined;
      }
      
      // Log para depuração
      console.log("DATABASE getUser - Dados brutos do usuário:", JSON.stringify(data));
      
      // Mapeando is_admin para isAdmin para compatibilidade com o código TypeScript
      // Convertendo explicitamente para boolean
      const isAdmin = data.is_admin === true || data.is_admin === 't';
      console.log("DATABASE getUser - is_admin raw value:", data.is_admin, "tipo:", typeof data.is_admin); 
      console.log("DATABASE getUser - isAdmin convertido:", isAdmin);
      
      // Criar um objeto User no formato esperado pela aplicação
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
      console.error("DATABASE getUser - Exceção:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      console.log("DATABASE getUserByUsername - Buscando usuário com username:", username);
      
      // Tentar primeiro verificar quantos registros existem com esse username
      const { data: checkData, error: checkError } = await supabase
        .from('users')
        .select('username')
        .eq('username', username);
        
      if (checkError) {
        console.error("DATABASE getUserByUsername - Erro ao verificar usuário:", checkError.message);
        return undefined;
      }
      
      if (!checkData || checkData.length === 0) {
        console.log(`DATABASE getUserByUsername - Nenhum usuário encontrado com username ${username}`);
        return undefined;
      }
      
      if (checkData.length > 1) {
        console.warn(`DATABASE getUserByUsername - Múltiplos usuários encontrados com username ${username}, usando o primeiro`);
      }
      
      // Pegar o primeiro registro encontrado
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .limit(1)
        .maybeSingle();
        
      if (error) {
        console.error("DATABASE getUserByUsername - Erro ao buscar dados do usuário:", error.message);
        return undefined;
      }
      
      if (!data) {
        console.log("DATABASE getUserByUsername - Dados do usuário não encontrados");
        return undefined;
      }
      
      // Log para depuração
      console.log("DATABASE getUserByUsername - Dados brutos do usuário:", JSON.stringify(data));
      
      // Mapeando is_admin para isAdmin para compatibilidade com o código TypeScript
      // Convertendo explicitamente para boolean
      const isAdmin = data.is_admin === true || data.is_admin === 't';
      console.log("DATABASE getUserByUsername - is_admin raw value:", data.is_admin, "tipo:", typeof data.is_admin); 
      console.log("DATABASE getUserByUsername - isAdmin convertido:", isAdmin);
      
      // Criar um objeto User no formato esperado pela aplicação
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
      console.error("DATABASE getUserByUsername - Exceção:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      console.log("DATABASE getUserByEmail - Buscando usuário com email:", email);
      
      // Tentar primeiro verificar quantos registros existem com esse email
      const { data: checkData, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email);
        
      if (checkError) {
        console.error("DATABASE getUserByEmail - Erro ao verificar usuário:", checkError.message);
        return undefined;
      }
      
      if (!checkData || checkData.length === 0) {
        console.log(`DATABASE getUserByEmail - Nenhum usuário encontrado com email ${email}`);
        return undefined;
      }
      
      if (checkData.length > 1) {
        console.warn(`DATABASE getUserByEmail - Múltiplos usuários encontrados com email ${email}, usando o primeiro`);
      }
      
      // Pegar o primeiro registro encontrado
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .limit(1)
        .maybeSingle();
        
      if (error) {
        console.error("DATABASE getUserByEmail - Erro ao buscar dados do usuário:", error.message);
        return undefined;
      }
      
      if (!data) {
        console.log("DATABASE getUserByEmail - Dados do usuário não encontrados");
        return undefined;
      }
      
      // Log para depuração
      console.log("DATABASE getUserByEmail - Dados brutos do usuário:", JSON.stringify(data));
      
      // Mapeando is_admin para isAdmin para compatibilidade com o código TypeScript
      // Convertendo explicitamente para boolean
      const isAdmin = data.is_admin === true || data.is_admin === 't';
      console.log("DATABASE getUserByEmail - is_admin raw value:", data.is_admin, "tipo:", typeof data.is_admin); 
      console.log("DATABASE getUserByEmail - isAdmin convertido:", isAdmin);
      
      // Criar um objeto User no formato esperado pela aplicação
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
      
      // Usar a API do Supabase para buscar todas as categorias
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) {
        console.error("DATABASE getCategories - Erro ao buscar categorias:", error.message);
        return [];
      }
      
      if (!data || data.length === 0) {
        console.log("DATABASE getCategories - Nenhuma categoria encontrada");
        return [];
      }
      
      // Mapear os dados do Supabase para o formato esperado pela aplicação
      const categories: Category[] = data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        imageUrl: item.image_url,
        iconUrl: item.icon_url,
        isHighlighted: item.is_highlighted,
        createdAt: new Date(item.created_at)
      }));
      
      console.log(`DATABASE getCategories - Encontradas ${categories.length} categorias`);
      return categories;
    } catch (error) {
      console.error("DATABASE getCategories - Exceção:", error);
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
      const category: Category = {
        id: data.id,
        name: data.name,
        description: data.description,
        imageUrl: data.image_url,
        iconUrl: data.icon_url,
        isHighlighted: data.is_highlighted,
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
        description: category.description,
        image_url: category.imageUrl,
        icon_url: category.iconUrl,
        is_highlighted: category.isHighlighted
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
      const result: Category = {
        id: data.id,
        name: data.name,
        description: data.description,
        imageUrl: data.image_url,
        iconUrl: data.icon_url,
        isHighlighted: data.is_highlighted,
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
      
      // Mapear campos para formato do Supabase (snake_case)
      const dbCategory: any = {};
      
      if (category.name !== undefined) dbCategory.name = category.name;
      if (category.description !== undefined) dbCategory.description = category.description;
      if (category.imageUrl !== undefined) dbCategory.image_url = category.imageUrl;
      if (category.iconUrl !== undefined) dbCategory.icon_url = category.iconUrl;
      if (category.isHighlighted !== undefined) dbCategory.is_highlighted = category.isHighlighted;
      
      // Usar a API do Supabase para atualizar a categoria
      const { data, error } = await supabase
        .from('categories')
        .update(dbCategory)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error("DATABASE updateCategory - Erro ao atualizar categoria:", error.message);
        throw new Error(`Erro ao atualizar categoria: ${error.message}`);
      }
      
      // Mapear para o formato esperado pela aplicação
      const result: Category = {
        id: data.id,
        name: data.name,
        description: data.description,
        imageUrl: data.image_url,
        iconUrl: data.icon_url,
        isHighlighted: data.is_highlighted,
        createdAt: new Date(data.created_at)
      };
      
      console.log(`DATABASE updateCategory - Categoria atualizada com sucesso: ${result.name}`);
      return result;
    } catch (error) {
      console.error("DATABASE updateCategory - Exceção:", error);
      throw error;
    }
  }
  
  async deleteCategory(id: number): Promise<void> {
    try {
      console.log("DATABASE deleteCategory - Excluindo categoria com ID:", id);
      
      // Usar a API do Supabase para excluir a categoria
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error("DATABASE deleteCategory - Erro ao excluir categoria:", error.message);
        throw new Error(`Erro ao excluir categoria: ${error.message}`);
      }
      
      console.log(`DATABASE deleteCategory - Categoria excluída com sucesso`);
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
      
      // Construir a query base para o Supabase
      let query = supabase
        .from('posts')
        .select(`
          id,
          title,
          description,
          image_url,
          unique_code,
          category_id,
          status,
          created_at,
          published_at
        `)
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
        console.error("DATABASE getPosts - Erro ao buscar posts:", error.message);
        return [];
      }
      
      if (!data || data.length === 0) {
        console.log("DATABASE getPosts - Nenhum post encontrado com os filtros especificados");
        return [];
      }
      
      // Mapear os dados do Supabase para o formato esperado pela aplicação
      const result = data.map(post => ({
        id: post.id,
        title: post.title,
        description: post.description || "",
        imageUrl: post.image_url,
        uniqueCode: post.unique_code,
        categoryId: post.category_id,
        status: post.status,
        createdAt: new Date(post.created_at),
        publishedAt: post.published_at ? new Date(post.published_at) : null
      }));
      
      console.log(`DATABASE getPosts - Encontrados ${result.length} posts`);
      return result;
    } catch (error) {
      console.error("DATABASE getPosts - Exceção:", error);
      return [];
    }
  }
  
  async getPostById(id: number): Promise<Post | undefined> {
    try {
      console.log("DATABASE getPostById - Buscando post com ID:", id);
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          description,
          image_url,
          unique_code,
          category_id,
          status,
          created_at,
          published_at
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error("DATABASE getPostById - Erro ao buscar post:", error.message);
        return undefined;
      }
      
      if (!data) {
        console.log(`DATABASE getPostById - Post com ID ${id} não encontrado`);
        return undefined;
      }
      
      // Mapear para o formato esperado pela aplicação
      const result: Post = {
        id: data.id,
        title: data.title,
        description: data.description || "",
        imageUrl: data.image_url,
        uniqueCode: data.unique_code,
        categoryId: data.category_id,
        status: data.status,
        createdAt: new Date(data.created_at),
        publishedAt: data.published_at ? new Date(data.published_at) : null
      };
      
      console.log(`DATABASE getPostById - Post encontrado: ${result.title}`);
      return result;
    } catch (error) {
      console.error("DATABASE getPostById - Exceção:", error);
      return undefined;
    }
  }
  
  async createPost(post: InsertPost): Promise<Post> {
    try {
      console.log("DATABASE createPost - Criando novo post:", JSON.stringify(post));
      
      // Mapear do formato da aplicação para o formato do Supabase
      const supabasePost = {
        title: post.title,
        description: post.description,
        image_url: post.imageUrl,
        unique_code: post.uniqueCode,
        category_id: post.categoryId,
        status: post.status || 'rascunho',
        published_at: post.publishedAt ? post.publishedAt.toISOString() : null
      };
      
      const { data, error } = await supabase
        .from('posts')
        .insert(supabasePost)
        .select()
        .single();
      
      if (error) {
        console.error("DATABASE createPost - Erro ao criar post:", error.message);
        throw new Error(`Erro ao criar post: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('Erro ao criar post: nenhum dado retornado');
      }
      
      // Mapear para o formato esperado pela aplicação
      const result: Post = {
        id: data.id,
        title: data.title,
        description: data.description || "",
        imageUrl: data.image_url,
        uniqueCode: data.unique_code,
        categoryId: data.category_id,
        status: data.status,
        createdAt: new Date(data.created_at),
        publishedAt: data.published_at ? new Date(data.published_at) : null
      };
      
      console.log(`DATABASE createPost - Post criado com ID: ${result.id}`);
      return result;
    } catch (error) {
      console.error("DATABASE createPost - Exceção:", error);
      throw error;
    }
  }
  
  async updatePost(id: number, post: Partial<InsertPost>): Promise<Post> {
    try {
      console.log(`DATABASE updatePost - Atualizando post com ID ${id}:`, JSON.stringify(post));
      
      // Mapear do formato da aplicação para o formato do Supabase
      const supabasePost: any = {};
      
      if (post.title !== undefined) supabasePost.title = post.title;
      if (post.description !== undefined) supabasePost.description = post.description;
      if (post.imageUrl !== undefined) supabasePost.image_url = post.imageUrl;
      if (post.uniqueCode !== undefined) supabasePost.unique_code = post.uniqueCode;
      if (post.categoryId !== undefined) supabasePost.category_id = post.categoryId;
      if (post.status !== undefined) supabasePost.status = post.status;
      if (post.publishedAt !== undefined) supabasePost.published_at = post.publishedAt.toISOString();
      
      const { data, error } = await supabase
        .from('posts')
        .update(supabasePost)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error("DATABASE updatePost - Erro ao atualizar post:", error.message);
        throw new Error(`Erro ao atualizar post: ${error.message}`);
      }
      
      if (!data) {
        throw new Error(`Post com ID ${id} não encontrado`);
      }
      
      // Mapear para o formato esperado pela aplicação
      const result: Post = {
        id: data.id,
        title: data.title,
        description: data.description || "",
        imageUrl: data.image_url,
        uniqueCode: data.unique_code,
        categoryId: data.category_id,
        status: data.status,
        createdAt: new Date(data.created_at),
        publishedAt: data.published_at ? new Date(data.published_at) : null
      };
      
      console.log(`DATABASE updatePost - Post atualizado: ${result.title}`);
      return result;
    } catch (error) {
      console.error("DATABASE updatePost - Exceção:", error);
      throw error;
    }
  }
  
  async deletePost(id: number): Promise<void> {
    try {
      console.log(`DATABASE deletePost - Excluindo post com ID: ${id}`);
      
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error("DATABASE deletePost - Erro ao excluir post:", error.message);
        throw new Error(`Erro ao excluir post: ${error.message}`);
      }
      
      console.log(`DATABASE deletePost - Post com ID ${id} excluído com sucesso`);
    } catch (error) {
      console.error("DATABASE deletePost - Exceção:", error);
      throw error;
    }
  }
  
  async updatePostStatus(ids: number[], status: 'aprovado' | 'rascunho' | 'rejeitado'): Promise<void> {
    try {
      console.log(`DATABASE updatePostStatus - Atualizando status para ${status} nos posts:`, ids);
      
      // Usar operação em lote (in) para atualizar todos os posts de uma vez
      const { error } = await supabase
        .from('posts')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .in('id', ids);
      
      if (error) {
        console.error('DATABASE updatePostStatus - Erro ao atualizar status dos posts:', error);
        throw new Error(`Erro ao atualizar status dos posts: ${error.message}`);
      }
      
      console.log(`DATABASE updatePostStatus - Status atualizado para ${status} em ${ids.length} posts`);
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
}

export const storage = new DatabaseStorage();
