import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core'

export const authUser = pgTable('auth_user', {
  id:            text('id').primaryKey(),
  name:          text('name').notNull(),
  email:         text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image:         text('image'),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull(),
  trialEndsAt:   timestamp('trial_ends_at', { withTimezone: true }),
})

export const authSession = pgTable('auth_session', {
  id:        text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId:    text('user_id').notNull().references(() => authUser.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
})

export const authAccount = pgTable('auth_account', {
  id:           text('id').primaryKey(),
  accountId:    text('account_id').notNull(),
  providerId:   text('provider_id').notNull(),
  userId:       text('user_id').notNull().references(() => authUser.id, { onDelete: 'cascade' }),
  accessToken:  text('access_token'),
  refreshToken: text('refresh_token'),
  idToken:      text('id_token'),
  expiresAt:    timestamp('expires_at', { withTimezone: true }),
  password:     text('password'),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull(),
})

export const authVerification = pgTable('auth_verification', {
  id:         text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value:      text('value').notNull(),
  expiresAt:  timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt:  timestamp('created_at', { withTimezone: true }),
  updatedAt:  timestamp('updated_at', { withTimezone: true }),
})
