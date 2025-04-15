import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertArtworkSchema } from "@shared/schema";
import { setupAuth } from "./auth";

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

  const httpServer = createServer(app);

  return httpServer;
}
