# PenPad — Sample Prospects

**Status: STAGED ONLY. Nothing has been sent.**
**Last updated: 2026-06-16**

---

## Hunter.io Status

Hunter.io is installed in this environment but requires OAuth authentication. It was not authenticated during this campaign build, so no automated email lookup or verification was performed.

This file therefore contains:
1. A sourcing strategy with specific, actionable search steps
2. A shortlist of target-account types and where to find them
3. A worked example of what a verified prospect record should look like, so you can replicate the format when you run the searches yourself

---

## Sourcing Strategy — Step by Step

### Step 1: CREST Member Register (highest-quality source)

URL: https://www.crest-approved.org/members/

CREST is the UK's primary accreditation body for penetration testing. Their public register lists every accredited company by name, country, and type of accreditation. Small firms listed here are hands-on operators by definition.

**How to use it:**

1. Go to the URL above and filter by Country: United Kingdom
2. Look for companies with "Penetration Testing" or "Web Application Testing" in their service list
3. Note the company name
4. Search the company name on LinkedIn — filter by company + 1–10 employees
5. Within the company's LinkedIn page, click "See all employees" to find the individual pentesters
6. Cross-check: do their profiles show OSCP/CREST certifications in the bio? If yes, high-confidence prospect

**What you're looking for:** Firms with 2–8 employees, CREST CRT or CCT holders, UK-based. The register has hundreds of members — focus on small ones first.

---

### Step 2: LinkedIn Company Search (volume source)

Search: `penetration testing` in the LinkedIn company search bar

Filters:
- Location: United Kingdom
- Company size: 1–10 employees
- Industry: Computer & Network Security

This will return 50–200 small UK pentest firms. For each, click through to the company page and then "See all employees." Review individual profiles for hands-on signals (see prospecting-criteria.md).

---

### Step 3: Hunter.io Domain Search (email finder — authenticate first)

Once Hunter.io is connected (run the OAuth flow via the hunter plugin), for each company domain you find in Steps 1–2:

1. Run a domain search: `hunter domain-search --domain xyz-security.co.uk`
2. Review the returned email addresses — prefer named addresses over generic info@
3. Run verification: `hunter email-verifier --email firstname@xyz-security.co.uk`
4. Only add to the cold-email list if verification returns `status: valid` or `status: accept_all` (the latter means the domain accepts all mail; treat with caution but include)
5. Discard `status: invalid` results entirely

---

### Step 4: GitHub (supplementary)

Search GitHub for: `pentest report template`

Sort by: Most starred

Look at the contributors and stargazers on popular repos (e.g., public Word/LaTeX pentest report templates). These are people actively thinking about the reporting problem. Some will have their company or location in their GitHub profile — cross-reference on LinkedIn.

---

## Target Account Shortlist — Profile Types

Rather than a static list of companies (which would require real-time verification), here are the specific account archetypes to search for. Each describes a real category of company that exists in the UK market.

---

**Archetype A: Solo CREST-accredited freelancer**
- Profile: individual pentester, CREST CRT or CCT, works under their own name or a single-person Ltd
- Where to find: CREST member register (individual assessors section), LinkedIn "Self-employed" + OSCP/CREST in bio
- Email: usually firstname@personalname.co.uk or firstname@namedcompany.co.uk
- Volume: hundreds exist in the UK
- Conversion likelihood: highest — they have no team tooling budget and feel the report pain directly

**Archetype B: 2–5 person boutique consultancy**
- Profile: a named UK company (e.g., "Apex Security Ltd", "RedLine Penetration Testing") with 2–5 staff, all of whom do hands-on testing
- Where to find: CREST member register (small firms), LinkedIn company search
- Email: typically firstname@companyname.co.uk; findable via Hunter domain search
- Volume: 50–200 firms of this type in the UK
- Conversion likelihood: high — no enterprise tooling, everyone writes their own reports

**Archetype C: OSCP graduate recently gone freelance**
- Profile: passed OSCP in the last 12–24 months, recently switched from employed to freelance/contractor
- Where to find: LinkedIn "Self-employed" + "OSCP" + recent start date in current role; r/oscp "I passed" posts
- Email: often not public yet; LinkedIn DM is better for this archetype
- Conversion likelihood: very high — they are building their workflow from scratch and have not yet invested in tooling

**Archetype D: Small firm with CHECK/Cyber Essentials Plus accreditation**
- Profile: firm that holds NCSC CHECK approval or delivers Cyber Essentials Plus assessments, typically 3–10 staff, UK government supply chain
- Where to find: NCSC CHECK supplier list (https://www.ncsc.gov.uk/information/check-penetration-testing), CREST register
- Email: findable via Hunter domain search on their .gov-registered domain or .co.uk
- Conversion likelihood: medium-high — they write many reports but may have more established processes

---

## Worked Example — What a Verified Prospect Record Should Look Like

When you run the sourcing steps above, record each prospect in this format before outreach:

```
Name:              [First Last]
Company:           [Company Name]
Domain:            company.co.uk
LinkedIn URL:      https://linkedin.com/in/handle
Email:             firstname@company.co.uk
Email status:      valid / accept_all / unverified
Source:            CREST register / LinkedIn search / GitHub
Certifications:    OSCP, CREST CRT  (from LinkedIn bio)
Company size:      3 employees
Signals:           Freelance, Burp Suite mentioned in about, active on r/penetrationtesting
Outreach channel:  LinkedIn DM (primary) / Cold email (if no LinkedIn response after 2 weeks)
Connection sent:   [date]
DM 1 sent:         [date]
DM 2 sent:         [date]
DM 3 sent:         [date]
Status:            Pending / Replied-interested / Replied-not-now / Archived
```

Maintain this as a spreadsheet (Google Sheets is fine). Do not mix LinkedIn-only contacts with email contacts — track the channel separately so you do not accidentally double-contact someone via both channels simultaneously.

---

## Realistic Volume Expectations

| Source | Estimated addressable contacts (UK) |
|---|---|
| CREST register (individual assessors + small firms) | 300–500 |
| LinkedIn search (1–10 employee pentest companies, UK) | 500–1,000 individuals |
| OSCP freelancers on LinkedIn | 200–400 |
| GitHub (pentest template contributors/stargazers, UK) | 50–150 |
| **Total reachable UK ICP (conservative)** | **~1,000–2,000** |

This is a small, concentrated niche. You do not need to reach all of them — you need to reach the right ones. 20 qualified conversations per month is a meaningful pipeline for an early-stage SaaS.

---

## Why Hunter Was Not Used Here

Hunter.io was not authenticated when this campaign was built. Rather than run the OAuth flow and make live API calls to an unverified contact pool, the safer path was to document the sourcing strategy precisely so you can execute it yourself with full control over which domains are queried and which contacts are added.

When you are ready to run Hunter:
1. Run `mcp__plugin_hunter_hunter__authenticate` in the Claude session to start the OAuth flow
2. Authenticate in your browser
3. Use the `hunter:domain-search` and `hunter:email-verifier` skills to build a verified list
4. Record results in the prospect format above before any outreach

Keep usage modest — Hunter's free tier has monthly limits, and verifying 10 high-quality domains is more useful than searching 100 low-confidence ones.
