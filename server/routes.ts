import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertArtworkSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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

  const httpServer = createServer(app);

  return httpServer;
}
