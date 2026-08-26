# PenPad — Landing Page Copy Revisions

**Status:** STAGED — do NOT apply to live site without review
**Anchored to:** GTM brief v2026-06-16

---

## Hero

### Eyebrow
Built for the freelancer who writes their own reports

### Headline
Your last pentest report took 4 hours.
It should take 20 minutes.

### Subhead
PenPad is purpose-built for freelance penetration testers. Log findings, score with CVSS v3.1, and export a branded, client-ready PDF — without touching Word.

### CTA row
- Primary button: Start for free
- Secondary link: See pricing
- Meta copy: No credit card required. 1 report free, always.

---

## Problem strip (3-column, between hero and features)

### Col 1
**The Word doc problem**
Merge fields break. Styles drift. CVSS scores get copied from a notes app and sometimes they're wrong. Every client gets a slightly different PDF and none of them look like you charged £5,000 for the engagement.

### Col 2
**Enterprise tools are overkill**
Dradis is £60+/user and expects you to self-host it. PlexTrac wants a sales call and starts at £450+/mo. If you're running 3-15 engagements a month solo, you don't need a PMO platform — you need a tool that gets out of your way.

### Col 3
**Your time is billable**
Two to four hours of report formatting per engagement isn't overhead — it's lost revenue. A solo pentester at £500/day is leaving real money in Word's toolbar every month.

---

## Features (3 blurbs — tighter than current copy)

### 01 — CVSS v3.1 scoring built in
Set the attack vector, complexity, and impact. PenPad calculates the score and severity band automatically. No spreadsheet, no CVSSv3 calculator tab, no manual error. Your vector string is stored alongside the finding so the client can verify it.

### 02 — Branded PDFs, one click
Cover page, executive summary, risk overview, full finding details with remediation guidance — all in a single export. Your client gets a polished PDF that looks like a proper deliverable, because it is. Bring your own branding or use the default — either way it doesn't look like a Word template from 2019.

### 03 — Reusable finding templates
Build your library once. SQLi, XSS, IDOR, broken auth — write the canonical description once and pull it into any engagement. Tweak the specifics per target, keep the remediation guidance consistent. The thing Word genuinely cannot do without fighting it.

---

## How it works (revised step labels)

1. **Open a report** — name the engagement, set scope and dates. Thirty seconds.
2. **Log your findings** — from a blank finding or your template library. CVSS vector included.
3. **Score automatically** — set the vector string. Severity and CVSS score recalculate instantly.
4. **Export** — one click. Professional PDF lands in your downloads. Send it.

---

## Pricing section copy

### Section headline
Simple pricing. No sales call required.

### Section sub
Dradis is £60+/user. PlexTrac wants a demo. PenPad is £49/mo — cancel any time, no explanation needed.

---

### Free tier
**Free — £0**
Good for: trying PenPad on a real engagement before you commit.

Includes:
- 1 report (up to 10 findings)
- CVSS v3.1 scoring
- Status tracking (Draft / Active / Final)
- Finding templates (read access)
- Community support

_No credit card required. No trial period — the free tier is permanent._

CTA: Get started

---

### Pro tier — recommended
**Pro — £49/mo**
Good for: the freelancer running 3+ engagements a month who needs unlimited capacity and clean PDF output.

Includes everything in Free, plus:
- Unlimited reports and findings
- PDF export with branding
- Full template library (read + write)
- Priority support
- Annual option: ~£399/yr (saves ~£190)

_Your client data stays structured, versioned, and yours._

CTA: Start free trial

---

### Team tier
**Team — £99/mo**
Good for: two-person shops who collaborate on the same engagement. Shared reports, shared template library, separate accounts.

CTA: Get started

---

### Pricing anchor copy (below cards)
No per-seat pricing. No feature gates designed to push you into the next tier. If you're a solo pentester, Pro is the one plan you'll ever need.

---

## FAQ

**1. I already have a Word template that clients expect. Can I keep the same structure?**
PenPad exports a structured PDF — it won't mirror your Word layout pixel-for-pixel. If your client has strong opinions about the report format, you'll want to check the PDF output on the free tier before upgrading. Most clients care about the content, not whether it came from Word.

**2. Is my client data safe? These are sensitive assessments.**
Data is encrypted at rest and in transit. Access controls are server-enforced — your reports are not accessible to other accounts. You can export everything at any time and delete your data on request. If you run a self-hosted requirement, that's on the roadmap; it's not available yet.

**3. Does PenPad support CVSS 4.0?**
Currently no — scoring is CVSS v3.1, which is still the standard most clients and frameworks (CHECK, CREST, PTES) reference. CVSS 4.0 support is planned. If this is blocking for you, let us know — it moves up the roadmap.

**4. Can I import findings from Burp, Nessus, or other tools?**
Not yet via direct integration. You can build a template library manually, which is how most users handle recurring findings. Import support is on the roadmap. If you have a specific tool you'd want connected, email security@d4rkwolf.co.uk.

**5. What if I cancel? Do I lose my reports?**
When you cancel, you drop to the Free tier — you retain access to your most recent report and can export PDFs from it. All your data is retained for 90 days, and you can request a full export at any time before then. Nothing disappears without warning.
