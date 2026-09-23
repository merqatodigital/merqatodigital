import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const siteSettings = sqliteTable('site_settings', { id: integer('id').primaryKey(), payload: text('payload').notNull(), updatedAt: text('updated_at').notNull() });
export const users = sqliteTable('users', { id: text('id').primaryKey(), email: text('email').notNull().unique(), role: text('role').notNull(), salt: text('salt').notNull(), passwordHash: text('password_hash').notNull(), createdAt: text('created_at').notNull() });
export const sessions = sqliteTable('sessions', { tokenHash: text('token_hash').primaryKey(), userId: text('user_id').notNull(), expiresAt: integer('expires_at').notNull() });
export const media = sqliteTable('media', { id: text('id').primaryKey(), filename: text('filename').notNull(), contentType: text('content_type').notNull(), size: integer('size').notNull(), kind: text('kind').notNull(), createdAt: text('created_at').notNull() });
export const loginAttempts = sqliteTable('login_attempts', { email: text('email').primaryKey(), failures: integer('failures').notNull(), windowStart: integer('window_start').notNull() });
