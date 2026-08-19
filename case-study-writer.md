\---  
name: case-study-writer  
description: Use whenever the user wants to write, improve, tighten, or review a portfolio case study, project writeup, or UX/product/design case study — including turning process notes, a README, or a braindump into a polished case study, or critiquing/rewriting an existing draft. Trigger this even if the user just says "make this a case study," "how do I write this up," or pastes raw project notes and asks for portfolio copy. Also trigger if the user asks to check a case study for credibility issues, fluff, or missing evidence before publishing.  
\---

\# Case Study Writer

Helps turn project notes, technical docs, or a rough draft into a case study that reads as credible and specific rather than templated portfolio copy. Also works in reverse: audit an existing case study draft and flag exactly what's weakening it.

\#\# Core philosophy

Weak case studies read like marketing. Good ones read like evidence. The difference is almost never writing quality — it's whether every claim is backed by something concrete (a screenshot, a number, a specific failed attempt, a decision you'd reconsider) instead of an adjective.

Three failure modes to actively hunt for and fix, in every pass:

1\. \*\*Unverified or invented metrics.\*\* Phrases like "reduced friction by 40%," "zero data loss," "significantly improved" — if the user can't point to where that number came from, it's not going in the case study as a stated fact. Either cut it, hedge it honestly ("no reported failures across my own testing"), or reframe it as a design goal rather than a measured result ("designed to eliminate X" is a mechanism claim, not a results claim, and doesn't need proof).  
2\. \*\*Marketing language standing in for reasoning.\*\* Feature names like "Dynamic Chromatic Warning System" or "Adversarial Pulse Animation" sound impressive but do no explanatory work. Replace the name with the plain mechanism, and let the \*why\* section carry the persuasion instead of the label.  
3\. \*\*A flawless narrative.\*\* If every decision in the doc is presented as correct and settled with no reconsideration, it reads as staged. Real projects have a moment of "this didn't work," multiple attempts, and at least one thing the person would do differently now.

\#\# Workflow

\#\#\# 1\. Figure out what you're working with

\- \*\*Raw material only\*\* (process notes, a README, transcript, braindump) → go straight to drafting a new case study (Step 2).  
\- \*\*Existing draft\*\* → run the audit first (Step 3), then rewrite based on findings.  
\- \*\*Ambiguous\*\* → ask one question: are they starting fresh or fixing something that exists. Don't ask more than that if the material makes the answer inferable.

Don't wait for a long interview if the input material already contains the answers — extract what you can (problem, decisions, what failed, outcomes) and only ask about genuine gaps: real metrics if any exist, availability of screenshots/visuals, and which decisions the person would reconsider today.

\#\#\# 2\. Structure

Use this shape as a default, not a rigid template — merge or drop sections that don't fit the project:

1\. \*\*Hook\*\* — one concrete moment of pain or stakes, not an abstract description of the tool. "Designed an interface that helps X" is not a hook. A specific scenario where the \*lack\* of this tool caused a problem is a hook.  
2\. \*\*Context\*\* — who this was for, what constraints (solo build, timeline, team size) shaped the work. Constraints are credibility signals, not caveats to hide.  
3\. \*\*The real problem\*\* — the underlying issue, distinct from the symptom. If the user's notes already draw this distinction, keep it — it's usually their sharpest material.  
4\. \*\*Key decisions\*\* — 3-5 decisions, each stated plainly with a one-line "why" that references a real trade-off, not just a benefit. A decision with no trade-off is suspicious — every real decision costs something.  
5\. \*\*What didn't work first\*\* — expand this, don't compress it. This is usually the most underwritten and most valuable section. Push for: what the failed approach actually looked like, the specific moment it became clear it was failing, and what was tried in between the failure and the final approach (multiple attempts read as real; one failed attempt then the final answer reads as staged).  
6\. \*\*Outcome\*\* — only claims backed by something real. See failure mode \#1 above.  
7\. \*\*What I'd reconsider\*\* — at least one honest limitation or thing to revisit. This section is a credibility multiplier — include it even if the user doesn't ask for it, and suggest it if their draft is missing it.  
8\. \*\*Reflection\*\* (optional) — one genuine takeaway, kept short. Cut if it restates the hook.

\#\#\# 3\. Auditing an existing draft

Go section by section and flag, inline or in a summary list:  
\- Every claim that has a number, superlative, or absolute ("zero," "always," "significantly") with no visible source — mark it as needing evidence or softening.  
\- Any feature name or coined term that isn't followed by a plain-language explanation of the actual mechanism.  
\- Any decisions section where every entry sounds unanimously correct with no trade-off mentioned.  
\- Missing or thin "what didn't work" content — this is almost always underwritten in first drafts; ask what else was tried.  
\- Whether visuals are referenced/needed — for anything spatial, visual, or UI-related, screenshots or before/after comparisons are usually the single highest-impact missing piece. Flag this explicitly if the draft has no visual plan.

Present findings as a short prioritized list (most credibility-damaging first), not a line-by-line copyedit — the user needs to know what to fix before how to fix it.

\#\#\# 4\. Tone calibration

\- Plain, specific, and slightly understated beats polished and vague. If a sentence would work equally well in a sales deck, it's too vague for a case study.  
\- Keep technical precision where the user's original material has it (exact numbers, stack details, specific constraints) — don't smooth these into generic language.  
\- Self-critique should be genuine, not a humblebrag ("my only flaw is I care too much"). If the user can't articulate a real limitation, ask them directly what they'd change with more time.

\#\#\# 5\. Deliverable

Default to producing the case study as a markdown file (or editing their existing file) rather than a long inline chat response, unless they're asking only for feedback/audit on a draft they already have open — in that case, respond inline with the prioritized findings first, then offer to produce the rewritten version as a file.  
