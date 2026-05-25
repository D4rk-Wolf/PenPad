import type { Severity } from '@/lib/utils'

export type CuratedTemplate = {
  category: 'OWASP Web' | 'OWASP API' | 'Infrastructure'
  title: string
  description: string
  cvssScore: number
  severity: Severity
  impact: string
  recommendation: string
}

export const CURATED_TEMPLATES: CuratedTemplate[] = [
  // ── OWASP Web Top 10 ─────────────────────────────────────────────────────
  {
    category:       'OWASP Web',
    title:          'SQL Injection',
    cvssScore:      9.8,
    severity:       'critical',
    description:    'User-supplied input is incorporated into SQL queries without adequate sanitisation, allowing an attacker to manipulate query logic.',
    impact:         'Complete compromise of the database; potential for authentication bypass, data exfiltration, data modification, or OS command execution.',
    recommendation: 'Use parameterised queries or prepared statements. Apply an ORM that escapes inputs by default. Validate and whitelist input where possible.',
  },
  {
    category:       'OWASP Web',
    title:          'Reflected Cross-Site Scripting (XSS)',
    cvssScore:      7.2,
    severity:       'high',
    description:    'User-supplied input is reflected in HTTP responses without encoding, allowing injection of arbitrary JavaScript that executes in a victim\'s browser.',
    impact:         'Session hijacking, credential theft, redirection to malicious sites, and page defacement.',
    recommendation: 'Encode all output using context-aware encoding (HTML, JS, CSS, URL). Implement a strict Content-Security-Policy header.',
  },
  {
    category:       'OWASP Web',
    title:          'Broken Access Control',
    cvssScore:      8.1,
    severity:       'high',
    description:    'The application fails to enforce access restrictions, allowing authenticated users to access resources or perform actions beyond their intended privileges.',
    impact:         'Horizontal or vertical privilege escalation; unauthorised data access or modification.',
    recommendation: 'Enforce access control on the server side for every request. Apply deny-by-default. Log and alert on access control failures.',
  },
  {
    category:       'OWASP Web',
    title:          'Sensitive Data Exposure',
    cvssScore:      7.5,
    severity:       'high',
    description:    'The application transmits or stores sensitive data (credentials, PII, payment data) without adequate encryption or protection.',
    impact:         'Exposure of credentials, personal data, or payment card information leading to fraud or regulatory breach.',
    recommendation: 'Encrypt sensitive data at rest and in transit using modern algorithms (AES-256, TLS 1.2+). Avoid storing sensitive data unless necessary.',
  },
  {
    category:       'OWASP Web',
    title:          'Security Misconfiguration',
    cvssScore:      6.5,
    severity:       'medium',
    description:    'The server, framework, or application is misconfigured, exposing sensitive functionality or information such as debug pages, default credentials, or verbose error messages.',
    impact:         'Information disclosure and unauthorised access to administrative functionality.',
    recommendation: 'Harden all environments. Disable debug features in production. Remove default accounts. Review configuration against CIS benchmarks.',
  },
  {
    category:       'OWASP Web',
    title:          'Vulnerable and Outdated Components',
    cvssScore:      7.2,
    severity:       'high',
    description:    'The application uses third-party libraries or frameworks with known, publicly disclosed vulnerabilities.',
    impact:         'Exploitation of known CVEs affecting underlying components, potentially leading to RCE, data exposure, or denial of service.',
    recommendation: 'Maintain a software bill of materials (SBOM). Monitor CVE feeds. Automate dependency updates using Dependabot or Snyk.',
  },
  {
    category:       'OWASP Web',
    title:          'Broken Authentication',
    cvssScore:      8.8,
    severity:       'high',
    description:    'Authentication mechanisms are implemented incorrectly, allowing attackers to compromise passwords, keys, or session tokens.',
    impact:         'Account takeover, user impersonation, and session hijacking.',
    recommendation: 'Enforce multi-factor authentication. Use secure password storage (bcrypt/argon2). Implement short-lived session tokens with proper invalidation on logout.',
  },
  {
    category:       'OWASP Web',
    title:          'Insecure Deserialisation',
    cvssScore:      7.7,
    severity:       'high',
    description:    'The application deserialises untrusted data without adequate validation, potentially leading to remote code execution or privilege escalation.',
    impact:         'Remote code execution, privilege escalation, and replay attacks.',
    recommendation: 'Avoid deserialising data from untrusted sources. Use data-only formats such as JSON. Implement integrity checks on serialised objects.',
  },
  {
    category:       'OWASP Web',
    title:          'Insufficient Logging and Monitoring',
    cvssScore:      4.3,
    severity:       'medium',
    description:    'Security-relevant events are not logged, monitored, or alerted on, allowing attacks to proceed undetected.',
    impact:         'Delayed detection of breaches, inability to investigate incidents, and non-compliance with regulatory requirements.',
    recommendation: 'Log authentication events, access control failures, and input validation failures. Centralise logs. Implement alerting for anomalous patterns.',
  },
  {
    category:       'OWASP Web',
    title:          'Server-Side Request Forgery (SSRF)',
    cvssScore:      8.6,
    severity:       'high',
    description:    'The application fetches remote resources based on user-supplied URLs without adequate validation, allowing requests to be directed to internal services.',
    impact:         'Access to internal metadata services, internal network scanning, and credential theft from cloud IMDS endpoints (e.g. AWS IMDSv1).',
    recommendation: 'Validate and whitelist allowed URLs. Block requests to private IP ranges. Disable HTTP redirects. Use an allowlist of approved domains.',
  },

  // ── OWASP API Top 10 ─────────────────────────────────────────────────────
  {
    category:       'OWASP API',
    title:          'Broken Object Level Authorisation (BOLA / IDOR)',
    cvssScore:      8.1,
    severity:       'high',
    description:    'API endpoints access objects using IDs supplied by the client without verifying the requesting user has permission to access that specific object.',
    impact:         'Horizontal privilege escalation; any authenticated user can access or modify another user\'s resources.',
    recommendation: 'Validate that the authenticated user is authorised to access the requested object on every API call. Do not rely on the obscurity of object IDs.',
  },
  {
    category:       'OWASP API',
    title:          'Broken API Authentication',
    cvssScore:      9.0,
    severity:       'critical',
    description:    'API authentication mechanisms are weak or absent, allowing unauthenticated access to protected endpoints.',
    impact:         'Full unauthorised access to user data or sensitive application functionality.',
    recommendation: 'Enforce authentication on all protected endpoints. Use short-lived tokens (JWT with expiry). Rotate API keys on compromise.',
  },
  {
    category:       'OWASP API',
    title:          'Broken Object Property Level Authorisation',
    cvssScore:      6.5,
    severity:       'medium',
    description:    'The API returns more object properties than the client should access, or allows writing to properties that should be read-only, enabling mass assignment attacks.',
    impact:         'Exposure of sensitive fields or privilege escalation via mass assignment of privileged properties.',
    recommendation: 'Define response schemas explicitly. Whitelist accepted input fields. Never auto-bind all input properties to internal objects.',
  },
  {
    category:       'OWASP API',
    title:          'Unrestricted Resource Consumption',
    cvssScore:      5.3,
    severity:       'medium',
    description:    'The API imposes no limits on request size, frequency, or resource usage, enabling resource exhaustion attacks.',
    impact:         'Denial of service, excessive cloud infrastructure costs, and degraded availability for legitimate users.',
    recommendation: 'Implement rate limiting per user and per IP. Limit request payload size. Apply pagination to all list endpoints.',
  },
  {
    category:       'OWASP API',
    title:          'Broken Function Level Authorisation',
    cvssScore:      8.1,
    severity:       'high',
    description:    'Administrative or privileged API functions are accessible to lower-privilege users due to missing server-side authorisation checks.',
    impact:         'Vertical privilege escalation; unprivileged users can invoke admin-only functionality.',
    recommendation: 'Enforce function-level authorisation on the server side. Apply deny-by-default. Audit all endpoints for missing authorisation checks.',
  },

  // ── Infrastructure ────────────────────────────────────────────────────────
  {
    category:       'Infrastructure',
    title:          'Default Credentials',
    cvssScore:      9.8,
    severity:       'critical',
    description:    'An administrative interface or service is accessible using vendor-default credentials that have not been changed.',
    impact:         'Full administrative access to the affected system or service with no prior knowledge required.',
    recommendation: 'Change all default credentials immediately on deployment. Maintain a credential inventory process for all managed systems and services.',
  },
  {
    category:       'Infrastructure',
    title:          'Unpatched Operating System',
    cvssScore:      8.1,
    severity:       'high',
    description:    'The operating system is running with known, unpatched vulnerabilities for which public exploits are available.',
    impact:         'Local or remote code execution and privilege escalation, depending on the specific CVE.',
    recommendation: 'Apply OS security patches within 30 days of release (7 days for critical severity). Implement automated patching. Use a vulnerability scanner for ongoing monitoring.',
  },
  {
    category:       'Infrastructure',
    title:          'Exposed Administrative Services',
    cvssScore:      7.2,
    severity:       'high',
    description:    'Administrative services (SSH, RDP, database ports) are directly exposed to the internet without IP restriction.',
    impact:         'Brute-force and credential stuffing attacks, and exploitation of service-layer vulnerabilities.',
    recommendation: 'Restrict administrative ports to trusted IP ranges or a VPN. Implement network-level access controls (security groups, firewall rules).',
  },
  {
    category:       'Infrastructure',
    title:          'Insecure Network Protocols',
    cvssScore:      6.5,
    severity:       'medium',
    description:    'Unencrypted protocols such as Telnet, FTP, or plain HTTP are in use, transmitting data — including credentials — in cleartext.',
    impact:         'Credential interception, session hijacking, and data theft via network sniffing.',
    recommendation: 'Disable Telnet, FTP, and plain HTTP. Replace with SSH, SFTP/FTPS, and HTTPS respectively. Enforce TLS 1.2 minimum.',
  },
  {
    category:       'Infrastructure',
    title:          'Missing HTTP Security Headers',
    cvssScore:      4.3,
    severity:       'medium',
    description:    'HTTP security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options) are absent, leaving the application vulnerable to browser-based attacks.',
    impact:         'Clickjacking, MIME-type sniffing, protocol downgrade attacks, and amplified XSS risk.',
    recommendation: 'Implement HSTS, Content-Security-Policy, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, and Referrer-Policy. Validate using securityheaders.com.',
  },
]
