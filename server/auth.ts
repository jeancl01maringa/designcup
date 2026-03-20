import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import FileStore from "session-file-store";
import { pool } from "./db";
import BrevoService from "./services/brevo-service";

const PostgresSessionStore = connectPg(session);
const FileStoreSession = FileStore(session);

declare global {
  namespace Express {
    interface User extends SelectUser { }
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    console.log("Comparando senha fornecida com hash armazenado");
    console.log("Hash armazenado:", stored);

    // Verifica se o formato é válido (hash.salt)
    if (!stored || !stored.includes(".")) {
      console.log("Formato de senha inválido no banco de dados");
      return false;
    }

    const [hashed, salt] = stored.split(".");

    if (!hashed || !salt) {
      console.log("Hash ou salt ausentes no formato da senha");
      return false;
    }

    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;

    const result = timingSafeEqual(hashedBuf, suppliedBuf);
    console.log("Resultado da comparação:", result ? "Senha corresponde" : "Senha não corresponde");

    return result;
  } catch (error) {
    console.error("Erro ao comparar senhas:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  // Add FileStore fallback for offline mode
  const isOfflineMode = process.env.VITE_SUPABASE_URL?.includes("dummy") || process.env.SUPABASE_URL?.includes("dummy");
  const store = isOfflineMode
    ? new FileStoreSession({ path: './.sessions_mock', ttl: 86400 * 30 })
    : new PostgresSessionStore({ pool, createTableIfMissing: true });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "design-para-estetica-secret",
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password',
    }, async (email, password, done) => {
      try {
        console.log("Tentativa de login com email:", email);

        // Mock Admin User para testes offline (Bypass) *ANTES* de tentar o DB
        if (email === "admin@designcup.com.br" && password === "admin123") {
          console.log("Login de Admin Offline bem-sucedido!");
          return done(null, {
            id: 9999,
            email: "admin@designcup.com.br",
            username: "Admin Local",
            password: "",
            isAdmin: true,
            tipo: "premium",
            whatsapp: "0000000000",
            profileImage: null,
            plano_id: 2,
            resetPasswordToken: null,
            resetPasswordExpires: null
          } as any);
        }

        let user;
        try {
          user = await storage.getUserByEmail(email);
        } catch (e) {
          console.error("Erro ao conectar no banco no login:", e);
          return done(null, false, { message: "Erro de conexão offline" });
        }

        if (!user) {
          console.log("Usuário não encontrado com o email:", email);
          return done(null, false, { message: "Credenciais inválidas" });
        }

        const passwordMatch = await comparePasswords(password, user.password);
        console.log("Verificação de senha:", passwordMatch ? "Sucesso" : "Falha");

        if (!passwordMatch) {
          return done(null, false, { message: "Credenciais inválidas" });
        }

        console.log("Login bem-sucedido para:", email);
        return done(null, user);
      } catch (err) {
        console.error("Erro na autenticação:", err);
        return done(err);
      }
    }),
  );

  // Session cache for users to reduce database hits
  const userCache = new Map<number, { user: any; timestamp: number }>();
  const CACHE_DURATION = 30 * 1000; // Reduzido para 30 segundos para evitar dados desatualizados

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      // Suporte ao usuário offline
      if (id === 9999) {
        const adminUser = {
          id: 9999,
          email: "admin@designcup.com.br",
          username: "Admin Local",
          password: "",
          isAdmin: true,
          tipo: "premium",
          whatsapp: "0000000000",
          profileImage: null,
          plano_id: 2
        };
        userCache.set(id, { user: adminUser, timestamp: Date.now() });
        return done(null, adminUser as any);
      }

      let user;
      try {
        user = await storage.getUser(id);
      } catch (e) {
        console.error("Erro ao conectar no banco no deserializeUser:", e);
        // Retornar falso mas não falhar a aplicação inteira
        return done(null, false);
      }

      if (!user) {
        console.warn(`Usuário com ID ${id} não encontrado. Invalidando sessão.`);
        // Limpar cache do usuário
        userCache.delete(id);
        return done(null, false);
      }

      const userWithAdmin = {
        ...user,
        isAdmin: Boolean(user.isAdmin)
      };

      // Atualizar cache com dados frescos
      userCache.set(id, { user: userWithAdmin, timestamp: Date.now() });

      done(null, userWithAdmin);
    } catch (err) {
      console.error("PASSPORT deserializeUser - Erro:", err);
      done(err, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, username, whatsapp } = req.body;

      if (!email || !password || !username) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }

      const user = await storage.createUser({
        username,
        email,
        password: await hashPassword(password),
        whatsapp: whatsapp || null,
        isAdmin: false, // Por padrão, novos usuários não são administradores
      });

      // Enviar email de boas-vindas para novos usuários usando Template ID #2
      try {
        await BrevoService.enviarEmailTemplate(email, username, 2, {
          nome: username,
          email: email
        });
        await BrevoService.adicionarContato(email, username, [1]); // Lista ID 1 para novos usuários
        console.log('📧 Email de boas-vindas enviado via Template ID #2 para:', email);

        // Notificar administrador sobre novo usuário
        await BrevoService.notificarNovoUsuario('jean.maringa@hotmail.com', username, email);
        console.log('📧 Notificação enviada ao administrador sobre novo usuário');
      } catch (emailError) {
        console.log('⚠️ Erro ao enviar email de boas-vindas:', emailError);
        // Não falha o registro se o email falhar
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error: any) {
      console.error("Erro no registro:", error);

      // Tratar erros específicos de constraint
      if (error?.code === '23505') {
        if (error.constraint === 'users_email_unique') {
          return res.status(400).json({ message: "Email já cadastrado" });
        }
      }

      res.status(500).json({ message: "Erro ao registrar o usuário" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: { message?: string }) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Credenciais inválidas" });
      }
      req.login(user, (err) => {
        if (err) return next(err);

        // Garantir que isAdmin esteja presente no objeto de resposta e remover a senha
        const responseUser = {
          ...user,
          isAdmin: Boolean(user.isAdmin), // Converter para booleano
          password: undefined // Remover a senha do objeto de resposta por segurança
        };

        // Debug para verificar o que está sendo retornado no login
        console.log("LOGIN responseUser:", JSON.stringify(responseUser));

        res.status(200).json(responseUser);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autenticado" });

    try {
      const userId = req.user.id;

      // Adicionado bypass do mock offline para o refresh não quebrar (500 Error) 
      if (userId === 9999) {
        return res.json(req.user);
      }

      // Buscar dados atualizados diretamente do banco para evitar cache desatualizado
      const freshUser = await storage.getUser(userId);

      if (!freshUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Invalidar cache do usuário para forçar dados atualizados
      userCache.delete(userId);

      const safeUser = {
        ...freshUser,
        isAdmin: Boolean(freshUser.isAdmin),
        password: undefined // Remover a senha por segurança
      };

      console.log("USER DATA ATUALIZADO:", JSON.stringify(safeUser));

      res.json(safeUser);
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
}