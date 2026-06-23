import { pgTable, uuid, text, numeric, integer, timestamp, date, customType, index } from 'drizzle-orm/pg-core'
import { authUser } from './auth-schema'

const bytea = customType<{ data: Buffer; default: false }>({
  dataType() { return 'bytea' },
})

export const reports = pgTable('reports', {
  id:         uuid('id').primaryKey().defaultRandom(),
  userId:     text('user_id').notNull().references(() => authUser.id, { onDelete: 'cascade' }),
  clientName: text('client_name').notNull(),
  scope:      text('scope'),
  startDate:  date('start_date'),
  endDate:    date('end_date'),
  testerName: text('tester_name'),
  status:     text('status').default('draft').notNull(),
  createdAt:  timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const findings = pgTable('findings', {
  id:             uuid('id').primaryKey().defaultRandom(),
  reportId:       uuid('report_id').notNull(),
  title:          text('title').notNull(),
  description:    text('description'),
  cvssScore:      numeric('cvss_score', { precision: 3, scale: 1 }),
  severity:       text('severity'),
  impact:         text('impact'),
  recommendation: text('recommendation'),
  evidence:       text('evidence'),
  affectedComponent: text('affected_component'),
  sortOrder:      integer('sort_order').default(0),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const subscriptions = pgTable('subscriptions', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  userId:               text('user_id').notNull().unique().references(() => authUser.id, { onDelete: 'cascade' }),
  stripeCustomerId:     text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  status:               text('status'),
  currentPeriodEnd:     timestamp('current_period_end', { withTimezone: true }),
  keygenLicenseId:      text('keygen_license_id'),
  licenseKey:           text('license_key'),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const findingTemplates = pgTable('finding_templates', {
  id:             uuid('id').primaryKey().defaultRandom(),
  userId:         text('user_id').notNull().references(() => authUser.id, { onDelete: 'cascade' }),
  title:          text('title').notNull(),
  description:    text('description'),
  cvssScore:      numeric('cvss_score', { precision: 3, scale: 1 }),
  severity:       text('severity'),
  impact:         text('impact'),
  recommendation: text('recommendation'),
  evidence:       text('evidence'),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const userBranding = pgTable('user_branding', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       text('user_id').notNull().unique().references(() => authUser.id, { onDelete: 'cascade' }),
  companyName:  text('company_name'),
  primaryColor: text('primary_color'),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const stripeEventsProcessed = pgTable('stripe_events_processed', {
  eventId:     text('event_id').primaryKey(),
  processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow().notNull(),
})

export const findingImages = pgTable('finding_images', {
  id:         uuid('id').primaryKey().defaultRandom(),
  findingId:  uuid('finding_id').notNull().references(() => findings.id, { onDelete: 'cascade' }),
  data:       bytea('data').notNull(),
  mimeType:   text('mime_type').notNull(),
  caption:    text('caption'),
  sortOrder:  integer('sort_order').notNull().default(0),
  byteSize:   integer('byte_size').notNull(),
  createdAt:  timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('finding_images_finding_id_sort_idx').on(t.findingId, t.sortOrder)])

export type Report             = typeof reports.$inferSelect
export type NewReport          = typeof reports.$inferInsert
export type Finding            = typeof findings.$inferSelect
export type NewFinding         = typeof findings.$inferInsert
export type Subscription       = typeof subscriptions.$inferSelect
export type FindingTemplate    = typeof findingTemplates.$inferSelect
export type NewFindingTemplate = typeof findingTemplates.$inferInsert
export type UserBranding       = typeof userBranding.$inferSelect
export type StripeEventProcessed = typeof stripeEventsProcessed.$inferSelect
export type FindingImage    = typeof findingImages.$inferSelect
export type NewFindingImage = typeof findingImages.$inferInsert

export * from './auth-schema'
