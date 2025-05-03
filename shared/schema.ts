import { pgTable, text, serial, integer, boolean, timestamp, foreignKey, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  favorites: many(favorites),
  userArtworks: many(userArtworks),
}));

// Extendemos o schema para incluir isAdmin para consistência com o código TypeScript
export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    email: true,
    password: true,
  })
  .extend({
    isAdmin: z.boolean().optional().default(false),
  });

// Artwork schema with different formats
export const artworks = pgTable("artworks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  format: text("format").notNull(), // square, portrait, stories
  isPro: boolean("is_pro").default(false),
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const artworksRelations = relations(artworks, ({ many }) => ({
  favorites: many(favorites),
  userArtworks: many(userArtworks),
}));

// Favorites table (for users to save artworks)
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  artworkId: integer("artwork_id").notNull().references(() => artworks.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  artwork: one(artworks, {
    fields: [favorites.artworkId],
    references: [artworks.id],
  }),
}));

// User-Artwork relationship (for tracking used artworks)
export const userArtworks = pgTable("user_artworks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  artworkId: integer("artwork_id").notNull().references(() => artworks.id),
  usedAt: timestamp("used_at").defaultNow().notNull(),
});

export const userArtworksRelations = relations(userArtworks, ({ one }) => ({
  user: one(users, {
    fields: [userArtworks.userId],
    references: [users.id],
  }),
  artwork: one(artworks, {
    fields: [userArtworks.artworkId],
    references: [artworks.id],
  }),
}));

export const insertArtworkSchema = createInsertSchema(artworks).omit({
  id: true,
  createdAt: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export const insertUserArtworkSchema = createInsertSchema(userArtworks).omit({
  id: true,
  usedAt: true,
});

// Categorias para o painel administrativo
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Enum para status de posts
export const postStatusEnum = pgEnum('post_status', ['aprovado', 'rascunho', 'rejeitado']);

// Posts/Postagens para o painel administrativo
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(), // título completo com formato para SEO
  tituloBase: text("titulo_base"), // título original sem formato
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  uniqueCode: text("unique_code").notNull().unique(), // código hash único
  categoryId: integer("category_id").references(() => categories.id),
  status: postStatusEnum("status").default('rascunho').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
  licenseType: text("license_type").default('free'), // premium ou free
  tags: text("tags").array(), // array de tags
  formato: text("formato"), // formato específico (feed, stories, cartaz)
  formats: text("formats").array(), // array de formatos (feed, stories, cartaz) - legado
  formatData: text("format_data"), // dados de formato em JSON
  formatoData: text("formato_data"), // novo campo em português para dados de formato em JSON
  canvaUrl: text("canva_url"), // URL do Canva específica para este formato
  groupId: text("group_id"), // ID para agrupar artes relacionadas (UUID)
  isVisible: boolean("is_visible").default(true).notNull(), // controle de visibilidade no feed
  isPro: boolean("is_pro").default(false), // campo is_pro para manter compatibilidade
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  posts: many(posts)
}));

export const postsRelations = relations(posts, ({ one }) => ({
  category: one(categories, {
    fields: [posts.categoryId],
    references: [categories.id],
  })
}));

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  publishedAt: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertArtwork = z.infer<typeof insertArtworkSchema>;
export type Artwork = typeof artworks.$inferSelect;

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

export type InsertUserArtwork = z.infer<typeof insertUserArtworkSchema>;
export type UserArtwork = typeof userArtworks.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
