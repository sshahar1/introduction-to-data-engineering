# Team Context: Gatsby → Astro Migration

**Discovered**: 2026-10-26 · **Source**: /Users/sigals/team-ai-directives (CDR.md + .skills.json)
**Feature context**: Domain = presentation / static site; Tech = Astro, Gatsby, Netlify, Markdown, vanilla JS; Patterns = static site generation, CDN headers, service worker; Actions = migrate, render, deploy.

## Discovered Team Context

| ID | Module | Type | Descriptor | Relevance |
|----|--------|------|------------|-----------|
| CDR-2026-020 | context_modules/rules/security/pre_commit_checklist.md | Rule | Pre-commit security checklist to verify before submitting code | High |
| example-examples-prompts-mission_brief | context_modules/examples/prompts/mission_brief.md | Example | Prompt template for creating a Mission Brief with goal, success criteria, and constraints | Low |
| constitution | context_modules/constitution.md | Constitution | Core principles governing all AI agent behavior and team interactions | Medium |
| CDR-2026-022 | context_modules/rules/style-guides/file_organization.md | Rule | Standards for file organization, sizing, and code structure across all languages | High |
| web-design-guidelines | external skill (vercel-labs/agent-skills) | Skill | Review UI code for web interface best practices (accessibility, performance, UX) | Medium |
| CDR-2026-005 | context_modules/personas/devops_engineer.md | Persona | CI/CD, Infrastructure as Code, GitOps specialist | Low |

_Searched 34 CDR entries + 14 skills, 6 matches found. No frontend/web persona exists; no Astro, Netlify, or static-site rules exist in the knowledge base. CDR rows carry status `stable` (lifecycle tracked in `.adlc/drafts/cdr/`), treated as accepted._

### Applicable directives (High relevance, condensed)

**CDR-2026-020 Pre-Commit Security Checklist** — items that apply to a static deck:
- No hardcoded secrets in source or config (`netlify.toml`, `_headers`, Astro config).
- XSS: Content Security Policy headers configured; no `innerHTML` with user input (slide HTML is author-controlled Markdown, not user input).
- Dependencies: no vulnerable deps (`yarn audit`), minimal-dependencies principle (matches project constitution §V).
- Not applicable: SQL injection, CSRF, auth, rate limiting (no server, no user input).

**Mission Brief example** — Brief should state a one-sentence Goal, measurable Success Criteria, and Constraints. The existing brief (scratchpad `mission-brief-gatsby-to-astro.md`) covers all three.

**CDR-2026-022 File Organization** (raised to High for planning): files 200–400 lines (max 800). Functions < 50 lines (max 100). Nesting ≤ 4 levels. Keep related code together. Merge files that are always edited together rather than over-splitting. For this deck: keep the navigation client script as one small module, and keep the slide pipeline in one place.

### Changes from Previous Discovery

- **Re-run 2026-10-26** (`before_plan` hook, feature dir known): same 6 matches.
- **Changed**: CDR-2026-022 File Organization — relevance Medium → High (planning decides file layout).
- **Changed**: Mission Brief example — relevance High → Low (brief already written; spec done).
