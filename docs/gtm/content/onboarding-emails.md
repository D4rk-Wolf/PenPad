# PenPad — Email Onboarding Sequence

**Status:** STAGED — do NOT send without review and Resend integration
**Sequence:** Post-signup, 3 emails
**Voice:** Direct, peer-to-peer, not marketing. No exclamation marks. No "excited to have you."

---

## Email 0 — Lead magnet delivery (instant, triggered by template form submit)

**To:** [template form email]
**From:** Connor at PenPad &lt;hello@penpad.co.uk&gt;
**Subject:** Your pentest report template + CVSS cheat-sheet

---

Here's the bundle.

[Download the template (DOCX + PDF + cheat-sheet)](https://penpad.co.uk/templates/download?token={{token}})

The CVSS cheat-sheet has a set of common vector strings you can copy directly into your report — SQLi, XSS, IDOR, local privesc. It's the reference I found myself rebuilding in a notes app every engagement; might as well have a proper version.

One thing to know: PenPad calculates the CVSS score and severity band automatically from the vector string, so you don't need the cheat-sheet if you're using it. The free tier covers one full report, no card required — penpad.co.uk.

If you have any feedback on the template (wrong structure, missing sections, something that breaks in a specific Word version), reply to this email. I read them.

— Connor
D4rkWolf Studios

---

## Email 1 — Welcome (Day 0 post-signup, triggered immediately)

**To:** [signup email]
**From:** Connor at PenPad &lt;hello@penpad.co.uk&gt;
**Subject:** Getting started with PenPad

---

You're in.

The free tier gives you one report. The goal is for you to take it through a real engagement — log a few findings, run the CVSS scoring, export the PDF — and see if it's faster than your current setup.

Here's the fastest way to see PenPad do what it does:

1. Go to Reports and create a new report
2. Set the scope and engagement dates — takes about 30 seconds
3. Add one finding manually, or pull from the template library if you've added anything
4. Set the CVSS vector on that finding — severity and score update live
5. Hit Export PDF

The PDF output is what most people want to see first. Once you've seen that, the rest of the workflow makes sense.

If you already use a finding template (even a Word-based one), the template library is where you build the equivalent. You write it once, pull it into any engagement, and tweak the specifics — the description and remediation boilerplate stays consistent across clients.

Any questions, reply here. I'll get back to you.

— Connor

P.S. The free tier is permanent — it's not a trial that expires. One report, as long as you need it.

---

## Email 2 — Create your first report (Day 3)

**To:** [signup email]
**From:** Connor at PenPad &lt;hello@penpad.co.uk&gt;
**Subject:** One thing most people get wrong in PenPad

---

The most common thing I see new users miss: they create a report, add findings manually, and don't use the template library.

That's fine for the first engagement. But the value compounds once your library has 10–15 common findings. SQLi, IDOR, broken auth, weak TLS, missing security headers — write each one properly once, and every future engagement you're just tweaking the specifics.

If you're still getting started, here's what the library setup looks like:

1. Go to Templates in the sidebar
2. Create a finding for your most common vulnerability — the one you write three times a month
3. Give it a canonical title, a clean description, and solid remediation guidance
4. Save it

Next time you create a report, you'll pull from that finding instead of writing from scratch. The CVSS vector from the template copies across too, so you're adjusting metrics rather than building from zero.

The second thing that makes a difference: the executive summary. Most pentest reports bury the risk picture. If you write the summary last, you'll have the full finding list to pull from — but keep it to 250–400 words and don't put CVSS scores in it. That section is for the CISO, not the dev team.

If you've already hit the free tier's report limit and you're finding the tool useful, Pro is £49/mo — unlimited reports, full PDF export with branding, and the full template library.

[Upgrade to Pro](https://penpad.co.uk/billing)

— Connor

---

## Email 3 — Free tier cap / upgrade nudge (Day 14 or triggered by free limit hit)

**To:** [signup email]
**From:** Connor at PenPad &lt;hello@penpad.co.uk&gt;
**Subject:** You've hit the PenPad free limit

---

You've used your free report. That means the tool is probably working.

The free tier is there so you can run a real engagement through PenPad before paying anything. If you got a client-ready PDF out of it, you've seen the core of what Pro does — just without the limits.

Pro is £49/mo. That covers:

- Unlimited reports and findings
- PDF export with branding on every report
- Full template library (read and write)
- Priority support

If you're running 3–15 engagements a month, that's less than £4/engagement to eliminate the formatting overhead. The tool should pay for itself by the second client.

Annual option is ~£399/yr if you'd rather not think about it monthly.

If you're a two-person shop, Team is £99/mo — shared reports, shared template library, separate accounts.

[Upgrade to Pro](https://penpad.co.uk/billing)

If Pro doesn't fit right now, reply and tell me why. Honest feedback on the pricing or the free tier limits directly shapes what we build next. This isn't a retention script — I actually want to know.

— Connor

P.S. Dradis is £60+/user and you have to self-host it. PlexTrac wants a sales call. You can cancel PenPad Pro any time with no penalty. That's the deal.
