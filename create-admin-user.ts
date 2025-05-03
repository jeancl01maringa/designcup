import { db } from "./server/db";
import { users } from "./shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq, or } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  try {
    // Verificar se o usuário admin já existe
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, "admin@example.com"),
          eq(users.username, "testadmin")
        )
      );

    if (existingAdmin) {
      console.log("Um usuário admin já existe:", existingAdmin);
      
      // Atualize a senha do usuário existente
      const hashedPassword = await hashPassword("password123");
      await db
        .update(users)
        .set({ 
          password: hashedPassword 
        })
        .where(eq(users.id, existingAdmin.id));
      
      console.log("Senha do admin atualizada com sucesso");
    } else {
      // Criar novo usuário admin
      const hashedPassword = await hashPassword("password123");
      const [admin] = await db
        .insert(users)
        .values({
          username: "testadmin",
          email: "admin@example.com",
          password: hashedPassword,
          is_admin: true,
          created_at: new Date(),
        })
        .returning();

      console.log("Novo admin criado:", admin);
    }

    // Verificar usuário atual jean.maringa@hotmail.com
    const [jeanUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, "jean.maringa@hotmail.com"));

    if (jeanUser) {
      const hashedPassword = await hashPassword("admin123");
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, jeanUser.id));
      
      console.log("Senha do usuário jean.maringa@hotmail.com atualizada");
    }

    console.log("Processo concluído com sucesso!");
  } catch (error) {
    console.error("Erro ao criar/atualizar usuário admin:", error);
  } finally {
    process.exit(0);
  }
}

createAdminUser();