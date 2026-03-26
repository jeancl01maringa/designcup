import { pool } from './server/db.js';

async function run() {
    const res = await pool.query("SELECT payload FROM webhook_logs WHERE provider = 'greenn' ORDER BY id DESC LIMIT 1");
    console.dir(res.rows[0]?.payload, { depth: null });
    process.exit(0);
}
run();
