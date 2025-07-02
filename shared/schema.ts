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
  bio: text("bio"),
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
  valorOriginal: text("valor_original"), // Valor original antes do desconto (R$ XX,XX)
  porcentagemEconomia: text("porcentagem_economia"), // Porcentagem de economia (ex: "25%")
  isActive: boolean("is_active").default(true).notNull(),
  isPrincipal: boolean("is_principal").default(false), // Indica se é o plano principal
  isGratuito: boolean("is_gratuito").default(false), // Indica se é o plano gratuito
  codigoHotmart: text("codigo_hotmart").unique(), // Código do plano na Hotmart
  urlHotmart: text("url_hotmart"), // URL de checkout do Hotmart
  beneficios: text("beneficios"), // Lista de benefícios, um por linha
  itensRestritos: text("itens_restritos"), // Lista de itens restritos, um por linha
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

// Courses schema
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  shortDescription: text("short_description"),
  coverImage: text("cover_image"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const coursesRelations = relations(courses, ({ many }) => ({
  modules: many(courseModules),
  enrollments: many(courseEnrollments),
}));

// Course modules schema
export const courseModules = pgTable("course_modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const courseModulesRelations = relations(courseModules, ({ one, many }) => ({
  course: one(courses, {
    fields: [courseModules.courseId],
    references: [courses.id],
  }),
  lessons: many(courseLessons),
}));

// Course lessons schema
export const lessonTypeEnum = pgEnum('lesson_type', ['video', 'pdf', 'link', 'text']);

export const courseLessons = pgTable("course_lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => courseModules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  type: lessonTypeEnum("type").notNull(),
  content: text("content"), // URL para vídeo/PDF ou conteúdo de texto
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const courseLessonsRelations = relations(courseLessons, ({ one, many }) => ({
  module: one(courseModules, {
    fields: [courseLessons.moduleId],
    references: [courseModules.id],
  }),
  progress: many(courseProgress),
}));

// Course enrollments (who has access to which courses)
export const courseEnrollments = pgTable("course_enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const courseEnrollmentsRelations = relations(courseEnrollments, ({ one }) => ({
  user: one(users, {
    fields: [courseEnrollments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [courseEnrollments.courseId],
    references: [courses.id],
  }),
}));

// Course progress tracking
export const courseProgress = pgTable("course_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonId: integer("lesson_id").notNull().references(() => courseLessons.id, { onDelete: "cascade" }),
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const lessonRatings = pgTable("lesson_ratings", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull(),
  userId: integer("user_id").notNull(),
  rating: integer("rating").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const lessonComments = pgTable("lesson_comments", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull(),
  userId: integer("user_id").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const courseProgressRelations = relations(courseProgress, ({ one }) => ({
  user: one(users, {
    fields: [courseProgress.userId],
    references: [users.id],
  }),
  lesson: one(courseLessons, {
    fields: [courseProgress.lessonId],
    references: [courseLessons.id],
  }),
}));

// Relations for lesson ratings and comments
export const lessonRatingsRelations = relations(lessonRatings, ({ one }) => ({
  user: one(users, {
    fields: [lessonRatings.userId],
    references: [users.id],
  }),
  lesson: one(courseLessons, {
    fields: [lessonRatings.lessonId],
    references: [courseLessons.id],
  }),
}));

export const lessonCommentsRelations = relations(lessonComments, ({ one }) => ({
  user: one(users, {
    fields: [lessonComments.userId],
    references: [users.id],
  }),
  lesson: one(courseLessons, {
    fields: [lessonComments.lessonId],
    references: [courseLessons.id],
  }),
}));

// Insert schemas
export const insertCourseSchema = createInsertSchema(courses);
export const insertCourseModuleSchema = createInsertSchema(courseModules);
export const insertCourseLessonSchema = createInsertSchema(courseLessons);
export const insertCourseEnrollmentSchema = createInsertSchema(courseEnrollments);
export const insertCourseProgressSchema = createInsertSchema(courseProgress);
export const insertLessonRatingSchema = createInsertSchema(lessonRatings);
export const insertLessonCommentSchema = createInsertSchema(lessonComments);

// Types
export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;
export type CourseModule = typeof courseModules.$inferSelect;
export type InsertCourseModule = typeof courseModules.$inferInsert;
export type CourseLesson = typeof courseLessons.$inferSelect;
export type InsertCourseLesson = typeof courseLessons.$inferInsert;
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type InsertCourseEnrollment = typeof courseEnrollments.$inferInsert;
export type CourseProgress = typeof courseProgress.$inferSelect;
export type InsertCourseProgress = typeof courseProgress.$inferInsert;
export type LessonRating = typeof lessonRatings.$inferSelect;
export type InsertLessonRating = typeof lessonRatings.$inferInsert;
export type LessonComment = typeof lessonComments.$inferSelect;
export type InsertLessonComment = typeof lessonComments.$inferInsert;

// Platform logo storage
export const platformLogo = pgTable("platform_logo", {
  id: serial("id").primaryKey(),
  imageData: text("image_data").notNull(), // Base64 encoded image
  mimeType: text("mime_type").notNull(),
  filename: text("filename").notNull(),
  size: integer("size").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export type PlatformLogo = typeof platformLogo.$inferSelect;
export type InsertPlatformLogo = typeof platformLogo.$inferInsert;

// Tools categories schema
export const toolCategories = pgTable("tool_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tools schema
export const tools = pgTable("tools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  categoryId: integer("category_id").references(() => toolCategories.id, { onDelete: "set null" }),
  imageUrl: text("image_url"),
  isNew: boolean("is_new").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const toolsRelations = relations(tools, ({ one }) => ({
  category: one(toolCategories, {
    fields: [tools.categoryId],
    references: [toolCategories.id],
  }),
}));

export const toolCategoriesRelations = relations(toolCategories, ({ many }) => ({
  tools: many(tools),
}));

// Tool schemas for form validation
export const insertToolCategorySchema = createInsertSchema(toolCategories)
  .pick({
    name: true,
    description: true,
    isActive: true,
  });

export const insertToolSchema = createInsertSchema(tools)
  .pick({
    name: true,
    description: true,
    url: true,
    categoryId: true,
    imageUrl: true,
    isNew: true,
    isActive: true,
  });

export type ToolCategory = typeof toolCategories.$inferSelect;
export type InsertToolCategory = typeof toolCategories.$inferInsert;
export type Tool = typeof tools.$inferSelect;
export type InsertTool = typeof tools.$inferInsert;
