import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage, ensureTagTablesExist, ensureHotmartFieldsExist } from "./storage";
import { setupSupabaseTables, migrateLocalDataToSupabase } from "./supabase";
import { db } from "./db";
import path from "path";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Servir arquivos de logos estaticamente
app.use('/logos', express.static(path.join(process.cwd(), 'public', 'logos')));

// Health check endpoint — Digital Ocean usa isso para saber se o servidor está vivo
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database with sample data
  try {
    const isOfflineMode = process.env.VITE_SUPABASE_URL?.includes("dummy") || process.env.SUPABASE_URL?.includes("dummy");

    if (isOfflineMode) {
      log('Running in offline mode (dummy credentials detected). Skipping database initialization.');
    } else {
      // Check if storage has seedDatabase method (DatabaseStorage)
      if ('seedDatabase' in storage) {
        try {
          log('Initializing database with sample data...');
          await (storage as any).seedDatabase();
          log('Database initialized successfully');
        } catch (seedErr: any) {
          log(`⚠️ seedDatabase falhou (servidor continua): ${seedErr?.message}`);
        }
      }

      // Verificar e criar tabelas de tags
      try {
        log('Verificando e criando tabelas de tags...');
        await ensureTagTablesExist();
      } catch (tagErr: any) {
        log(`⚠️ ensureTagTablesExist falhou (servidor continua): ${tagErr?.message}`);
      }

      // Verificar e adicionar campos do Hotmart na tabela subscriptions
      try {
        log('Verificando campos do Hotmart na tabela subscriptions...');
        await ensureHotmartFieldsExist();
      } catch (hotmartErr: any) {
        log(`⚠️ ensureHotmartFieldsExist falhou (servidor continua): ${hotmartErr?.message}`);
      }
    }
  } catch (error) {
    log(`Error initializing database: ${error}`);
  }

  const server = await registerRoutes(app);

  // Error handler global do Express
  // IMPORTANTE: NÃO re-lançar o erro (throw err) senão o processo inteiro morre!
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error(`❌ Express error handler: [${status}] ${message}`);
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
    // NÃO fazer throw err aqui! Isso crashava o servidor inteiro.
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();

// Proteção contra crash por exceção não capturada
process.on('uncaughtException', (err) => {
  console.error('🔥 uncaughtException (servidor NÃO vai morrer):', err?.message || err);
});

