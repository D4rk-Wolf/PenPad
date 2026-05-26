export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type ReportStatus = 'draft' | 'active' | 'final'

export interface SeverityCounts {
  critical: number
  high: number
  medium: number
  low: number
  info: number
}

export interface Report {
  id: string
  title: string
  client: string
  date: string
  status: ReportStatus
  counts: SeverityCounts
}

export interface Finding {
  id: string
  reportId: string
  title: string
  severity: Severity
  cvss: number
  status: 'open' | 'resolved' | 'accepted' | 'wontfix'
  category: string
  description: string
  impact: string
  recommendation: string
  evidence?: string
  owasp?: string
  cve?: string
}

export interface Template {
  id: string
  title: string
  category: string
  severity: Severity
  cvss: number
  owasp?: string
  tags: string[]
}

export interface User {
  name: string
  email: string
  initials: string
  role: string
  plan: 'free' | 'pro' | 'team'
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export const REPORTS: Report[] = [
  {
    id: 'RPT-0042',
    title: 'Acme Corp — External Network Pentest',
    client: 'Acme Corp',
    date: '2026-05-18',
    status: 'active',
    counts: { critical: 2, high: 4, medium: 5, low: 3, info: 2 },
  },
  {
    id: 'RPT-0041',
    title: 'BioNexus — Web Application Assessment',
    client: 'BioNexus',
    date: '2026-05-10',
    status: 'final',
    counts: { critical: 0, high: 3, medium: 7, low: 4, info: 6 },
  },
  {
    id: 'RPT-0040',
    title: 'Stratos Bank — Internal Red Team',
    client: 'Stratos Bank',
    date: '2026-04-28',
    status: 'final',
    counts: { critical: 1, high: 6, medium: 4, low: 2, info: 1 },
  },
  {
    id: 'RPT-0039',
    title: 'Meridian Health — API Security Review',
    client: 'Meridian Health',
    date: '2026-04-15',
    status: 'draft',
    counts: { critical: 0, high: 2, medium: 3, low: 5, info: 4 },
  },
  {
    id: 'RPT-0038',
    title: 'Vortex Logistics — Cloud Config Audit',
    client: 'Vortex Logistics',
    date: '2026-04-02',
    status: 'final',
    counts: { critical: 3, high: 5, medium: 2, low: 1, info: 3 },
  },
  {
    id: 'RPT-0037',
    title: 'Nomad Studios — Mobile App Pentest',
    client: 'Nomad Studios',
    date: '2026-03-20',
    status: 'draft',
    counts: { critical: 0, high: 1, medium: 4, low: 6, info: 5 },
  },
]

// ─── Findings for RPT-0042 ────────────────────────────────────────────────────

export const FINDINGS_RPT_0042: Finding[] = [
  {
    id: 'F-001',
    reportId: 'RPT-0042',
    title: 'Unauthenticated RCE via Deserialization in Admin API',
    severity: 'critical',
    cvss: 9.8,
    status: 'open',
    category: 'Injection',
    owasp: 'A03:2021',
    description:
      'The `/api/admin/import` endpoint deserializes user-supplied data without validation, allowing arbitrary code execution without authentication.',
    impact:
      'Full compromise of the application server. An attacker can exfiltrate data, pivot to internal network, or establish persistent access.',
    recommendation:
      'Replace native deserialization with a safe alternative (e.g., JSON schema validation). Require authentication on all admin endpoints. Apply allowlisting to accepted content types.',
    evidence:
      'POST /api/admin/import HTTP/1.1\nContent-Type: application/java-serialized-object\n\n[serialized payload triggering calc.exe on server]',
  },
  {
    id: 'F-002',
    reportId: 'RPT-0042',
    title: 'SQL Injection in User Search Endpoint',
    severity: 'critical',
    cvss: 9.1,
    status: 'open',
    category: 'Injection',
    owasp: 'A03:2021',
    cve: 'CVE-2025-11234',
    description:
      'The `q` parameter in `/api/users/search` is interpolated directly into a SQL query without parameterisation.',
    impact:
      'Full database read access. Attacker can enumerate all user credentials, PII, and session tokens.',
    recommendation:
      'Use parameterised queries or a prepared statement for all database interactions. Deploy a WAF rule as a short-term mitigation.',
    evidence: "GET /api/users/search?q=' OR 1=1--\n\nReturns all 84,000 user rows.",
  },
  {
    id: 'F-003',
    reportId: 'RPT-0042',
    title: 'Broken Object Level Authorisation on Report Endpoint',
    severity: 'high',
    cvss: 8.1,
    status: 'open',
    category: 'Broken Access Control',
    owasp: 'A01:2021',
    description:
      'Authenticated users can access any report by incrementing the numeric `reportId` parameter. No ownership check is performed.',
    impact:
      "Access to all client reports across the platform, including competitor data and confidential assessment findings.",
    recommendation:
      'Implement server-side ownership checks for every object access. Use non-guessable UUIDs in external-facing identifiers.',
  },
  {
    id: 'F-004',
    reportId: 'RPT-0042',
    title: 'Reflected XSS in Error Message Parameter',
    severity: 'high',
    cvss: 7.4,
    status: 'open',
    category: 'XSS',
    owasp: 'A03:2021',
    description:
      'The `message` query parameter is reflected in the 404 error page without HTML encoding.',
    impact: 'Session hijacking, credential phishing, or malicious redirects against authenticated users.',
    recommendation: 'HTML-encode all user-controlled data before rendering. Implement a Content Security Policy.',
  },
  {
    id: 'F-005',
    reportId: 'RPT-0042',
    title: 'JWT Algorithm Confusion (RS256→HS256)',
    severity: 'high',
    cvss: 8.8,
    status: 'open',
    category: 'Authentication',
    owasp: 'A07:2021',
    description:
      'The token validation endpoint accepts HS256-signed tokens when the server is configured for RS256, using the public key as the HMAC secret.',
    impact: 'Attacker can forge arbitrary JWTs and impersonate any user including administrators.',
    recommendation:
      "Explicitly reject tokens whose `alg` header doesn't match the configured algorithm. Use a library that enforces algorithm pinning.",
  },
  {
    id: 'F-006',
    reportId: 'RPT-0042',
    title: 'SSRF via Webhook URL Parameter',
    severity: 'high',
    cvss: 7.5,
    status: 'open',
    category: 'SSRF',
    owasp: 'A10:2021',
    description:
      'The webhook registration endpoint makes outbound HTTP requests to attacker-controlled URLs without validation, enabling SSRF.',
    impact: 'Access to internal services, metadata API (AWS IMDSv1), and potentially cloud credentials.',
    recommendation:
      'Validate webhook URLs against an allowlist of approved domains. Block requests to RFC 1918 and link-local ranges.',
  },
  {
    id: 'F-007',
    reportId: 'RPT-0042',
    title: 'Sensitive Data Exposed in API Response',
    severity: 'medium',
    cvss: 5.3,
    status: 'open',
    category: 'Sensitive Data Exposure',
    owasp: 'A02:2021',
    description:
      'The `/api/users/me` endpoint returns password hashes, internal user IDs, and admin flags in the response body.',
    impact: 'Information leakage that assists in privilege escalation and offline password cracking.',
    recommendation: 'Apply field-level serialisation allowlists. Never return credential material in API responses.',
  },
  {
    id: 'F-008',
    reportId: 'RPT-0042',
    title: 'Missing Rate Limiting on Authentication Endpoints',
    severity: 'medium',
    cvss: 5.9,
    status: 'open',
    category: 'Authentication',
    owasp: 'A07:2021',
    description:
      'The `/api/auth/login` endpoint has no rate limiting, lockout policy, or CAPTCHA, enabling brute-force attacks.',
    impact: 'Credential brute-force against accounts with weak passwords.',
    recommendation:
      'Implement rate limiting (e.g., 5 attempts / 15 min per IP), account lockout after failed attempts, and CAPTCHA after threshold.',
  },
  {
    id: 'F-009',
    reportId: 'RPT-0042',
    title: 'CORS Policy Allows Arbitrary Origins',
    severity: 'medium',
    cvss: 6.1,
    status: 'open',
    category: 'Misconfiguration',
    owasp: 'A05:2021',
    description:
      'The API sets `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true`, an invalid but accepted configuration in some browsers.',
    impact: 'Cross-origin data leakage if the browser enforces the combination.',
    recommendation:
      'Enumerate allowed origins explicitly. Never combine wildcard origin with credentials: true.',
  },
  {
    id: 'F-010',
    reportId: 'RPT-0042',
    title: 'Outdated TLS — TLS 1.0/1.1 Accepted',
    severity: 'medium',
    cvss: 4.8,
    status: 'open',
    category: 'Cryptography',
    owasp: 'A02:2021',
    description: 'The server accepts TLS 1.0 and 1.1 connections which are deprecated and vulnerable to POODLE/BEAST.',
    impact: 'Downgrade attacks enabling decryption of sensitive traffic.',
    recommendation: 'Disable TLS 1.0 and 1.1. Enforce TLS 1.2+ with strong cipher suites.',
  },
  {
    id: 'F-011',
    reportId: 'RPT-0042',
    title: 'Directory Listing Enabled on Static Asset Server',
    severity: 'low',
    cvss: 3.1,
    status: 'open',
    category: 'Misconfiguration',
    owasp: 'A05:2021',
    description: 'Apache directory listing is enabled on `/assets/`, exposing internal file structure.',
    impact: 'Information disclosure; assists in mapping attack surface.',
    recommendation: 'Disable directory listing (`Options -Indexes` in Apache configuration).',
  },
  {
    id: 'F-012',
    reportId: 'RPT-0042',
    title: 'Server Version Disclosed in HTTP Headers',
    severity: 'info',
    cvss: 0,
    status: 'open',
    category: 'Information Disclosure',
    owasp: 'A05:2021',
    description: '`Server: Apache/2.4.51 (Ubuntu)` header exposes server version to unauthenticated users.',
    impact: 'Assists attackers in identifying version-specific vulnerabilities.',
    recommendation: 'Remove or genericise the `Server` response header.',
  },
]

// ─── Templates ────────────────────────────────────────────────────────────────

export const TEMPLATE_CATEGORIES = [
  'All',
  'Injection',
  'Broken Access Control',
  'Authentication',
  'Cryptography',
  'XSS',
  'SSRF',
  'Misconfiguration',
  'Sensitive Data Exposure',
  'IDOR',
  'Business Logic',
]

export const TEMPLATES: Template[] = [
  { id: 'T-001', title: 'SQL Injection — Error-Based', category: 'Injection', severity: 'critical', cvss: 9.1, owasp: 'A03:2021', tags: ['SQLi', 'Database'] },
  { id: 'T-002', title: 'SQL Injection — Blind Boolean', category: 'Injection', severity: 'high', cvss: 7.5, owasp: 'A03:2021', tags: ['SQLi', 'Database'] },
  { id: 'T-003', title: 'SQL Injection — Time-Based', category: 'Injection', severity: 'high', cvss: 7.5, owasp: 'A03:2021', tags: ['SQLi', 'Database'] },
  { id: 'T-004', title: 'Command Injection via Parameter', category: 'Injection', severity: 'critical', cvss: 9.8, owasp: 'A03:2021', tags: ['RCE', 'OS'] },
  { id: 'T-005', title: 'LDAP Injection', category: 'Injection', severity: 'high', cvss: 7.1, owasp: 'A03:2021', tags: ['LDAP', 'Directory'] },
  { id: 'T-006', title: 'Insecure Deserialization — Java', category: 'Injection', severity: 'critical', cvss: 9.8, owasp: 'A08:2021', tags: ['Java', 'RCE'] },
  { id: 'T-007', title: 'IDOR — Object Reference', category: 'IDOR', severity: 'high', cvss: 8.1, owasp: 'A01:2021', tags: ['Authorization', 'API'] },
  { id: 'T-008', title: 'IDOR — Sequential ID Enumeration', category: 'IDOR', severity: 'medium', cvss: 5.4, owasp: 'A01:2021', tags: ['Authorization', 'API'] },
  { id: 'T-009', title: 'Broken Object Level Auth', category: 'Broken Access Control', severity: 'high', cvss: 8.1, owasp: 'A01:2021', tags: ['BOLA', 'API'] },
  { id: 'T-010', title: 'Privilege Escalation — Horizontal', category: 'Broken Access Control', severity: 'high', cvss: 7.4, owasp: 'A01:2021', tags: ['AuthZ'] },
  { id: 'T-011', title: 'Privilege Escalation — Vertical', category: 'Broken Access Control', severity: 'critical', cvss: 9.0, owasp: 'A01:2021', tags: ['AuthZ', 'Admin'] },
  { id: 'T-012', title: 'Missing Function Level Auth', category: 'Broken Access Control', severity: 'high', cvss: 7.5, owasp: 'A01:2021', tags: ['AuthZ', 'API'] },
  { id: 'T-013', title: 'Reflected XSS', category: 'XSS', severity: 'high', cvss: 7.4, owasp: 'A03:2021', tags: ['XSS', 'Client'] },
  { id: 'T-014', title: 'Stored XSS', category: 'XSS', severity: 'high', cvss: 8.0, owasp: 'A03:2021', tags: ['XSS', 'Client', 'Persistent'] },
  { id: 'T-015', title: 'DOM-Based XSS', category: 'XSS', severity: 'medium', cvss: 6.1, owasp: 'A03:2021', tags: ['XSS', 'DOM', 'Client'] },
  { id: 'T-016', title: 'SSRF — Internal Network Access', category: 'SSRF', severity: 'high', cvss: 7.5, owasp: 'A10:2021', tags: ['SSRF', 'Network'] },
  { id: 'T-017', title: 'SSRF — Cloud Metadata Access (IMDSv1)', category: 'SSRF', severity: 'critical', cvss: 9.3, owasp: 'A10:2021', tags: ['SSRF', 'AWS', 'Cloud'] },
  { id: 'T-018', title: 'JWT Algorithm Confusion', category: 'Authentication', severity: 'high', cvss: 8.8, owasp: 'A07:2021', tags: ['JWT', 'AuthN'] },
  { id: 'T-019', title: 'Weak Password Policy', category: 'Authentication', severity: 'medium', cvss: 5.9, owasp: 'A07:2021', tags: ['Password', 'AuthN'] },
  { id: 'T-020', title: 'Missing MFA on Privileged Actions', category: 'Authentication', severity: 'medium', cvss: 6.5, owasp: 'A07:2021', tags: ['MFA', 'AuthN'] },
  { id: 'T-021', title: 'Broken Brute-Force Protection', category: 'Authentication', severity: 'medium', cvss: 5.9, owasp: 'A07:2021', tags: ['Brute Force', 'AuthN'] },
  { id: 'T-022', title: 'TLS 1.0/1.1 Enabled', category: 'Cryptography', severity: 'medium', cvss: 4.8, owasp: 'A02:2021', tags: ['TLS', 'Transport'] },
  { id: 'T-023', title: 'Self-Signed Certificate', category: 'Cryptography', severity: 'low', cvss: 3.7, owasp: 'A02:2021', tags: ['TLS', 'Certificate'] },
  { id: 'T-024', title: 'Secrets in Source Code', category: 'Sensitive Data Exposure', severity: 'critical', cvss: 9.1, owasp: 'A02:2021', tags: ['Secrets', 'Credentials'] },
  { id: 'T-025', title: 'Verbose Error Messages', category: 'Misconfiguration', severity: 'low', cvss: 3.1, owasp: 'A05:2021', tags: ['Error Handling', 'Info Disclosure'] },
]

// ─── Current User ─────────────────────────────────────────────────────────────

export const CURRENT_USER: User = {
  name: 'Jamie Foster',
  email: 'j.foster@d4rkwolf.co',
  initials: 'JF',
  role: 'Senior Penetration Tester',
  plan: 'pro',
}
