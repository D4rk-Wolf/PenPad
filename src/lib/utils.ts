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

export const SEVERITY_COLOURS: Record<Severity, string> = {
  critical: 'bg-red-600 text-white',
  high:     'bg-orange-500 text-white',
  medium:   'bg-yellow-500 text-black',
  low:      'bg-blue-500 text-white',
  info:     'bg-gray-500 text-white',
}

export const FREE_REPORT_LIMIT = 3

