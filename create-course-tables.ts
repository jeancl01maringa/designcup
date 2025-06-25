/**
 * Script para criar as tabelas de cursos no banco de dados
 * 
 * Para executar: npx tsx create-course-tables.ts
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createCourseTables() {
  try {
    console.log('Criando tabelas de cursos...');

    // Criar enum para tipos de aula
    await pool.query(`
      CREATE TYPE lesson_type AS ENUM ('video', 'pdf', 'link', 'text');
    `);
    console.log('✓ Enum lesson_type criado');

    // Criar tabela courses
    await pool.query(`
      CREATE TABLE courses (
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
      CREATE TABLE course_modules (
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
      CREATE TABLE course_lessons (
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
      CREATE TABLE course_enrollments (
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
      CREATE TABLE course_progress (
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
      CREATE INDEX idx_course_modules_course_id ON course_modules(course_id);
      CREATE INDEX idx_course_lessons_module_id ON course_lessons(module_id);
      CREATE INDEX idx_course_enrollments_user_id ON course_enrollments(user_id);
      CREATE INDEX idx_course_enrollments_course_id ON course_enrollments(course_id);
      CREATE INDEX idx_course_progress_user_id ON course_progress(user_id);
      CREATE INDEX idx_course_progress_lesson_id ON course_progress(lesson_id);
    `);
    console.log('✓ Índices criados');

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

    console.log('\n🎉 Sistema de cursos criado com sucesso!');
    console.log('Você pode acessar:');
    console.log('- Painel admin: /admin/cursos');
    console.log('- Área do usuário: /cursos');
    
  } catch (error: any) {
    console.error('Erro ao criar tabelas de cursos:', error);
    
    // Se o erro for que o tipo já existe, continuar
    if (error.message?.includes('already exists')) {
      console.log('Algumas estruturas já existem, continuando...');
    } else {
      throw error;
    }
  } finally {
    await pool.end();
  }
}

createCourseTables().catch(console.error);