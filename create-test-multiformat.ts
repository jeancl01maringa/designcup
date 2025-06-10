/**
 * Script para criar uma arte de teste com múltiplos formatos
 */

import { Pool } from '@neondatabase/serverless';
import crypto from 'crypto';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

async function createTestPost() {
  const groupId = crypto.randomUUID();
  const tituloBase = "Arte Multi-Formato Teste";
  
  const formatos = [
    {
      tipo: "Feed",
      imageUrl: "https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/uploads/1749587969399_atualiza__o_est_tica_10_jpg",
      canvaUrl: "https://www.canva.com/design/DAGja9C7R0w/feed-link",
    },
    {
      tipo: "Stories", 
      imageUrl: "https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/uploads/1749587430763_atualiza__o_est_tica_05_jpg",
      canvaUrl: "https://www.canva.com/design/DAGpl23o_80/stories-link",
    },
    {
      tipo: "Cartaz",
      imageUrl: "https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/uploads/1749587969399_atualiza__o_est_tica_10_jpg", 
      canvaUrl: "https://www.canva.com/design/cartaz-link",
    }
  ];
  
  console.log(`🔄 Criando grupo ${groupId} com ${formatos.length} formatos...`);
  
  for (const formato of formatos) {
    const uniqueCode = `test-${formato.tipo}-${Date.now()}`;
    const title = `${tituloBase} - ${formato.tipo}`;
    
    const postData = [
      title, // title
      tituloBase, // titulo_base
      `Teste para formato ${formato.tipo}`, // description
      formato.imageUrl, // image_url
      uniqueCode, // unique_code
      4, // category_id (Botox)
      3, // user_id (Jean Carlos)
      'aprovado', // status
      formato.tipo, // formato
      JSON.stringify({
        formato: formato.tipo,
        imageUrl: formato.imageUrl,
        canvaUrl: formato.canvaUrl
      }), // format_data
      formato.canvaUrl, // canva_url
      groupId, // group_id
      'free', // license_type
      false, // is_pro
      true // is_visible
    ];
    
    try {
      const result = await pool.query(`
        INSERT INTO posts (
          title, titulo_base, description, image_url, unique_code, 
          category_id, user_id, status, formato, format_data, 
          canva_url, group_id, license_type, is_pro, is_visible
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        ) RETURNING id
      `, postData);
      
      console.log(`✅ Criado formato ${formato.tipo} - ID: ${result.rows[0].id}`);
      
    } catch (error) {
      console.error(`❌ Erro ao criar formato ${formato.tipo}:`, error);
    }
  }
  
  console.log(`\n📦 Grupo criado: ${groupId}`);
  console.log(`🔗 Acesse: http://localhost:5000/admin para ver no painel`);
  
  return groupId;
}

createTestPost().then(() => {
  console.log('✅ Teste concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
});