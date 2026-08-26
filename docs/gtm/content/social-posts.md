# PenPad — Social Posts (Staged)

**Status:** STAGED — review and approve before posting
**Channels:** LinkedIn (founder voice), Reddit r/penetrationtesting (community voice), Discord (community voice)
**Rule:** Never pure promo. Problem first, product second.

---

## LinkedIn Posts (Founder Voice)

### LinkedIn Post 1 — Origin story
**Best time:** Tuesday or Wednesday, 8–10am BST
**Format:** Single post, no image required (product screenshot optional)

---

Your last pentest report took 4 hours. That's not a problem with you — it's a problem with the tool.

Word was not built for structured security data. CVSS scores get manually typed from a calculator tab. Finding descriptions get copy-pasted with formatting that breaks at the client end. Every engagement produces a slightly different PDF and none of them look like you charged what you charged.

I'm a developer, not a pentester. But I kept seeing the same complaints in security communities, and it looked like a genuinely unsolved problem for anyone who wasn't a large enterprise with a Dradis server and a dedicated PMO.

So I built PenPad — CVSS v3.1 scoring built in, reusable finding templates, one-click client-ready PDF export.

Free tier at penpad.co.uk. No credit card.

If you write your own reports, I'd genuinely like to know what I got wrong.

---

### LinkedIn Post 2 — Competitor comparison
**Best time:** Thursday, 9–11am BST
**Format:** Single post

---

Dradis: £60+/user, self-hosted, complex setup.
PlexTrac: £450+/mo, requires a sales call.
Notion: Not a pentest tool. Stop.
Word: You know what Word does.

PenPad: £49/mo, cancel any time, built for the freelancer running 3–15 engagements a month solo.

The enterprise tools were built for the enterprise. If you're a solo OSCP/CREST operator writing your own reports, you don't need a PMO platform — you need something that gets out of your way by the second hour of an engagement.

penpad.co.uk — one report free, no card required.

---

### LinkedIn Post 3 — Value/tip post (non-promotional)
**Best time:** Tuesday, 9am BST
**Format:** Single post with structured list

---

Five things that separate a pentest report that clients act on from one they file and forget:

1. An executive summary that doesn't have a single CVE or CVSS score in it. That section is for the CISO, not the dev team.

2. Finding titles that say where the vulnerability is. "SQL Injection in /api/v1/users" not "SQL Injection."

3. CVSS vector strings alongside every score. A severity label without a vector is a judgment call. Show your working.

4. Remediation guidance that's specific enough to be actionable. "Apply input validation" is not remediation. A file name and a line number is.

5. A risk summary table at the end. One page, finding / severity / CVSS / status. Dev teams use this for remediation tracking. Management uses it for board updates. It's the most-read page after the exec summary.

None of this requires any particular tool. It just requires discipline in the write-up.

(If the formatting overhead is what's killing you — that's a different problem. penpad.co.uk.)

---

### LinkedIn Post 4 — Social proof hook (post after first testimonials are collected)
**Best time:** Wednesday, 10am BST
**Format:** Quote post — swap in a real testimonial

---

"I used to block out half a day for report writing. PenPad gets it done before the client follow-up call."

— [Name], freelance pentester, [City]

The goal when building PenPad was simple: your last pentest report took 4 hours. It should take 20 minutes.

The tool is free to try: penpad.co.uk

---

## Reddit Posts (Community Voice)

### Reddit Post 1 — r/penetrationtesting (primary launch post)
**Channel:** r/penetrationtesting
**Flair:** Tool
**Best time:** Tuesday–Thursday, 9am–12pm UTC
**Tone:** Honest dev showing up, not marketing

**Title:**
I built a pentest report tool because I kept seeing the same complaints about Word — looking for feedback from people who actually use it

**Body:**

I'm a developer, not a pentester. Over the past year I kept seeing the same thread in communities like this one: report writing is miserable, Word templates break, CVSS scoring is done manually in a notes app, copy-pasting the same findings over and over.

Dradis exists but it's self-hosted and complex. PlexTrac is enterprise pricing. Most people I talked to were still on Word or Google Docs.

It looked like a gap, so I built something: **PenPad** (penpad.co.uk).

What it does:

- CVSS v3.1 scoring built in — set the vector, severity and score calculate automatically
- Reusable finding templates — write the canonical SQLi description once, pull it into any engagement
- One-click PDF export — cover page, risk overview, findings, remediation
- Status tracking: Draft → Active → Final

Free tier: one report, 10 findings. No credit card.

I genuinely need feedback from people who write reports professionally. What's missing? What did I get wrong about the actual workflow? What would make it a tool you'd actually use on a live engagement?

---

### Reddit Post 2 — r/oscp (follow-up after r/penetrationtesting gets traction)
**Channel:** r/oscp
**Best time:** After the primary post gets comments
**Tone:** Specific to OSCP exam report context

**Title:**
Built a pentest report tool — might help with your OSCP report, looking for feedback

**Body:**

I built PenPad (penpad.co.uk) — a web tool for writing pentest reports. CVSS v3.1 scoring built in, reusable finding templates, PDF export.

The OSCP report is a lot of people's first serious structured pentest report, and the formatting overhead is real — Offensive Security's template requirements are specific and Word doesn't make it easy.

The free tier is one report (10 findings). If you're writing your exam report, that should be enough to take it through the tool and see if it helps.

I'm a developer, not a pentester myself — so if the tool doesn't fit the OSCP report format, I'd genuinely like to know why. Reply here or penpad.co.uk.

---

## Discord Posts (Community Voice)

### Discord Post 1 — TCM Security / TryHackMe / HackTheBox servers
**Channel:** #tools or #projects
**Tone:** Community member, not vendor — join first, engage, post this after you've been visible

---

Been lurking here for a bit and wanted to share something I built that might be relevant.

I built **PenPad** — a web-based pentest report tool. If you're tired of Word formatting fights, it handles CVSS v3.1 scoring automatically, lets you build a reusable finding library, and exports a proper client-ready PDF with one click.

Free to try on a real engagement: **penpad.co.uk** (one report free, no card).

I'm a developer not a pentester, so honest feedback on whether it actually fits a real engagement workflow would be genuinely useful — especially if there's something obvious I've missed. Happy to answer questions here.

---

### Discord Post 2 — Answer thread version (for when someone asks about report tools)
**Context:** Use when someone asks "what do people use for pentest reports?" or "best way to format OSCP report?"
**Tone:** Genuinely helpful, mention PenPad at the end

---

Most people are still on Word which is... fine, but it fights you on formatting constantly. A few options:

- **Word/Google Docs** — free, flexible, painful for structured data. Most common setup.
- **Dradis** — proper pentest tool, self-hosted, more setup than most solos want
- **LaTeX** — good output, steep learning curve if you don't already know it

I built **PenPad** (penpad.co.uk) as a lighter alternative — CVSS scoring built in, template library, PDF export. Free tier covers one report if you want to try it. Not going to pretend it's the right fit for everyone but if the Word formatting is what's killing you, worth seeing if it helps.

---

## Posting notes

**LinkedIn:** Post as Connor Simmons (personal), not as D4rkWolf Studios. Founder voice converts better than brand voice in B2B niches.

**Reddit:** Never post the same copy twice. Each subreddit gets a distinct framing. Read the recent top posts before yours to check tone match.

**Discord:** Lurk first. Servers that trust builders who show up as community members, not vendors. The Discord post 2 (answer thread version) is often higher-value than a cold intro post.

**Hashtags for LinkedIn/X:** #pentesting #infosec #OSCP #penetrationtesting #cybersecurity
