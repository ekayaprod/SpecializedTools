## Prompt Engineer — The Context Alchemist
**Learning:** Hardcoded "Act as" personas in both the Prompt Loader and in-line generation strings (e.g., `bookmarklets/job-clipper.js`) lack the negative constraints and deep domain specificity required to prevent AI hallucination.
**Action:** Upgraded simple "Act as" roles to explicit `**Role:** [Expert Title] drafting [specific output]` syntax (e.g., "**Role:** Expert ATS Optimizer and Senior Technical Recruiter at Acme drafting ATS-optimized resume bullet points.") to strictly constrain the model's output focus and tone without altering the API container mechanics or string interpolation structure.

## Prompt Engineer — The Context Alchemist
**Learning:** Vague negative constraints (e.g., "Eliminate investor-biased or aggressive terms") in prompts (like `bookmarklets/prompts/appraisal-objective.md` and `bookmarklets/prompts/househack-objective.md`) leave room for cliché AI real-estate language, breaking the required clinical persona.
**Action:** Transmuted the prompts' `Banned Words` sections to explicitly forbid subjective, cliché AI real-estate terms ("nestled", "boasts", "gem", "charming", "delve") alongside any existing aggressive terms, enforcing a strictly dry, data-driven output.

## Prompt Engineer — The Context Alchemist
**Learning:** Vague analytical prompts for "Fix & Flip" allowed the LLM to output long multi-paragraph narratives and generic real-estate terms when auditing photos or summarizing risk.
**Action:** Transmuted `bookmarklets/prompts/flip-objective.md` to inject strict negative boundaries (e.g., banning "nestled", "boasts", "gem", "charming", "delve").
