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

export const SEVERITY_COLOURS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-50 text-orange-800',
  medium: 'bg-yellow-50 text-yellow-800',
  low: 'bg-blue-50 text-blue-800',
  info: 'bg-slate-100 text-slate-600',
}

export const SEVERITY_BORDER_COLOURS: Record<string, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-400',
  medium: 'border-l-yellow-400',
  low: 'border-l-blue-400',
  info: 'border-l-slate-300',
}

export const FREE_REPORT_LIMIT = 3

