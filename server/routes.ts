import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertArtworkSchema, insertCategorySchema, insertPostSchema, insertPlanSchema, insertTagSchema, type InsertPost, type InsertPlan, type InsertTag } from "@shared/schema";
import { setupAuth, hashPassword } from "./auth";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import * as schema from "@shared/schema";
import { db, pool } from "./db";
import { supabase } from "./supabase-client";
import * as crypto from "crypto";
import multer from "multer";
import * as path from "path";
import * as fs from "fs";

// Configurar multer para upload de imagens
const storage_multer = multer.memoryStorage();
const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use apenas JPG, PNG, GIF ou WebP.'));
    }
  },
});

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
      
      console.log(`Atualizando formato de arquivo #${id}:`, { name, type, icon, is_active });
      
      // Usar diretamente o PostgreSQL para esta operação
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
      
      // Se não houver cláusulas para atualizar, retornar erro
      if (setClauses.length === 0) {
        return res.status(400).json({ message: 'Nenhum campo para atualizar fornecido' });
      }
      
      // Adicionar o parâmetro id ao final
      queryParams.push(id);
      
      const updateQuery = `
        UPDATE file_formats 
        SET ${setClauses.join(', ')} 
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      console.log(`Executando query: ${updateQuery}`, queryParams);
      
      try {
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
        // Usar diretamente o PostgreSQL para operação de exclusão
        console.log(`Executando exclusão via PostgreSQL direto`);
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
      
      console.log(`Atualizando formato de post #${id}:`, { name, size, orientation, is_active });
      
      // Usar diretamente o PostgreSQL para esta operação
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
      
      // Se não houver cláusulas para atualizar, retornar erro
      if (setClauses.length === 0) {
        return res.status(400).json({ message: 'Nenhum campo para atualizar fornecido' });
      }
      
      // Adicionar o parâmetro id ao final
      queryParams.push(id);
      
      const updateQuery = `
        UPDATE post_formats 
        SET ${setClauses.join(', ')} 
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      console.log(`Executando query: ${updateQuery}`, queryParams);
      
      try {
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
        // Usar diretamente o PostgreSQL para operação de exclusão
        console.log(`Executando exclusão via PostgreSQL direto`);
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
  
  // API endpoints para gerenciamento de tags (SEO)
  app.get('/api/admin/tags', async (req, res) => {
    try {
      // Verificar autenticação de administrador
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      console.log('Buscando todas as tags');
      const tags = await storage.getTags();
      res.json(tags);
    } catch (error: any) {
      console.error('Erro ao buscar tags:', error);
      res.status(500).json({ message: 'Erro ao buscar tags', error: error.message });
    }
  });
  
  app.get('/api/admin/tags/:id', async (req, res) => {
    try {
      // Verificar autenticação de administrador
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      console.log(`Buscando tag com ID ${id}`);
      const tag = await storage.getTagById(id);
      
      if (!tag) {
        return res.status(404).json({ message: 'Tag não encontrada' });
      }
      
      res.json(tag);
    } catch (error: any) {
      console.error(`Erro ao buscar tag:`, error);
      res.status(500).json({ message: 'Erro ao buscar tag', error: error.message });
    }
  });
  
  app.post('/api/admin/tags', async (req, res) => {
    try {
      // Verificar autenticação de administrador
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      // Validar dados da tag
      const validationResult = insertTagSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Dados inválidos', 
          errors: validationResult.error.errors 
        });
      }
      
      const tagData: InsertTag = validationResult.data;
      console.log('Criando nova tag:', tagData);
      
      // Verificar se já existe uma tag com o mesmo slug
      const existingTag = await storage.getTagBySlug(tagData.slug);
      if (existingTag) {
        return res.status(400).json({ message: 'Já existe uma tag com este slug' });
      }
      
      const newTag = await storage.createTag(tagData);
      res.status(201).json(newTag);
    } catch (error: any) {
      console.error('Erro ao criar tag:', error);
      res.status(500).json({ message: 'Erro ao criar tag', error: error.message });
    }
  });
  
  app.patch('/api/admin/tags/:id', async (req, res) => {
    try {
      // Verificar autenticação de administrador
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      // Verificar se a tag existe
      const existingTag = await storage.getTagById(id);
      if (!existingTag) {
        return res.status(404).json({ message: 'Tag não encontrada' });
      }
      
      // Se estiver atualizando o slug, verificar se já existe uma tag com esse slug
      if (req.body.slug && req.body.slug !== existingTag.slug) {
        const tagWithSlug = await storage.getTagBySlug(req.body.slug);
        if (tagWithSlug && tagWithSlug.id !== id) {
          return res.status(400).json({ message: 'Já existe uma tag com este slug' });
        }
      }
      
      console.log(`Atualizando tag ${id}:`, req.body);
      const updatedTag = await storage.updateTag(id, req.body);
      res.json(updatedTag);
    } catch (error: any) {
      console.error(`Erro ao atualizar tag:`, error);
      res.status(500).json({ message: 'Erro ao atualizar tag', error: error.message });
    }
  });
  
  app.delete('/api/admin/tags/:id', async (req, res) => {
    try {
      // Verificar autenticação de administrador
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      // Verificar se a tag existe
      const existingTag = await storage.getTagById(id);
      if (!existingTag) {
        return res.status(404).json({ message: 'Tag não encontrada' });
      }
      
      // Verificar se a tag está sendo usada em posts
      if (existingTag.count && existingTag.count > 0) {
        console.warn(`Atenção: A tag ${id} está sendo usada em ${existingTag.count} post(s), mas será excluída mesmo assim`);
      }
      
      console.log(`Excluindo tag ${id}`);
      await storage.deleteTag(id);
      res.status(200).json({ message: 'Tag excluída com sucesso' });
    } catch (error: any) {
      console.error(`Erro ao excluir tag:`, error);
      res.status(500).json({ message: 'Erro ao excluir tag', error: error.message });
    }
  });
  
  app.patch('/api/admin/tags/:id/toggle', async (req, res) => {
    try {
      // Verificar autenticação de administrador
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      // Verificar se a tag existe
      const existingTag = await storage.getTagById(id);
      if (!existingTag) {
        return res.status(404).json({ message: 'Tag não encontrada' });
      }
      
      // Alternar o status da tag (ativo/inativo)
      const newStatus = !existingTag.isActive;
      console.log(`Alternando status da tag ${id} para ${newStatus ? 'ativo' : 'inativo'}`);
      
      const updatedTag = await storage.toggleTagStatus(id, newStatus);
      res.json(updatedTag);
    } catch (error: any) {
      console.error(`Erro ao alternar status da tag:`, error);
      res.status(500).json({ message: 'Erro ao alternar status da tag', error: error.message });
    }
  });

  // Public API endpoint for active categories only
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getActiveCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching active categories:', error);
      res.status(500).json({ message: 'Error fetching categories' });
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
      // Registrar detalhes da requisição para depuração
      console.log(`DELETE /api/admin/categories/${req.params.id} - Iniciando exclusão`);
      
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ 
          message: 'ID da categoria inválido'
        });
      }
      
      // A função agora retorna informações sobre os posts atualizados
      const result = await storage.deleteCategory(id);
      
      console.log(`DELETE /api/admin/categories/${id} - Categoria excluída com sucesso. ${result.postsUpdated} posts afetados.`);
      
      // Enviar resposta com detalhes sobre os posts atualizados
      if (result.postsUpdated > 0) {
        return res.status(200).json({
          success: true,
          message: 'Categoria excluída com sucesso.',
          postsUpdated: result.postsUpdated,
          details: `${result.postsUpdated} postagens foram atualizadas para ficar sem categoria.`
        });
      }
      
      // Se não havia posts, continuar com a resposta padrão de sucesso
      res.status(204).end();
    } catch (error: any) {
      // Capturar a mensagem de erro para análise
      const errorMessage = error.message || 'Erro desconhecido ao excluir categoria';
      console.error(`DELETE /api/admin/categories/${req.params.id} - Erro:`, errorMessage);
      
      // Verificar se é um erro de restrição de chave estrangeira
      if (errorMessage.includes('violates foreign key constraint')) {
        return res.status(400).json({ 
          message: 'Não foi possível excluir a categoria devido a restrições de banco de dados. Verifique se há outros objetos relacionados à categoria.',
          error: 'RESTRICAO_BANCO_DADOS'
        });
      }
      
      // Verificar outros erros comuns
      if (errorMessage.includes('Erro ao atualizar os posts relacionados')) {
        return res.status(400).json({ 
          message: errorMessage,
          error: 'ERRO_ATUALIZAR_POSTS'
        });
      }
      
      // Erro técnico - problema no servidor
      console.error('Detalhes completos do erro:', error);
      res.status(500).json({ 
        message: 'Erro ao excluir categoria',
        details: errorMessage
      });
    }
  });

  // Endpoint para alternar status da categoria (ativar/desativar)
  app.patch('/api/admin/categories/:id/status', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      const { isActive } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID de categoria inválido' });
      }

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'Status isActive deve ser um boolean' });
      }

      console.log(`Alterando status da categoria ${id} para isActive=${isActive}`);

      const updatedCategory = await storage.updateCategory(id, { isActive });
      
      res.json({
        success: true,
        category: updatedCategory,
        message: `Categoria ${isActive ? 'ativada' : 'desativada'} com sucesso`
      });
    } catch (error) {
      console.error('Erro ao alterar status da categoria:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ 
        message: 'Erro ao alterar status da categoria',
        error: errorMessage
      });
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
  
  // Endpoint especial para atualizar apenas a licença diretamente no Supabase
  app.patch('/api/admin/posts/:id/premium', async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const { isPremium } = req.body;
      
      if (isNaN(postId) || typeof isPremium !== 'boolean') {
        return res.status(400).json({ message: 'ID de post e estado premium são obrigatórios' });
      }
      
      console.log(`Endpoint /premium - Atualizando post ${postId} para isPremium=${isPremium}`);
      
      // Atualizar diretamente via Supabase
      const { error } = await supabase
        .from('posts')
        .update({ 
          is_pro: isPremium,
          license_type: isPremium ? 'premium' : 'free'
        })
        .eq('id', postId);
      
      if (error) {
        console.error("Endpoint /premium - Erro ao atualizar via Supabase:", error);
        
        // Tentar atualizar direto no PostgreSQL
        try {
          const result = await pool.query(`
            UPDATE posts 
            SET is_pro = $1, license_type = $2
            WHERE id = $3
            RETURNING id, title, is_pro, license_type
          `, [isPremium, isPremium ? 'premium' : 'free', postId]);
          
          if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Post não encontrado' });
          }
          
          console.log("Endpoint /premium - Post atualizado via PostgreSQL:", result.rows[0]);
          return res.json(result.rows[0]);
        } catch (pgError) {
          console.error("Endpoint /premium - Erro ao atualizar via PostgreSQL:", pgError);
          throw new Error("Falha ao atualizar post premium via PostgreSQL");
        }
      } else {
        console.log("Endpoint /premium - Post atualizado com sucesso via Supabase");
        
        // Retornar sucesso mesmo sem buscar o post atualizado para evitar problemas de cache
        return res.json({ 
          id: postId, 
          isPremium,
          success: true,
          message: `Post ${postId} updated to premium=${isPremium}`
        });
      }
    } catch (error) {
      console.error('Error updating post premium status:', error);
      res.status(500).json({ message: 'Error updating post premium status' });
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

  // API endpoints para planos (plans)
  // Rota de compatibilidade em português
  app.get('/api/admin/planos', async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      console.log('Buscando todos os planos (via compatibilidade)');
      
      // Parâmetro opcional: mostrar todos ou apenas ativos
      const showInactive = req.query.showInactive === 'true';
      
      try {
        const plans = await storage.getPlans(showInactive);
        console.log(`Encontrados ${plans.length} planos`);
        return res.json(plans);
      } catch (storageError: any) {
        console.error("Erro ao buscar planos via storage:", storageError);
        return res.status(500).json({ 
          message: 'Erro ao buscar planos',
          error: storageError.message
        });
      }
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      res.status(500).json({ 
        message: 'Erro ao buscar planos',
        error: error.message
      });
    }
  });
  
  app.get('/api/admin/plans', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      console.log('Buscando todos os planos');
      
      // Parâmetro opcional: mostrar todos ou apenas ativos
      const showInactive = req.query.showInactive === 'true';
      
      try {
        const plans = await storage.getPlans(showInactive);
        console.log(`Encontrados ${plans.length} planos`);
        return res.json(plans);
      } catch (storageError: any) {
        console.error("Erro ao buscar planos via storage:", storageError);
        return res.status(500).json({ 
          message: 'Erro ao buscar planos',
          error: storageError.message
        });
      }
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      res.status(500).json({ 
        message: 'Erro ao buscar planos',
        error: error.message
      });
    }
  });
  
  // Rota de compatibilidade em português
  app.get('/api/admin/planos/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const id = parseInt(req.params.id);
      console.log(`Buscando plano #${id} (via compatibilidade)`);
      
      try {
        const plan = await storage.getPlanById(id);
        
        if (!plan) {
          return res.status(404).json({ message: 'Plano não encontrado' });
        }
        
        return res.json(plan);
      } catch (storageError: any) {
        console.error(`Erro ao buscar plano #${id} via storage:`, storageError);
        return res.status(500).json({ 
          message: 'Erro ao buscar plano',
          error: storageError.message
        });
      }
    } catch (error: any) {
      console.error('Error fetching plan:', error);
      res.status(500).json({ 
        message: 'Erro ao buscar plano',
        error: error.message
      });
    }
  });
  
  app.get('/api/admin/plans/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const id = parseInt(req.params.id);
      console.log(`Buscando plano #${id}`);
      
      try {
        const plan = await storage.getPlanById(id);
        
        if (!plan) {
          return res.status(404).json({ message: 'Plano não encontrado' });
        }
        
        return res.json(plan);
      } catch (storageError: any) {
        console.error(`Erro ao buscar plano #${id} via storage:`, storageError);
        return res.status(500).json({ 
          message: 'Erro ao buscar plano',
          error: storageError.message
        });
      }
    } catch (error: any) {
      console.error('Error fetching plan:', error);
      res.status(500).json({ 
        message: 'Erro ao buscar plano',
        error: error.message
      });
    }
  });
  
  app.post('/api/admin/plans', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      console.log('Criando novo plano:', req.body);
      
      // Validar dados do plano com o schema de inserção
      const parsedData = insertPlanSchema.safeParse(req.body);
      
      if (!parsedData.success) {
        return res.status(400).json({
          message: 'Dados do plano inválidos',
          errors: parsedData.error.format()
        });
      }
      
      try {
        // Se for plano gratuito, garantir que o valor seja 0
        if (parsedData.data.isGratuito) {
          parsedData.data.valor = "0,00";
        }
        
        const newPlan = await storage.createPlan(parsedData.data);
        return res.status(201).json(newPlan);
      } catch (storageError: any) {
        console.error("Erro ao criar plano via storage:", storageError);
        return res.status(500).json({ 
          message: 'Erro ao criar plano',
          error: storageError.message
        });
      }
    } catch (error: any) {
      console.error('Error creating plan:', error);
      res.status(500).json({ 
        message: 'Erro ao criar plano',
        error: error.message
      });
    }
  });
  
  app.put('/api/admin/plans/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const id = parseInt(req.params.id);
      console.log(`Atualizando plano #${id}:`, req.body);
      
      // Validar dados parciais do plano
      const parsedData = insertPlanSchema.partial().safeParse(req.body);
      
      if (!parsedData.success) {
        return res.status(400).json({
          message: 'Dados do plano inválidos',
          errors: parsedData.error.format()
        });
      }
      
      // Se for plano gratuito, garantir que o valor seja 0
      if (parsedData.data.isGratuito === true) {
        parsedData.data.valor = "0,00";
      }
      
      try {
        const updatedPlan = await storage.updatePlan(id, parsedData.data);
        return res.json(updatedPlan);
      } catch (storageError: any) {
        console.error(`Erro ao atualizar plano #${id} via storage:`, storageError);
        return res.status(500).json({ 
          message: 'Erro ao atualizar plano',
          error: storageError.message
        });
      }
    } catch (error: any) {
      console.error('Error updating plan:', error);
      res.status(500).json({ 
        message: 'Erro ao atualizar plano',
        error: error.message
      });
    }
  });
  
  app.delete('/api/admin/plans/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const id = parseInt(req.params.id);
      console.log(`Excluindo plano #${id}`);
      
      try {
        await storage.deletePlan(id);
        return res.status(200).json({ success: true });
      } catch (storageError: any) {
        console.error(`Erro ao excluir plano #${id} via storage:`, storageError);
        return res.status(500).json({ 
          message: 'Erro ao excluir plano',
          error: storageError.message
        });
      }
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      res.status(500).json({ 
        message: 'Erro ao excluir plano',
        error: error.message
      });
    }
  });
  
  // Endpoint para ativar/desativar plano
  app.patch('/api/admin/plans/:id/toggle', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const id = parseInt(req.params.id);
      const isActive = req.body.isActive === true;
      
      console.log(`${isActive ? 'Ativando' : 'Desativando'} plano #${id}`);
      
      try {
        const updatedPlan = await storage.togglePlanStatus(id, isActive);
        return res.json(updatedPlan);
      } catch (storageError: any) {
        console.error(`Erro ao alterar status do plano #${id} via storage:`, storageError);
        return res.status(500).json({ 
          message: 'Erro ao alterar status do plano',
          error: storageError.message
        });
      }
    } catch (error: any) {
      console.error('Error toggling plan status:', error);
      res.status(500).json({ 
        message: 'Erro ao alterar status do plano',
        error: error.message
      });
    }
  });
  
  // Rota pública para listar planos ativos
  app.get('/api/plans', async (req, res) => {
    try {
      console.log('Buscando planos ativos para usuários');
      
      // Por padrão, apenas planos ativos são mostrados para usuários
      const showInactive = false;
      
      try {
        const plans = await storage.getPlans(showInactive);
        console.log(`Encontrados ${plans.length} planos ativos`);
        return res.json(plans);
      } catch (storageError: any) {
        console.error("Erro ao buscar planos via storage:", storageError);
        return res.status(500).json({ 
          message: 'Erro ao buscar planos',
          error: storageError.message
        });
      }
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      res.status(500).json({ 
        message: 'Erro ao buscar planos',
        error: error.message
      });
    }
  });

  // API endpoints para gerenciamento de usuários
  app.get('/api/admin/usuarios', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      console.log('Buscando todos os usuários');
      
      try {
        // Buscar usuários com dados completos incluindo dados de assinatura
        const query = `
          SELECT 
            u.id, 
            u.username, 
            u.email, 
            u.telefone,
            u.is_admin as "isAdmin",
            u.created_at as "createdAt",
            COALESCE(u.tipo, 'free') as tipo,
            u.plano_id,
            u.data_vencimento,
            COALESCE(u.active, false) as active
          FROM users u
          ORDER BY u.created_at DESC
        `;
        
        const result = await pool.query(query);
        return res.json(result.rows || []);
      } catch (dbError: any) {
        console.error("Erro ao buscar usuários:", dbError);
        return res.status(500).json({ 
          message: 'Erro ao buscar usuários',
          error: dbError.message
        });
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      res.status(500).json({ 
        message: 'Erro ao buscar usuários',
        error: error.message
      });
    }
  });

  app.get('/api/admin/usuarios/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      
      try {
        const query = `
          SELECT 
            u.id, 
            u.username, 
            u.email, 
            u.telefone,
            u.is_admin as "isAdmin",
            u.created_at as "createdAt",
            COALESCE(u.tipo, 'free') as tipo,
            u.plano_id,
            u.data_vencimento,
            COALESCE(u.active, false) as active
          FROM users u
          WHERE u.id = $1
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows && result.rows.length > 0) {
          return res.json(result.rows[0]);
        } else {
          return res.status(404).json({ message: 'Usuário não encontrado' });
        }
      } catch (dbError: any) {
        console.error(`Erro ao buscar usuário #${id}:`, dbError);
        return res.status(500).json({ 
          message: 'Erro ao buscar usuário',
          error: dbError.message
        });
      }
    } catch (error: any) {
      console.error('Error fetching user:', error);
      res.status(500).json({ 
        message: 'Erro ao buscar usuário',
        error: error.message
      });
    }
  });

  app.patch('/api/admin/usuarios/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      const { username, email, isAdmin, tipo, plano_id, data_vencimento, active, telefone } = req.body;
      
      console.log(`Atualizando usuário #${id}:`, req.body);
      
      // Construir a query SQL de atualização
      let setClauses = [];
      const queryParams = [];
      let paramIndex = 1;
      
      if (username !== undefined) {
        setClauses.push(`username = $${paramIndex}`);
        queryParams.push(username);
        paramIndex++;
      }
      
      if (email !== undefined) {
        setClauses.push(`email = $${paramIndex}`);
        queryParams.push(email);
        paramIndex++;
      }
      
      if (telefone !== undefined) {
        if (telefone === "") {
          setClauses.push(`telefone = NULL`);
        } else {
          setClauses.push(`telefone = $${paramIndex}`);
          queryParams.push(telefone);
          paramIndex++;
        }
      }
      
      if (isAdmin !== undefined) {
        setClauses.push(`is_admin = $${paramIndex}`);
        queryParams.push(isAdmin);
        paramIndex++;
      }
      
      if (tipo !== undefined) {
        setClauses.push(`tipo = $${paramIndex}`);
        queryParams.push(tipo);
        paramIndex++;
      }
      
      if (plano_id !== undefined) {
        if (plano_id === "") {
          setClauses.push(`plano_id = NULL`);
        } else {
          setClauses.push(`plano_id = $${paramIndex}`);
          queryParams.push(plano_id);
          paramIndex++;
        }
      }
      
      if (data_vencimento !== undefined) {
        if (data_vencimento === "") {
          setClauses.push(`data_vencimento = NULL`);
        } else {
          setClauses.push(`data_vencimento = $${paramIndex}`);
          queryParams.push(data_vencimento);
          paramIndex++;
        }
      }
      
      if (active !== undefined) {
        setClauses.push(`active = $${paramIndex}`);
        queryParams.push(active);
        paramIndex++;
      }
      
      // Se não houver cláusulas para atualizar, retornar erro
      if (setClauses.length === 0) {
        return res.status(400).json({ message: 'Nenhum campo para atualizar fornecido' });
      }
      
      // Adicionar o parâmetro id ao final
      queryParams.push(id);
      
      const updateQuery = `
        UPDATE users 
        SET ${setClauses.join(', ')} 
        WHERE id = $${paramIndex}
        RETURNING id, username, email, telefone, is_admin as "isAdmin", created_at as "createdAt", 
          COALESCE(tipo, 'free') as tipo, plano_id, data_vencimento, COALESCE(active, false) as active
      `;
      
      try {
        const result = await pool.query(updateQuery, queryParams);
        
        if (result.rows && result.rows.length > 0) {
          return res.json(result.rows[0]);
        } else {
          return res.status(404).json({ message: 'Usuário não encontrado ou não foi atualizado' });
        }
      } catch (dbError: any) {
        console.error(`Erro ao atualizar usuário #${id}:`, dbError);
        return res.status(500).json({ 
          message: 'Erro ao atualizar usuário',
          error: dbError.message
        });
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      res.status(500).json({ 
        message: 'Erro ao atualizar usuário',
        error: error.message
      });
    }
  });

  app.delete('/api/admin/usuarios/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      
      // Não permitir excluir a si mesmo
      if (id === req.user.id) {
        return res.status(400).json({ message: 'Não é possível excluir seu próprio usuário' });
      }
      
      try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows && result.rows.length > 0) {
          return res.status(200).json({ success: true });
        } else {
          return res.status(404).json({ message: 'Usuário não encontrado' });
        }
      } catch (dbError: any) {
        console.error(`Erro ao excluir usuário #${id}:`, dbError);
        return res.status(500).json({ 
          message: 'Erro ao excluir usuário',
          error: dbError.message
        });
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      res.status(500).json({ 
        message: 'Erro ao excluir usuário',
        error: error.message
      });
    }
  });

  app.patch('/api/admin/usuarios/:id/toggle-active', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      const { active } = req.body;
      
      console.log(`Alterando status de ativo do usuário #${id} para ${active}`);
      
      try {
        const result = await pool.query(`
          UPDATE users 
          SET active = $1 
          WHERE id = $2
          RETURNING id, username, email, telefone, is_admin as "isAdmin", created_at as "createdAt", 
            COALESCE(tipo, 'free') as tipo, plano_id, data_vencimento, COALESCE(active, false) as active
        `, [active, id]);
        
        if (result.rows && result.rows.length > 0) {
          return res.json(result.rows[0]);
        } else {
          return res.status(404).json({ message: 'Usuário não encontrado' });
        }
      } catch (dbError: any) {
        console.error(`Erro ao atualizar status de ativo do usuário #${id}:`, dbError);
        return res.status(500).json({ 
          message: 'Erro ao atualizar status de ativo do usuário',
          error: dbError.message
        });
      }
    } catch (error: any) {
      console.error('Error toggling user active status:', error);
      res.status(500).json({ 
        message: 'Erro ao atualizar status de ativo do usuário',
        error: error.message
      });
    }
  });

  // Rota para redefinir a senha de um usuário para o padrão
  app.patch('/api/admin/usuarios/:id/reset-password', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      const { newPassword } = req.body;
      
      if (!newPassword) {
        return res.status(400).json({ message: 'Nova senha é obrigatória' });
      }

      console.log(`Redefinindo senha do usuário #${id} para o padrão`);
      
      // Gerar o hash da nova senha
      const hashedPassword = await hashPassword(newPassword);
      
      try {
        const result = await pool.query(`
          UPDATE users 
          SET password = $1 
          WHERE id = $2
          RETURNING id, username, email, telefone, is_admin as "isAdmin", created_at as "createdAt", 
            COALESCE(tipo, 'free') as tipo, plano_id, data_vencimento, COALESCE(active, false) as active
        `, [hashedPassword, id]);
        
        if (result.rows && result.rows.length > 0) {
          return res.json({ 
            message: 'Senha redefinida com sucesso',
            user: result.rows[0]
          });
        } else {
          return res.status(404).json({ message: 'Usuário não encontrado' });
        }
      } catch (dbError: any) {
        console.error(`Erro ao redefinir senha do usuário #${id}:`, dbError);
        return res.status(500).json({ 
          message: 'Erro ao redefinir senha do usuário',
          error: dbError.message
        });
      }
    } catch (error: any) {
      console.error('Error resetting user password:', error);
      res.status(500).json({ 
        message: 'Erro ao redefinir senha do usuário',
        error: error.message
      });
    }
  });

  // API endpoints para gerenciamento de assinantes
  app.get('/api/admin/assinantes', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      console.log('Buscando todos os assinantes premium');
      
      try {
        // Buscar apenas usuários premium
        const query = `
          SELECT 
            u.id, 
            u.username, 
            u.email, 
            u.is_admin as "isAdmin",
            u.created_at as "createdAt",
            u.tipo,
            u.plano_id,
            u.data_vencimento,
            COALESCE(u.active, false) as active,
            u.telefone
          FROM users u
          WHERE u.tipo = 'premium'
          ORDER BY u.data_vencimento ASC
        `;
        
        const result = await pool.query(query);
        return res.json(result.rows || []);
      } catch (dbError: any) {
        console.error("Erro ao buscar assinantes:", dbError);
        return res.status(500).json({ 
          message: 'Erro ao buscar assinantes',
          error: dbError.message
        });
      }
    } catch (error: any) {
      console.error('Error fetching subscribers:', error);
      res.status(500).json({ 
        message: 'Erro ao buscar assinantes',
        error: error.message
      });
    }
  });

  app.patch('/api/admin/assinantes/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      const { username, email, tipo, plano_id, data_vencimento, active, telefone } = req.body;
      
      console.log(`Atualizando assinante #${id}:`, req.body);
      
      // Construir a query SQL de atualização
      let setClauses = [];
      const queryParams = [];
      let paramIndex = 1;
      
      // Permitir alterar o tipo do usuário (premium ou free)
      if (tipo !== undefined) {
        if (tipo === 'free' || tipo === 'premium') {
          setClauses.push(`tipo = $${paramIndex}`);
          queryParams.push(tipo);
          paramIndex++;
        } else {
          return res.status(400).json({ message: 'Tipo de usuário inválido. Use "free" ou "premium".' });
        }
      }
      
      if (username !== undefined) {
        setClauses.push(`username = $${paramIndex}`);
        queryParams.push(username);
        paramIndex++;
      }
      
      if (email !== undefined) {
        setClauses.push(`email = $${paramIndex}`);
        queryParams.push(email);
        paramIndex++;
      }
      
      if (telefone !== undefined) {
        if (telefone === "") {
          setClauses.push(`telefone = NULL`);
        } else {
          setClauses.push(`telefone = $${paramIndex}`);
          queryParams.push(telefone);
          paramIndex++;
        }
      }
      
      if (plano_id !== undefined) {
        if (plano_id === "") {
          setClauses.push(`plano_id = NULL`);
        } else {
          setClauses.push(`plano_id = $${paramIndex}`);
          queryParams.push(plano_id);
          paramIndex++;
        }
      }
      
      if (data_vencimento !== undefined) {
        if (data_vencimento === "") {
          setClauses.push(`data_vencimento = NULL`);
        } else {
          setClauses.push(`data_vencimento = $${paramIndex}`);
          queryParams.push(data_vencimento);
          paramIndex++;
        }
      }
      
      if (active !== undefined) {
        setClauses.push(`active = $${paramIndex}`);
        queryParams.push(active);
        paramIndex++;
      }
      
      // Se não houver cláusulas para atualizar além do tipo, retornar erro
      if (setClauses.length <= 1) {
        return res.status(400).json({ message: 'Nenhum campo para atualizar fornecido' });
      }
      
      // Adicionar o parâmetro id ao final
      queryParams.push(id);
      
      const updateQuery = `
        UPDATE users 
        SET ${setClauses.join(', ')} 
        WHERE id = $${paramIndex}
        RETURNING id, username, email, is_admin as "isAdmin", created_at as "createdAt", 
          tipo, plano_id, data_vencimento, active, telefone
      `;
      
      try {
        const result = await pool.query(updateQuery, queryParams);
        
        if (result.rows && result.rows.length > 0) {
          return res.json(result.rows[0]);
        } else {
          return res.status(404).json({ message: 'Assinante não encontrado ou não foi atualizado' });
        }
      } catch (dbError: any) {
        console.error(`Erro ao atualizar assinante #${id}:`, dbError);
        return res.status(500).json({ 
          message: 'Erro ao atualizar assinante',
          error: dbError.message
        });
      }
    } catch (error: any) {
      console.error('Error updating subscriber:', error);
      res.status(500).json({ 
        message: 'Erro ao atualizar assinante',
        error: error.message
      });
    }
  });

  app.patch('/api/admin/assinantes/:id/toggle-active', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      const { active } = req.body;
      
      console.log(`Alterando status de ativo do assinante #${id} para ${active}`);
      
      try {
        const result = await pool.query(`
          UPDATE users 
          SET active = $1 
          WHERE id = $2 AND tipo = 'premium'
          RETURNING id, username, email, is_admin as "isAdmin", created_at as "createdAt", 
            tipo, plano_id, data_vencimento, active, telefone
        `, [active, id]);
        
        if (result.rows && result.rows.length > 0) {
          return res.json(result.rows[0]);
        } else {
          return res.status(404).json({ message: 'Assinante não encontrado' });
        }
      } catch (dbError: any) {
        console.error(`Erro ao atualizar status do assinante #${id}:`, dbError);
        return res.status(500).json({ 
          message: 'Erro ao atualizar status do assinante',
          error: dbError.message
        });
      }
    } catch (error: any) {
      console.error('Error toggling subscriber active status:', error);
      res.status(500).json({ 
        message: 'Erro ao atualizar status do assinante',
        error: error.message
      });
    }
  });

  app.patch('/api/admin/assinantes/:id/cancel', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      
      console.log(`Cancelando assinatura do usuário #${id}`);
      
      try {
        const result = await pool.query(`
          UPDATE users 
          SET 
            tipo = 'free',
            active = false,
            plano_id = NULL,
            data_vencimento = NULL
          WHERE id = $1
          RETURNING id, username, email, is_admin as "isAdmin", created_at as "createdAt", 
            tipo, plano_id, data_vencimento, active, telefone
        `, [id]);
        
        if (result.rows && result.rows.length > 0) {
          return res.json(result.rows[0]);
        } else {
          return res.status(404).json({ message: 'Assinante não encontrado' });
        }
      } catch (dbError: any) {
        console.error(`Erro ao cancelar assinatura do usuário #${id}:`, dbError);
        return res.status(500).json({ 
          message: 'Erro ao cancelar assinatura',
          error: dbError.message
        });
      }
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      res.status(500).json({ 
        message: 'Erro ao cancelar assinatura',
        error: error.message
      });
    }
  });
  
  // Rota para redefinir a senha de um assinante para o padrão
  app.patch('/api/admin/assinantes/:id/reset-password', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      const { newPassword } = req.body;
      
      if (!newPassword) {
        return res.status(400).json({ message: 'Nova senha é obrigatória' });
      }

      console.log(`Redefinindo senha do assinante #${id}`);
      
      // Gerar o hash da nova senha
      const hashedPassword = await hashPassword(newPassword);
      
      try {
        const result = await pool.query(`
          UPDATE users 
          SET password = $1 
          WHERE id = $2 AND tipo = 'premium'
          RETURNING id, username, email, is_admin as "isAdmin", created_at as "createdAt", 
            tipo, plano_id, data_vencimento, active, telefone
        `, [hashedPassword, id]);
        
        if (result.rows && result.rows.length > 0) {
          return res.json({ 
            message: 'Senha redefinida com sucesso',
            user: result.rows[0]
          });
        } else {
          return res.status(404).json({ message: 'Assinante não encontrado' });
        }
      } catch (dbError: any) {
        console.error(`Erro ao redefinir senha do assinante #${id}:`, dbError);
        return res.status(500).json({ 
          message: 'Erro ao redefinir senha do assinante',
          error: dbError.message
        });
      }
    } catch (error: any) {
      console.error('Error resetting subscriber password:', error);
      res.status(500).json({ 
        message: 'Erro ao redefinir senha do assinante',
        error: error.message
      });
    }
  });

  // API endpoints para perfil do usuário (Minha Conta)
  app.patch('/api/user/profile', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const userId = req.user.id;
      const { username, email, telefone, biografia, site, localizacao } = req.body;
      
      console.log(`Atualizando perfil do usuário #${userId}:`, req.body);
      
      // Construir a query SQL de atualização
      let setClauses = [];
      const queryParams = [];
      let paramIndex = 1;
      
      if (username !== undefined) {
        setClauses.push(`username = $${paramIndex}`);
        queryParams.push(username);
        paramIndex++;
      }
      
      if (email !== undefined) {
        setClauses.push(`email = $${paramIndex}`);
        queryParams.push(email);
        paramIndex++;
      }
      
      if (telefone !== undefined) {
        if (telefone === "") {
          setClauses.push(`telefone = NULL`);
        } else {
          setClauses.push(`telefone = $${paramIndex}`);
          queryParams.push(telefone);
          paramIndex++;
        }
      }
      
      if (setClauses.length === 0) {
        return res.status(400).json({ message: 'Nenhum campo fornecido para atualização' });
      }
      
      queryParams.push(userId); // ID vai por último
      
      const updateQuery = `
        UPDATE users 
        SET ${setClauses.join(', ')} 
        WHERE id = $${paramIndex}
        RETURNING id, username, email, telefone, is_admin as "isAdmin", created_at as "createdAt"
      `;
      
      try {
        const result = await pool.query(updateQuery, queryParams);
        
        if (result.rows && result.rows.length > 0) {
          const updatedUser = result.rows[0];
          console.log(`Perfil do usuário #${userId} atualizado com sucesso`);
          return res.json({
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            telefone: updatedUser.telefone,
            isAdmin: updatedUser.isAdmin,
            createdAt: updatedUser.createdAt
          });
        } else {
          return res.status(404).json({ message: 'Usuário não encontrado' });
        }
      } catch (dbError: any) {
        console.error(`Erro ao atualizar perfil do usuário #${userId}:`, dbError);
        return res.status(500).json({ 
          message: 'Erro ao atualizar perfil',
          error: dbError.message
        });
      }
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ 
        message: 'Erro ao atualizar perfil',
        error: error.message
      });
    }
  });

  app.patch('/api/user/password', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias' });
      }
      
      console.log(`Alterando senha do usuário #${userId}`);
      
      try {
        // Buscar a senha atual do usuário
        const userQuery = 'SELECT password FROM users WHERE id = $1';
        const userResult = await pool.query(userQuery, [userId]);
        
        if (!userResult.rows || userResult.rows.length === 0) {
          return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        
        const currentHashedPassword = userResult.rows[0].password;
        
        // Verificar se a senha atual está correta
        const { scrypt, randomBytes, timingSafeEqual } = await import('crypto');
        const { promisify } = await import('util');
        const scryptAsync = promisify(scrypt);
        
        const [hashed, salt] = currentHashedPassword.split('.');
        const hashedBuf = Buffer.from(hashed, 'hex');
        const suppliedBuf = (await scryptAsync(currentPassword, salt, 64)) as Buffer;
        
        if (!timingSafeEqual(hashedBuf, suppliedBuf)) {
          return res.status(400).json({ message: 'Senha atual incorreta' });
        }
        
        // Gerar hash para a nova senha
        const newSalt = randomBytes(16).toString('hex');
        const newHashedBuf = (await scryptAsync(newPassword, newSalt, 64)) as Buffer;
        const newHashedPassword = `${newHashedBuf.toString('hex')}.${newSalt}`;
        
        // Atualizar a senha no banco
        const updateQuery = 'UPDATE users SET password = $1 WHERE id = $2';
        await pool.query(updateQuery, [newHashedPassword, userId]);
        
        console.log(`Senha do usuário #${userId} alterada com sucesso`);
        return res.json({ message: 'Senha alterada com sucesso' });
        
      } catch (dbError: any) {
        console.error(`Erro ao alterar senha do usuário #${userId}:`, dbError);
        return res.status(500).json({ 
          message: 'Erro ao alterar senha',
          error: dbError.message
        });
      }
    } catch (error: any) {
      console.error('Error changing user password:', error);
      res.status(500).json({ 
        message: 'Erro ao alterar senha',
        error: error.message
      });
    }
  });

  // Rota para upload de foto de perfil
  app.post('/api/profile/upload-photo', upload.single('image'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Nenhuma imagem enviada' });
      }

      const userId = req.user.id;
      const file = req.file;
      
      console.log(`Upload de foto para usuário #${userId}`);

      try {
        // Gerar nome único para o arquivo
        const fileExtension = path.extname(file.originalname);
        const fileName = `profile_${userId}_${Date.now()}${fileExtension}`;
        const filePath = `${fileName}`;

        // Fazer upload para o Supabase Storage no bucket "perfis"
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('perfis')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true
          });

        if (uploadError) {
          console.error('Erro no upload para Supabase:', uploadError);
          return res.status(500).json({ 
            message: 'Erro ao fazer upload da imagem',
            error: uploadError.message 
          });
        }

        // Obter URL pública da imagem
        const { data: publicUrlData } = supabase.storage
          .from('perfis')
          .getPublicUrl(filePath);

        if (!publicUrlData.publicUrl) {
          return res.status(500).json({ 
            message: 'Erro ao obter URL da imagem'
          });
        }

        const imageUrl = publicUrlData.publicUrl;

        // Atualizar o banco de dados com a nova URL da imagem
        const updateResult = await pool.query(`
          UPDATE users 
          SET profile_image = $1 
          WHERE id = $2
          RETURNING id, username, email, profile_image
        `, [imageUrl, userId]);

        if (updateResult.rows && updateResult.rows.length > 0) {
          console.log(`Foto de perfil atualizada para usuário #${userId}: ${imageUrl}`);
          return res.json({ 
            message: 'Foto de perfil atualizada com sucesso',
            profileImage: imageUrl,
            user: updateResult.rows[0]
          });
        } else {
          return res.status(404).json({ message: 'Usuário não encontrado' });
        }

      } catch (storageError: any) {
        console.error('Erro ao processar upload:', storageError);
        return res.status(500).json({ 
          message: 'Erro ao processar upload da imagem',
          error: storageError.message
        });
      }

    } catch (error: any) {
      console.error('Erro no upload de foto de perfil:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  });

  // Rota para obter dados do perfil do usuário
  app.get('/api/profile', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const userId = req.user.id;
      
      try {
        // Primeiro tentar buscar com todos os campos
        let result = await pool.query(`
          SELECT id, username, email, 
                 telefone, profile_image, created_at,
                 COALESCE(tipo, 'free') as tipo, 
                 plano_id, data_vencimento, 
                 COALESCE(active, true) as active
          FROM users 
          WHERE id = $1
        `, [userId]);

        if (result.rows && result.rows.length > 0) {
          const userData = result.rows[0];
          return res.json({
            id: userData.id,
            username: userData.username,
            email: userData.email,
            telefone: userData.telefone || null,
            profileImage: userData.profile_image || null,
            createdAt: userData.created_at,
            tipo: userData.tipo || 'free',
            planoId: userData.plano_id || null,
            dataVencimento: userData.data_vencimento || null,
            active: userData.active !== false
          });
        } else {
          // Se não encontrou, tentar com campos básicos apenas
          result = await pool.query(`
            SELECT id, username, email, created_at
            FROM users 
            WHERE id = $1
          `, [userId]);

          if (result.rows && result.rows.length > 0) {
            const userData = result.rows[0];
            return res.json({
              id: userData.id,
              username: userData.username,
              email: userData.email,
              telefone: null,
              profileImage: null,
              createdAt: userData.created_at,
              tipo: 'free',
              planoId: null,
              dataVencimento: null,
              active: true
            });
          } else {
            return res.status(404).json({ message: 'Usuário não encontrado' });
          }
        }
      } catch (dbError: any) {
        console.error(`Erro ao buscar perfil do usuário #${userId}:`, dbError);
        // Em caso de erro de coluna não encontrada, retornar dados básicos
        return res.json({
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          telefone: null,
          profileImage: null,
          createdAt: req.user.createdAt,
          tipo: 'free',
          planoId: null,
          dataVencimento: null,
          active: true
        });
      }

    } catch (error: any) {
      console.error('Erro ao obter perfil:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
