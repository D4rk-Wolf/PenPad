import { pgTable, uuid, text, numeric, integer, timestamp, date } from 'drizzle-orm/pg-core'

export const reports = pgTable('reports', {
  id:         uuid('id').primaryKey().defaultRandom(),
  userId:     uuid('user_id').notNull(),
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
  userId:               uuid('user_id').notNull().unique(),
  stripeCustomerId:     text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  status:               text('status'),
  currentPeriodEnd:     timestamp('current_period_end', { withTimezone: true }),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const findingTemplates = pgTable('finding_templates', {
  id:             uuid('id').primaryKey().defaultRandom(),
  userId:         uuid('user_id').notNull(),
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
  userId:       uuid('user_id').notNull().unique(),
  companyName:  text('company_name'),
  primaryColor: text('primary_color'),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Report             = typeof reports.$inferSelect
export type NewReport          = typeof reports.$inferInsert
export type Finding            = typeof findings.$inferSelect
export type NewFinding         = typeof findings.$inferInsert
export type Subscription       = typeof subscriptions.$inferSelect
export type FindingTemplate    = typeof findingTemplates.$inferSelect
export type NewFindingTemplate = typeof findingTemplates.$inferInsert
export type UserBranding       = typeof userBranding.$inferSelect
