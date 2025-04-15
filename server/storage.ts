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
        title: "Facial Treatment Promotion",
        description: "Elegant design for facial treatments",
        imageUrl: "https://images.unsplash.com/photo-1557053506-9eff64026ff3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&h=1080&q=80",
        format: "square",
        isPro: true,
        category: "facial"
      },
      {
        title: "Skin Care Routine",
        description: "Professional template for skin care services",
        imageUrl: "https://images.unsplash.com/photo-1596704017254-9a92e7a12ecb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&h=1350&q=80",
        format: "portrait",
        isPro: true,
        category: "skin"
      },
      {
        title: "Beauty Stories Template",
        description: "Elegant Instagram stories template",
        imageUrl: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&h=1920&q=80",
        format: "stories",
        isPro: true,
        category: "social"
      },
      {
        title: "Aesthetic Service Promo",
        description: "Clean design for aesthetic services",
        imageUrl: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&h=1080&q=80",
        format: "square",
        isPro: true,
        category: "promo"
      },
      {
        title: "Aesthetic Procedure Post",
        description: "Professional post for aesthetic procedures",
        imageUrl: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&h=1350&q=80",
        format: "portrait",
        isPro: true,
        category: "procedures"
      },
      {
        title: "Minimalist Beauty Template",
        description: "Clean and minimalist design for beauty professionals",
        imageUrl: "https://images.unsplash.com/photo-1614159102922-39bb647f58f7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&h=1080&q=80",
        format: "square",
        isPro: true,
        category: "minimalist"
      },
      {
        title: "Beauty Products Stories",
        description: "Instagram stories template for beauty products",
        imageUrl: "https://images.unsplash.com/photo-1551392505-f4056032826e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&h=1920&q=80",
        format: "stories",
        isPro: true,
        category: "products"
      },
      {
        title: "Aesthetic Treatment Promo",
        description: "Promotional template for aesthetic treatments",
        imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&h=1080&q=80",
        format: "square",
        isPro: true,
        category: "treatment"
      },
      {
        title: "Professional Beauty Post",
        description: "Professional social media post for beauty services",
        imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&h=1350&q=80",
        format: "portrait",
        isPro: true,
        category: "beauty"
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
