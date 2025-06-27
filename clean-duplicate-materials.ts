/**
 * Script para limpar materiais duplicados das aulas
 * 
 * Para executar: npx tsx clean-duplicate-materials.ts
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function cleanDuplicateMaterials() {
  try {
    console.log('🧹 Limpando materiais duplicados...');
    
    // Buscar aulas com materiais extras
    const lessonsQuery = `
      SELECT id, title, extra_materials 
      FROM lessons 
      WHERE extra_materials IS NOT NULL AND extra_materials != '[]'
    `;
    
    const result = await pool.query(lessonsQuery);
    
    for (const lesson of result.rows) {
      console.log(`\n📚 Aula ${lesson.id}: ${lesson.title}`);
      
      let materials = lesson.extra_materials;
      if (typeof materials === 'string') {
        try {
          materials = JSON.parse(materials);
        } catch (e) {
          console.warn('  ⚠️ Erro ao fazer parse dos materiais');
          continue;
        }
      }
      
      if (Array.isArray(materials) && materials.length > 0) {
        console.log(`  📄 Materiais encontrados: ${materials.length}`);
        
        // Corrigir nomes com encoding e remover duplicados
        const cleanedMaterials = materials.map(material => ({
          ...material,
          name: material.name.replace(/Ã§Ã£o/g, 'ção').replace(/Ã£/g, 'ã').replace(/Ã§/g, 'ç')
        }));
        
        // Remover duplicados baseado no nome do arquivo (após correção)
        const uniqueMaterials = cleanedMaterials.filter((material, index, self) => 
          index === self.findIndex(m => m.name === material.name)
        );
        
        if (uniqueMaterials.length !== materials.length) {
          console.log(`  🔧 Removendo ${materials.length - uniqueMaterials.length} duplicados`);
          
          // Atualizar no banco
          const updateQuery = `
            UPDATE lessons 
            SET extra_materials = $1 
            WHERE id = $2
          `;
          
          await pool.query(updateQuery, [JSON.stringify(uniqueMaterials), lesson.id]);
          console.log(`  ✅ Aula ${lesson.id} atualizada`);
        } else {
          console.log(`  ✅ Nenhum duplicado encontrado`);
        }
        
        // Mostrar materiais finais
        console.log('  📋 Materiais únicos:');
        uniqueMaterials.forEach((material, index) => {
          console.log(`    ${index + 1}. ${material.name}`);
        });
      }
    }
    
    console.log('\n🎉 Limpeza concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  } finally {
    await pool.end();
  }
}

cleanDuplicateMaterials();