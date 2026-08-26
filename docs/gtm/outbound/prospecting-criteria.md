# PenPad — Prospecting Criteria

**Status: STAGED ONLY. Nothing has been sent.**
**Last updated: 2026-06-16**

---

## Ideal Prospect Definition

| Dimension | Target |
|---|---|
| Role | Penetration Tester, Security Consultant, Red Team Consultant, Ethical Hacker, Vulnerability Researcher |
| Seniority | Individual contributor or owner of a micro-consultancy. Not a CISO, not a manager-only role |
| Certifications | OSCP (OffSec), CREST CRT, CREST CCT, CEH (lower signal), GPEN, GWAPT |
| Company size | 1 person (solo/freelance) to 5 people. Small named consultancies with no in-house enterprise tooling |
| Geography | UK (primary), Ireland, Netherlands, Germany, France, Belgium, Nordics (EU secondary) |
| Engagement volume | Enough work that report writing is a recurring pain — roughly 3+ reports/month |
| Current tool | Word, Google Docs, custom LaTeX, or Dradis (self-hosted, complex) |
| Pricing sensitivity | Individual paying out of pocket or small firm with no enterprise SaaS budget |

---

## LinkedIn / Sales Navigator Filters

### Basic LinkedIn search (free)

Use the search bar with these terms in combination. LinkedIn's free search is limited — use Boolean where possible.

**Title search (use one at a time or combine with OR):**
```
"Penetration Tester"
"Pen Tester"
"Penetration Testing Consultant"
"Security Consultant" AND "penetration"
"Red Team" AND "consultant"
"Ethical Hacker"
"Offensive Security"
"Vulnerability Researcher"
```

**Geography filter:**
- United Kingdom (primary)
- Ireland, Netherlands, Germany, France (secondary)
- Filter out results showing "Director of", "Head of", "VP", "CISO" in title — those are management

**Company size filter:**
- 1–10 employees (catches solo and micro-consultancy)
- Self-employed / freelance

**Keyword in About section / bio (look manually):**
- OSCP, CREST, CEH, GPEN, GWAPT
- Burp Suite, Nmap, Metasploit, Cobalt Strike (tooling mentions = hands-on operator)
- "pentest report", "engagement report", "client report"

---

### Sales Navigator filters (if you have access)

| Filter | Value |
|---|---|
| Job title | Penetration Tester, Security Consultant, Ethical Hacker, Red Team Consultant |
| Geography | United Kingdom; expand to EU after UK pipeline is built |
| Company headcount | 1–10 |
| Seniority level | Individual Contributor, Owner, Partner |
| Keywords (in profile) | OSCP OR CREST OR Burp OR "pentest report" |
| Industry | Computer & Network Security; Information Technology & Services |

**Exclude:**
- Titles containing: Director, Head of, VP, Manager, CISO, GRC, Compliance
- Companies with >50 employees — they likely have in-house tooling or enterprise contracts

---

## Signals That Indicate a Real Operator vs. Management

### Strong "hands-on" signals (high confidence)

- Bio or About section explicitly mentions OSCP, CREST CRT, CREST CCT, GPEN, or GWAPT
- Activity posts show HTB/THM writeups, CTF results, or engagement war stories
- "Freelance" or "Self-employed" in current position
- Mentions specific tools: Burp Suite, Nmap, BloodHound, Impacket, Cobalt Strike, Metasploit
- Profile shows varied client engagements (financial sector, healthcare, fintech) — indicates active consultant
- Endorsements for "Penetration Testing", "Vulnerability Assessment", "Web Application Security"

### Weaker signals (treat with caution)

- "Security Consultant" without specifics — could be GRC, SOC, or sales
- CEH only (certification is widely held; by itself it doesn't mean active pentesting)
- Works at a large consultancy (Big 4, KPMG, Deloitte) — likely has enterprise tooling already
- Job title is "Security Analyst" — usually blue team / SOC, not report-writing pentesters

### Disqualifying signals (skip)

- Title: CISO, CTO, Director of Security, Head of Cyber — wrong buyer
- Company: 200+ employees — enterprise budget tier, not PenPad's audience
- Role focus: GRC, Compliance, Risk, SOC — not writing pentest engagement reports
- Location: US/APAC (start UK/EU only; US market is different competitive landscape)

---

## Where Else This ICP Congregates

### Reddit

| Community | Size | Approach |
|---|---|---|
| r/penetrationtesting | ~90k | Post value-first content; answer report-writing questions; mention PenPad when genuinely relevant |
| r/oscp | Large | OSCP students writing their exam report are a direct near-term audience |
| r/AskNetsec | Large | Answer questions about reporting tools; never post a bare promo link |
| r/netsec | ~500k | Stricter on self-promo; good for following signal, not direct outreach |

**Approach:** Search `site:reddit.com/r/penetrationtesting pentest report` before posting. Find threads where the pain is already expressed ("how do you format your reports?", "what do you use for pentest reporting?"). Answer genuinely, mention PenPad at the end as one option, not the only option.

**Do not:** post a bare link with no context. That gets downvoted and loses credibility permanently.

---

### Discord Communities

| Server | Channel | Approach |
|---|---|---|
| TryHackMe | #projects, #tools | Lurk first, answer questions, mention PenPad when relevant |
| HackTheBox | #tools, #general | Same as above |
| TCM Security Discord | Various | Students are directly the target user; engage as a peer |
| The Cyber Mentor community | Various | Same audience as TCM |
| NetSec Focus | Various | More experienced operators; higher bar, higher value if it lands |

**Rule:** Join as a genuine participant. Do not drop a link on day 1. Spend 1–2 weeks engaging with questions before mentioning the product. Community trust in infosec is earned, not bought.

---

### Other Channels

**Security BSides / local conferences (UK)**
- BSides London, BSides Manchester, BSides Edinburgh
- The talk and hallway track crowd is overwhelmingly practitioners, not management
- Sponsoring a table is expensive; showing up as an attendee and having conversations is free

**CREST and OffSec community forums**
- CREST has a member forum; OSCP graduates have Slack communities
- Approach: participate in existing discussions, not cold pitches

**GitHub**
- Search for public pentest report templates on GitHub
- People who have starred/forked LaTeX/Word pentest report templates are exact-match prospects
- Engage via issues or discussions if there is a legitimate reason to (e.g., "built a tool that automates some of this")

**X / Twitter**
- Hashtags: #OSCP, #pentesting, #infosec, #bugbounty
- Reply to practitioners posting about report pain — it happens regularly
- Do not DM cold on Twitter without prior interaction; the signal-to-noise ratio is poor

---

## Target Account Shortlist — UK Small Security Consultancies

These are the types of companies to look for, not a verified contact list. Use LinkedIn company search with "1–10 employees" + "penetration testing" in description. Examples of company profiles that fit:

- Sole-trader pentesters with a personal domain and LinkedIn presence
- Named micro-consultancies: "XYZ Security", "XYZ Consulting", "XYZ Cyber" with 1–5 staff listed
- Companies that appear on CREST's public member register (crest-approved.org) — this is a searchable directory of CREST-accredited firms; filter by UK and sort by size to find small operators
- Companies listed on CHECK-approved supplier lists (for UK government work) — the smallest firms on these lists are exactly the ICP

**CREST member register search:**
URL: https://www.crest-approved.org/members/
Filter: United Kingdom; individual assessors and small firms are listed by name and accreditation type. Firms with 1–10 staff and CREST CRT / CCT holders are high-confidence targets.

**OffSec partner directory:**
Not publicly browsable, but LinkedIn search for "OSCP" + "United Kingdom" + "1–10 employees" replicates it effectively.

---

## Daily Prospecting Workflow

1. Run LinkedIn search with one title variant + UK geography filter
2. Open each profile; check for hands-on signals (certs in bio, tooling mentions, freelance status)
3. If qualified: send connection request with the appropriate note variant (see linkedin-sequence.md)
4. Cap at 20–25 connection requests per day to stay within LinkedIn's acceptable range
5. Log accepted connections and DM dates in a simple spreadsheet: Name, Company, Connection Date, DM 1 Date, DM 2 Date, DM 3 Date, Status
6. Once per week: check CREST member register for new small UK firms and cross-reference against LinkedIn

**Volume expectation:** At 20 requests/day with a ~30–40% acceptance rate (typical for targeted niche outreach), you will have 40–60 accepted connections per week to sequence through. Expect 5–10% reply rate on DM 1, yielding 2–6 conversations per week at steady state.
