import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

// Blog Posts Table
export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImage: text("cover_image"),
  images: text("images"), // JSON array of image URLs (max 5)
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  tags: text("tags"), // JSON string array
  published: integer("published", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
}, (table) => ([
  index("idx_posts_published").on(table.published, table.createdAt),
]));

// Comments Table
export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  postSlug: text("post_slug").notNull(),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email"),
  authorAvatar: text("author_avatar"),
  content: text("content").notNull(),
  parentId: text("parent_id"), // For nested comments
  status: text("status").default("approved"), // approved, spam (auto-approve now)
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
}, (table) => ([
  index("idx_comments_post").on(table.postSlug, table.createdAt),
  index("idx_comments_status").on(table.status),
]));

// Post Likes Table
export const postLikes = sqliteTable("post_likes", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull(),
  userId: text("user_id"), // anonymous user identifier (IP or session)
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
}, (table) => ([
  index("idx_post_likes_post").on(table.postId),
  index("idx_post_likes_user_post").on(table.userId, table.postId),
]));

// Reactions Table (optional - for likes, etc.)
export const reactions = sqliteTable("reactions", {
  id: text("id").primaryKey(),
  commentId: text("comment_id").notNull(),
  userId: text("user_id"),
  type: text("type").notNull(), // like, love, thinking
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// Users Table (simple admin only)
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").default("admin"), // admin
  avatar: text("avatar"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// Resources Table (admin-uploaded files for users)
export const resources = sqliteTable("resources", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  publicId: text("public_id").notNull(),
  category: text("category").default("general"),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
}, (table) => ([
  index("idx_resources_category").on(table.category, table.createdAt),
]));

// Type exports
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type PostLike = typeof postLikes.$inferSelect;
export type NewPostLike = typeof postLikes.$inferInsert;
export type Reaction = typeof reactions.$inferSelect;
export type User = typeof users.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
