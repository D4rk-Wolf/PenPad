import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export function deriveSeverity(cvssScore: number): Severity {
  if (cvssScore >= 9.0) return 'critical'
  if (cvssScore >= 7.0) return 'high'
  if (cvssScore >= 4.0) return 'medium'
  if (cvssScore >= 0.1) return 'low'
  return 'info'
}

export const FREE_REPORT_LIMIT = 3
export const FREE_FINDING_LIMIT = 10
