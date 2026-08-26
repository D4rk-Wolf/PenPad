# Lead Magnet: Free Pentest Report Template + CVSS Cheat-Sheet

**Asset type:** Downloadable bundle (PDF + DOCX + one-page cheat-sheet PDF)
**Capture mechanic:** Email gate on penpad.co.uk/templates
**Hook:** The ironic Word template — give them the thing they're searching for, make it genuinely good, then show them why the tool is better
**Funnel destination:** PenPad free signup

---

## Concept

Pentesters searching "pentest report template" are actively writing reports right now. They're not in a research phase — they have a deadline. Give them the best free template that exists for the search term, make it polished and actually useful, and include a one-page CVSS v3.1 cheat-sheet that lives in the folder next to their Word doc.

The template itself becomes a soft recurring CTA: every time they use it, they feel the friction Word creates. The cheat-sheet has a footer note: "Or let PenPad calculate this automatically — penpad.co.uk."

This is the "give them the fish and show them the fishing rod is broken" move. It works because it's honest.

---

## Bundle contents

### 1. Pentest Report Template (DOCX + PDF)

A clean, professional Word template following the structure in the SEO article. Genuinely the best free template available for the search term — not a placeholder, not a demo.

**Included sections:**

- Cover page (fields: client name, engagement type, date range, classification, version, assessor name)
- Document control table (version, date, author, changes)
- Executive summary (guided placeholder text showing the format)
- Scope and methodology (scope table + methodology field)
- Findings section (one fully formatted example finding: SQL Injection, CRITICAL, CVSS 9.1, full vector string, description, evidence placeholder, remediation, CWE/OWASP ref)
- Risk summary table (finding, severity, CVSS, status columns)
- Appendix placeholder

**Design notes:**
- Dark header bar with logo placeholder
- Clean sans-serif body (Calibri or system-safe equivalent)
- Severity colour coding: CRITICAL (dark red), HIGH (orange), MEDIUM (amber), LOW (blue), INFO (grey)
- Footer: "Confidential — [Client Name] | [Date]"
- Looks like a proper deliverable, not a training exercise

**DOCX version:** Fully editable, styles applied so the header colours and severity badges don't break when you add content.
**PDF version:** For reference / client-facing sample.

---

### 2. CVSS v3.1 Quick-Reference Cheat-Sheet (one-page PDF)

A single A4/Letter page — the kind you'd print and keep next to your keyboard during an engagement.

**Contents:**

**Base Score Metrics**

| Metric | Abbrev | Options |
|---|---|---|
| Attack Vector | AV | Network (N) / Adjacent (A) / Local (L) / Physical (P) |
| Attack Complexity | AC | Low (L) / High (H) |
| Privileges Required | PR | None (N) / Low (L) / High (H) |
| User Interaction | UI | None (N) / Required (R) |
| Scope | S | Unchanged (U) / Changed (C) |
| Confidentiality | C | None (N) / Low (L) / High (H) |
| Integrity | I | None (N) / Low (L) / High (H) |
| Availability | A | None (N) / Low (L) / High (H) |

**Severity bands**

| Score | Severity |
|---|---|
| 0.0 | None |
| 0.1–3.9 | Low |
| 4.0–6.9 | Medium |
| 7.0–8.9 | High |
| 9.0–10.0 | Critical |

**Common vector strings (copy-paste ready)**

| Vulnerability | Vector | Score |
|---|---|---|
| Unauthenticated RCE over network | AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H | 10.0 (Critical) |
| SQLi, auth bypass | AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N | 9.1 (Critical) |
| Stored XSS | AV:N/AC:L/PR:L/UI:R/S:C/C:L/I:L/A:N | 5.4 (Medium) |
| IDOR, low-priv data access | AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N | 6.5 (Medium) |
| Local privilege escalation | AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H | 7.8 (High) |
| Weak TLS config (no exploit) | AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N | 3.7 (Low) |
| Info disclosure, error messages | AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N | 5.3 (Medium) |

**Footer note (on cheat-sheet):**
PenPad calculates CVSS scores automatically from the vector string — penpad.co.uk

---

## Email capture page copy

**URL:** penpad.co.uk/templates

**Headline:**
Free Pentest Report Template (2026)

**Subhead:**
A professional DOCX template + CVSS v3.1 cheat-sheet. No opt-in required — but drop your email and we'll send the bundle directly, plus let you know when we add more templates.

**Form:**
- Email field (placeholder: your@email.com)
- Button: Send me the template
- Micro-copy below button: No spam. Unsubscribe any time. We'll also let you know when PenPad adds features relevant to your workflow.

**Below fold:**
After you've tried the template, see why a growing number of freelance pentesters moved off Word entirely: [Try PenPad free — no credit card required]

---

## Funnel sequence after email capture

1. Instant delivery email — template download link + brief note (see onboarding-emails.md, Email 0)
2. 3 days later — Email 1 (welcome / create your first report)
3. 7 days later — Email 2 (first report walkthrough)
4. 14 days later — Email 3 (free cap / upgrade nudge)

---

## Why this works

The people searching "pentest report template" are the exact ICP. They're in the middle of an engagement, they're frustrated with their current process, and they have a deadline. The template gives them immediate value and earns the email address without friction.

Every time they open the Word template, the cheat-sheet footer reminds them that PenPad automates the CVSS calculation they just had to look up. The conversion happens gradually — the third or fourth engagement where they notice they're fighting Word again is when they try the free tier.

The Word template is the proof that PenPad is better than it — and it works precisely because it's honest about that.
