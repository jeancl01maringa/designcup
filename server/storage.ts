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
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async getArtworks(): Promise<Artwork[]> {
    const result = await db.select().from(artworks).orderBy(desc(artworks.createdAt));
    return result;
  }
  
  async getArtworkById(id: number): Promise<Artwork | undefined> {
    const [artwork] = await db.select().from(artworks).where(eq(artworks.id, id));
    return artwork;
  }
  
  async searchArtworks(query: string): Promise<Artwork[]> {
    const lowerQuery = `%${query.toLowerCase()}%`;
    const result = await db.select().from(artworks).where(
      or(
        like(artworks.title, lowerQuery),
        like(artworks.description || '', lowerQuery),
        like(artworks.category || '', lowerQuery)
      )
    );
    return result;
  }
  
  async getArtworksByCategory(category: string): Promise<Artwork[]> {
    const result = await db.select().from(artworks).where(eq(artworks.category, category));
    return result;
  }
  
  async createArtwork(insertArtwork: InsertArtwork): Promise<Artwork> {
    const [artwork] = await db
      .insert(artworks)
      .values(insertArtwork)
      .returning();
    return artwork;
  }
  
  async getFavoritesByUserId(userId: number): Promise<Artwork[]> {
    const result = await db
      .select({
        id: artworks.id,
        title: artworks.title,
        description: artworks.description,
        imageUrl: artworks.imageUrl,
        format: artworks.format,
        isPro: artworks.isPro,
        category: artworks.category,
        createdAt: artworks.createdAt
      })
      .from(favorites)
      .innerJoin(artworks, eq(favorites.artworkId, artworks.id))
      .where(eq(favorites.userId, userId));
    
    return result;
  }
  
  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const [result] = await db
      .insert(favorites)
      .values(favorite)
      .returning();
    return result;
  }
  
  async removeFavorite(userId: number, artworkId: number): Promise<void> {
    await db
      .delete(favorites)
      .where(
        eq(favorites.userId, userId) && 
        eq(favorites.artworkId, artworkId)
      );
  }
  
  async getUserArtworksByUserId(userId: number): Promise<Artwork[]> {
    const result = await db
      .select({
        id: artworks.id,
        title: artworks.title,
        description: artworks.description,
        imageUrl: artworks.imageUrl,
        format: artworks.format,
        isPro: artworks.isPro,
        category: artworks.category,
        createdAt: artworks.createdAt
      })
      .from(userArtworks)
      .innerJoin(artworks, eq(userArtworks.artworkId, artworks.id))
      .where(eq(userArtworks.userId, userId))
      .orderBy(desc(userArtworks.usedAt));
    
    return result;
  }
  
  async addUserArtwork(userArtwork: InsertUserArtwork): Promise<UserArtwork> {
    const [result] = await db
      .insert(userArtworks)
      .values(userArtwork)
      .returning();
    return result;
  }
  
  // Category methods (for admin panel)
  async getCategories(): Promise<Category[]> {
    const result = await db.select().from(categories).orderBy(categories.name);
    return result;
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const [result] = await db
      .insert(categories)
      .values(category)
      .returning();
    return result;
  }
  
  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    const [result] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return result;
  }
  
  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
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
    let query = db.select().from(posts);
    
    if (filters) {
      if (filters.searchTerm) {
        const searchTerm = `%${filters.searchTerm.toLowerCase()}%`;
        query = query.where(
          or(
            like(posts.title, searchTerm),
            like(posts.description || '', searchTerm),
            like(posts.uniqueCode, searchTerm)
          )
        );
      }
      
      if (filters.categoryId) {
        query = query.where(eq(posts.categoryId, filters.categoryId));
      }
      
      if (filters.status) {
        // @ts-ignore - O TypeScript não consegue inferir corretamente que o status é válido
        query = query.where(eq(posts.status, filters.status));
      }
      
      if (filters.month && filters.year) {
        // Filtrar por mês e ano específicos
        const startDate = new Date(filters.year, filters.month - 1, 1);
        const endDate = new Date(filters.year, filters.month, 0);
        query = query.where(
          // @ts-ignore - O TypeScript não consegue inferir corretamente as datas
          posts.createdAt >= startDate && posts.createdAt <= endDate
        );
      } else if (filters.startDate && filters.endDate) {
        // Filtrar por intervalo de datas
        query = query.where(
          // @ts-ignore - O TypeScript não consegue inferir corretamente as datas
          posts.createdAt >= filters.startDate && posts.createdAt <= filters.endDate
        );
      }
    }
    
    const result = await query.orderBy(desc(posts.createdAt));
    return result;
  }
  
  async getPostById(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }
  
  async createPost(post: InsertPost): Promise<Post> {
    const [result] = await db
      .insert(posts)
      .values(post)
      .returning();
    return result;
  }
  
  async updatePost(id: number, post: Partial<InsertPost>): Promise<Post> {
    const [result] = await db
      .update(posts)
      .set(post)
      .where(eq(posts.id, id))
      .returning();
    return result;
  }
  
  async deletePost(id: number): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }
  
  async updatePostStatus(ids: number[], status: 'aprovado' | 'rascunho' | 'rejeitado'): Promise<void> {
    await db
      .update(posts)
      .set({ status })
      .where(
        // @ts-ignore - O TypeScript não consegue inferir corretamente que id está em ids
        ids.map(id => eq(posts.id, id)).reduce((acc, curr) => or(acc, curr))
      );
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
      const adminEmail = "admin@estetica.app";
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
          isAdmin: true
        });
        
        console.log("Admin user created with username 'admin' and password 'admin123'");
      }
    }
  }
}

export const storage = new DatabaseStorage();
