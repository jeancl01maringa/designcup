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
import webhookHotmart from "./routes/webhook-hotmart";

// Configurar multer para upload de imagens
const storage_multer = multer.memoryStorage();
const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB para materiais extras
  },
  fileFilter: (req, file, cb) => {
    console.log('📁 Upload file:', file.fieldname, file.mimetype, file.originalname);
    
    // Para materiais extras das aulas, permitir mais tipos de arquivo
    if (file.fieldname === 'extraMaterials' || file.fieldname.startsWith('extraMaterial_')) {
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/plain', 
        'application/zip', 
        'application/x-rar-compressed'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        console.error('❌ Tipo não permitido para material extra:', file.mimetype);
        cb(new Error('Tipo de arquivo não permitido para materiais extras. Use PDF, DOC, DOCX, XLS, XLSX, TXT, ZIP, RAR ou imagens.'));
      }
    } else if (file.fieldname === 'coverImage') {
      // Para imagens de capa, manter apenas formatos de imagem
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        console.error('❌ Tipo não permitido para capa:', file.mimetype);
        cb(new Error('Tipo de arquivo não permitido para imagem de capa. Use apenas JPG, PNG, GIF ou WebP.'));
      }
    } else {
      // Para outros uploads (artes, etc), manter apenas imagens
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        console.error('❌ Tipo não permitido:', file.mimetype);
        cb(new Error('Tipo de arquivo não permitido. Use apenas JPG, PNG, GIF ou WebP.'));
      }
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Registrar webhook do Hotmart PRIMEIRO (antes de outros middlewares)
  app.use('/webhook/hotmart', webhookHotmart);
  
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

  // Public API endpoint for visible posts (for the feed)
  app.get('/api/posts/visible', async (req, res) => {
    try {
      const posts = await storage.getVisiblePosts();
      res.json(posts);
    } catch (error) {
      console.error('Error fetching visible posts:', error);
      res.status(500).json({ message: 'Error fetching visible posts' });
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

  // API endpoint to get user's plan information
  app.get('/api/user/plan', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const userId = req.user.id;
      const userType = req.user.tipo;

      console.log(`Buscando plano do usuário ${userId} - tipo: ${userType}`);

      // Se o usuário é tipo "free", sempre retornar plano gratuito
      if (userType === 'free') {
        console.log('Usuário tipo free, retornando plano gratuito');
        return res.json({
          planName: 'Plano Gratuito',
          periodo: 'Gratuito',
          valor: 'R$ 0,00',
          isActive: true,
          startDate: null,
          expirationDate: null,
          source: 'local'
        });
      }

      try {
        // Buscar assinatura real da Hotmart na tabela subscriptions
        const result = await pool.query(`
          SELECT 
            hotmart_plan_name,
            plan_type,
            hotmart_plan_price,
            hotmart_currency,
            status,
            start_date,
            end_date,
            origin,
            transaction_id
          FROM subscriptions 
          WHERE user_id = $1 
          AND status = 'active'
          ORDER BY start_date DESC
          LIMIT 1
        `, [userId]);

        if (result.rows && result.rows.length > 0) {
          const subscription = result.rows[0];
          console.log(`Assinatura ativa encontrada: ${subscription.hotmart_plan_name}`);
          
          // Mapear o tipo de plano para o nome correto
          let planName = 'Premium';
          let valor = 'N/A';
          
          if (subscription.plan_type === 'mensal' || subscription.hotmart_plan_name?.includes('Mensal')) {
            planName = 'Plano Mensal Premium';
            valor = 'R$ 29,90';
          } else if (subscription.plan_type === 'trimestral' || subscription.hotmart_plan_name?.includes('Trimestral')) {
            planName = 'Plano Trimestral Premium';
            valor = 'R$ 67,00';
          } else if (subscription.plan_type === 'semestral' || subscription.hotmart_plan_name?.includes('Semestral')) {
            planName = 'Plano Semestral Premium';
            valor = 'R$ 127,00';
          } else if (subscription.plan_type === 'anual' || subscription.hotmart_plan_name?.includes('Anual')) {
            planName = 'Plano Anual Premium';
            valor = 'R$ 197,00';
          }
          
          return res.json({
            planName: planName,
            periodo: subscription.hotmart_plan_name?.includes('Anual') ? 'Anual' : 'Mensal',
            valor: subscription.hotmart_plan_price ? `R$ ${subscription.hotmart_plan_price}` : valor,
            isActive: subscription.status === 'active',
            startDate: subscription.start_date,
            expirationDate: subscription.end_date,
            source: subscription.origin || 'hotmart',
            transactionId: subscription.transaction_id
          });
        } else {
          console.log(`Nenhuma assinatura ativa encontrada para usuário ${userId}, verificando plano_id`);
          
          // Fallback: se não encontrou assinatura ativa mas é premium, buscar por plano_id como string
          const userPlanId = req.user.plano_id;
          if (userPlanId) {
            return res.json({
              planName: userPlanId === 'anual' ? 'Plano Anual' : userPlanId === 'mensal' ? 'Plano Mensal' : `Plano ${userPlanId}`,
              periodo: userPlanId === 'anual' ? 'Anual' : 'Mensal',
              valor: 'N/A',
              isActive: true,
              startDate: req.user.created_at,
              expirationDate: req.user.data_vencimento,
              source: 'local'
            });
          }

          return res.json({
            planName: 'Plano Gratuito',
            periodo: 'Gratuito',
            valor: 'R$ 0,00',
            isActive: true,
            startDate: null,
            expirationDate: null,
            source: 'local'
          });
        }
      } catch (dbError: any) {
        console.error(`Erro ao buscar assinatura do usuário ${userId}:`, dbError);
        return res.status(500).json({ message: 'Erro ao buscar informações do plano' });
      }
    } catch (error: any) {
      console.error('Error fetching user plan:', error);
      res.status(500).json({ message: 'Erro ao buscar plano do usuário' });
    }
  });



  // API endpoint for following/unfollowing users (toggle)
  app.post('/api/users/:id/follow', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      let targetUserId = parseInt(req.params.id);
      
      // Mapear autor/1 para o usuário admin (ID 3 - Jean Carlos)
      if (targetUserId === 1) {
        targetUserId = 3;
      }
      
      const currentUserId = req.user!.id;

      if (isNaN(targetUserId)) {
        return res.status(400).json({ message: 'ID inválido' });
      }

      if (targetUserId === currentUserId) {
        return res.status(400).json({ message: 'Você não pode seguir a si mesmo' });
      }

      console.log(`Usuário ${currentUserId} tentando toggle seguir usuário ${targetUserId}`);

      // Verificar se já está seguindo
      const checkResult = await pool.query(`
        SELECT id FROM user_follows 
        WHERE follower_id = $1 AND following_id = $2
      `, [currentUserId, targetUserId]);

      if (checkResult.rows && checkResult.rows.length > 0) {
        // Desseguir - remover da tabela
        await pool.query(`
          DELETE FROM user_follows 
          WHERE follower_id = $1 AND following_id = $2
        `, [currentUserId, targetUserId]);

        console.log(`Usuário ${currentUserId} deixou de seguir usuário ${targetUserId}`);
        res.json({ following: false });
      } else {
        // Seguir - adicionar na tabela
        try {
          await pool.query(`
            INSERT INTO user_follows (follower_id, following_id, created_at)
            VALUES ($1, $2, NOW())
          `, [currentUserId, targetUserId]);

          console.log(`Usuário ${currentUserId} agora segue usuário ${targetUserId}`);
          res.json({ following: true });
        } catch (insertError: any) {
          // Se a tabela não existir, criar ela
          if (insertError.code === '42P01') {
            await pool.query(`
              CREATE TABLE IF NOT EXISTS user_follows (
                id SERIAL PRIMARY KEY,
                follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(follower_id, following_id)
              )
            `);
            
            await pool.query(`
              INSERT INTO user_follows (follower_id, following_id, created_at)
              VALUES ($1, $2, NOW())
            `, [currentUserId, targetUserId]);

            console.log(`Usuário ${currentUserId} agora segue usuário ${targetUserId}`);
            res.json({ following: true });
          } else {
            throw insertError;
          }
        }
      }
    } catch (error: any) {
      console.error('Error toggling follow user:', error);
      res.status(500).json({ message: 'Erro ao seguir/desseguir usuário' });
    }
  });

  app.get('/api/users/:id/follow-status', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ following: false });
      }

      let targetUserId = parseInt(req.params.id);
      
      // Mapear autor/1 para o usuário admin (ID 3 - Jean Carlos)
      if (targetUserId === 1) {
        targetUserId = 3;
      }
      
      const currentUserId = req.user!.id;

      if (isNaN(targetUserId)) {
        return res.status(400).json({ message: 'ID inválido' });
      }

      if (targetUserId === currentUserId) {
        return res.json({ following: false });
      }

      // Verificar se está seguindo
      const result = await pool.query(`
        SELECT id FROM user_follows 
        WHERE follower_id = $1 AND following_id = $2
      `, [currentUserId, targetUserId]);

      const isFollowing = result.rows && result.rows.length > 0;
      res.json({ following: isFollowing });
    } catch (error: any) {
      console.error('Error checking follow status:', error);
      res.status(500).json({ message: 'Erro ao verificar status de seguir' });
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

  // Get category statistics with post counts
  app.get('/api/admin/category-stats', async (req, res) => {
    try {
      console.log("Buscando estatísticas das categorias...");
      
      // Buscar todas as categorias
      const categories = await storage.getCategories();
      
      // Para cada categoria, contar quantos posts ela tem
      const categoryStats = await Promise.all(
        categories.map(async (category) => {
          try {
            // Contar posts ativos para esta categoria
            const query = `
              SELECT COUNT(*) as post_count 
              FROM posts 
              WHERE category_id = $1
            `;
            
            const result = await pool.query(query, [category.id]);
            const postCount = parseInt(result.rows[0]?.post_count || 0);
            
            console.log(`Categoria ${category.id} (${category.name}): ${postCount} posts`);
            
            return {
              ...category,
              postCount
            };
          } catch (error) {
            console.error(`Erro ao contar posts da categoria ${category.id}:`, error);
            return {
              ...category,
              postCount: 0
            };
          }
        })
      );
      
      console.log(`Estatísticas calculadas para ${categoryStats.length} categorias`);
      res.json(categoryStats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas das categorias:', error);
      res.status(500).json({ message: 'Error fetching category statistics' });
    }
  });

  // Get only categories that have posts (for public feed)
  app.get('/api/categories/with-posts', async (req, res) => {
    try {
      console.log("Buscando categorias com posts para o feed público...");
      
      // Buscar categorias usando o storage que acessa o Supabase corretamente
      const allCategories = await storage.getCategories();
      const activeCategoriesWithPosts = [];
      
      // Para cada categoria ativa, verificar se tem posts
      for (const category of allCategories) {
        if (!category.isActive) continue;
        
        // Contar posts desta categoria usando a mesma lógica do feed (agrupamento)
        const query = `
          WITH grouped_posts AS (
            SELECT DISTINCT ON (COALESCE(group_id, 'single_' || id::text)) 
              id, category_id
            FROM posts 
            WHERE category_id = $1 
            AND status = 'aprovado' 
            AND (is_visible IS NULL OR is_visible = true)
            ORDER BY COALESCE(group_id, 'single_' || id::text), created_at ASC
          )
          SELECT COUNT(*) as post_count FROM grouped_posts
        `;
        
        const result = await pool.query(query, [category.id]);
        const postCount = parseInt(result.rows[0].post_count);
        
        if (postCount > 0) {
          activeCategoriesWithPosts.push({
            id: category.id,
            name: category.name,
            description: category.description,
            slug: category.slug || null,
            isActive: category.isActive,
            createdAt: category.createdAt,
            postCount: postCount
          });
        }
      }
      
      // Ordenar por nome
      activeCategoriesWithPosts.sort((a, b) => a.name.localeCompare(b.name));
      
      console.log(`Encontradas ${activeCategoriesWithPosts.length} categorias com posts:`, 
        activeCategoriesWithPosts.map(c => `${c.name} (${c.postCount} posts)`));
      
      res.json(activeCategoriesWithPosts);
    } catch (error) {
      console.error('Error fetching categories with posts:', error);
      res.status(500).json({ message: 'Error fetching categories with posts' });
    }
  });

  // Get all categories with statistics (for Categories page)
  app.get('/api/categories/with-stats', async (req, res) => {
    try {
      console.log("Buscando todas as categorias com estatísticas...");
      
      // Buscar todas as categorias ativas com contagem de posts
      const query = `
        SELECT 
          c.id,
          c.name,
          c.description,
          c.slug,
          c.image_url,
          c.is_active as "isActive",
          c.created_at,
          COALESCE(COUNT(p.id), 0) as post_count
        FROM categories c
        LEFT JOIN posts p ON c.id = p.category_id AND p.status = 'aprovado'
        WHERE c.is_active = true
        GROUP BY c.id, c.name, c.description, c.slug, c.image_url, c.is_active, c.created_at
        ORDER BY post_count DESC, c.name ASC
      `;
      
      const categoriesResult = await pool.query(query);
      
      // Para cada categoria, buscar os primeiros 4 posts para preview
      const categoriesWithStats = await Promise.all(
        categoriesResult.rows.map(async (category) => {
          const postsQuery = `
            SELECT 
              p.id,
              p.title,
              p.image_url as image,
              p.is_pro as "isPremium",
              p.created_at
            FROM posts p
            WHERE p.category_id = $1 
            AND p.status = 'aprovado'
            AND p.is_visible = true
            ORDER BY p.created_at DESC
            LIMIT 4
          `;
          
          const postsResult = await pool.query(postsQuery, [category.id]);
          const posts = postsResult.rows.map(row => ({
            id: row.id,
            title: row.title,
            image: row.image,
            isPremium: !!row.isPremium
          }));
          
          return {
            id: category.id,
            name: category.name,
            description: category.description,
            slug: category.slug,
            image_url: category.image_url,
            is_highlighted: false,
            isActive: category.isActive,
            postCount: parseInt(category.post_count),
            posts: posts,
            createdAt: category.created_at
          };
        })
      );
      
      console.log(`Encontradas ${categoriesWithStats.length} categorias com estatísticas:`, 
        categoriesWithStats.map(c => `${c.name} (${c.postCount} posts)`));
      
      res.json(categoriesWithStats);
    } catch (error) {
      console.error('Error fetching categories with stats:', error);
      res.status(500).json({ message: 'Error fetching categories with stats' });
    }
  });

  // Get posts by category ID (for category previews)
  app.get('/api/posts/category/:id', async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }

      console.log(`Buscando posts da categoria ${categoryId}...`);
      
      // Check if this is a detailed request (all posts for category page)
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
      const detailed = req.query.detailed === 'true';
      
      let query;
      if (detailed) {
        // Full post data for category detail page
        query = `
          SELECT 
            p.id,
            p.title,
            p.description,
            p.image_url as "imageUrl",
            p.is_pro as "isPremium",
            p.category_id as "categoryId",
            p.user_id as "authorId",
            u.username as "authorName",
            u.profile_image as "authorProfileImage",
            p.created_at as "createdAt",
            p.unique_code as "uniqueCode"
          FROM posts p
          JOIN users u ON p.user_id = u.id
          WHERE p.category_id = $1 
          AND p.status = 'aprovado'
          AND p.is_visible = true
          ORDER BY p.created_at DESC
        `;
      } else {
        // Simple data for category previews
        query = `
          SELECT 
            p.id,
            p.title,
            p.image_url as image,
            p.is_pro as "isPremium",
            p.created_at
          FROM posts p
          WHERE p.category_id = $1 
          AND p.status = 'aprovado'
          AND p.is_visible = true
          ORDER BY p.created_at DESC
          LIMIT $2
        `;
      }
      
      const result = detailed 
        ? await pool.query(query, [categoryId])
        : await pool.query(query, [categoryId, limit]);
        
      const posts = result.rows.map(row => {
        if (detailed) {
          return {
            id: row.id,
            title: row.title,
            description: row.description,
            imageUrl: row.imageUrl,
            isPremium: !!row.isPremium,
            categoryId: row.categoryId,
            authorId: row.authorId,
            authorName: row.authorName,
            authorProfileImage: row.authorProfileImage,
            views: 0,
            likes: 0,
            saves: 0,
            createdAt: row.createdAt,
            uniqueCode: row.uniqueCode
          };
        } else {
          return {
            id: row.id,
            title: row.title,
            image: row.image,
            isPremium: !!row.isPremium,
            createdAt: row.created_at
          };
        }
      });
      
      console.log(`Encontrados ${posts.length} posts para categoria ${categoryId}`);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching posts by category:', error);
      res.status(500).json({ message: 'Error fetching posts by category' });
    }
  });

  // Get category by slug
  app.get('/api/categories/:slug', async (req, res) => {
    try {
      const slug = req.params.slug;
      
      const query = `
        SELECT 
          c.id,
          c.name,
          c.description,
          c.slug,
          COUNT(p.id) as post_count
        FROM categories c
        LEFT JOIN posts p ON c.id = p.category_id 
          AND p.status = 'aprovado' 
          AND p.is_visible = true
        WHERE c.slug = $1 OR (c.slug IS NULL AND c.id::text = $1)
        GROUP BY c.id, c.name, c.description, c.slug
      `;
      
      const result = await pool.query(query, [slug]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      const category = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        description: result.rows[0].description,
        slug: result.rows[0].slug,
        postCount: parseInt(result.rows[0].post_count)
      };
      
      res.json(category);
    } catch (error) {
      console.error('Error fetching category by slug:', error);
      res.status(500).json({ message: 'Error fetching category' });
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
      console.log('PUT /api/admin/categories/:id - Recebido:', req.params.id, req.body);
      
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ 
          message: 'ID da categoria inválido'
        });
      }
      
      const parsedData = insertCategorySchema.partial().safeParse(req.body);
      
      if (!parsedData.success) {
        console.log('Erro de validação:', parsedData.error.format());
        return res.status(400).json({ 
          message: 'Dados da categoria inválidos',
          errors: parsedData.error.format() 
        });
      }
      
      console.log('Dados validados:', parsedData.data);
      
      const category = await storage.updateCategory(id, parsedData.data);
      
      console.log('Categoria atualizada com sucesso:', category);
      res.json(category);
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ 
        message: 'Erro ao atualizar categoria',
        error: errorMessage
      });
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
  // Endpoint otimizado para preview rápido de posts
  app.get('/api/posts/preview/:id', async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      
      if (!postId || isNaN(postId)) {
        return res.status(400).json({ message: 'ID de post inválido' });
      }

      console.log(`Preview - Buscando post com ID: ${postId}`);

      // Tentar buscar diretamente do Supabase primeiro
      const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      console.log(`Preview - Resultado Supabase:`, { error: error?.message, found: !!post });

      if (error || !post) {
        // Se não encontrar no Supabase, tentar pelo sistema interno
        console.log(`Preview - Post ${postId} não encontrado no Supabase, tentando sistema interno`);
        try {
          const internalPost = await storage.getPostById(postId);
          if (internalPost) {
            console.log(`Preview - Post ${postId} encontrado no sistema interno`);
            
            // Cache headers para melhor performance
            res.set('Cache-Control', 'public, max-age=300');
            return res.json(internalPost);
          }
        } catch (internalError) {
          console.error(`Preview - Erro no sistema interno:`, internalError);
        }
        
        console.log(`Preview - Post ${postId} não encontrado em nenhum sistema`);
        return res.status(404).json({ message: 'Post não encontrado' });
      }

      // Normalizar campos para consistência
      const normalizedPost = {
        id: post.id,
        title: post.title,
        description: post.description,
        imageUrl: post.image_url,
        uniqueCode: post.unique_code,
        categoryId: post.category_id,
        status: post.status,
        createdAt: post.created_at,
        formatData: post.format_data,
        formats: post.formats || [],
        licenseType: post.license_type || 'free',
        isPro: post.is_pro || false,
        tags: post.tags || []
      };

      console.log(`Preview - Post ${postId} normalizado com sucesso`);

      // Cache headers para melhor performance
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutos de cache
      res.json(normalizedPost);

    } catch (error) {
      console.error('Erro ao buscar preview do post:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Endpoint público para obter posts aprovados com cache otimizado
  app.get('/api/admin/posts/approved', async (req, res) => {
    try {
      // Cache headers para melhor performance do feed público
      res.set('Cache-Control', 'public, max-age=180'); // 3 minutos de cache
      
      console.log('Buscando posts aprovados via Supabase...');
      
      // Usar a implementação com Supabase para maior velocidade em acesso público
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'aprovado')
        .eq('is_visible', true) // Apenas posts visíveis
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Erro ao buscar posts aprovados:", error);
        throw error;
      }
      
      console.log(`Encontrados ${data?.length || 0} posts aprovados no Supabase`);
      
      // Normalizar os dados para o formato esperado pelo frontend
      const normalizedPosts = (data || []).map(post => {
        console.log(`Post ${post.id}: ${post.title} - URL: ${post.image_url}`);
        
        return {
          id: post.id,
          title: post.title,
          description: post.description,
          imageUrl: post.image_url, // Usar diretamente o image_url do Supabase
          categoryId: post.category_id,
          status: post.status,
          isVisible: post.is_visible !== false,
          isPro: post.is_pro || false,
          formato: post.formato,
          createdAt: post.created_at,
          updatedAt: post.updated_at,
          uniqueCode: post.unique_code,
          groupId: post.group_id,
          licenseType: post.license_type
        };
      });
      
      console.log(`Retornando ${normalizedPosts.length} posts normalizados`);
      res.json(normalizedPosts);
    } catch (error) {
      console.error('Error fetching approved posts:', error);
      res.status(500).json({ message: 'Error fetching approved posts' });
    }
  });

  // Endpoint para obter todos os formatos únicos disponíveis nos posts
  app.get('/api/posts/formats', async (req, res) => {
    try {
      console.log('Buscando todos os formatos únicos disponíveis nos posts...');
      
      const query = `
        SELECT DISTINCT formato as name
        FROM posts 
        WHERE status = 'aprovado' 
        AND (is_visible IS NULL OR is_visible = true)
        AND formato IS NOT NULL 
        AND formato != ''
        ORDER BY formato ASC
      `;
      
      const result = await pool.query(query);
      const formats = result.rows.map(row => row.name);
      
      console.log(`Encontrados ${formats.length} formatos únicos:`, formats);
      
      res.json(formats);
    } catch (error) {
      console.error('Error fetching unique formats:', error);
      res.status(500).json({ message: 'Error fetching formats' });
    }
  });
  
  // Endpoint público para obter posts relacionados (variações de formato)
  app.get('/api/posts/formats/:groupId', async (req, res) => {
    try {
      const { groupId } = req.params;
      
      if (!groupId) {
        return res.status(400).json({ message: 'Group ID is required' });
      }
      
      console.log(`Buscando todos os formatos do grupo: ${groupId}`);
      
      // Buscar todos os posts do grupo usando PostgreSQL direto
      const query = `
        SELECT id, title, description, image_url, unique_code, category_id, user_id,
               status, created_at, published_at, formato, group_id, titulo_base,
               is_pro, license_type, canva_url, formato_data, is_visible
        FROM posts 
        WHERE group_id = $1 
        AND status = 'aprovado'
        ORDER BY id ASC
      `;
      
      const result = await pool.query(query, [groupId]);
      
      if (!result.rows || result.rows.length === 0) {
        console.log(`Nenhum formato encontrado para o grupo ${groupId}`);
        return res.json([]);
      }
      
      // Mapear os dados para o formato esperado pelo cliente
      const formattedData = result.rows.map(post => ({
        id: post.id,
        title: post.title,
        description: post.description || "",
        imageUrl: post.image_url,
        uniqueCode: post.unique_code,
        categoryId: post.category_id,
        userId: post.user_id,
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
      }));
      
      console.log(`Encontradas ${formattedData.length} variações de formato para o grupo ${groupId}`);
      res.json(formattedData);
    } catch (error) {
      console.error('Error fetching format variations:', error);
      res.status(500).json({ message: 'Error fetching format variations' });
    }
  });

  app.get('/api/admin/posts', async (req, res) => {
    try {
      // Se tem groupId como parâmetro, buscar apenas posts do grupo
      if (req.query.groupId) {
        const groupId = req.query.groupId as string;
        console.log(`Buscando posts do grupo: ${groupId}`);
        
        const groupPosts = await storage.getPostsByGroupId(groupId);
        return res.json(groupPosts);
      }
      
      const filters = {
        searchTerm: req.query.search as string,
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        formatId: req.query.formatId ? parseInt(req.query.formatId as string) : undefined,
        licenseType: req.query.licenseType as string,
        isVisible: req.query.isVisible ? req.query.isVisible === 'true' : undefined,
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
          
          // Manter o título original limpo sem adicionar informações de formato
          const title = tituloBase;
          
          // Gerando um uniqueCode para cada formato
          const uniqueCode = parsedData.data.uniqueCode 
            ? `${parsedData.data.uniqueCode}-${formatoData.formato}` 
            : crypto.randomUUID().substring(0, 8);
          
          // Preparando os dados únicos para este formato específico
          const postData = {
            ...parsedData.data,
            userId: req.user!.id,
            title,
            tituloBase,
            uniqueCode,
            groupId,
            formato: formatoData.formato || formatoData.type,
            formatoData: JSON.stringify(formatoData),
            canvaUrl: formatoData.canvaUrl || formatoData.editUrl || formatoData.links?.[0]?.url || '',
            imageUrl: (formatoData.imageUrl && !formatoData.imageUrl.startsWith('blob:')) 
              ? formatoData.imageUrl 
              : (formatoData.previewUrl && !formatoData.previewUrl.startsWith('blob:'))
                ? formatoData.previewUrl 
                : '', // Validar URLs de imagem para evitar blob URLs
          };
          
          console.log(`Criando formato ${formatoData.formato || formatoData.type} com dados únicos:`, {
            imageUrl: postData.imageUrl,
            canvaUrl: postData.canvaUrl,
            groupId: postData.groupId
          });
          
          // Criando o post para este formato com dados do autor
          const post = await storage.createPost(postData, req.user);
          createdPosts.push(post);
        }
        
        res.status(201).json({
          success: true,
          message: `${createdPosts.length} posts criados com sucesso no grupo ${groupId}`,
          posts: createdPosts,
          groupId
        });
      } else {
        // Apenas um formato - fluxo tradicional com dados do autor
        const post = await storage.createPost(parsedData.data, req.user);
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
  
  // Endpoint PATCH para atualizações completas de posts (edit mode)
  app.patch('/api/admin/posts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`PATCH /api/admin/posts/${id} - Dados:`, req.body);
      
      // Extrair todos os campos que podem ser atualizados
      const { 
        title, 
        categoryId, 
        status, 
        description, 
        licenseType, 
        isVisible, 
        formatData, 
        imageUrl,
        groupId,
        uniqueCode,
        formatos 
      } = req.body;
      
      // Mapear para o formato do modelo
      const updateData: Partial<InsertPost> = {};
      
      // Campos básicos
      if (title !== undefined) {
        updateData.title = title;
        console.log(`Atualizando título para: ${title}`);
      }
      
      if (categoryId !== undefined) {
        updateData.categoryId = parseInt(categoryId);
        console.log(`Atualizando categoria para: ${categoryId}`);
      }
      
      if (status !== undefined) {
        updateData.status = status;
        console.log(`Atualizando status para: ${status}`);
      }
      
      if (description !== undefined) {
        updateData.description = description;
        console.log(`Atualizando descrição`);
      }
      
      if (licenseType !== undefined) {
        updateData.licenseType = licenseType;
        updateData.isPro = licenseType === 'premium';
        console.log(`Atualizando licenseType para ${licenseType} e isPro para ${updateData.isPro}`);
      }
      
      if (isVisible !== undefined) {
        updateData.isVisible = isVisible;
        console.log(`Atualizando isVisible para ${isVisible}`);
      }
      
      if (imageUrl !== undefined) {
        updateData.imageUrl = imageUrl;
        console.log(`Atualizando imageUrl`);
      }
      
      if (formatData !== undefined) {
        updateData.formatData = formatData;
        console.log(`Atualizando formatData com ${formatData?.length || 0} caracteres`);
      }
      
      if (groupId !== undefined) {
        updateData.groupId = groupId;
        console.log(`Atualizando groupId para: ${groupId}`);
      }
      
      if (uniqueCode !== undefined) {
        updateData.uniqueCode = uniqueCode;
        console.log(`Atualizando uniqueCode para: ${uniqueCode}`);
      }
      
      // Se há formatos múltiplos, atualizar todos os posts do grupo
      if (formatos && Array.isArray(formatos) && formatos.length > 0 && groupId) {
        console.log(`Atualizando grupo de ${formatos.length} formatos`);
        
        try {
          const relatedPosts = await storage.getPostsByGroupId(groupId);
          console.log(`Encontrados ${relatedPosts.length} posts no grupo ${groupId}`);
          
          const updatedPosts = [];
          
          for (const formato of formatos) {
            try {
              // Encontrar o post correspondente a este formato
              const existingPost = relatedPosts.find(p => p.formato === formato.formato);
              
              if (existingPost) {
                // Criar uma cópia dos dados de atualização sem o uniqueCode
                const { uniqueCode, ...baseUpdateData } = updateData;
                
                // Preparar dados específicos para este formato, preservando URLs válidas
                let imageUrl = existingPost.imageUrl; // Manter URL existente por padrão
                
                // Usar nova URL apenas se for válida (não blob)
                if (formato.imageUrl && !formato.imageUrl.startsWith('blob:')) {
                  imageUrl = formato.imageUrl;
                } else if (formato.previewUrl && !formato.previewUrl.startsWith('blob:')) {
                  imageUrl = formato.previewUrl;
                }
                
                const formatUpdateData = {
                  ...baseUpdateData,
                  imageUrl: imageUrl, // Usar URL validada
                  canvaUrl: formato.canvaUrl || formato.editUrl || existingPost.canvaUrl, // Preservar link individual
                  formatData: JSON.stringify(formato)
                  // Não incluir uniqueCode para manter o código único de cada post
                };
                
                console.log(`Atualizando formato ${formato.formato} - URL imagem: ${imageUrl}`);
                
                console.log(`Atualizando post ${existingPost.id} (${formato.formato})`);
                const updatedPost = await storage.updatePost(existingPost.id, formatUpdateData);
                updatedPosts.push(updatedPost);
                console.log(`Post ${existingPost.id} atualizado com sucesso`);
              } else {
                console.warn(`Post não encontrado para formato ${formato.formato} no grupo ${groupId}`);
              }
            } catch (formatError) {
              console.error(`Erro ao atualizar formato ${formato.formato}:`, formatError);
              throw formatError;
            }
          }
          
          console.log(`Grupo atualizado com sucesso: ${updatedPosts.length} posts`);
          
          // Retornar o primeiro post atualizado para manter compatibilidade com o frontend
          const mainPost = updatedPosts.find(p => p.id === id) || updatedPosts[0];
          if (mainPost) {
            res.json(mainPost);
          } else {
            throw new Error("Nenhum post foi atualizado com sucesso");
          }
        } catch (groupError) {
          console.error("Erro ao atualizar grupo:", groupError);
          throw groupError;
        }
      } else {
        // Atualização de post único
        console.log("Atualizando post único");
        const post = await storage.updatePost(id, updateData);
        res.json(post);
      }
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
      
      // Usar PostgreSQL direto para dados reais
      const postsCountQuery = `SELECT COUNT(*) as count FROM posts`;
      const approvedPostsQuery = `SELECT COUNT(*) as count FROM posts WHERE status = 'aprovado'`;
      const categoriesQuery = `SELECT COUNT(*) as count FROM categories`;
      const usersQuery = `SELECT COUNT(*) as count FROM users`;
      const subscribersQuery = `SELECT COUNT(*) as count FROM users WHERE tipo = 'premium'`;
      const recentPostsQuery = `
        SELECT id, title, status, created_at 
        FROM posts 
        ORDER BY created_at DESC 
        LIMIT 5
      `;
      
      const [
        postsResult,
        approvedPostsResult,
        categoriesResult,
        usersResult,
        subscribersResult,
        recentPostsResult
      ] = await Promise.all([
        pool.query(postsCountQuery),
        pool.query(approvedPostsQuery),
        pool.query(categoriesQuery),
        pool.query(usersQuery),
        pool.query(subscribersQuery),
        pool.query(recentPostsQuery)
      ]);
      
      const postsCount = parseInt(postsResult.rows[0]?.count || 0);
      const approvedPostsCount = parseInt(approvedPostsResult.rows[0]?.count || 0);
      const categoriesCount = parseInt(categoriesResult.rows[0]?.count || 0);
      const usersCount = parseInt(usersResult.rows[0]?.count || 0);
      const subscribersCount = parseInt(subscribersResult.rows[0]?.count || 0);
      const recentPosts = recentPostsResult.rows.map(post => ({
        id: post.id,
        title: post.title,
        status: post.status,
        createdAt: post.created_at
      }));
      
      console.log(`Estatísticas: ${postsCount} posts, ${approvedPostsCount} aprovados, ${categoriesCount} categorias, ${usersCount} usuários, ${subscribersCount} assinantes`);
      
      // Retornar estatísticas reais
      res.json({
        postsCount,
        approvedPostsCount,
        categoriesCount,
        usersCount,
        subscribersCount,
        artworksCount: postsCount, // Posts são as artes na plataforma
        recentPosts,
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
            u.whatsapp,
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
      
      if (isNaN(id)) {
        console.error(`ID inválido recebido: ${req.params.id}`);
        return res.status(400).json({ message: 'ID de usuário inválido' });
      }
      
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
          setClauses.push(`whatsapp = NULL`);
        } else {
          setClauses.push(`whatsapp = $${paramIndex}`);
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

  // Endpoint POST para criar usuário
  app.post('/api/admin/usuarios', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const { username, email, password, telefone, isAdmin, tipo, plano_id, active } = req.body;
      
      // Validação básica
      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Nome, email e senha são obrigatórios' });
      }

      console.log('Criando novo usuário:', { username, email, tipo, isAdmin });
      
      // Verificar se email já existe
      const existingUserCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUserCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Este email já está em uso' });
      }
      
      // Gerar hash da senha
      const hashedPassword = await hashPassword(password);
      
      try {
        const result = await pool.query(`
          INSERT INTO users (username, email, password, is_admin, telefone, tipo, plano_id, active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id, username, email, telefone, is_admin as "isAdmin", created_at as "createdAt", 
            COALESCE(tipo, 'free') as tipo, plano_id, data_vencimento, COALESCE(active, true) as active
        `, [username, email, hashedPassword, isAdmin || false, telefone || null, tipo || 'free', plano_id || null, active !== false]);
        
        const newUser = result.rows[0];
        console.log(`Usuário criado com sucesso - ID: ${newUser.id}`);
        
        return res.status(201).json(newUser);
      } catch (dbError: any) {
        console.error('Erro ao criar usuário no banco:', dbError);
        return res.status(500).json({ 
          message: 'Erro ao criar usuário',
          error: dbError.message
        });
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      res.status(500).json({ 
        message: 'Erro ao criar usuário',
        error: error.message
      });
    }
  });

  // Endpoint para adicionar campos do Hotmart na tabela subscriptions
  app.post('/api/admin/add-hotmart-fields', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      console.log('🔧 Adicionando campos de planos reais do Hotmart...');

      try {
        // Verificar se as colunas já existem
        const checkColumns = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'subscriptions' 
          AND column_name IN ('hotmart_plan_id', 'hotmart_plan_name', 'hotmart_plan_price', 'hotmart_currency')
        `);

        const existingColumns = checkColumns.rows.map(row => row.column_name);
        console.log('📋 Colunas existentes:', existingColumns);

        // Adicionar colunas faltantes
        const columnsToAdd = [
          { name: 'hotmart_plan_id', type: 'TEXT', description: 'ID real do plano no Hotmart' },
          { name: 'hotmart_plan_name', type: 'TEXT', description: 'Nome real do plano no Hotmart' },
          { name: 'hotmart_plan_price', type: 'DECIMAL(10,2)', description: 'Preço real do plano' },
          { name: 'hotmart_currency', type: 'VARCHAR(3) DEFAULT \'BRL\'', description: 'Moeda do plano' }
        ];

        const addedColumns = [];
        const existingColumnsFound = [];

        for (const column of columnsToAdd) {
          if (!existingColumns.includes(column.name)) {
            console.log(`➕ Adicionando coluna ${column.name}...`);
            
            await pool.query(`
              ALTER TABLE subscriptions 
              ADD COLUMN ${column.name} ${column.type}
            `);
            
            console.log(`✅ Coluna ${column.name} adicionada`);
            addedColumns.push(column.name);
          } else {
            console.log(`⏭️ Coluna ${column.name} já existe`);
            existingColumnsFound.push(column.name);
          }
        }

        res.json({
          success: true,
          message: 'Campos de planos Hotmart configurados',
          addedColumns,
          existingColumnsFound,
          totalColumns: columnsToAdd.length
        });

      } catch (dbError: any) {
        console.error('❌ Erro de banco ao adicionar campos:', dbError);
        res.status(500).json({ 
          message: 'Erro de banco ao configurar campos',
          error: dbError.message,
          code: dbError.code
        });
      }

    } catch (error: any) {
      console.error('❌ Erro geral ao adicionar campos Hotmart:', error);
      res.status(500).json({ 
        message: 'Erro ao configurar campos do Hotmart',
        error: error.message
      });
    }
  });

  // Endpoint para obter planos reais do webhook Hotmart
  app.get('/api/admin/hotmart-plans', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      // Retornar os 4 planos cadastrados no Hotmart baseados no seu produto
      // Estes planos correspondem aos que estão configurados na sua conta Hotmart
      const hotmartPlans = [
        {
          id: 'mensal',
          name: 'Plano Mensal Premium',
          periodo: 'Mensal',
          valor: '29,90',
          description: 'Acesso completo mensal - Design para Estética'
        },
        {
          id: 'trimestral',
          name: 'Plano Trimestral Premium',
          periodo: 'Trimestral',
          valor: '67,00',
          description: 'Acesso completo trimestral - Design para Estética'
        },
        {
          id: 'semestral',
          name: 'Plano Semestral Premium',
          periodo: 'Semestral',
          valor: '127,00',
          description: 'Acesso completo semestral - Design para Estética'
        },
        {
          id: 'anual',
          name: 'Plano Anual Premium',
          periodo: 'Anual',
          valor: '197,00',
          description: 'Acesso completo anual - Design para Estética'
        }
      ];

      console.log('Retornando 4 planos cadastrados no Hotmart:', hotmartPlans.length);
      res.json(hotmartPlans);
    } catch (error: any) {
      console.error('Error fetching Hotmart plans:', error);
      res.status(500).json({ 
        message: 'Erro ao buscar planos do Hotmart',
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

  // Rota para buscar dados públicos de um usuário (para exibir perfil do autor)
  app.get('/api/admin/users/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (!userId || isNaN(userId)) {
        return res.status(400).json({ message: 'ID de usuário inválido' });
      }
      
      console.log(`Buscando dados públicos do usuário admin #${userId}`);
      
      try {
        const result = await pool.query(`
          SELECT 
            id, 
            username, 
            email, 
            telefone, 
            profile_image as "profileImage",
            created_at as "createdAt", 
            COALESCE(tipo, 'free') as tipo,
            plano_id,
            data_vencimento,
            COALESCE(active, true) as active,
            bio
          FROM users 
          WHERE id = $1 AND is_admin = true
        `, [userId]);
        
        if (result.rows && result.rows.length > 0) {
          const userData = result.rows[0];
          
          // Remover informações sensíveis para exibição pública
          const publicUserData = {
            id: userData.id,
            username: userData.username,
            profileImage: userData.profileImage,
            createdAt: userData.createdAt,
            tipo: userData.tipo,
            active: userData.active,
            bio: userData.bio
          };
          
          console.log(`Dados públicos do usuário admin #${userId} encontrados:`, publicUserData.username);
          return res.json(publicUserData);
        } else {
          console.log(`Usuário admin #${userId} não encontrado`);
          return res.status(404).json({ message: 'Autor não encontrado' });
        }
      } catch (dbError: any) {
        console.error(`Erro ao buscar usuário #${userId}:`, dbError);
        return res.status(500).json({ 
          message: 'Erro ao buscar dados do usuário',
          error: dbError.message
        });
      }
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      res.status(500).json({ 
        message: 'Erro ao buscar dados do usuário',
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

      console.log('Buscando todos os assinantes premium com dados reais de vencimento');
      
      try {
        // Buscar usuários premium com dados reais da tabela subscriptions
        const query = `
          SELECT 
            u.id, 
            u.username, 
            u.email, 
            u.is_admin as "isAdmin",
            u.created_at as "createdAt",
            u.tipo,
            u.plano_id,
            COALESCE(s.end_date, u.data_vencimento) as data_vencimento,
            COALESCE(u.active, false) as active,
            u.telefone,
            s.hotmart_plan_name,
            s.status as subscription_status,
            s.origin as subscription_origin
          FROM users u
          LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
          WHERE u.tipo = 'premium'
          ORDER BY COALESCE(s.end_date, u.data_vencimento) ASC
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
      
      // Verificar se o usuário é premium (integração Hotmart)
      const currentUser = await storage.getUser(userId);
      const isPremiumUser = currentUser?.tipo === "premium";
      
      // Bloquear alterações de email/telefone para usuários premium
      if (isPremiumUser && (email !== undefined || telefone !== undefined)) {
        return res.status(403).json({ 
          message: 'Usuários premium devem solicitar alteração de email e telefone via suporte devido à integração com Hotmart',
          error: 'ALTERACAO_RESTRITA_PREMIUM'
        });
      }
      
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
      
      if (biografia !== undefined) {
        setClauses.push(`bio = $${paramIndex}`);
        queryParams.push(biografia);
        paramIndex++;
      }
      
      if (setClauses.length === 0) {
        return res.status(400).json({ message: 'Nenhum campo fornecido para atualização' });
      }
      
      queryParams.push(userId); // ID vai por último
      
      const updateQuery = `
        UPDATE users 
        SET ${setClauses.join(', ')} 
        WHERE id = $${paramIndex}
        RETURNING id, username, email, telefone, is_admin as "isAdmin", created_at as "createdAt", bio
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
            createdAt: updatedUser.createdAt,
            bio: updatedUser.bio
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
        // Validar tipo de arquivo
        if (!file.mimetype.startsWith('image/')) {
          return res.status(400).json({ message: 'Arquivo deve ser uma imagem' });
        }

        // Validar tamanho (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          return res.status(400).json({ message: 'Arquivo muito grande. Máximo 5MB.' });
        }

        // Importar função de upload do Supabase
        const { uploadImageToSupabase, ensureBucket } = await import('./supabase-upload.js');
        
        // Assegurar que o bucket perfis existe
        await ensureBucket('perfis');

        // Upload para Supabase Storage com conversão WebP e timestamp
        const uploadResult = await uploadImageToSupabase(
          file.buffer,
          file.originalname,
          'perfis',
          `profile_${userId}`
        );

        if (uploadResult.error || !uploadResult.url) {
          return res.status(500).json({ 
            message: 'Erro no upload da imagem',
            error: uploadResult.error
          });
        }

        // Atualizar perfil no banco
        const updatedUser = await storage.updateUserProfileImage(userId, uploadResult.url);

        console.log(`Foto de perfil atualizada para usuário #${userId}: ${uploadResult.url}`);
        
        // Garantir que a resposta contém a URL correta da nova imagem
        const responseUser = {
          ...updatedUser,
          profileImage: uploadResult.url
        };
        
        return res.json({
          success: true,
          user: responseUser,
          profileImage: uploadResult.url,
          newImageUrl: uploadResult.url // Campo adicional para garantir a atualização
        });

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
                 COALESCE(active, true) as active,
                 bio
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
            active: userData.active !== false,
            bio: userData.bio || null
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
              active: true,
              bio: null
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
          active: true,
          bio: null
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

  // Rota para atualizar dados do perfil do usuário
  app.patch('/api/user/profile', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const userId = req.user.id;
      const { username, email, telefone, biografia, site, localizacao } = req.body;
      
      console.log(`Atualizando perfil do usuário #${userId}:`, req.body);

      try {
        // Verificar se o usuário existe usando o storage (mesma forma da autenticação)
        const currentUser = await storage.getUser(userId);
        
        console.log(`Verificando usuário para atualização #${userId}:`, currentUser);

        if (!currentUser) {
          return res.status(404).json({ message: 'Usuário não encontrado na verificação de perfil' });
        }

        // Atualizar dados do perfil diretamente no banco
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (username !== undefined) {
          updateFields.push(`username = $${paramIndex}`);
          updateValues.push(username);
          paramIndex++;
        }

        if (email !== undefined) {
          updateFields.push(`email = $${paramIndex}`);
          updateValues.push(email);
          paramIndex++;
        }

        if (telefone !== undefined) {
          updateFields.push(`telefone = $${paramIndex}`);
          updateValues.push(telefone);
          paramIndex++;
        }

        if (biografia !== undefined) {
          updateFields.push(`bio = $${paramIndex}`);
          updateValues.push(biografia);
          paramIndex++;
        }

        if (updateFields.length === 0) {
          return res.status(400).json({ message: 'Nenhum campo para atualizar fornecido' });
        }

        // Adicionar ID do usuário
        updateValues.push(userId);

        const updateQuery = `
          UPDATE users 
          SET ${updateFields.join(', ')} 
          WHERE id = $${paramIndex}
          RETURNING id, username, email, telefone, profile_image as "profileImage", 
                   bio, created_at as "createdAt", 
                   COALESCE(tipo, 'free') as tipo, plano_id, data_vencimento, 
                   COALESCE(active, true) as active, is_admin as "isAdmin"
        `;

        const result = await pool.query(updateQuery, updateValues);

        if (result.rows && result.rows.length > 0) {
          const updatedUser = result.rows[0];
          console.log(`Perfil atualizado para usuário #${userId}:`, updatedUser.username);
          
          return res.json({ 
            message: 'Perfil atualizado com sucesso',
            user: updatedUser
          });
        } else {
          return res.status(404).json({ message: 'Usuário não encontrado para atualização' });
        }

      } catch (dbError: any) {
        console.error(`Erro ao atualizar perfil do usuário #${userId}:`, dbError);
        return res.status(500).json({ 
          message: 'Erro ao atualizar dados do perfil',
          error: dbError.message
        });
      }

    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  });

  // API endpoints para edições recentes
  app.get('/api/user/recent-edits', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const userId = req.user!.id;
      console.log(`Buscando edições recentes do usuário ${userId}`);

      try {
        // Buscar o campo recent_edits do usuário
        const result = await pool.query(`
          SELECT recent_edits FROM users WHERE id = $1
        `, [userId]);

        if (!result.rows || result.rows.length === 0) {
          return res.json([]);
        }

        const recentEditsIds = result.rows[0].recent_edits || [];
        
        if (recentEditsIds.length === 0) {
          return res.json([]);
        }

        // Buscar os posts correspondentes aos IDs das edições recentes
        const placeholders = recentEditsIds.map((_, index) => `$${index + 1}`).join(',');
        const postsResult = await pool.query(`
          SELECT id, title, description, image_url, formato, is_pro, category_id, created_at
          FROM posts 
          WHERE id IN (${placeholders}) AND status = 'aprovado'
        `, recentEditsIds);

        // Ordenar pelos IDs na ordem original (mais recente primeiro)
        const orderedPosts = recentEditsIds.map(id => 
          postsResult.rows.find(post => post.id === id)
        ).filter(Boolean);

        const recentEdits = orderedPosts.map(post => ({
          post: {
            id: post.id,
            title: post.title,
            description: post.description,
            imageUrl: post.image_url,
            formato: post.formato,
            isPro: post.is_pro || false,
            categoryId: post.category_id,
            createdAt: post.created_at
          },
          editedAt: new Date().toISOString() // Usar data atual como aproximação
        }));

        console.log(`Encontradas ${recentEdits.length} edições recentes`);
        res.json(recentEdits);
      } catch (dbError: any) {
        console.error('Erro de banco ao buscar edições recentes:', dbError);
        res.status(500).json({ message: 'Erro ao buscar edições recentes' });
      }
    } catch (error: any) {
      console.error('Error fetching recent edits:', error);
      res.status(500).json({ message: 'Erro ao buscar edições recentes' });
    }
  });

  // GET /api/user/following - Buscar usuários que o usuário atual está seguindo
  app.get('/api/user/following', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const userId = req.user.id;
      console.log(`Buscando usuários seguidos pelo usuário #${userId}`);

      try {
        const result = await pool.query(`
          SELECT 
            u.id,
            u.username,
            u.profile_image as "profileImage",
            u.is_admin as "isAdmin",
            u.created_at as "createdAt",
            COUNT(p.id) as "postsCount"
          FROM follows f
          JOIN users u ON f.following_id = u.id
          LEFT JOIN posts p ON u.id = p.user_id AND p.status = 'aprovado'
          WHERE f.follower_id = $1 AND u.is_admin = true
          GROUP BY u.id, u.username, u.profile_image, u.is_admin, u.created_at
          ORDER BY f.created_at DESC
        `, [userId]);

        const followedUsers = result.rows.map(row => ({
          id: row.id,
          username: row.username,
          profileImage: row.profileImage,
          postsCount: parseInt(row.postsCount) || 0,
          isDesigner: row.isAdmin,
          createdAt: row.createdAt
        }));

        console.log(`Encontrados ${followedUsers.length} usuários seguidos`);
        res.json(followedUsers);
      } catch (dbError: any) {
        console.error('Erro ao buscar usuários seguidos:', dbError);
        res.status(500).json({ message: 'Erro ao buscar usuários seguidos' });
      }
    } catch (error: any) {
      console.error('Error fetching following users:', error);
      res.status(500).json({ message: 'Erro ao buscar usuários seguidos' });
    }
  });

  // GET /api/authors - Buscar todos os autores/designers (usuários admin)
  app.get('/api/authors', async (req, res) => {
    try {
      console.log('Buscando todos os autores/designers');

      try {
        // Primeiro, verificar se a coluna bio existe e criar se necessário
        try {
          await pool.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT
          `);
          console.log('Coluna bio verificada/criada com sucesso');
        } catch (alterError) {
          console.log('Coluna bio pode já existir, continuando...');
        }

        const result = await pool.query(`
          SELECT 
            u.id,
            u.username,
            u.profile_image as "profileImage",
            u.created_at as "createdAt",
            COALESCE(u.bio, 'Bem-vindo ao nosso perfil oficial! Aqui você encontra conteúdos criativos que agregam valor aos seus projetos.') as bio,
            COUNT(p.id) as "postsCount"
          FROM users u
          LEFT JOIN posts p ON u.id = p.user_id AND p.status = 'aprovado'
          WHERE u.is_admin = true AND u.active = true
          GROUP BY u.id, u.username, u.profile_image, u.created_at, u.bio
          ORDER BY u.created_at ASC
        `, []);

        const authors = result.rows.map(row => ({
          id: row.id,
          username: row.username,
          profileImage: row.profileImage,
          postsCount: parseInt(row.postsCount) || 0,
          createdAt: row.createdAt,
          bio: row.bio
        }));

        console.log(`Encontrados ${authors.length} autores/designers`);
        res.json(authors);
      } catch (dbError: any) {
        console.error('Erro ao buscar autores:', dbError);
        res.status(500).json({ message: 'Erro ao buscar autores' });
      }
    } catch (error: any) {
      console.error('Error fetching authors:', error);
      res.status(500).json({ message: 'Erro ao buscar autores' });
    }
  });

  // GET /api/admin/authors - Buscar todos os autores para o painel administrativo
  app.get('/api/admin/authors', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user.isAdmin) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const authors = await storage.getAllAuthors();
      res.json(authors);
    } catch (error: any) {
      console.error('Erro ao buscar autores para admin:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  app.post('/api/user/recent-edits/:postId', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const userId = req.user!.id;
      const postId = parseInt(req.params.postId);

      if (isNaN(postId)) {
        return res.status(400).json({ message: 'ID do post inválido' });
      }

      console.log(`Adicionando post ${postId} às edições recentes do usuário ${userId}`);

      try {
        // Buscar as edições recentes atuais
        const userResult = await pool.query(`
          SELECT recent_edits FROM users WHERE id = $1
        `, [userId]);

        if (!userResult.rows || userResult.rows.length === 0) {
          return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        let recentEdits = userResult.rows[0].recent_edits || [];
        
        // Remover o post se já existe (para evitar duplicatas)
        recentEdits = recentEdits.filter(id => id !== postId);
        
        // Adicionar no início da lista
        recentEdits.unshift(postId);
        
        // Limitar a 20 itens
        if (recentEdits.length > 20) {
          recentEdits = recentEdits.slice(0, 20);
        }

        // Atualizar o banco
        await pool.query(`
          UPDATE users SET recent_edits = $1 WHERE id = $2
        `, [JSON.stringify(recentEdits), userId]);

        console.log(`Edições recentes atualizadas para usuário ${userId}:`, recentEdits);
        res.json({ 
          success: true, 
          message: 'Post adicionado às edições recentes',
          recentEditsCount: recentEdits.length
        });
      } catch (dbError: any) {
        console.error('Erro de banco ao atualizar edições recentes:', dbError);
        res.status(500).json({ message: 'Erro ao atualizar edições recentes' });
      }
    } catch (error: any) {
      console.error('Error adding to recent edits:', error);
      res.status(500).json({ message: 'Erro ao adicionar à lista de edições recentes' });
    }
  });



  app.get('/api/users/:id/followers', async (req, res) => {
    try {
      let userId = parseInt(req.params.id);
      
      // Mapear autor/1 para o usuário admin (ID 3 - Jean Carlos)
      if (userId === 1) {
        userId = 3;
      }
      
      try {
        // Contar seguidores
        const result = await pool.query(`
          SELECT COUNT(*) as count
          FROM user_follows 
          WHERE following_id = $1
        `, [userId]);
        
        const count = result.rows && result.rows.length > 0 ? parseInt(result.rows[0].count) : 0;
        
        return res.json({ count });
      } catch (dbError: any) {
        // Se a tabela não existir, retornar 0
        if (dbError.code === '42P01') {
          return res.json({ count: 0 });
        }
        throw dbError;
      }
    } catch (error: any) {
      console.error('Erro ao buscar seguidores:', error);
      res.json({ count: 0 });
    }
  });

  // API endpoint para buscar artes relacionadas baseado em categoria e similaridade de título
  app.get('/api/posts/:id/related', async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 8;
      
      if (!postId) {
        return res.status(400).json({ message: 'ID do post inválido' });
      }

      // Primeiro, buscar o post atual para obter sua categoria e título
      const currentPostQuery = `
        SELECT id, title, category_id, group_id 
        FROM posts 
        WHERE id = $1
      `;
      
      const currentPostResult = await pool.query(currentPostQuery, [postId]);
      
      if (currentPostResult.rows.length === 0) {
        return res.status(404).json({ message: 'Post não encontrado' });
      }
      
      const currentPost = currentPostResult.rows[0];
      const { title, category_id, group_id } = currentPost;
      
      // Extrair palavras-chave do título (remover palavras comuns e manter as principais)
      const titleWords = title
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => 
          word.length > 3 && 
          !['para', 'com', 'sem', 'que', 'uma', 'seu', 'sua', 'seus', 'suas', 'arte', 'canva', 'editável', 'social', 'media'].includes(word)
        )
        .slice(0, 5); // Máximo 5 palavras-chave
      
      // Construir query para buscar posts relacionados
      let relatedQuery = `
        SELECT DISTINCT ON (p.group_id) 
          p.id, p.title, p.image_url as "imageUrl", p.unique_code as "uniqueCode", 
          p.formato, p.license_type as "licenseType", p.is_pro as "isPro",
          p.created_at as "createdAt", p.user_id as "userId", p.group_id as "groupId",
          c.name as "categoryName"
        FROM posts p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'aprovado' 
          AND p.is_visible = true 
          AND p.id != $1
          AND p.group_id != $2
          AND (
            p.category_id = $3
      `;
      
      const queryParams = [postId, group_id || '', category_id];
      let paramIndex = 4;
      
      // Adicionar condições de similaridade de título se temos palavras-chave
      if (titleWords.length > 0) {
        const titleConditions = titleWords.map(word => {
          queryParams.push(`%${word}%`);
          return `LOWER(p.title) LIKE $${paramIndex++}`;
        }).join(' OR ');
        
        relatedQuery += ` OR (${titleConditions})`;
      }
      
      relatedQuery += `
          )
        ORDER BY p.group_id, 
          CASE WHEN p.category_id = $3 THEN 1 ELSE 2 END,
          p.created_at DESC
        LIMIT $${paramIndex}
      `;
      
      queryParams.push(limit);
      
      const result = await pool.query(relatedQuery, queryParams);
      
      return res.json(result.rows);
      
    } catch (error: any) {
      console.error('Erro ao buscar artes relacionadas:', error);
      res.status(500).json({ 
        message: 'Erro ao buscar artes relacionadas',
        error: error.message
      });
    }
  });

  // API endpoints para curtidas e salvos
  app.post('/api/posts/:id/like', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const postId = parseInt(req.params.id);
      const userId = req.user!.id;

      if (isNaN(postId)) {
        return res.status(400).json({ message: 'ID do post inválido' });
      }

      console.log(`Usuário ${userId} curtindo post ${postId}`);

      // Verificar se já curtiu
      const checkResult = await pool.query(`
        SELECT id FROM post_likes 
        WHERE user_id = $1 AND post_id = $2
      `, [userId, postId]);

      if (checkResult.rows && checkResult.rows.length > 0) {
        // Já curtiu, remover curtida
        await pool.query(`
          DELETE FROM post_likes 
          WHERE user_id = $1 AND post_id = $2
        `, [userId, postId]);
        
        console.log(`Curtida removida: usuário ${userId}, post ${postId}`);
        res.json({ liked: false });
      } else {
        // Não curtiu ainda, adicionar curtida
        await pool.query(`
          INSERT INTO post_likes (user_id, post_id, created_at)
          VALUES ($1, $2, NOW())
        `, [userId, postId]);
        
        console.log(`Curtida adicionada: usuário ${userId}, post ${postId}`);
        res.json({ liked: true });
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
      res.status(500).json({ message: 'Erro ao curtir post' });
    }
  });

  app.post('/api/posts/:id/save', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const postId = parseInt(req.params.id);
      const userId = req.user!.id;

      if (isNaN(postId)) {
        return res.status(400).json({ message: 'ID do post inválido' });
      }

      console.log(`Usuário ${userId} salvando post ${postId}`);

      // Verificar se já salvou
      const checkResult = await pool.query(`
        SELECT id FROM post_saves 
        WHERE user_id = $1 AND post_id = $2
      `, [userId, postId]);

      if (checkResult.rows && checkResult.rows.length > 0) {
        // Já salvou, remover
        await pool.query(`
          DELETE FROM post_saves 
          WHERE user_id = $1 AND post_id = $2
        `, [userId, postId]);
        
        console.log(`Post removido dos salvos: usuário ${userId}, post ${postId}`);
        res.json({ saved: false });
      } else {
        // Não salvou ainda, adicionar
        await pool.query(`
          INSERT INTO post_saves (user_id, post_id, created_at)
          VALUES ($1, $2, NOW())
        `, [userId, postId]);
        
        console.log(`Post salvo: usuário ${userId}, post ${postId}`);
        res.json({ saved: true });
      }
    } catch (error: any) {
      console.error('Error toggling save:', error);
      res.status(500).json({ message: 'Erro ao salvar post' });
    }
  });

  // Buscar posts curtidos do usuário
  app.get('/api/user/liked-posts', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const userId = req.user!.id;
      console.log(`Buscando posts curtidos do usuário ${userId}`);

      const result = await pool.query(`
        SELECT p.*, pl.created_at as liked_at
        FROM posts p
        INNER JOIN post_likes pl ON p.id = pl.post_id
        WHERE pl.user_id = $1
        ORDER BY pl.created_at DESC
      `, [userId]);

      const posts = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        imageUrl: row.image_url,
        formato: row.formato,
        isPro: row.is_pro || false,
        categoryId: row.category_id,
        createdAt: row.created_at,
        likedAt: row.liked_at
      }));

      console.log(`Encontrados ${posts.length} posts curtidos`);
      res.json(posts);
    } catch (error: any) {
      console.error('Error fetching liked posts:', error);
      res.status(500).json({ message: 'Erro ao buscar posts curtidos' });
    }
  });

  // Buscar posts salvos do usuário
  app.get('/api/user/saved-posts', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const userId = req.user!.id;
      console.log(`Buscando posts salvos do usuário ${userId}`);

      const result = await pool.query(`
        SELECT p.*, ps.created_at as saved_at
        FROM posts p
        INNER JOIN post_saves ps ON p.id = ps.post_id
        WHERE ps.user_id = $1
        ORDER BY ps.created_at DESC
      `, [userId]);

      const posts = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        imageUrl: row.image_url,
        formato: row.formato,
        isPro: row.is_pro || false,
        categoryId: row.category_id,
        createdAt: row.created_at,
        savedAt: row.saved_at
      }));

      console.log(`Encontrados ${posts.length} posts salvos`);
      res.json(posts);
    } catch (error: any) {
      console.error('Error fetching saved posts:', error);
      res.status(500).json({ message: 'Erro ao buscar posts salvos' });
    }
  });

  // Verificar status de curtida e salvamento de um post
  app.get('/api/posts/:id/status', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const postId = parseInt(req.params.id);
      const userId = req.user!.id;

      if (isNaN(postId)) {
        return res.status(400).json({ message: 'ID do post inválido' });
      }

      // Verificar curtida
      const likeResult = await pool.query(`
        SELECT id FROM post_likes 
        WHERE user_id = $1 AND post_id = $2
      `, [userId, postId]);

      // Verificar salvamento
      const saveResult = await pool.query(`
        SELECT id FROM post_saves 
        WHERE user_id = $1 AND post_id = $2
      `, [userId, postId]);

      res.json({
        liked: likeResult.rows && likeResult.rows.length > 0,
        saved: saveResult.rows && saveResult.rows.length > 0
      });
    } catch (error: any) {
      console.error('Error checking post status:', error);
      res.status(500).json({ message: 'Erro ao verificar status do post' });
    }
  });

  // API endpoints para gerenciamento de popups
  app.get('/api/popups', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const popups = await storage.getPopups();
      res.json(popups);
    } catch (error: any) {
      console.error('Error fetching popups:', error);
      res.status(500).json({ message: 'Erro ao buscar popups' });
    }
  });

  app.get('/api/popups/active', async (req, res) => {
    try {
      const popups = await storage.getActivePopups();
      res.json(popups);
    } catch (error: any) {
      console.error('Error fetching active popups:', error);
      res.status(500).json({ message: 'Erro ao buscar popups ativos' });
    }
  });

  app.get('/api/popups/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }

      const popup = await storage.getPopupById(id);
      if (!popup) {
        return res.status(404).json({ message: 'Popup não encontrado' });
      }

      res.json(popup);
    } catch (error: any) {
      console.error('Error fetching popup:', error);
      res.status(500).json({ message: 'Erro ao buscar popup' });
    }
  });

  app.post('/api/popups', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      console.log('Criando popup com dados:', req.body);

      const popup = await storage.createPopup(req.body);
      res.status(201).json(popup);
    } catch (error: any) {
      console.error('Error creating popup:', error);
      res.status(500).json({ message: 'Erro ao criar popup', error: error.message });
    }
  });

  app.put('/api/popups/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }

      const popup = await storage.updatePopup(id, req.body);
      res.json(popup);
    } catch (error: any) {
      console.error('Error updating popup:', error);
      res.status(500).json({ message: 'Erro ao atualizar popup' });
    }
  });

  app.patch('/api/popups/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }

      const popup = await storage.updatePopup(id, req.body);
      res.json(popup);
    } catch (error: any) {
      console.error('Error updating popup:', error);
      res.status(500).json({ message: 'Erro ao atualizar popup' });
    }
  });

  app.delete('/api/popups/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }

      await storage.deletePopup(id);
      res.status(200).json({ success: true, message: 'Popup excluído com sucesso' });
    } catch (error: any) {
      console.error('Error deleting popup:', error);
      res.status(500).json({ message: 'Erro ao excluir popup' });
    }
  });

  app.patch('/api/popups/:id/toggle', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }

      const { isActive } = req.body;
      const popup = await storage.togglePopupStatus(id, isActive);
      res.json(popup);
    } catch (error: any) {
      console.error('Error toggling popup status:', error);
      res.status(500).json({ message: 'Erro ao atualizar status do popup' });
    }
  });

  // Cache para posts visíveis com TTL de 5 minutos
  let visiblePostsCache: { data: any[], timestamp: number } | null = null;
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  // Endpoint otimizado com cache para posts visíveis
  app.get('/api/posts/visible', async (req, res) => {
    try {
      const now = Date.now();
      
      // Cache headers para melhor performance
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutos de cache no navegador
      
      // Verificar se temos cache válido
      if (visiblePostsCache && (now - visiblePostsCache.timestamp) < CACHE_TTL) {
        return res.json(visiblePostsCache.data);
      }

      // Buscar dados frescos
      const posts = await storage.getVisiblePosts();
      
      // Atualizar cache
      visiblePostsCache = {
        data: posts,
        timestamp: now
      };
      
      res.json(posts);
    } catch (error) {
      console.error("Erro ao buscar posts visíveis:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Upload route for Supabase Storage
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      const { bucket, path } = req.body;
      if (!bucket || !path) {
        return res.status(400).json({ error: 'Bucket e caminho são obrigatórios' });
      }

      // Upload usando o cliente administrativo do Supabase (bypassa RLS)
      const { uploadImageToSupabase } = await import('./supabase-upload');
      
      const result = await uploadImageToSupabase(
        req.file.buffer,
        req.file.originalname,
        bucket,
        path
      );

      if (result.error) {
        return res.status(500).json({ error: result.error });
      }

      res.json({ url: result.url });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Erro interno no upload' });
    }
  });

  // Settings routes
  app.get('/api/settings', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ message: 'Erro ao buscar configurações' });
    }
  });

  app.get('/api/settings/:key', async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await storage.getSetting(key);
      
      if (!setting) {
        return res.status(404).json({ message: 'Configuração não encontrada' });
      }

      res.json(setting);
    } catch (error: any) {
      console.error('Error fetching setting:', error);
      res.status(500).json({ message: 'Erro ao buscar configuração' });
    }
  });

  app.post('/api/settings', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const { key, value, description } = req.body;
      
      if (!key || !value) {
        return res.status(400).json({ message: 'Chave e valor são obrigatórios' });
      }

      const setting = await storage.setSetting(key, value, description);
      res.status(201).json(setting);
    } catch (error: any) {
      console.error('Error creating setting:', error);
      res.status(500).json({ message: 'Erro ao criar configuração' });
    }
  });

  app.put('/api/settings/:key', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const { key } = req.params;
      const { value } = req.body;
      
      if (!value) {
        return res.status(400).json({ message: 'Valor é obrigatório' });
      }

      const setting = await storage.updateSetting(key, value);
      res.json(setting);
    } catch (error: any) {
      console.error('Error updating setting:', error);
      res.status(500).json({ message: 'Erro ao atualizar configuração' });
    }
  });

  app.delete('/api/settings/:key', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const { key } = req.params;
      await storage.deleteSetting(key);
      res.status(200).json({ success: true, message: 'Configuração removida com sucesso' });
    } catch (error: any) {
      console.error('Error deleting setting:', error);
      res.status(500).json({ message: 'Erro ao remover configuração' });
    }
  });

  // Logo upload in database (base64)
  app.post('/api/logo/upload', upload.single('logo'), async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado' });
      }

      const file = req.file;
      
      // Validar tipo de arquivo
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
      if (!validTypes.includes(file.mimetype)) {
        return res.status(400).json({ message: 'Formato de arquivo inválido. Use PNG, JPG ou SVG.' });
      }

      // Validar tamanho (máximo 2MB para base64)
      if (file.size > 2 * 1024 * 1024) {
        return res.status(400).json({ message: 'Arquivo muito grande. Máximo 2MB.' });
      }

      // Converter arquivo para base64
      const base64Data = file.buffer.toString('base64');
      
      // Limpar logos anteriores (manter apenas o último)
      await pool.query('DELETE FROM platform_logo');
      
      // Inserir novo logo
      const logoId = await pool.query(`
        INSERT INTO platform_logo (image_data, mime_type, filename, size, uploaded_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id
      `, [base64Data, file.mimetype, file.originalname, file.size]);

      console.log(`Logo salvo no banco com ID: ${logoId.rows[0].id}`);
      
      res.json({
        success: true,
        message: 'Logo atualizado com sucesso',
        logoId: logoId.rows[0].id
      });

    } catch (error: any) {
      console.error('Error uploading logo:', error);
      res.status(500).json({ message: 'Erro ao fazer upload do logo' });
    }
  });

  // Buscar logo atual
  app.get('/api/logo', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT image_data, mime_type, filename 
        FROM platform_logo 
        ORDER BY uploaded_at DESC 
        LIMIT 1
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Logo não encontrado' });
      }

      const logo = result.rows[0];
      
      // Retornar logo como data URL
      const dataUrl = `data:${logo.mime_type};base64,${logo.image_data}`;
      
      res.json({
        dataUrl,
        filename: logo.filename,
        mimeType: logo.mime_type
      });

    } catch (error: any) {
      console.error('Error fetching logo:', error);
      res.status(500).json({ message: 'Erro ao buscar logo' });
    }
  });

  // Remover logo
  app.delete('/api/logo', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      // Remover todos os logos
      const result = await pool.query('DELETE FROM platform_logo');
      
      console.log(`${result.rowCount || 0} logo(s) removido(s) do banco`);
      
      res.json({
        success: true,
        message: 'Logo removido com sucesso'
      });

    } catch (error: any) {
      console.error('Error deleting logo:', error);
      res.status(500).json({ message: 'Erro ao remover logo' });
    }
  });

  // Logo upload routes (arquivo local - manter para compatibilidade)
  app.post('/api/settings/logo', upload.single('logo'), async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado' });
      }

      const file = req.file;
      
      // Validar tipo de arquivo
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
      if (!validTypes.includes(file.mimetype)) {
        return res.status(400).json({ message: 'Formato de arquivo inválido. Use PNG, JPG ou SVG.' });
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ message: 'Arquivo muito grande. Máximo 5MB.' });
      }

      // Salvar logo localmente para evitar problemas com Supabase
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Criar diretório de logos se não existir
      const logoDir = path.join(process.cwd(), 'public', 'logos');
      try {
        await fs.mkdir(logoDir, { recursive: true });
      } catch (error) {
        // Diretório já existe
      }

      // Processar arquivo (converter SVG para PNG se necessário)
      let finalBuffer = file.buffer;
      let fileExtension = '';
      
      if (file.mimetype === 'image/svg+xml') {
        // Converter SVG para PNG usando Sharp
        const sharp = await import('sharp');
        try {
          finalBuffer = await sharp.default(file.buffer, { density: 300 })
            .resize(800, 800, { 
              fit: 'inside', 
              withoutEnlargement: true,
              background: { r: 255, g: 255, b: 255, alpha: 0 }
            })
            .png({ quality: 100, compressionLevel: 6 })
            .toBuffer();
          fileExtension = '.png';
          console.log(`SVG convertido para PNG: ${(finalBuffer.length / 1024).toFixed(1)}KB`);
        } catch (error) {
          console.warn('Erro na conversão SVG, usando original:', error);
          fileExtension = '.svg';
        }
      } else {
        // Para outros formatos, manter original ou otimizar
        const sharp = await import('sharp');
        try {
          finalBuffer = await sharp.default(file.buffer)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .png({ quality: 95 })
            .toBuffer();
          fileExtension = '.png';
        } catch (error) {
          // Manter formato original se não conseguir converter
          fileExtension = file.originalname.includes('.') ? 
            '.' + file.originalname.split('.').pop() : '.png';
        }
      }

      // Gerar nome único para o arquivo
      const fileName = `logo_${Date.now()}${fileExtension}`;
      const filePath = path.join(logoDir, fileName);
      
      // Salvar arquivo
      await fs.writeFile(filePath, finalBuffer);
      
      // URL pública do logo
      const logoPath = `/logos/${fileName}`;
      if (!logoPath) {
        return res.status(500).json({ 
          message: 'URL do logo não foi retornada do Supabase' 
        });
      }
      console.log(`Logo salvo no Supabase: ${logoPath}`);

      // Salvar no banco de dados
      const setting = await storage.setSetting('logo_plataforma', logoPath!, 'Logo personalizado da plataforma');
      
      res.json({
        success: true,
        message: 'Logo atualizado com sucesso',
        logoPath,
        setting
      });

    } catch (error: any) {
      console.error('Error uploading logo:', error);
      res.status(500).json({ message: 'Erro ao fazer upload do logo' });
    }
  });

  // Endpoint para buscar número de curtidas de um post
  app.get('/api/posts/:id/likes', async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: 'ID inválido' });
      }

      const result = await pool.query(
        'SELECT COUNT(*) as count FROM likes WHERE post_id = $1',
        [postId]
      );

      const count = parseInt(result.rows[0].count) || 0;
      res.json({ count });
    } catch (error: any) {
      console.error('Erro ao buscar curtidas:', error);
      res.status(500).json({ message: 'Erro ao buscar curtidas' });
    }
  });

  // Endpoint para estatísticas de assinaturas
  app.get('/api/admin/subscriptions/stats', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const stats = await pool.query(`
        SELECT 
          COUNT(*) as total_subscriptions,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
          COUNT(CASE WHEN status = 'canceled' THEN 1 END) as canceled_subscriptions,
          COUNT(CASE WHEN origin = 'hotmart' THEN 1 END) as hotmart_subscriptions
        FROM subscriptions
      `);

      res.json(stats.rows[0]);
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas de assinaturas:', error);
      res.status(500).json({ message: 'Erro ao buscar estatísticas' });
    }
  });

  // Endpoint para lista de assinaturas
  app.get('/api/admin/subscriptions', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const subscriptions = await pool.query(`
        SELECT 
          s.id,
          s.user_id,
          u.username,
          u.email,
          u.telefone,
          s.plan_type,
          s.hotmart_plan_id,
          s.hotmart_plan_name,
          s.hotmart_plan_price,
          s.hotmart_currency,
          s.status,
          s.start_date,
          s.end_date,
          s.transaction_id,
          s.origin,
          s.last_event,
          s.telefone as subscription_telefone,
          s.created_at
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        ORDER BY s.created_at DESC
      `);

      // Processar os dados para incluir informações do plano real
      const processedSubscriptions = subscriptions.rows.map(subscription => {
        // Função para limpar o nome do plano removendo o prefixo do produto
        const cleanPlanName = (planName: string) => {
          if (!planName) return 'Premium';
          
          // Remover "Kit de Documentos Estética Premium" e limpar
          const cleaned = planName
            .replace(/Kit de Documentos Estética Premium\s*-?\s*/i, '')
            .trim();
          
          // Se ficou vazio após limpeza, mapear pelo tipo
          if (!cleaned) {
            if (subscription.plan_type === 'mensal') return 'Plano Mensal Premium';
            if (subscription.plan_type === 'trimestral') return 'Plano Trimestral Premium'; 
            if (subscription.plan_type === 'semestral') return 'Plano Semestral Premium';
            if (subscription.plan_type === 'anual') return 'Plano Anual Premium';
            return 'Premium';
          }
          
          return cleaned;
        };

        return {
          ...subscription,
          // Se temos dados do Hotmart, limpar o nome, senão usar plan_type
          plan_display_name: subscription.hotmart_plan_name ? 
            cleanPlanName(subscription.hotmart_plan_name) : 
            `Plano ${subscription.plan_type}`,
          plan_price_display: subscription.hotmart_plan_price ? 
            `R$ ${parseFloat(subscription.hotmart_plan_price).toFixed(2).replace('.', ',')}` : 
            'N/A',
          plan_source: subscription.hotmart_plan_id ? 'Hotmart' : 'Sistema'
        };
      });
      
      res.json(processedSubscriptions);
    } catch (error: any) {
      console.error('Erro ao buscar assinaturas:', error);
      res.status(500).json({ message: 'Erro ao buscar assinaturas' });
    }
  });

  // SETUP COURSE TABLES ENDPOINT (one-time use)
  app.post('/api/admin/setup-course-tables', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      console.log('Criando tabelas de cursos...');

      // Criar enum para tipos de aula (se não existir)
      try {
        await pool.query(`CREATE TYPE lesson_type AS ENUM ('video', 'pdf', 'link', 'text');`);
        console.log('✓ Enum lesson_type criado');
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log('✓ Enum lesson_type já existe');
        } else {
          throw error;
        }
      }

      // Criar tabela courses
      await pool.query(`
        CREATE TABLE IF NOT EXISTS courses (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          short_description TEXT,
          cover_image TEXT,
          is_active BOOLEAN DEFAULT true NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      console.log('✓ Tabela courses criada');

      // Criar tabela course_modules
      await pool.query(`
        CREATE TABLE IF NOT EXISTS course_modules (
          id SERIAL PRIMARY KEY,
          course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          "order" INTEGER DEFAULT 0 NOT NULL,
          is_active BOOLEAN DEFAULT true NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      console.log('✓ Tabela course_modules criada');

      // Criar tabela course_lessons
      await pool.query(`
        CREATE TABLE IF NOT EXISTS course_lessons (
          id SERIAL PRIMARY KEY,
          module_id INTEGER NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          type lesson_type NOT NULL,
          content TEXT,
          "order" INTEGER DEFAULT 0 NOT NULL,
          is_active BOOLEAN DEFAULT true NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      console.log('✓ Tabela course_lessons criada');

      // Criar tabela course_enrollments
      await pool.query(`
        CREATE TABLE IF NOT EXISTS course_enrollments (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          enrolled_at TIMESTAMP DEFAULT NOW() NOT NULL,
          is_active BOOLEAN DEFAULT true NOT NULL,
          UNIQUE(user_id, course_id)
        );
      `);
      console.log('✓ Tabela course_enrollments criada');

      // Criar tabela course_progress
      await pool.query(`
        CREATE TABLE IF NOT EXISTS course_progress (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          lesson_id INTEGER NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
          is_completed BOOLEAN DEFAULT false NOT NULL,
          completed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          UNIQUE(user_id, lesson_id)
        );
      `);
      console.log('✓ Tabela course_progress criada');

      // Criar índices para melhor performance
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON course_modules(course_id);
        CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON course_lessons(module_id);
        CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON course_enrollments(user_id);
        CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
        CREATE INDEX IF NOT EXISTS idx_course_progress_user_id ON course_progress(user_id);
        CREATE INDEX IF NOT EXISTS idx_course_progress_lesson_id ON course_progress(lesson_id);
      `);
      console.log('✓ Índices criados');

      // Verificar se já existe curso de exemplo
      const existingCourse = await pool.query('SELECT id FROM courses LIMIT 1');
      
      if (existingCourse.rows.length === 0) {
        // Inserir dados de exemplo
        const courseResult = await pool.query(`
          INSERT INTO courses (title, description, short_description, cover_image, is_active)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id;
        `, [
          'Kit de Mídias para Estética',
          'Curso completo com modelos de alta qualidade para redes sociais, incluindo posts para Instagram, Stories e materiais para divulgação de clínicas estéticas.',
          'Modelos profissionais para redes sociais e marketing',
          'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&h=300&fit=crop',
          true
        ]);

        const courseId = courseResult.rows[0].id;
        console.log(`✓ Curso de exemplo criado com ID: ${courseId}`);

        // Criar módulos de exemplo
        const module1Result = await pool.query(`
          INSERT INTO course_modules (course_id, title, description, "order")
          VALUES ($1, $2, $3, $4)
          RETURNING id;
        `, [courseId, 'COMECE AQUI', 'Materiais introdutórios e orientações iniciais', 1]);

        const module2Result = await pool.query(`
          INSERT INTO course_modules (course_id, title, description, "order")
          VALUES ($1, $2, $3, $4)
          RETURNING id;
        `, [courseId, 'Grupo e Suporte VIP', 'Acesso ao grupo exclusivo e materiais de suporte', 2]);

        const module3Result = await pool.query(`
          INSERT INTO course_modules (course_id, title, description, "order")
          VALUES ($1, $2, $3, $4)
          RETURNING id;
        `, [courseId, 'Acesso às Artes', 'Biblioteca completa de artes e modelos', 3]);

        console.log('✓ Módulos de exemplo criados');

        // Criar aulas de exemplo
        const lessons = [
          {
            moduleId: module1Result.rows[0].id,
            title: 'Boas-vindas ao curso',
            description: 'Vídeo de apresentação e orientações iniciais',
            type: 'video',
            content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            order: 1
          },
          {
            moduleId: module1Result.rows[0].id,
            title: 'Como usar os materiais',
            description: 'Guia em PDF sobre como utilizar os materiais do curso',
            type: 'pdf',
            content: 'https://example.com/guia-uso.pdf',
            order: 2
          },
          {
            moduleId: module2Result.rows[0].id,
            title: 'Link do Grupo VIP',
            description: 'Acesse o grupo exclusivo no WhatsApp',
            type: 'link',
            content: 'https://chat.whatsapp.com/exemplo',
            order: 1
          },
          {
            moduleId: module3Result.rows[0].id,
            title: 'Biblioteca de Posts',
            description: 'Acesso aos posts para Instagram e Facebook',
            type: 'link',
            content: 'https://drive.google.com/drive/folders/exemplo',
            order: 1
          },
          {
            moduleId: module3Result.rows[0].id,
            title: 'Biblioteca de Stories',
            description: 'Modelos de Stories para Instagram',
            type: 'link',
            content: 'https://drive.google.com/drive/folders/exemplo-stories',
            order: 2
          }
        ];

        for (const lesson of lessons) {
          await pool.query(`
            INSERT INTO course_lessons (module_id, title, description, type, content, "order")
            VALUES ($1, $2, $3, $4, $5, $6);
          `, [lesson.moduleId, lesson.title, lesson.description, lesson.type, lesson.content, lesson.order]);
        }

        console.log('✓ Aulas de exemplo criadas');
      } else {
        console.log('✓ Dados de exemplo já existem');
      }

      console.log('🎉 Sistema de cursos configurado com sucesso!');
      
      res.json({ 
        success: true, 
        message: 'Sistema de cursos configurado com sucesso!' 
      });
    } catch (error: any) {
      console.error('Erro ao configurar sistema de cursos:', error);
      res.status(500).json({ 
        message: 'Erro ao configurar sistema de cursos',
        error: error.message 
      });
    }
  });

  // COURSES API ENDPOINTS
  
  // Admin course management
  app.get('/api/admin/courses', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const query = `
        SELECT 
          c.id,
          c.title,
          c.description,
          c.short_description as "shortDescription",
          c.cover_image as "coverImage",
          c.is_active as "isActive",
          c.created_at as "createdAt",
          COUNT(DISTINCT m.id) as "moduleCount",
          COUNT(DISTINCT l.id) as "lessonCount",
          COUNT(DISTINCT ce.id) as "enrollmentCount"
        FROM courses c
        LEFT JOIN modules m ON c.id = m.course_id
        LEFT JOIN lessons l ON m.id = l.module_id
        LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.is_active = true
        GROUP BY c.id, c.title, c.description, c.short_description, c.cover_image, c.is_active, c.created_at
        ORDER BY c.created_at DESC
      `;
      
      const result = await pool.query(query);
      res.json(result.rows || []);
    } catch (error: any) {
      console.error('Erro ao buscar cursos:', error);
      res.status(500).json({ message: 'Erro ao buscar cursos' });
    }
  });

  app.post('/api/admin/courses', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const { title, description, shortDescription, coverImage, isActive } = req.body;
      
      const query = `
        INSERT INTO courses (title, description, short_description, cover_image, is_active)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const result = await pool.query(query, [title, description, shortDescription, coverImage, isActive]);
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao criar curso:', error);
      res.status(500).json({ message: 'Erro ao criar curso' });
    }
  });

  app.put('/api/admin/courses/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // Build dynamic query based on provided fields
      const updateFields = [];
      const queryParams = [];
      let paramIndex = 1;
      
      if (updates.title !== undefined) {
        updateFields.push(`title = $${paramIndex}`);
        queryParams.push(updates.title);
        paramIndex++;
      }
      
      if (updates.description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        queryParams.push(updates.description);
        paramIndex++;
      }
      
      if (updates.shortDescription !== undefined) {
        updateFields.push(`short_description = $${paramIndex}`);
        queryParams.push(updates.shortDescription);
        paramIndex++;
      }
      
      if (updates.coverImage !== undefined) {
        updateFields.push(`cover_image = $${paramIndex}`);
        queryParams.push(updates.coverImage);
        paramIndex++;
      }
      
      if (updates.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex}`);
        queryParams.push(updates.isActive);
        paramIndex++;
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({ message: 'Nenhum campo para atualizar' });
      }
      
      updateFields.push(`updated_at = NOW()`);
      queryParams.push(id);
      
      const query = `
        UPDATE courses 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await pool.query(query, queryParams);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Curso não encontrado' });
      }
      
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao atualizar curso:', error);
      res.status(500).json({ message: 'Erro ao atualizar curso' });
    }
  });

  app.delete('/api/admin/courses/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      
      // Verificar se o curso existe
      const checkQuery = 'SELECT id FROM courses WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Curso não encontrado' });
      }
      
      // Deletar curso (cascade vai remover módulos, aulas e matrículas)
      const deleteQuery = 'DELETE FROM courses WHERE id = $1';
      await pool.query(deleteQuery, [id]);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Erro ao excluir curso:', error);
      res.status(500).json({ message: 'Erro ao excluir curso' });
    }
  });

  // Module management routes
  app.get('/api/admin/courses/:courseId/modules', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const courseId = parseInt(req.params.courseId);
      
      const query = `
        SELECT 
          m.id, 
          m.course_id as "courseId", 
          m.title, 
          m.description, 
          m.order_index as "orderIndex",
          COUNT(l.id) as "lessonCount",
          COALESCE(
            json_agg(
              json_build_object(
                'id', l.id,
                'moduleId', l.module_id,
                'title', l.title,
                'description', l.description,
                'content', l.content,
                'type', l.type,
                'orderIndex', l.order_index,
                'isPublished', true
              ) ORDER BY l.order_index, l.id
            ) FILTER (WHERE l.id IS NOT NULL),
            '[]'::json
          ) as lessons
        FROM modules m
        LEFT JOIN lessons l ON m.id = l.module_id
        WHERE m.course_id = $1
        GROUP BY m.id, m.course_id, m.title, m.description, m.order_index
        ORDER BY m.order_index, m.id
      `;
      
      const result = await pool.query(query, [courseId]);
      res.json(result.rows.map(row => ({
        ...row,
        lessonCount: parseInt(row.lessonCount),
        lessons: row.lessons || []
      })));
    } catch (error: any) {
      console.error('Erro ao buscar módulos:', error);
      res.status(500).json({ message: 'Erro ao buscar módulos' });
    }
  });

  app.post('/api/admin/courses/:courseId/modules', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const courseId = parseInt(req.params.courseId);
      const { title, description } = req.body;
      
      // Get next order index
      const orderQuery = 'SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM modules WHERE course_id = $1';
      const orderResult = await pool.query(orderQuery, [courseId]);
      const orderIndex = orderResult.rows[0].next_order;
      
      const query = `
        INSERT INTO modules (course_id, title, description, order_index)
        VALUES ($1, $2, $3, $4)
        RETURNING id, course_id as "courseId", title, description, order_index as "orderIndex"
      `;
      
      const result = await pool.query(query, [courseId, title, description, orderIndex]);
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao criar módulo:', error);
      res.status(500).json({ message: 'Erro ao criar módulo' });
    }
  });

  app.put('/api/admin/modules/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      const { title, description } = req.body;
      
      const query = `
        UPDATE modules 
        SET title = $1, description = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING id, course_id as "courseId", title, description, order_index as "orderIndex"
      `;
      
      const result = await pool.query(query, [title, description, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Módulo não encontrado' });
      }
      
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao atualizar módulo:', error);
      res.status(500).json({ message: 'Erro ao atualizar módulo' });
    }
  });

  app.delete('/api/admin/modules/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      
      // Verificar se o módulo existe
      const checkQuery = 'SELECT id FROM modules WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Módulo não encontrado' });
      }
      
      // Deletar módulo (cascade vai remover aulas e progresso)
      const deleteQuery = 'DELETE FROM modules WHERE id = $1';
      await pool.query(deleteQuery, [id]);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Erro ao excluir módulo:', error);
      res.status(500).json({ message: 'Erro ao excluir módulo' });
    }
  });

  // Get single course for admin
  app.get('/api/admin/courses/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      
      const query = `
        SELECT id, title, description, cover_image as "coverImage", is_active as "isActive", created_at as "createdAt"
        FROM courses 
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Curso não encontrado' });
      }
      
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao buscar curso:', error);
      res.status(500).json({ message: 'Erro ao buscar curso' });
    }
  });

  // Lesson management routes

  app.post('/api/admin/modules/:moduleId/lessons', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const moduleId = parseInt(req.params.moduleId);
      const { title, description, content, type } = req.body;
      
      // Get next order index
      const orderQuery = 'SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM lessons WHERE module_id = $1';
      const orderResult = await pool.query(orderQuery, [moduleId]);
      const orderIndex = orderResult.rows[0].next_order;
      
      const query = `
        INSERT INTO lessons (module_id, title, description, content, type, order_index)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, module_id as "moduleId", title, description, content, type, order_index as "orderIndex"
      `;
      
      const result = await pool.query(query, [moduleId, title, description || '', content || '', type || 'video', orderIndex]);
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao criar aula:', error);
      res.status(500).json({ message: 'Erro ao criar aula' });
    }
  });

  app.put('/api/admin/lessons/:id', upload.any(), async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      const { title, description, content, type, videoPlatform, isPremium, extraMaterials: existingMaterialsUpdate } = req.body;
      
      // Log the request to understand what's being sent
      console.log('📝 Update request body:', { title, description, hasContent: !!content, type, videoPlatform, isPremium, hasExtraMaterials: !!existingMaterialsUpdate });
      console.log('📁 Existing materials update:', existingMaterialsUpdate);
      const files = req.files as Express.Multer.File[];
      
      console.log('📁 Files received:', files?.map(f => ({ name: f.fieldname, original: f.originalname, type: f.mimetype })));
      
      // First, add missing columns if they don't exist
      try {
        await pool.query('ALTER TABLE lessons ADD COLUMN IF NOT EXISTS cover_image TEXT');
        await pool.query('ALTER TABLE lessons ADD COLUMN IF NOT EXISTS extra_materials JSONB DEFAULT \'[]\'');
        await pool.query('ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_platform VARCHAR(50) DEFAULT \'youtube\'');
        await pool.query('ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false');
      } catch (alterError: any) {
        console.log('Columns might already exist:', alterError.message);
      }

      let coverImageUrl = null;
      let materialsToUpdate: any[] = [];

      // Upload cover image to Supabase if provided
      const coverFile = files?.find(f => f.fieldname === 'coverImage');
      if (coverFile) {
        let processedBuffer = coverFile.buffer;
        
        // Converter imagem para WebP se for uma imagem
        if (coverFile.mimetype.startsWith('image/')) {
          try {
            const sharp = await import('sharp');
            processedBuffer = await sharp.default(coverFile.buffer)
              .webp({ quality: 80 })
              .resize(800, 600, { 
                fit: 'inside',
                withoutEnlargement: true 
              })
              .toBuffer();
          } catch (sharpError: any) {
            console.warn('Sharp não disponível, usando imagem original:', sharpError.message);
          }
        }
        
        const coverFileName = `lesson_cover_${id}_${Date.now()}.webp`;
        
        const { data: coverData, error: coverError } = await supabase.storage
          .from('lesson-covers')
          .upload(coverFileName, processedBuffer, {
            contentType: 'image/webp',
          });

        if (coverError) {
          console.error('Erro ao fazer upload da capa:', coverError);
        } else {
          const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/"/g, '') || '';
          coverImageUrl = `${supabaseUrl}/storage/v1/object/public/lesson-covers/${coverFileName}`;
        }
      }

      // Upload extra materials
      const materialFiles = files?.filter(f => f.fieldname === 'extraMaterials' || f.fieldname.startsWith('extraMaterial_')) || [];
      for (let i = 0; i < materialFiles.length; i++) {
        const materialFile = materialFiles[i];
        const extension = materialFile.originalname.split('.').pop() || 'bin';
        const materialFileName = `lesson_${id}_material_${i}_${Date.now()}.${extension}`;
        
        const { data: materialData, error: materialError } = await supabase.storage
          .from('lesson-materials')
          .upload(materialFileName, materialFile.buffer, {
            contentType: materialFile.mimetype,
          });

        if (materialError) {
          console.error('Erro ao fazer upload do material:', materialError);
        } else {
          const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/"/g, '') || '';
          const fileUrl = `${supabaseUrl}/storage/v1/object/public/lesson-materials/${materialFileName}`;
          // Fix encoding issues with filename
          const cleanFileName = Buffer.from(materialFile.originalname, 'latin1').toString('utf8');
          
          materialsToUpdate.push({
            name: cleanFileName,
            url: fileUrl,
            type: materialFile.mimetype,
            size: materialFile.size
          });
        }
      }

      // Build dynamic update query
      const updateFields = ['updated_at = NOW()'];
      const updateValues = [];
      let paramCount = 1;

      if (title) {
        updateFields.push(`title = $${paramCount}`);
        updateValues.push(title);
        paramCount++;
      }

      if (description !== undefined) {
        updateFields.push(`description = $${paramCount}`);
        updateValues.push(description);
        paramCount++;
      }

      if (content !== undefined) {
        updateFields.push(`content = $${paramCount}`);
        updateValues.push(content);
        paramCount++;
      }

      if (type) {
        updateFields.push(`type = $${paramCount}`);
        updateValues.push(type);
        paramCount++;
      }

      if (videoPlatform) {
        updateFields.push(`video_platform = $${paramCount}`);
        updateValues.push(videoPlatform);
        paramCount++;
      }

      if (isPremium !== undefined) {
        updateFields.push(`is_premium = $${paramCount}`);
        updateValues.push(isPremium === 'true');
        paramCount++;
      }

      if (coverImageUrl) {
        updateFields.push(`cover_image = $${paramCount}`);
        updateValues.push(coverImageUrl);
        paramCount++;
      }

      // Handle materials update
      const hasNewUploads = materialsToUpdate.length > 0;
      const hasExistingUpdate = existingMaterialsUpdate !== undefined && existingMaterialsUpdate !== null;
      
      if (hasExistingUpdate || hasNewUploads) {
        let finalMaterials = [];
        
        if (hasExistingUpdate) {
          // This is a removal/update request - use the filtered materials as-is
          try {
            const parsedMaterials = typeof existingMaterialsUpdate === 'string' 
              ? JSON.parse(existingMaterialsUpdate) 
              : existingMaterialsUpdate;
            finalMaterials = Array.isArray(parsedMaterials) ? parsedMaterials : [];
            console.log('🗑️ Materials update (removal):', finalMaterials);
          } catch (e) {
            console.warn('Error parsing existing materials update:', e);
            finalMaterials = [];
          }
        } else {
          // This is just adding new materials - get current ones first
          try {
            const currentLessonQuery = `SELECT extra_materials FROM lessons WHERE id = $1`;
            const currentResult = await pool.query(currentLessonQuery, [id]);
            if (currentResult.rows[0]?.extra_materials) {
              const currentMaterials = currentResult.rows[0].extra_materials;
              finalMaterials = Array.isArray(currentMaterials) 
                ? currentMaterials 
                : JSON.parse(currentMaterials);
              console.log('📁 Current materials from DB:', finalMaterials);
            }
          } catch (e) {
            console.warn('Error getting current materials:', e);
            finalMaterials = [];
          }
        }
        
        // Add new materials to existing ones
        if (hasNewUploads) {
          finalMaterials = finalMaterials.concat(materialsToUpdate);
          console.log('➕ Adding new materials:', materialsToUpdate);
          console.log('📋 Final materials list:', finalMaterials);
        }
        
        updateFields.push(`extra_materials = $${paramCount}`);
        updateValues.push(JSON.stringify(finalMaterials));
        paramCount++;
      }

      updateValues.push(id);

      const query = `
        UPDATE lessons 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, module_id as "moduleId", title, description, content, type, order_index as "orderIndex", 
                  cover_image as "coverImage", extra_materials as "extraMaterials", video_platform as "videoPlatform", is_premium as "isPremium"
      `;
      
      const result = await pool.query(query, updateValues);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Aula não encontrada' });
      }
      
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao atualizar aula:', error);
      res.status(500).json({ message: 'Erro ao atualizar aula' });
    }
  });

  app.delete('/api/admin/lessons/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      
      // Verificar se a aula existe
      const checkQuery = 'SELECT id FROM lessons WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Aula não encontrada' });
      }
      
      // Deletar aula
      const deleteQuery = 'DELETE FROM lessons WHERE id = $1';
      await pool.query(deleteQuery, [id]);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Erro ao excluir aula:', error);
      res.status(500).json({ message: 'Erro ao excluir aula' });
    }
  });

  // Get single lesson
  app.get('/api/admin/lessons/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const id = parseInt(req.params.id);
      
      const query = `
        SELECT 
          l.id, 
          l.module_id as "moduleId", 
          l.title, 
          l.description, 
          l.content, 
          l.type, 
          l.order_index as "orderIndex",
          l.created_at as "createdAt",
          l.updated_at as "updatedAt",
          l.extra_materials as "extraMaterials",
          l.cover_image as "coverImage",
          l.video_platform as "videoPlatform",
          l.is_premium as "isPremium",
          m.course_id as "courseId"
        FROM lessons l
        JOIN modules m ON l.module_id = m.id
        WHERE l.id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Aula não encontrada' });
      }
      
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao buscar aula:', error);
      res.status(500).json({ message: 'Erro ao buscar aula' });
    }
  });

  // Get course with full structure for lesson viewing
  app.get('/api/courses/:id/full', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const courseId = parseInt(req.params.id);
      
      // Buscar curso
      const courseQuery = `
        SELECT id, title, description, cover_image as "coverImage"
        FROM courses 
        WHERE id = $1
      `;
      const courseResult = await pool.query(courseQuery, [courseId]);
      
      if (courseResult.rows.length === 0) {
        return res.status(404).json({ message: 'Curso não encontrado' });
      }
      
      const course = courseResult.rows[0];
      
      // Buscar módulos
      const modulesQuery = `
        SELECT id, title, order_index as "orderIndex"
        FROM modules 
        WHERE course_id = $1 
        ORDER BY order_index
      `;
      const modulesResult = await pool.query(modulesQuery, [courseId]);
      
      // Buscar aulas para cada módulo
      const modules = [];
      for (const module of modulesResult.rows) {
        const lessonsQuery = `
          SELECT 
            id, 
            title, 
            description, 
            content, 
            type, 
            duration,
            extra_materials,
            order_index as "orderIndex"
          FROM lessons 
          WHERE module_id = $1 
          ORDER BY order_index
        `;
        const lessonsResult = await pool.query(lessonsQuery, [module.id]);
        
        const lessonsWithFiles = lessonsResult.rows.map(lesson => ({
          ...lesson,
          files: lesson.extra_materials || []
        }));
        
        modules.push({
          ...module,
          lessons: lessonsWithFiles
        });
      }
      
      console.log('✅ Curso completo encontrado:', {
        courseId: course.id,
        title: course.title,
        modulesCount: modules.length,
        lessonsCount: modules.reduce((acc, m) => acc + m.lessons.length, 0)
      });
      
      res.json({
        ...course,
        modules
      });
    } catch (error: any) {
      console.error('Erro ao buscar curso completo:', error);
      res.status(500).json({ message: 'Erro ao buscar curso' });
    }
  });



  // Get single lesson for student view
  app.get('/api/lessons/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const lessonId = parseInt(req.params.id);
      
      const query = `
        SELECT 
          id, 
          module_id as "moduleId", 
          title, 
          description, 
          content, 
          type, 
          duration,
          extra_materials,
          order_index as "orderIndex"
        FROM lessons 
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [lessonId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Aula não encontrada' });
      }
      
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao buscar aula:', error);
      res.status(500).json({ message: 'Erro ao buscar aula' });
    }
  });

  // Rota para primeira aula do curso
  app.get('/api/courses/:courseId/first-lesson', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const courseId = parseInt(req.params.courseId);
      
      // Buscar primeira aula do primeiro módulo do curso
      const query = `
        SELECT 
          l.id as lesson_id,
          l.title,
          l.module_id,
          m.title as module_title,
          c.title as course_title
        FROM lessons l
        JOIN modules m ON l.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        WHERE c.id = $1
        ORDER BY m.order_index ASC, l.order_index ASC
        LIMIT 1
      `;
      
      const result = await pool.query(query, [courseId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Nenhuma aula encontrada para este curso' });
      }
      
      const firstLesson = result.rows[0];
      console.log('🎯 Primeira aula encontrada:', firstLesson);
      
      res.json({
        courseId,
        lessonId: firstLesson.lesson_id,
        redirectUrl: `/cursos/${courseId}/aula/${firstLesson.lesson_id}`
      });
    } catch (error: any) {
      console.error('Erro ao buscar primeira aula:', error);
      res.status(500).json({ message: 'Erro ao buscar primeira aula' });
    }
  });

  // Criar módulo
  app.post('/api/admin/courses/:courseId/modules', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const courseId = parseInt(req.params.courseId);
      const { title, description = '', orderIndex = 1 } = req.body;
      
      if (!title) {
        return res.status(400).json({ message: 'Título é obrigatório' });
      }

      const result = await pool.query(`
        INSERT INTO modules (course_id, title, description, order_index) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, course_id as "courseId", title, description, order_index as "orderIndex"
      `, [courseId, title, description, orderIndex]);

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao criar módulo:', error);
      res.status(500).json({ message: 'Erro ao criar módulo' });
    }
  });

  // Reorder modules
  app.put('/api/admin/courses/:courseId/modules/reorder', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const courseId = parseInt(req.params.courseId);
      const { moduleIds } = req.body;
      
      if (!Array.isArray(moduleIds)) {
        return res.status(400).json({ message: 'moduleIds deve ser um array' });
      }

      // Update order index for each module
      for (let i = 0; i < moduleIds.length; i++) {
        await pool.query(
          'UPDATE modules SET order_index = $1 WHERE id = $2 AND course_id = $3',
          [i + 1, moduleIds[i], courseId]
        );
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Erro ao reordenar módulos:', error);
      res.status(500).json({ message: 'Erro ao reordenar módulos' });
    }
  });

  // Reorder lessons
  app.put('/api/admin/modules/:moduleId/lessons/reorder', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const moduleId = parseInt(req.params.moduleId);
      const { lessonIds } = req.body;
      
      if (!Array.isArray(lessonIds)) {
        return res.status(400).json({ message: 'lessonIds deve ser um array' });
      }

      // Update order index for each lesson
      for (let i = 0; i < lessonIds.length; i++) {
        await pool.query(
          'UPDATE lessons SET order_index = $1 WHERE id = $2 AND module_id = $3',
          [i + 1, lessonIds[i], moduleId]
        );
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Erro ao reordenar aulas:', error);
      res.status(500).json({ message: 'Erro ao reordenar aulas' });
    }
  });

  // Excluir módulo
  app.delete('/api/admin/modules/:moduleId', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const moduleId = parseInt(req.params.moduleId);
      
      // Primeiro excluir todas as aulas do módulo
      await pool.query('DELETE FROM lessons WHERE module_id = $1', [moduleId]);
      
      // Depois excluir o módulo
      const result = await pool.query('DELETE FROM modules WHERE id = $1 RETURNING *', [moduleId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Módulo não encontrado' });
      }

      res.json({ success: true, message: 'Módulo excluído com sucesso' });
    } catch (error: any) {
      console.error('Erro ao excluir módulo:', error);
      res.status(500).json({ message: 'Erro ao excluir módulo' });
    }
  });

  // Duplicar módulo
  app.post('/api/admin/modules/:moduleId/duplicate', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const moduleId = parseInt(req.params.moduleId);
      
      // Buscar módulo original
      const moduleResult = await pool.query(`
        SELECT * FROM modules WHERE id = $1
      `, [moduleId]);
      
      if (moduleResult.rows.length === 0) {
        return res.status(404).json({ message: 'Módulo não encontrado' });
      }
      
      const originalModule = moduleResult.rows[0];
      
      // Criar novo módulo
      const newModuleResult = await pool.query(`
        INSERT INTO modules (course_id, title, description, order_index) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, course_id as "courseId", title, description, order_index as "orderIndex"
      `, [
        originalModule.course_id, 
        originalModule.title + ' (Cópia)', 
        originalModule.description, 
        originalModule.order_index + 1
      ]);
      
      const newModule = newModuleResult.rows[0];
      
      // Buscar aulas do módulo original
      const lessonsResult = await pool.query(`
        SELECT * FROM lessons WHERE module_id = $1 ORDER BY order_index
      `, [moduleId]);
      
      // Duplicar aulas
      for (const lesson of lessonsResult.rows) {
        await pool.query(`
          INSERT INTO lessons (module_id, title, description, content, type, duration, extra_materials, order_index) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          newModule.id,
          lesson.title + ' (Cópia)',
          lesson.description,
          lesson.content,
          lesson.type,
          lesson.duration,
          lesson.extra_materials,
          lesson.order_index
        ]);
      }

      res.status(201).json(newModule);
    } catch (error: any) {
      console.error('Erro ao duplicar módulo:', error);
      res.status(500).json({ message: 'Erro ao duplicar módulo' });
    }
  });

  // Excluir aula
  app.delete('/api/admin/lessons/:lessonId', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const lessonId = parseInt(req.params.lessonId);
      
      const result = await pool.query('DELETE FROM lessons WHERE id = $1 RETURNING *', [lessonId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Aula não encontrada' });
      }

      res.json({ success: true, message: 'Aula excluída com sucesso' });
    } catch (error: any) {
      console.error('Erro ao excluir aula:', error);
      res.status(500).json({ message: 'Erro ao excluir aula' });
    }
  });

  // Duplicar aula
  app.post('/api/admin/lessons/:lessonId/duplicate', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const lessonId = parseInt(req.params.lessonId);
      
      // Buscar aula original
      const lessonResult = await pool.query(`
        SELECT * FROM lessons WHERE id = $1
      `, [lessonId]);
      
      if (lessonResult.rows.length === 0) {
        return res.status(404).json({ message: 'Aula não encontrada' });
      }
      
      const originalLesson = lessonResult.rows[0];
      
      // Criar nova aula
      const newLessonResult = await pool.query(`
        INSERT INTO lessons (module_id, title, description, content, type, duration, extra_materials, order_index) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING id, module_id as "moduleId", title, description, content, type, duration, order_index as "orderIndex"
      `, [
        originalLesson.module_id,
        originalLesson.title + ' (Cópia)',
        originalLesson.description,
        originalLesson.content,
        originalLesson.type,
        originalLesson.duration,
        originalLesson.extra_materials,
        originalLesson.order_index + 1
      ]);

      res.status(201).json(newLessonResult.rows[0]);
    } catch (error: any) {
      console.error('Erro ao duplicar aula:', error);
      res.status(500).json({ message: 'Erro ao duplicar aula' });
    }
  });

  // Mover aula para outro módulo
  app.put('/api/admin/lessons/:lessonId/move', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const lessonId = parseInt(req.params.lessonId);
      const { newModuleId, newPosition } = req.body;
      
      if (!newModuleId || !newPosition) {
        return res.status(400).json({ message: 'newModuleId e newPosition são obrigatórios' });
      }

      // Verificar se a aula existe
      const lessonCheck = await pool.query('SELECT * FROM lessons WHERE id = $1', [lessonId]);
      if (lessonCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Aula não encontrada' });
      }

      // Verificar se o módulo de destino existe
      const moduleCheck = await pool.query('SELECT * FROM modules WHERE id = $1', [newModuleId]);
      if (moduleCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Módulo de destino não encontrado' });
      }

      // Ajustar order_index das aulas no módulo de destino para abrir espaço
      await pool.query(`
        UPDATE lessons 
        SET order_index = order_index + 1 
        WHERE module_id = $1 AND order_index >= $2
      `, [newModuleId, newPosition]);

      // Mover a aula para o novo módulo e posição
      const result = await pool.query(`
        UPDATE lessons 
        SET module_id = $1, order_index = $2 
        WHERE id = $3 
        RETURNING id, module_id as "moduleId", title, description, content, type, duration, order_index as "orderIndex"
      `, [newModuleId, newPosition, lessonId]);

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao mover aula:', error);
      res.status(500).json({ message: 'Erro ao mover aula' });
    }
  });

  // User course access
  app.get('/api/courses', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const userId = req.user.id;
      const isPremium = req.user.tipo === 'premium' && req.user.active === true;
      
      console.log(`[USER COURSES] User ${userId}: tipo=${req.user.tipo}, active=${req.user.active}, isPremium=${isPremium}`);
      
      const query = `
        SELECT 
          c.id,
          c.title,
          c.description,
          c.short_description as "shortDescription",
          c.cover_image as "coverImage",
          c.is_active as "isActive",
          c.created_at as "createdAt",
          COUNT(DISTINCT m.id) as "moduleCount",
          COUNT(DISTINCT l.id) as "lessonCount",
          CASE 
            WHEN $2 = true OR ce.id IS NOT NULL THEN true 
            ELSE false 
          END as "hasAccess",
          COALESCE(
            CASE 
              WHEN COUNT(DISTINCT l.id) = 0 THEN 0
              ELSE (COUNT(DISTINCT cp.id) * 100.0 / COUNT(DISTINCT l.id))
            END, 0
          ) as progress
        FROM courses c
        LEFT JOIN modules m ON c.id = m.course_id
        LEFT JOIN lessons l ON m.id = l.module_id
        LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.user_id = $1 AND ce.is_active = true
        LEFT JOIN course_progress cp ON l.id = cp.lesson_id AND cp.user_id = $1 AND cp.is_completed = true
        WHERE c.is_active = true
        GROUP BY c.id, c.title, c.description, c.short_description, c.cover_image, c.is_active, c.created_at, ce.id
        ORDER BY c.created_at DESC
      `;
      
      const result = await pool.query(query, [userId, isPremium]);
      
      console.log(`[USER COURSES] Found ${result.rows.length} courses, user has access to ${result.rows.filter((c: any) => c.hasAccess).length}`);
      
      res.json(result.rows || []);
    } catch (error: any) {
      console.error('Erro ao buscar cursos do usuário:', error);
      res.status(500).json({ message: 'Erro ao buscar cursos' });
    }
  });

  app.get('/api/courses/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const courseId = parseInt(req.params.id);
      const userId = req.user.id;
      const isPremium = req.user.tipo === 'premium' && req.user.active === true;
      
      console.log(`[COURSE ACCESS] User ${userId}: tipo=${req.user.tipo}, active=${req.user.active}, isPremium=${isPremium}`);
      
      // Buscar curso com módulos e aulas
      const courseQuery = `
        SELECT 
          c.*,
          CASE 
            WHEN $3 = true OR ce.id IS NOT NULL THEN true 
            ELSE false 
          END as "hasAccess"
        FROM courses c
        LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.user_id = $2 AND ce.is_active = true
        WHERE c.id = $1 AND c.is_active = true
      `;
      
      const courseResult = await pool.query(courseQuery, [courseId, userId, isPremium]);
      
      if (courseResult.rows.length === 0) {
        return res.status(404).json({ message: 'Curso não encontrado' });
      }
      
      const course = courseResult.rows[0];
      
      if (!course.hasAccess) {
        return res.json({ ...course, modules: [] });
      }
      
      // Buscar módulos com aulas e progresso
      const modulesQuery = `
        SELECT 
          cm.*,
          json_agg(
            json_build_object(
              'id', cl.id,
              'moduleId', cl.module_id,
              'title', cl.title,
              'description', cl.description,
              'type', cl.type,
              'content', cl.content,
              'order', cl.order,
              'isActive', cl.is_active,
              'createdAt', cl.created_at,
              'isCompleted', COALESCE(cp.is_completed, false)
            ) ORDER BY cl.order, cl.created_at
          ) FILTER (WHERE cl.id IS NOT NULL) as lessons
        FROM course_modules cm
        LEFT JOIN course_lessons cl ON cm.id = cl.module_id AND cl.is_active = true
        LEFT JOIN course_progress cp ON cl.id = cp.lesson_id AND cp.user_id = $2
        WHERE cm.course_id = $1 AND cm.is_active = true
        GROUP BY cm.id
        ORDER BY cm.order, cm.created_at
      `;
      
      const modulesResult = await pool.query(modulesQuery, [courseId, userId]);
      
      // Calcular progresso total
      const totalLessons = modulesResult.rows.reduce((acc, module) => 
        acc + (module.lessons ? module.lessons.length : 0), 0
      );
      const completedLessons = modulesResult.rows.reduce((acc, module) => 
        acc + (module.lessons ? module.lessons.filter((l: any) => l.isCompleted).length : 0), 0
      );
      const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
      
      res.json({
        ...course,
        modules: modulesResult.rows.map(module => ({
          ...module,
          lessons: module.lessons || []
        })),
        progress
      });
    } catch (error: any) {
      console.error('Erro ao buscar detalhes do curso:', error);
      res.status(500).json({ message: 'Erro ao buscar curso' });
    }
  });

  app.post('/api/course-progress', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const userId = req.user.id;
      const { lessonId, isCompleted } = req.body;
      
      const query = `
        INSERT INTO course_progress (user_id, lesson_id, is_completed, completed_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, lesson_id) 
        DO UPDATE SET 
          is_completed = $3,
          completed_at = CASE WHEN $3 = true THEN NOW() ELSE NULL END
        RETURNING *
      `;
      
      const completedAt = isCompleted ? new Date() : null;
      const result = await pool.query(query, [userId, lessonId, isCompleted, completedAt]);
      
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao salvar progresso:', error);
      res.status(500).json({ message: 'Erro ao salvar progresso' });
    }
  });

  // Rotas para avaliações das aulas
  app.post("/api/lessons/:id/rating", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Não autorizado' });
      }

      const lessonId = parseInt(req.params.id);
      const { rating } = req.body;
      const userId = req.user.id;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Avaliação deve ser entre 1 e 5' });
      }

      // Verificar se já existe avaliação do usuário para esta aula
      const existing = await pool.query(`
        SELECT id FROM lesson_ratings 
        WHERE lesson_id = $1 AND user_id = $2
      `, [lessonId, userId]);

      if (existing.rows.length > 0) {
        // Atualizar avaliação existente
        await pool.query(`
          UPDATE lesson_ratings 
          SET rating = $1, updated_at = CURRENT_TIMESTAMP 
          WHERE lesson_id = $2 AND user_id = $3
        `, [rating, lessonId, userId]);
      } else {
        // Criar nova avaliação
        await pool.query(`
          INSERT INTO lesson_ratings (lesson_id, user_id, rating)
          VALUES ($1, $2, $3)
        `, [lessonId, userId, rating]);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Erro ao salvar avaliação:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Buscar avaliação média da aula
  app.get("/api/lessons/:id/rating", async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);

      const result = await pool.query(`
        SELECT 
          COALESCE(AVG(rating), 0) as average_rating,
          COUNT(rating) as rating_count
        FROM lesson_ratings 
        WHERE lesson_id = $1
      `, [lessonId]);

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao buscar avaliação:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Rotas para comentários das aulas
  app.post("/api/lessons/:id/comments", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Não autorizado' });
      }

      const lessonId = parseInt(req.params.id);
      const { comment } = req.body;
      const userId = req.user.id;

      if (!comment || comment.trim().length === 0) {
        return res.status(400).json({ message: 'Comentário não pode estar vazio' });
      }

      const result = await pool.query(`
        INSERT INTO lesson_comments (lesson_id, user_id, comment)
        VALUES ($1, $2, $3)
        RETURNING id, created_at
      `, [lessonId, userId, comment.trim()]);

      res.json({ 
        id: result.rows[0].id,
        createdAt: result.rows[0].created_at,
        success: true 
      });
    } catch (error: any) {
      console.error('Erro ao salvar comentário:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Buscar comentários da aula
  app.get("/api/lessons/:id/comments", async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);

      const result = await pool.query(`
        SELECT 
          lc.id,
          lc.comment,
          lc.created_at,
          u.username,
          u.profile_image
        FROM lesson_comments lc
        JOIN users u ON lc.user_id = u.id
        WHERE lc.lesson_id = $1
        ORDER BY lc.created_at DESC
      `, [lessonId]);

      res.json(result.rows);
    } catch (error: any) {
      console.error('Erro ao buscar comentários:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // === ROTAS PARA INVESTIMENTOS EM TRÁFEGO ===
  
  // Buscar investimentos em tráfego
  app.get('/api/admin/traffic-investments', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const { startDate, endDate, limit } = req.query;
      
      let query = 'SELECT * FROM traffic_investments';
      const params: any[] = [];
      const conditions: string[] = [];
      
      if (startDate) {
        conditions.push('date >= $' + (params.length + 1));
        params.push(startDate);
      }
      
      if (endDate) {
        conditions.push('date <= $' + (params.length + 1));
        params.push(endDate);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY date DESC';
      
      if (limit) {
        query += ' LIMIT $' + (params.length + 1);
        params.push(parseInt(limit as string));
      }

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Erro ao buscar investimentos em tráfego:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Criar novo investimento em tráfego
  app.post('/api/admin/traffic-investments', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const { date, amount, description, utm_campaign } = req.body;
      
      if (!date || !amount) {
        return res.status(400).json({ message: 'Data e valor são obrigatórios' });
      }

      const result = await pool.query(`
        INSERT INTO traffic_investments (date, amount, description, utm_campaign)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [date, amount, description || null, utm_campaign || null]);

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao criar investimento em tráfego:', error);
      if (error.code === '23505') { // Violação de constraint único
        res.status(400).json({ message: 'Já existe um investimento para esta data' });
      } else {
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  });

  // Atualizar investimento em tráfego
  app.put('/api/admin/traffic-investments/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const { id } = req.params;
      const { date, amount, description, utm_campaign } = req.body;
      
      if (!date || !amount) {
        return res.status(400).json({ message: 'Data e valor são obrigatórios' });
      }

      const result = await pool.query(`
        UPDATE traffic_investments 
        SET date = $1, amount = $2, description = $3, utm_campaign = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *
      `, [date, amount, description || null, utm_campaign || null, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Investimento não encontrado' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao atualizar investimento em tráfego:', error);
      if (error.code === '23505') {
        res.status(400).json({ message: 'Já existe um investimento para esta data' });
      } else {
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  });

  // Deletar investimento em tráfego
  app.delete('/api/admin/traffic-investments/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const { id } = req.params;

      const result = await pool.query(`
        DELETE FROM traffic_investments 
        WHERE id = $1
        RETURNING *
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Investimento não encontrado' });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Erro ao deletar investimento em tráfego:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Buscar estatísticas de investimentos em tráfego
  app.get('/api/admin/traffic-investments/stats', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const { startDate, endDate } = req.query;
      
      let query = `
        SELECT 
          COALESCE(SUM(amount), 0) as total_investment,
          COALESCE(AVG(amount), 0) as avg_daily_investment,
          COUNT(*) as total_days
        FROM traffic_investments
      `;
      const params: any[] = [];
      const conditions: string[] = [];
      
      if (startDate) {
        conditions.push('date >= $' + (params.length + 1));
        params.push(startDate);
      }
      
      if (endDate) {
        conditions.push('date <= $' + (params.length + 1));
        params.push(endDate);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      const result = await pool.query(query, params);
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas de investimentos:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Estatísticas por UTM Campaign
  app.get('/api/admin/traffic-investments/utm-stats', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const { startDate, endDate } = req.query;
      
      let query = `
        SELECT 
          utm_campaign,
          COALESCE(SUM(amount), 0) as total_investment,
          COUNT(*) as total_entries,
          COALESCE(AVG(amount), 0) as avg_investment
        FROM traffic_investments
        WHERE utm_campaign IS NOT NULL AND utm_campaign != ''
      `;
      const params: any[] = [];
      
      if (startDate) {
        query += ' AND date >= $' + (params.length + 1);
        params.push(startDate);
      }
      
      if (endDate) {
        query += ' AND date <= $' + (params.length + 1);
        params.push(endDate);
      }
      
      query += ' GROUP BY utm_campaign ORDER BY total_investment DESC';

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas por UTM:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // =============================================================================
  // TOOLS ROUTES
  // =============================================================================

  // Get all tools with categories
  app.get('/api/tools', async (req, res) => {
    try {
      const { category } = req.query;
      
      let query = `
        SELECT 
          t.*,
          tc.name as category_name,
          tc.description as category_description
        FROM tools t
        LEFT JOIN tool_categories tc ON t.category_id = tc.id
        WHERE t.is_active = true
      `;
      
      const params: any[] = [];
      
      if (category) {
        query += ' AND tc.name = $1';
        params.push(category);
      }
      
      query += ' ORDER BY t.is_new DESC, t.created_at DESC';
      
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Erro ao buscar ferramentas:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Get all tool categories
  app.get('/api/tool-categories', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT tc.*, COUNT(t.id) as tools_count
        FROM tool_categories tc
        LEFT JOIN tools t ON tc.id = t.category_id AND t.is_active = true
        WHERE tc.is_active = true
        GROUP BY tc.id
        ORDER BY tc.name
      `);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Erro ao buscar categorias de ferramentas:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // =============================================================================
  // ADMIN TOOLS ROUTES
  // =============================================================================

  // Get all tools for admin (including inactive)
  app.get('/api/admin/tools', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          t.*,
          tc.name as category_name,
          tc.description as category_description
        FROM tools t
        LEFT JOIN tool_categories tc ON t.category_id = tc.id
        ORDER BY t.created_at DESC
      `);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Erro ao buscar ferramentas (admin):', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Get all tool categories for admin (including inactive)
  app.get('/api/admin/tool-categories', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT tc.*, COUNT(t.id) as tools_count
        FROM tool_categories tc
        LEFT JOIN tools t ON tc.id = t.category_id
        GROUP BY tc.id
        ORDER BY tc.name
      `);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Erro ao buscar categorias de ferramentas (admin):', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Create new tool
  app.post('/api/admin/tools', upload.single('image'), async (req, res) => {
    try {
      const { name, description, url, categoryId, isNew } = req.body;
      let imageUrl = null;

      // Upload image if provided
      if (req.file) {
        const fileName = `tool_${Date.now()}_${req.file.originalname}`;
        
        const { data, error } = await supabase.storage
          .from('images')
          .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
          });

        if (error) {
          console.error('Erro no upload da imagem:', error);
        } else {
          const { data: publicData } = supabase.storage
            .from('images')
            .getPublicUrl(fileName);
          imageUrl = publicData.publicUrl;
        }
      }

      const result = await pool.query(`
        INSERT INTO tools (name, description, url, category_id, image_url, is_new)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [name, description, url, categoryId || null, imageUrl, isNew === 'true']);

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao criar ferramenta:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Update tool
  app.put('/api/admin/tools/:id', upload.single('image'), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, url, categoryId, isNew, isActive } = req.body;
      let imageUrl = req.body.imageUrl;

      // Upload new image if provided
      if (req.file) {
        const fileName = `tool_${Date.now()}_${req.file.originalname}`;
        
        const { data, error } = await supabase.storage
          .from('images')
          .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
          });

        if (error) {
          console.error('Erro no upload da imagem:', error);
        } else {
          const { data: publicData } = supabase.storage
            .from('images')
            .getPublicUrl(fileName);
          imageUrl = publicData.publicUrl;
        }
      }

      const result = await pool.query(`
        UPDATE tools 
        SET name = $1, description = $2, url = $3, category_id = $4, 
            image_url = $5, is_new = $6, is_active = $7, updated_at = NOW()
        WHERE id = $8
        RETURNING *
      `, [name, description, url, categoryId || null, imageUrl, isNew === 'true', isActive !== 'false', id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Ferramenta não encontrada' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao atualizar ferramenta:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Delete tool
  app.delete('/api/admin/tools/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await pool.query('DELETE FROM tools WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Ferramenta não encontrada' });
      }

      res.json({ message: 'Ferramenta excluída com sucesso' });
    } catch (error: any) {
      console.error('Erro ao excluir ferramenta:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Create new tool category
  app.post('/api/admin/tool-categories', async (req, res) => {
    try {
      const { name, description } = req.body;
      
      const result = await pool.query(`
        INSERT INTO tool_categories (name, description)
        VALUES ($1, $2)
        RETURNING *
      `, [name, description]);

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao criar categoria de ferramenta:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Update tool category
  app.put('/api/admin/tool-categories/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, isActive } = req.body;
      
      const result = await pool.query(`
        UPDATE tool_categories 
        SET name = $1, description = $2, is_active = $3, updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `, [name, description, isActive !== 'false', id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Categoria não encontrada' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao atualizar categoria de ferramenta:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Delete tool category
  app.delete('/api/admin/tool-categories/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if category has tools
      const toolsCheck = await pool.query('SELECT COUNT(*) FROM tools WHERE category_id = $1', [id]);
      
      if (parseInt(toolsCheck.rows[0].count) > 0) {
        return res.status(400).json({ message: 'Não é possível excluir categoria que possui ferramentas' });
      }
      
      const result = await pool.query('DELETE FROM tool_categories WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Categoria não encontrada' });
      }

      res.json({ message: 'Categoria excluída com sucesso' });
    } catch (error: any) {
      console.error('Erro ao excluir categoria de ferramenta:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // API endpoints para settings de personalização
  app.get('/api/settings', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT key, value, description 
        FROM settings 
        WHERE key IN ('logo_url', 'login_background_url')
        ORDER BY key
      `);

      res.json(result.rows);
    } catch (error: any) {
      console.error('Erro ao buscar configurações:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  app.post('/api/settings', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: 'Acesso negado - apenas administradores' });
      }

      const { key, value } = req.body;

      // Validar que a key é permitida
      if (!['logo_url', 'login_background_url'].includes(key)) {
        return res.status(400).json({ message: 'Chave de configuração não permitida' });
      }

      // Inserir ou atualizar a configuração
      const result = await pool.query(`
        INSERT INTO settings (key, value, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (key) 
        DO UPDATE SET value = $2, updated_at = NOW()
        RETURNING *
      `, [key, value]);

      console.log(`Configuração atualizada: ${key} = ${value}`);
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao atualizar configuração:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
