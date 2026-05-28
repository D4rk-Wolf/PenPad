/**
 * Shared Zod validation schemas.
 *
 * Extracted from Server Action files so they can be:
 *  1. Imported by client code for pre-flight validation (optional)
 *  2. Unit tested without needing to mock 'use server' modules
 *
 * Server Actions import from here rather than defining schemas inline.
 */

import { z } from 'zod'

// ── Findings ──────────────────────────────────────────────────────────────────

export const FindingSchema = z.object({
  title:             z.string().min(1, 'Title is required').max(500),
  description:       z.string().max(20_000).optional().nullable(),
  cvssScore:         z.coerce.number().min(0).max(10),
  impact:            z.string().max(10_000).optional().nullable(),
  recommendation:    z.string().max(10_000).optional().nullable(),
  evidence:          z.string().max(20_000).optional().nullable(),
  affectedComponent: z.string().max(500).optional().nullable(),
})

export type FindingInput = z.infer<typeof FindingSchema>

// ── Reports ───────────────────────────────────────────────────────────────────

export const ReportSchema = z.object({
  clientName: z.string().min(1, 'Client name is required').max(200),
  scope:      z.string().max(5_000).optional().nullable(),
  startDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional().nullable(),
  endDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional().nullable(),
  testerName: z.string().max(200).optional().nullable(),
})

export type ReportInput = z.infer<typeof ReportSchema>

// ── Settings ──────────────────────────────────────────────────────────────────

export const PasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword:     z.string().min(8, 'New password must be at least 8 characters'),
})

export type PasswordInput = z.infer<typeof PasswordSchema>
