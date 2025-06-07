import { pgTable, text, serial, integer, boolean, timestamp, foreignKey, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User schema
export const userTipoEnum = pgEnum('user_tipo', ['free', 'premium']);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  telefone: text("telefone"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Campos para gerenciar assinantes
  tipo: userTipoEnum("tipo").default('free').notNull(),
  plano_id: text("plano_id"),
  data_vencimento: timestamp("data_vencimento"),
  active: boolean("active").default(false).notNull(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  favorites: many(favorites),
  userArtworks: many(userArtworks),
  plan: one(plans, {
    fields: [users.plano_id],
    references: [plans.codigoHotmart],
  }),
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
  userId: integer("user_id").references(() => users.id), // ID do usuário que criou
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
  // Campos do autor (para evitar consultas separadas)
  authorName: text("author_name"), // nome do usuário que criou
  authorProfileImage: text("author_profile_image"), // foto de perfil do autor
  authorType: text("author_type"), // tipo do usuário (free/premium)
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

// Tags para o sistema de SEO
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  count: integer("count").default(0), // contador de uso
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relacionamento Many-to-Many entre Posts e Tags
export const postTags = pgTable("post_tags", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tagsRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags)
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id],
  }),
  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id],
  })
}));

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  createdAt: true,
  count: true,
});

export const insertPostTagSchema = createInsertSchema(postTags).omit({
  id: true,
  createdAt: true,
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

export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;

export type InsertPostTag = z.infer<typeof insertPostTagSchema>;
export type PostTag = typeof postTags.$inferSelect;

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

// Planos para o painel administrativo
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  periodo: text("periodo").notNull(), // Mensal, Anual, etc.
  valor: text("valor").notNull(), // Formato monetário (R$ XX,XX)
  isActive: boolean("is_active").default(true).notNull(),
  isPrincipal: boolean("is_principal").default(false), // Indica se é o plano principal
  isGratuito: boolean("is_gratuito").default(false), // Indica se é o plano gratuito
  codigoHotmart: text("codigo_hotmart").unique(), // Código do plano na Hotmart
  urlHotmart: text("url_hotmart"), // URL de checkout do Hotmart
  beneficios: text("beneficios"), // Lista de benefícios, um por linha
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const plansRelations = relations(plans, ({ many }) => ({
  users: many(users)
}));

export const insertPlanSchema = createInsertSchema(plans).omit({
  id: true,
  createdAt: true,
});

export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type Plan = typeof plans.$inferSelect;

// Popup schema for marketing campaigns
export const popupTargetPageEnum = pgEnum('popup_target_page', ['home', 'categories', 'art', 'plans', 'all']);
export const popupUserTypeEnum = pgEnum('popup_user_type', ['free', 'premium', 'designers', 'admins', 'all']);
export const popupFrequencyEnum = pgEnum('popup_frequency', ['always', 'once_per_session', 'once_per_day', 'once_per_week']);
export const popupAnimationEnum = pgEnum('popup_animation', ['fade', 'slide', 'zoom', 'bounce']);
export const popupPositionEnum = pgEnum('popup_position', ['center', 'top', 'bottom', 'left', 'right']);
export const popupSizeEnum = pgEnum('popup_size', ['small', 'medium', 'large']);

export const popups = pgTable("popups", {
  id: serial("id").primaryKey(),
  title: text("title"),
  content: text("content"),
  imageUrl: text("image_url"),
  buttonText: text("button_text"),
  buttonUrl: text("button_url"),
  
  // Appearance settings
  backgroundColor: text("background_color").default("#ffffff"),
  textColor: text("text_color").default("#000000"),
  buttonColor: text("button_color").default("#1f4ed8"),
  buttonTextColor: text("button_text_color").default("#ffffff"),
  borderRadius: integer("border_radius").default(8),
  buttonWidth: text("button_width").default("auto"), // 'auto' or 'full'
  animation: popupAnimationEnum("animation").default("fade"),
  position: popupPositionEnum("position").default("center"),
  size: popupSizeEnum("size").default("medium"),
  delaySeconds: integer("delay_seconds").default(3),
  
  // Targeting settings
  targetPages: popupTargetPageEnum("target_pages").array().default(['all']),
  targetUserTypes: popupUserTypeEnum("target_user_types").array().default(['all']),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  frequency: popupFrequencyEnum("frequency").default("once_per_session"),
  
  // Status
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPopupSchema = createInsertSchema(popups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPopup = z.infer<typeof insertPopupSchema>;
export type Popup = typeof popups.$inferSelect;

// Settings schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;
