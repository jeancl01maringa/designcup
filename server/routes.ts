import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertArtworkSchema, insertCategorySchema, insertPostSchema } from "@shared/schema";
import { setupAuth } from "./auth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // put application routes here
  // prefix all routes with /api

  // API endpoints for artworks
  app.get('/api/artworks', async (req, res) => {
    try {
      const artworks = await storage.getArtworks();
      res.json(artworks);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching artworks' });
    }
  });

  app.get('/api/artworks/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const artwork = await storage.getArtworkById(id);
      
      if (!artwork) {
        return res.status(404).json({ message: 'Artwork not found' });
      }
      
      res.json(artwork);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching artwork' });
    }
  });

  app.get('/api/search', async (req, res) => {
    try {
      const query = req.query.q as string || '';
      const artworks = await storage.searchArtworks(query);
      res.json(artworks);
    } catch (error) {
      res.status(500).json({ message: 'Error searching artworks' });
    }
  });

  app.get('/api/category/:category', async (req, res) => {
    try {
      const category = req.params.category;
      const artworks = await storage.getArtworksByCategory(category);
      res.json(artworks);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching artworks by category' });
    }
  });

  app.post('/api/artworks', async (req, res) => {
    try {
      const parsedData = insertArtworkSchema.safeParse(req.body);
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: 'Invalid artwork data',
          errors: parsedData.error.format() 
        });
      }
      
      const artwork = await storage.createArtwork(parsedData.data);
      res.status(201).json(artwork);
    } catch (error) {
      res.status(500).json({ message: 'Error creating artwork' });
    }
  });
  
  // API endpoint for social sharing
  app.get('/api/share/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const artwork = await storage.getArtworkById(id);
      
      if (!artwork) {
        return res.status(404).json({ message: 'Artwork not found' });
      }
      
      // Optional custom parameters for sharing
      const customTitle = req.query.title as string;
      const customDescription = req.query.description as string;
      
      // Create share data with either custom or original values
      const shareData = {
        id: artwork.id,
        title: customTitle || artwork.title,
        description: customDescription || artwork.description,
        imageUrl: artwork.imageUrl,
        shareUrl: `${req.protocol}://${req.get('host')}/artwork/${artwork.id}`,
        format: artwork.format,
        isPro: artwork.isPro
      };
      
      res.json(shareData);
    } catch (error) {
      res.status(500).json({ message: 'Error generating share data' });
    }
  });

  // API endpoints for admin panel - Categories
  app.get('/api/admin/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching categories' });
    }
  });

  app.get('/api/admin/categories/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategoryById(id);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching category' });
    }
  });

  app.post('/api/admin/categories', async (req, res) => {
    try {
      const parsedData = insertCategorySchema.safeParse(req.body);
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: 'Invalid category data',
          errors: parsedData.error.format() 
        });
      }
      
      const category = await storage.createCategory(parsedData.data);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: 'Error creating category' });
    }
  });

  app.put('/api/admin/categories/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsedData = insertCategorySchema.partial().safeParse(req.body);
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: 'Invalid category data',
          errors: parsedData.error.format() 
        });
      }
      
      const category = await storage.updateCategory(id, parsedData.data);
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: 'Error updating category' });
    }
  });

  app.delete('/api/admin/categories/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting category' });
    }
  });

  // API endpoints for admin panel - Posts
  app.get('/api/admin/posts', async (req, res) => {
    try {
      const filters = {
        searchTerm: req.query.search as string,
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        status: req.query.status as string,
        month: req.query.month ? parseInt(req.query.month as string) : undefined,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };
      
      const posts = await storage.getPosts(filters);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ message: 'Error fetching posts' });
    }
  });

  app.get('/api/admin/posts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getPostById(id);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching post' });
    }
  });

  app.post('/api/admin/posts', async (req, res) => {
    try {
      // Esquema com validações personalizadas
      const postSchema = insertPostSchema.extend({
        uniqueCode: z.string().min(4).max(50),
      });
      
      const parsedData = postSchema.safeParse(req.body);
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: 'Invalid post data',
          errors: parsedData.error.format() 
        });
      }
      
      const post = await storage.createPost(parsedData.data);
      res.status(201).json(post);
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ message: 'Error creating post' });
    }
  });

  app.put('/api/admin/posts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Esquema parcial para atualização
      const parsedData = insertPostSchema.partial().safeParse(req.body);
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: 'Invalid post data',
          errors: parsedData.error.format() 
        });
      }
      
      const post = await storage.updatePost(id, parsedData.data);
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: 'Error updating post' });
    }
  });

  app.delete('/api/admin/posts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePost(id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting post' });
    }
  });

  // Atualizar status de múltiplos posts
  app.put('/api/admin/posts/status/batch', async (req, res) => {
    try {
      const { ids, status } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Invalid post IDs' });
      }
      
      if (!['aprovado', 'rascunho', 'rejeitado'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      
      await storage.updatePostStatus(ids, status);
      res.status(200).json({ message: 'Posts updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error updating posts status' });
    }
  });

  // Endpoints para upload de imagens via Supabase
  app.post('/api/admin/upload', async (req, res) => {
    try {
      // Este endpoint apenas recebe os metadados da imagem após o upload direto para o Supabase
      // e retorna a confirmação
      const { imageUrl, filename, size } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ message: 'Image URL is required' });
      }
      
      res.status(200).json({ 
        success: true, 
        imageUrl,
        metadata: {
          filename,
          size,
          uploadedAt: new Date()
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Error processing upload' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
