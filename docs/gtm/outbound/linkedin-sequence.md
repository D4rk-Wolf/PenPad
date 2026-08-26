# PenPad — LinkedIn Outreach Sequence

**Status: STAGED ONLY. Nothing has been sent.**
**Last updated: 2026-06-16**
**Primary motion: LinkedIn direct outreach (connection request + DM sequence)**

---

## Who You Are Sending To

Solo freelance pentesters and small-team consultants (1–5 people), UK/EU, who hold OSCP or CREST CRT/CCT, run 3–15 engagements per month, and currently produce client reports in Word or Google Docs. They lose 2–4 hours per engagement to formatting, copy-pasting boilerplate findings, and producing a consistent PDF. They are price-sensitive: Dradis ($79/user/mo) feels like overkill for a solo operator, and PlexTrac ($450+/mo) is enterprise pricing they cannot justify.

PenPad is honest about its state: it is a real, working product (penpad.co.uk) with a free tier (3 reports, 10 findings each), a Pro subscription for unlimited use + PDF export + custom templates, and a self-hosted Docker option in development. Connor is a developer, not a pentester. The copy reflects this.

---

## Connection Request Note

Character limit: 300. Keep it under 280 to be safe.

---

**Note A — certification hook (use when OSCP/CREST visible in bio):**

> Saw your OSCP/CREST background. I built PenPad — a report tool for pentesters who are tired of Word. Free to try. Not a recruiter, not selling a course. Happy to connect.

**Note B — job title hook (use when title is "Penetration Tester" or "Security Consultant"):**

> Built a pentest report tool called PenPad (penpad.co.uk) after seeing how much time report formatting eats. Happy to connect — curious whether it fits how you actually work.

**Note C — consultancy size hook (use when profile shows solo/freelance):**

> I'm a dev who built PenPad for solo pentesters — CVSS scoring, finding templates, client PDF export. Wanted to connect with people doing the actual work to get honest feedback.

**Rule:** Never send a connection note that is purely a pitch. Each note above leads with something true and specific. Do not use all three interchangeably on the same day to the same audience — pick one variant per campaign run and rotate across weeks.

---

## DM Sequence

Send the first DM only after the connection is accepted. Do not send DM 1 the same minute the connection accepts — wait at least a few hours so it does not feel automated.

---

### DM 1 — Day 0 (same day connection accepts, after a natural delay)

**Hook:** "How long does your last report take to write?"

---

> Hey [first name],
>
> Appreciate the connect.
>
> Quick genuine question: how long does your last pentest report take to write from findings-done to PDF-in-the-client's-inbox?
>
> I'm a developer — I built PenPad (penpad.co.uk) to try to cut that time down. CVSS scoring built in, 20 curated finding templates for OWASP Web/API and infrastructure, one-click PDF export.
>
> Free tier is 3 full reports. No card required.
>
> Not a pitch — I want to know whether it actually fits the way you work, or where it falls short. Worth a look?

**CTA:** implicit — the question invites a reply; the URL is there if they want to look immediately.

---

### DM 2 — Day 4 (if no reply to DM 1)

**Purpose:** Surface the specific pain (formatting time) with a concrete number. Short.

---

> Following up briefly —
>
> I keep hearing the same thing from pentesters: 2–4 hours per engagement just on formatting and copy-pasting the same findings.
>
> PenPad's free tier is there to test against a real engagement. If that number sounds familiar, worth 10 minutes at penpad.co.uk.
>
> If reports aren't the bottleneck for you, no worries — just let me know and I won't clutter your inbox.

**CTA:** penpad.co.uk (free trial, no card).

---

### DM 3 — Day 10 (if still no reply)

**Purpose:** Final touch. Lower the bar — explicitly give them an out. Keeps goodwill intact.

---

> Last message from me on this —
>
> If Word (or whatever you use) is working fine, that's a completely valid answer and I'm not going to keep pinging you.
>
> If you ever hit a moment where the report is the painful part of an engagement, PenPad is free to try: penpad.co.uk.
>
> Either way — good luck with the work.

**CTA:** penpad.co.uk. No pressure framing.

---

## Cadence

| Touch | Timing | Trigger |
|---|---|---|
| Connection request | Day 0 | Manual — after finding prospect |
| DM 1 | Day 0 (hours after accept) | Connection accepted |
| DM 2 | Day 4 | No reply to DM 1 |
| DM 3 | Day 10 | No reply to DM 2 |
| Stop | Day 10 | Archive thread. Do not follow up again unless they engage |

Send no more than 20–30 connection requests per day (LinkedIn rate limit and authenticity floor). If you exceed ~50/day, LinkedIn flags the account. Keep volume low enough that you can personalise the note per profile.

---

## Reply-Handling Guide

### Reply type: Interested / wants to know more

Signs: "That sounds useful", "I've been looking for something like this", "How much is Pro?", asking about features.

**Response:**

> Great — here's the short version: free tier is 3 reports (10 findings each), no card needed. Pro is [insert current price] per month for unlimited reports, unlimited findings, PDF export, and custom reusable templates. Self-hosted Docker option is coming for anyone who needs data to stay local.
>
> Best way to see if it fits is to run your next report through it on the free tier. penpad.co.uk — takes 2 minutes to sign up.
>
> Any questions once you've had a look, just reply here.

Note: Insert the actual current Pro price. Do not quote a number in the sequence itself in case pricing changes.

---

### Reply type: Not now / too busy

Signs: "Interesting but not the right time", "In the middle of a big engagement", "Will look later".

**Response:**

> No problem at all. If you do circle back, the free tier is always there — penpad.co.uk. Good luck with the current engagement.

Do not follow up again after this reply. They have indicated timing, not disinterest — they may convert later organically.

---

### Reply type: "I use X" objection

**Common objections and how to handle them honestly:**

**"I use Dradis"**
> That's a solid tool — it's been around a long time and the self-hosted model is great for data sovereignty. PenPad is simpler and cloud-based (with a self-hosted option coming), so it depends on whether you need Dradis's depth or want something you can get running in 2 minutes. Free tier is there if you ever want to compare on a real report.

**"I use Word / Google Docs"**
> That's honestly what most people use — PenPad is trying to replace that workflow specifically. The difference is CVSS scoring built in, pre-written finding templates you can drop in, and PDF export that doesn't require fiddling with styles. If Word is working for you, that's fine — the free tier is there for the next time it isn't.

**"I use PlexTrac / Plextrac"**
> PlexTrac is a much bigger platform — full client portal, collaboration features, the whole thing. PenPad is aimed at solo operators and small teams who don't need all of that and don't want to pay enterprise pricing. Different market. If you're on PlexTrac and happy, it's probably not for you.

**"I built my own template"**
> Totally reasonable — a lot of good pentesters have done that. PenPad is for the people who haven't, or who want CVSS auto-scoring and structured output without maintaining a template. If yours works, it works.

---

### Reply type: Not a fit

Signs: they're in management, GRC, or clearly not doing hands-on pentests; they're a recruiter; they work in a large team with enterprise tooling.

**Response:**

> Thanks for the reply — sounds like PenPad isn't the right fit for where you are. No worries. Good luck with the work.

Do not persist. Archive.

---

## Tone Notes

- Connor is a developer, not a pentester. This is stated honestly in the copy above. Do not pretend otherwise.
- PenPad is a real, working product with a free tier — represent it that way.
- Do not use phrases like "game-changer", "revolutionary", "I'd love to connect and share synergies." Write like a person.
- If someone asks a question about the product you don't know the answer to, say you'll check and come back — don't guess.
