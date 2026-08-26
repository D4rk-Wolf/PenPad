# PenPad — Cold Email Sequence (Secondary Motion)

**Status: STAGED ONLY. Nothing has been sent.**
**Last updated: 2026-06-16**

---

## When to Use This Sequence

This is a secondary channel, used only where:

1. You have found a small UK security consultancy operating on its own domain (e.g., `xyz-security.co.uk`, `xyzpentest.co.uk`)
2. The company clearly does penetration testing work (CREST listed, or website describes pentest services)
3. The company has 1–10 staff — small enough that individual pentesters are writing their own reports
4. LinkedIn outreach has not been viable (no profile, or no connection acceptance after 2 weeks)

Do not use cold email to contact individuals whose company email you have scraped without a legitimate business reason. The legitimate reason here is that you are offering a tool directly relevant to the recipient's stated professional work, with a free tier, and an honest unsubscribe path.

**Compliance notes (UK/EU):**
- PECR (UK) permits B2B cold email to work email addresses where there is a relevant legitimate interest and a clear opt-out is provided. This sequence includes opt-out in every email.
- GDPR: the data used is professional contact information obtained from public sources (company website, CREST register). Do not store or use personal emails.
- Be accurate about what the product is and what it costs. Do not exaggerate.

---

## Sourcing Contacts for Cold Email

**Method 1 — CREST member register**
Visit https://www.crest-approved.org/members/ and filter for UK members. Find the company website from the listing. Look for a contact/team page to identify the pentesters by name.

**Method 2 — Company website contact page**
Small consultancies often list a single contact email (e.g., `hello@xyzpentest.co.uk` or `contact@xyzpentest.co.uk`). This is acceptable to use. Generic info@ addresses are lower conversion but still valid.

**Method 3 — Hunter.io (domain search)**
If Hunter.io is authenticated (it is not currently connected), run a domain search against the company's domain to find named staff email addresses. Verify before sending.

**Email format patterns for UK small consultancies:**
- `firstname@domain.co.uk`
- `firstname.lastname@domain.co.uk`
- `firstname.l@domain.co.uk`
- `info@domain.co.uk` / `hello@domain.co.uk` (generic, use when named contacts are not findable)

---

## Email 1 — Initial Outreach

**Subject:** How long does your last pentest report take?

---

Hi [first name / "there" if name unknown],

Pentest work is technical. The report shouldn't take as long as it does.

I built PenPad — a reporting tool for pentesters who are spending 2–4 hours per engagement on formatting, copy-pasting findings, and wrestling Word into producing a consistent client PDF.

What it does:
- CVSS v3.1 scoring built in — enter the score, severity derives automatically
- 20 curated finding templates (OWASP Web Top 10, OWASP API Top 10, Infrastructure) to drop straight into a report
- One-click PDF export in a client-ready format
- Status tracking: Draft, Active, Final

Free tier is 3 full reports, no card required. penpad.co.uk.

I'm a developer, not a pentester — so I need feedback from people who actually write these reports. If you try it and it doesn't fit your workflow, I'd genuinely like to know why.

Worth a look?

Connor Simmons
D4rkWolf Studios
penpad.co.uk

To opt out of further emails, reply with "unsubscribe" and I will not contact you again.

---

**Notes on Email 1:**
- Subject line is a question, not a pitch — it prompts reflection before the email is opened
- Lead paragraph names the pain immediately
- Feature list is short (4 bullets) and each point addresses a specific ICP pain
- Honest disclosure that Connor is a developer, not a pentester — matches the product's existing voice
- Free tier is the CTA, not a demo call or a form — lower friction
- Unsubscribe instruction is plain English, not a legal footer (more human, still compliant)

---

## Email 2 — Follow-Up (Day 5, no reply)

**Subject:** Re: How long does your last pentest report take?

---

Hi [first name / "there"],

Following up on the note below.

If report formatting isn't a bottleneck for you, this probably isn't useful — and that's a fine answer.

If it is, the one thing worth knowing: PenPad's free tier covers 3 full reports (10 findings each), which is enough to run a real engagement through it and see if it fits before paying anything.

penpad.co.uk

Connor

To opt out: reply "unsubscribe."

---

**Notes on Email 2:**
- Threads under the original subject ("Re:") — keeps conversation context visible
- Gives them a genuine out ("that's a fine answer") — reduces friction and preserves goodwill
- Single new point: reiterates the free tier scope concretely so they know exactly what they're getting
- Very short — no new pitch, just a nudge

---

## Email 3 — Final Touch (Day 12, no reply)

**Subject:** Re: How long does your last pentest report take?

---

Hi [first name / "there"],

Last one from me.

If PenPad isn't the right fit, no worries — I won't keep emailing.

The free tier will be there at penpad.co.uk if you ever hit a moment where the report side of an engagement is the painful part.

Good luck with the work.

Connor

To opt out: reply "unsubscribe."

---

**Notes on Email 3:**
- Explicit "last one" — sets a clear end point, which is both honest and effective (people often reply to a final touch out of courtesy)
- No new features or selling — just keeps the door open
- "Good luck with the work" is genuine; these are people doing real technical work

---

## Cadence

| Email | Timing | Condition |
|---|---|---|
| Email 1 | Day 0 | Initial send |
| Email 2 | Day 5 | No reply to Email 1 |
| Email 3 | Day 12 | No reply to Email 2 |
| Stop | Day 12 | Archive. Do not email again unless they reply |

**Volume:** Send in small batches (10–20/day) rather than bulk blasting. This is a niche audience — reputation damage from a bad send travels fast in the security community.

**Reply to "unsubscribe":** Remove immediately, do not contact again, delete from list.

---

## Reply-Handling (Email)

**Interested:** Treat identically to LinkedIn "interested" replies. Point to the free tier, offer to answer questions, do not push for a call unless they ask for one.

**"We already use X":** Acknowledge honestly. For Dradis: note PenPad is simpler/cloud-based. For PlexTrac: note it's a different market (solo/small vs enterprise). Do not disparage competitors.

**"Remove me" / "Unsubscribe":** Act immediately. Reply to confirm removal. No further contact.

**No reply after Email 3:** Archive. Do not add to any future batch without a new, distinct reason to contact them (e.g., a major product update 6 months later — even then, only if you have a legitimate basis).

---

## What Not to Do

- Do not use a fake "from" name or domain to appear larger than you are
- Do not claim PenPad has features it does not have (e.g., multi-user collaboration, SSO, SOC 2 compliance) — it does not currently have these
- Do not promise pricing that has not been confirmed
- Do not scrape personal email addresses (Gmail, Hotmail) — UK PECR does not apply the same legitimate interest basis to personal addresses
- Do not send follow-ups faster than the cadence above — it reads as spam and damages deliverability
- Do not use open tracking pixels without disclosure — most security professionals will notice and it is a trust signal in the wrong direction
