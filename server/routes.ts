import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertArtworkSchema, insertCategorySchema, insertPostSchema, type InsertPost } from "@shared/schema";
import { setupAuth } from "./auth";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import * as schema from "@shared/schema";
import { db, pool } from "./db";
import { supabase } from "./supabase-client";
import * as crypto from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // put application routes here
  // prefix all routes with /api

  // API endpoints para formatos de arquivo (file_formats)
  app.get('/api/admin/file-formats', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      console.log('Buscando todos os formatos de arquivo');
      
      try {
        // Tentar primeiro com Supabase
        const { data, error } = await supabase
          .from('file_formats')
          .select('*')
          .order('id', { ascending: true });
          
        if (!error) {
          console.log(`Encontrados ${data?.length || 0} formatos de arquivo via Supabase`);
          return res.json(data || []);
        }
        
        // Se falhar no Supabase, tentar diretamente com PostgreSQL
        console.log("Tentando buscar formatos com PostgreSQL direto");
        const result = await pool.query(`SELECT * FROM file_formats ORDER BY id ASC`);
        console.log(`Encontrados ${result.rows?.length || 0} formatos de arquivo via PostgreSQL`);
        return res.json(result.rows || []);
      } catch (dbError: any) {
        console.error("Erro ao buscar formatos de arquivo via PostgreSQL:", dbError);
        return res.status(500).json({ 
          message: 'Erro ao buscar formatos de arquivo',
          error: dbError.message
        });
      }
    } catch (error: any) {
      console.error('Error fetching file formats:', error);
      res.status(500).json({ 
        message: 'Erro ao buscar formatos de arquivo',
        error: error.message
      });
    }
  });

  app.post('/api/admin/file-formats', async (req, res) => {
    try {
      // Verifique se o usuário está autenticado e é admin
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const { name, type, icon, is_active } = req.body;
      
      if (!name || !type) {
        return res.status(400).json({ message: 'Nome e tipo são obrigatórios' });
      }
      
      console.log('Criando formato de arquivo:', { name, type, icon, is_active });
      
      try {
        // Tente inserir no Supabase primeiro
        const { data, error } = await supabase
          .from('file_formats')
          .insert([{ 
            name, 
            type, 
            icon: icon || null, 
            is_active: is_active !== false,
            created_at: new Date().toISOString()
          }])
          .select();
          
        if (!error && data && data.length > 0) {
          console.log("Formato de arquivo criado com sucesso via Supabase");
          return res.status(201).json(data[0]);
        }
        
        // Se falhar no Supabase, tentar com PostgreSQL diretamente
        console.log("Tentando criar formato de arquivo via PostgreSQL direto");
        const result = await pool.query(`
          INSERT INTO file_formats (name, type, icon, is_active, created_at) 
          VALUES ($1, $2, $3, $4, $5) 
          RETURNING *
        `, [
          name, 
          type, 
          icon || null, 
          is_active !== false, 
          new Date()
        ]);
        
        if (result.rows && result.rows.length > 0) {
          console.log("Formato de arquivo criado com sucesso via PostgreSQL");
          return res.status(201).json(result.rows[0]);
        } else {
          return res.status(500).json({ 
            message: 'Formato criado, mas nenhum dado retornado' 
          });
        }
      } catch (dbError: any) {
        console.error("Erro ao criar formato de arquivo via PostgreSQL:", dbError);
        return res.status(500).json({ 
          message: 'Erro ao criar formato de arquivo', 
          error: dbError.message 
        });
      }
    } catch (error: any) {
      console.error('Error creating file format:', error);
      res.status(500).json({ 
        message: 'Erro ao criar formato de arquivo',
        error: error.message 
      });
    }
  });

  app.patch('/api/admin/file-formats/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      const { name, type, icon, is_active } = req.body;
      
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (type !== undefined) updateData.type = type;
      if (icon !== undefined) updateData.icon = icon;
      if (is_active !== undefined) updateData.is_active = is_active;
      
      console.log(`Atualizando formato de arquivo #${id}:`, updateData);
      
      try {
        // Tentar primeiro com Supabase
        const { data, error } = await supabase
          .from('file_formats')
          .update(updateData)
          .eq('id', id)
          .select();
          
        if (!error && data && data.length > 0) {
          console.log(`Formato de arquivo #${id} atualizado com sucesso via Supabase`);
          return res.json(data[0]);
        }
        
        // Se falhar no Supabase, tentar com PostgreSQL diretamente
        console.log(`Tentando atualizar formato de arquivo #${id} via PostgreSQL direto`);
        
        // Construir a query SQL de atualização
        let setClauses = [];
        const queryParams = [];
        let paramIndex = 1;
        
        if (name !== undefined) {
          setClauses.push(`name = $${paramIndex}`);
          queryParams.push(name);
          paramIndex++;
        }
        
        if (type !== undefined) {
          setClauses.push(`type = $${paramIndex}`);
          queryParams.push(type);
          paramIndex++;
        }
        
        if (icon !== undefined) {
          setClauses.push(`icon = $${paramIndex}`);
          queryParams.push(icon);
          paramIndex++;
        }
        
        if (is_active !== undefined) {
          setClauses.push(`is_active = $${paramIndex}`);
          queryParams.push(is_active);
          paramIndex++;
        }
        
        // Adicionar o parâmetro id ao final
        queryParams.push(id);
        
        const updateQuery = `
          UPDATE file_formats 
          SET ${setClauses.join(', ')} 
          WHERE id = $${paramIndex}
          RETURNING *
        `;
        
        const result = await pool.query(updateQuery, queryParams);
        
        if (result.rows && result.rows.length > 0) {
          console.log(`Formato de arquivo #${id} atualizado com sucesso via PostgreSQL`);
          return res.json(result.rows[0]);
        } else {
          return res.status(404).json({ message: 'Formato não encontrado ou não foi atualizado' });
        }
      } catch (dbError: any) {
        console.error(`Erro ao atualizar formato de arquivo #${id} via PostgreSQL:`, dbError);
        return res.status(500).json({ 
          message: 'Erro ao atualizar formato de arquivo',
          error: dbError.message
        });
      }
    } catch (error: any) {
      console.error('Error updating file format:', error);
      res.status(500).json({ 
        message: 'Erro ao atualizar formato de arquivo',
        error: error.message
      });
    }
  });

  app.delete('/api/admin/file-formats/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      
      console.log(`Excluindo formato de arquivo #${id}`);
      
      try {
        // Tentar primeiro com Supabase
        const { error } = await supabase
          .from('file_formats')
          .delete()
          .eq('id', id);
          
        if (!error) {
          console.log(`Formato de arquivo #${id} excluído com sucesso via Supabase`);
          return res.status(200).json({ success: true });
        }
        
        // Se falhar no Supabase, tentar com PostgreSQL diretamente
        console.log(`Tentando excluir formato de arquivo #${id} via PostgreSQL direto`);
        const result = await pool.query('DELETE FROM file_formats WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows && result.rows.length > 0) {
          console.log(`Formato de arquivo #${id} excluído com sucesso via PostgreSQL`);
          return res.status(200).json({ success: true });
        } else {
          console.log(`Formato de arquivo #${id} não encontrado para exclusão via PostgreSQL`);
          return res.status(404).json({ message: 'Formato não encontrado' });
        }
      } catch (dbError: any) {
        console.error(`Erro ao excluir formato de arquivo #${id} via PostgreSQL:`, dbError);
        return res.status(500).json({ 
          message: 'Erro ao excluir formato de arquivo',
          error: dbError.message
        });
      }
    } catch (error: any) {
      console.error('Error deleting file format:', error);
      res.status(500).json({ 
        message: 'Erro ao excluir formato de arquivo',
        error: error.message
      });
    }
  });

  // API endpoints para formatos de post (post_formats)
  app.get('/api/admin/post-formats', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      console.log('Buscando todos os formatos de post');
      
      try {
        // Tentar primeiro com Supabase
        const { data, error } = await supabase
          .from('post_formats')
          .select('*')
          .order('id', { ascending: true });
          
        if (!error) {
          console.log(`Encontrados ${data?.length || 0} formatos de post via Supabase`);
          return res.json(data || []);
        }
        
        // Se falhar no Supabase, tentar diretamente com PostgreSQL
        console.log("Tentando buscar formatos de post com PostgreSQL direto");
        const result = await pool.query(`SELECT * FROM post_formats ORDER BY id ASC`);
        console.log(`Encontrados ${result.rows?.length || 0} formatos de post via PostgreSQL`);
        return res.json(result.rows || []);
      } catch (dbError: any) {
        console.error("Erro ao buscar formatos de post via PostgreSQL:", dbError);
        return res.status(500).json({ 
          message: 'Erro ao buscar formatos de post',
          error: dbError.message
        });
      }
    } catch (error: any) {
      console.error('Error fetching post formats:', error);
      res.status(500).json({ 
        message: 'Erro ao buscar formatos de post',
        error: error.message
      });
    }
  });

  app.post('/api/admin/post-formats', async (req, res) => {
    try {
      // Verifique se o usuário está autenticado e é admin
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const { name, size, orientation, is_active } = req.body;
      
      if (!name || !size || !orientation) {
        return res.status(400).json({ message: 'Nome, tamanho e orientação são obrigatórios' });
      }
      
      console.log('Criando formato de post:', { name, size, orientation, is_active });
      
      try {
        // Tente inserir no Supabase primeiro
        const { data, error } = await supabase
          .from('post_formats')
          .insert([{ 
            name, 
            size, 
            orientation, 
            is_active: is_active !== false,
            created_at: new Date().toISOString()
          }])
          .select();
          
        if (!error && data && data.length > 0) {
          console.log("Formato de post criado com sucesso via Supabase");
          return res.status(201).json(data[0]);
        }
        
        // Se falhar no Supabase, tentar com PostgreSQL diretamente
        console.log("Tentando criar formato de post via PostgreSQL direto");
        const result = await pool.query(`
          INSERT INTO post_formats (name, size, orientation, is_active, created_at) 
          VALUES ($1, $2, $3, $4, $5) 
          RETURNING *
        `, [
          name, 
          size, 
          orientation, 
          is_active !== false, 
          new Date()
        ]);
        
        if (result.rows && result.rows.length > 0) {
          console.log("Formato de post criado com sucesso via PostgreSQL");
          return res.status(201).json(result.rows[0]);
        } else {
          return res.status(500).json({ 
            message: 'Formato criado, mas nenhum dado retornado' 
          });
        }
      } catch (dbError: any) {
        console.error("Erro ao criar formato de post via PostgreSQL:", dbError);
        return res.status(500).json({ 
          message: 'Erro ao criar formato de post', 
          error: dbError.message 
        });
      }
    } catch (error: any) {
      console.error('Error creating post format:', error);
      res.status(500).json({ 
        message: 'Erro ao criar formato de post',
        error: error.message 
      });
    }
  });

  app.patch('/api/admin/post-formats/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      const { name, size, orientation, is_active } = req.body;
      
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (size !== undefined) updateData.size = size;
      if (orientation !== undefined) updateData.orientation = orientation;
      if (is_active !== undefined) updateData.is_active = is_active;
      
      console.log(`Atualizando formato de post #${id}:`, updateData);
      
      try {
        // Tentar primeiro com Supabase
        const { data, error } = await supabase
          .from('post_formats')
          .update(updateData)
          .eq('id', id)
          .select();
          
        if (!error && data && data.length > 0) {
          console.log(`Formato de post #${id} atualizado com sucesso via Supabase`);
          return res.json(data[0]);
        }
        
        // Se falhar no Supabase, tentar com PostgreSQL diretamente
        console.log(`Tentando atualizar formato de post #${id} via PostgreSQL direto`);
        
        // Construir a query SQL de atualização
        let setClauses = [];
        const queryParams = [];
        let paramIndex = 1;
        
        if (name !== undefined) {
          setClauses.push(`name = $${paramIndex}`);
          queryParams.push(name);
          paramIndex++;
        }
        
        if (size !== undefined) {
          setClauses.push(`size = $${paramIndex}`);
          queryParams.push(size);
          paramIndex++;
        }
        
        if (orientation !== undefined) {
          setClauses.push(`orientation = $${paramIndex}`);
          queryParams.push(orientation);
          paramIndex++;
        }
        
        if (is_active !== undefined) {
          setClauses.push(`is_active = $${paramIndex}`);
          queryParams.push(is_active);
          paramIndex++;
        }
        
        // Adicionar o parâmetro id ao final
        queryParams.push(id);
        
        const updateQuery = `
          UPDATE post_formats 
          SET ${setClauses.join(', ')} 
          WHERE id = $${paramIndex}
          RETURNING *
        `;
        
        const result = await pool.query(updateQuery, queryParams);
        
        if (result.rows && result.rows.length > 0) {
          console.log(`Formato de post #${id} atualizado com sucesso via PostgreSQL`);
          return res.json(result.rows[0]);
        } else {
          return res.status(404).json({ message: 'Formato não encontrado ou não foi atualizado' });
        }
      } catch (dbError: any) {
        console.error(`Erro ao atualizar formato de post #${id} via PostgreSQL:`, dbError);
        return res.status(500).json({ 
          message: 'Erro ao atualizar formato de post',
          error: dbError.message
        });
      }
    } catch (error: any) {
      console.error('Error updating post format:', error);
      res.status(500).json({ 
        message: 'Erro ao atualizar formato de post',
        error: error.message
      });
    }
  });

  app.delete('/api/admin/post-formats/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      
      console.log(`Excluindo formato de post #${id}`);
      
      try {
        // Tentar primeiro com Supabase
        const { error } = await supabase
          .from('post_formats')
          .delete()
          .eq('id', id);
          
        if (!error) {
          console.log(`Formato de post #${id} excluído com sucesso via Supabase`);
          return res.status(200).json({ success: true });
        }
        
        // Se falhar no Supabase, tentar com PostgreSQL diretamente
        console.log(`Tentando excluir formato de post #${id} via PostgreSQL direto`);
        const result = await pool.query('DELETE FROM post_formats WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows && result.rows.length > 0) {
          console.log(`Formato de post #${id} excluído com sucesso via PostgreSQL`);
          return res.status(200).json({ success: true });
        } else {
          console.log(`Formato de post #${id} não encontrado para exclusão via PostgreSQL`);
          return res.status(404).json({ message: 'Formato não encontrado' });
        }
      } catch (dbError: any) {
        console.error(`Erro ao excluir formato de post #${id} via PostgreSQL:`, dbError);
        return res.status(500).json({ 
          message: 'Erro ao excluir formato de post',
          error: dbError.message
        });
      }
    } catch (error: any) {
      console.error('Error deleting post format:', error);
      res.status(500).json({ 
        message: 'Erro ao excluir formato de post',
        error: error.message
      });
    }
  });

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
  // Endpoint público para obter posts aprovados
  app.get('/api/admin/posts/approved', async (req, res) => {
    try {
      // Usar a implementação com Supabase para maior velocidade em acesso público
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'aprovado')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Erro ao buscar posts aprovados:", error);
        throw error;
      }
      
      res.json(data || []);
    } catch (error) {
      console.error('Error fetching approved posts:', error);
      res.status(500).json({ message: 'Error fetching approved posts' });
    }
  });
  
  // Endpoint público para obter posts relacionados (variações de formato)
  app.get('/api/posts/formats/:groupId', async (req, res) => {
    try {
      const { groupId } = req.params;
      
      if (!groupId) {
        return res.status(400).json({ message: 'Group ID is required' });
      }
      
      // Buscar apenas posts aprovados com este groupId (para o público)
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('group_id', groupId)
        .eq('status', 'aprovado')
        .order('id', { ascending: true });
        
      if (error) {
        console.error("Erro ao buscar variações de formato:", error);
        throw error;
      }
      
      // Mapear os dados do Supabase para o formato esperado pelo cliente
      const formattedData = data?.map(post => ({
        id: post.id,
        title: post.title,
        description: post.description || "",
        imageUrl: post.image_url,
        uniqueCode: post.unique_code,
        categoryId: post.category_id,
        status: post.status,
        createdAt: new Date(post.created_at),
        publishedAt: post.published_at ? new Date(post.published_at) : null,
        formato: post.formato,
        groupId: post.group_id,
        tituloBase: post.titulo_base,
        isPro: !!post.is_pro,
        licenseType: post.license_type || 'free',
        canvaUrl: post.canva_url,
        formatoData: post.formato_data,
        isVisible: post.is_visible !== false
      })) || [];
      
      console.log(`Encontradas ${formattedData.length} variações de formato para o grupo ${groupId}`);
      res.json(formattedData);
    } catch (error) {
      console.error('Error fetching format variations:', error);
      res.status(500).json({ message: 'Error fetching format variations' });
    }
  });

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

  // Novo endpoint para buscar posts relacionados pelo grupo_id
  app.get('/api/admin/posts/related/:groupId', async (req, res) => {
    try {
      const { groupId } = req.params;
      
      if (!groupId) {
        return res.status(400).json({ message: 'Group ID is required' });
      }
      
      const relatedPosts = await storage.getPostsByGroupId(groupId);
      res.json(relatedPosts);
    } catch (error) {
      console.error('Error fetching related posts:', error);
      res.status(500).json({ message: 'Error fetching related posts' });
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
      
      // Verificar se estamos criando múltiplos formatos
      const { formatos } = req.body;
      
      if (formatos && Array.isArray(formatos) && formatos.length > 0) {
        // Múltiplos formatos - cria uma arte para cada formato com o mesmo grupo_id
        console.log(`Criando post com ${formatos.length} formatos diferentes`);
        
        // Gerando um UUID para o grupo
        const groupId = crypto.randomUUID();
        console.log(`ID do grupo gerado: ${groupId}`);
        
        // Extraindo o título base
        const tituloBase = parsedData.data.title;
        console.log(`Título base: ${tituloBase}`);
        
        const createdPosts = [];
        
        // Para cada formato, criar um post específico
        for (const formato of formatos) {
          const formatoData = typeof formato === 'string' 
            ? { formato } 
            : formato;
          
          // Título completo com o formato para SEO
          const title = `${tituloBase} - Editável no Canva - ${formatoData.formato.toUpperCase()}`;
          
          // Gerando um uniqueCode para cada formato
          const uniqueCode = parsedData.data.uniqueCode 
            ? `${parsedData.data.uniqueCode}-${formatoData.formato}` 
            : crypto.randomUUID().substring(0, 8);
          
          // Preparando os dados para este formato específico
          const postData = {
            ...parsedData.data,
            title,
            tituloBase,
            uniqueCode,
            groupId,
            formato: formatoData.formato,
            formatoData: JSON.stringify(formatoData),
            canvaUrl: formatoData.canvaUrl || '',
          };
          
          // Criando o post para este formato
          const post = await storage.createPost(postData);
          createdPosts.push(post);
        }
        
        res.status(201).json({
          success: true,
          message: `${createdPosts.length} posts criados com sucesso no grupo ${groupId}`,
          posts: createdPosts,
          groupId
        });
      } else {
        // Apenas um formato - fluxo tradicional
        const post = await storage.createPost(parsedData.data);
        res.status(201).json(post);
      }
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
  
  // Endpoint PATCH para atualizações parciais (como licenseType, isVisible, etc)
  app.patch('/api/admin/posts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`PATCH /api/admin/posts/${id} - Dados:`, req.body);
      
      // Permitir campos específicos para atualização parcial
      const { licenseType, isVisible } = req.body;
      
      // Mapear para o formato do modelo
      const updateData: Partial<InsertPost> = {};
      
      if (licenseType !== undefined) {
        // Salvar como licenseType e também atualizar is_pro
        updateData.licenseType = licenseType;
        // Será true se licenseType for 'premium'
        updateData.isPro = licenseType === 'premium';
        console.log(`Atualizando licenseType para ${licenseType} e isPro para ${updateData.isPro}`);
      }
      
      if (isVisible !== undefined) {
        updateData.isVisible = isVisible;
        console.log(`Atualizando isVisible para ${isVisible}`);
      }
      
      const post = await storage.updatePost(id, updateData);
      res.json(post);
    } catch (error) {
      console.error('Error updating post:', error);
      res.status(500).json({ message: 'Error updating post' });
    }
  });
  
  // Excluir múltiplos posts em lote
  app.delete('/api/admin/posts/batch', async (req, res) => {
    try {
      const { ids } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Invalid post IDs' });
      }
      
      // Excluir cada post do array de IDs
      for (const id of ids) {
        await storage.deletePost(id);
      }
      
      res.status(200).json({ 
        success: true,
        message: `${ids.length} posts deleted successfully` 
      });
    } catch (error) {
      console.error('Error deleting posts in batch:', error);
      res.status(500).json({ message: 'Error deleting posts' });
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

  // Endpoint para estatísticas do painel admin
  app.get('/api/admin/stats', async (req, res) => {
    try {
      console.log("Buscando estatísticas do painel admin...");
      
      // Usar a implementação com Supabase
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id');
      
      if (postsError) {
        console.error("Erro ao buscar posts:", postsError);
        throw postsError;
      }
      
      const { data: approvedPostsData, error: approvedPostsError } = await supabase
        .from('posts')
        .select('id')
        .eq('status', 'aprovado');
        
      if (approvedPostsError) {
        console.error("Erro ao buscar posts aprovados:", approvedPostsError);
        throw approvedPostsError;
      }
      
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id');
        
      if (categoriesError) {
        console.error("Erro ao buscar categorias:", categoriesError);
        throw categoriesError;
      }
      
      // Contagem de itens
      const postsCount = postsData?.length || 0;
      const approvedPostsCount = approvedPostsData?.length || 0;
      const categoriesCount = categoriesData?.length || 0;
      
      // Retornar estatísticas
      res.json({
        postsCount,
        approvedPostsCount,
        categoriesCount,
        lastUpdate: new Date()
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Error fetching admin stats' });
    }
  });
  
  // Rota de teste para criar categoria e post (acesso sem autenticação para facilitar teste)
  app.get('/api/admin/setup-test-data', async (req, res) => {
    try {
      console.log("Configurando dados de teste para o painel admin...");
      
      // Criar categoria de teste se não existir
      const { data: existingCategories, error: categoryCheckError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', 'tutoriais');
        
      if (categoryCheckError) {
        console.error("Erro ao verificar categorias existentes:", categoryCheckError);
        throw categoryCheckError;
      }
      
      let categoryId;
      
      if (!existingCategories || existingCategories.length === 0) {
        // Criar nova categoria
        const { data: newCategory, error: categoryCreateError } = await supabase
          .from('categories')
          .insert({
            name: 'Tutoriais',
            slug: 'tutoriais',
            description: 'Guias passo-a-passo para procedimentos estéticos',
            image_url: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&auto=format&fit=crop'
          })
          .select()
          .single();
          
        if (categoryCreateError) {
          console.error("Erro ao criar categoria:", categoryCreateError);
          throw categoryCreateError;
        }
        
        categoryId = newCategory.id;
        console.log(`Categoria criada com ID: ${categoryId}`);
      } else {
        categoryId = existingCategories[0].id;
        console.log(`Categoria existente com ID: ${categoryId}`);
      }
      
      // Criar um post de teste
      const uniqueCode = `post-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      
      const { data: newPost, error: postCreateError } = await supabase
        .from('posts')
        .insert({
          title: 'Guia de Procedimentos Estéticos: O Básico',
          description: 'Um guia abrangente para iniciantes na área de estética facial e corporal',
          image_url: 'https://images.unsplash.com/photo-1571646750134-88aa9e7ab608?w=800&auto=format&fit=crop',
          unique_code: uniqueCode,
          category_id: categoryId,
          status: 'aprovado',
          published_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (postCreateError) {
        console.error("Erro ao criar post:", postCreateError);
        throw postCreateError;
      }
      
      res.json({
        success: true,
        message: 'Dados de teste criados com sucesso',
        category: {
          id: categoryId,
          name: existingCategories?.[0]?.name || 'Tutoriais',
          slug: 'tutoriais'
        },
        post: {
          id: newPost.id,
          title: newPost.title,
          uniqueCode: newPost.unique_code
        }
      });
    } catch (error) {
      console.error('Erro ao configurar dados de teste:', error);
      res.status(500).json({ 
        message: 'Erro ao configurar dados de teste',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
