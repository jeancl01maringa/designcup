import { 
  users, type User, type InsertUser,
  artworks, type Artwork, type InsertArtwork
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Artwork methods
  getArtworks(): Promise<Artwork[]>;
  getArtworkById(id: number): Promise<Artwork | undefined>;
  searchArtworks(query: string): Promise<Artwork[]>;
  getArtworksByCategory(category: string): Promise<Artwork[]>;
  createArtwork(artwork: InsertArtwork): Promise<Artwork>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private artworkItems: Map<number, Artwork>;
  currentUserId: number;
  currentArtworkId: number;

  constructor() {
    this.users = new Map();
    this.artworkItems = new Map();
    this.currentUserId = 1;
    this.currentArtworkId = 1;
    
    // Initialize with sample artwork data
    this.initializeArtworks();
  }

  private initializeArtworks() {
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
    
    sampleArtworks.forEach(artwork => {
      this.createArtwork(artwork);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async getArtworks(): Promise<Artwork[]> {
    return Array.from(this.artworkItems.values());
  }
  
  async getArtworkById(id: number): Promise<Artwork | undefined> {
    return this.artworkItems.get(id);
  }
  
  async searchArtworks(query: string): Promise<Artwork[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.artworkItems.values()).filter(
      artwork => 
        artwork.title.toLowerCase().includes(lowerQuery) || 
        (artwork.description && artwork.description.toLowerCase().includes(lowerQuery)) ||
        (artwork.category && artwork.category.toLowerCase().includes(lowerQuery))
    );
  }
  
  async getArtworksByCategory(category: string): Promise<Artwork[]> {
    return Array.from(this.artworkItems.values()).filter(
      artwork => artwork.category === category
    );
  }
  
  async createArtwork(insertArtwork: InsertArtwork): Promise<Artwork> {
    const id = this.currentArtworkId++;
    const artwork: Artwork = { ...insertArtwork, id };
    this.artworkItems.set(id, artwork);
    return artwork;
  }
}

export const storage = new MemStorage();
