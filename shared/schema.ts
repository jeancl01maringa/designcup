import { pgTable, text, serial, integer, boolean, timestamp, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  favorites: many(favorites),
  userArtworks: many(userArtworks),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertArtwork = z.infer<typeof insertArtworkSchema>;
export type Artwork = typeof artworks.$inferSelect;

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

export type InsertUserArtwork = z.infer<typeof insertUserArtworkSchema>;
export type UserArtwork = typeof userArtworks.$inferSelect;
