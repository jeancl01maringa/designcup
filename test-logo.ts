import 'dotenv/config';
import { pool } from './server/db';

async function testLogo() {
    try {
        console.log("Testando busca de logo...");
        const result = await pool.query(`
      SELECT image_data, mime_type, filename 
      FROM platform_logo 
      ORDER BY uploaded_at DESC 
      LIMIT 1
    `);
        console.log("SUCESSO: Resposta do logo:", result.rowCount);
        process.exit(0);
    } catch (err) {
        console.error("ERRO AO BUSCAR LOGO:");
        console.error(err);
        process.exit(1);
    }
}

testLogo();
