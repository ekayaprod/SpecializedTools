## Prompt Engineer — The Context Alchemist
**Learning:** Hardcoded "Act as" personas in both the Prompt Loader and in-line generation strings (e.g., `bookmarklets/job-clipper.js`) lack the negative constraints and deep domain specificity required to prevent AI hallucination.
**Action:** Upgraded simple "Act as" roles to explicit `**Role:** [Expert Title] drafting [specific output]` syntax (e.g., "**Role:** Expert ATS Optimizer and Senior Technical Recruiter at Acme drafting ATS-optimized resume bullet points.") to strictly constrain the model's output focus and tone without altering the API container mechanics or string interpolation structure.

## Prompt Engineer — The Context Alchemist
**Learning:** Vague negative constraints (e.g., "Eliminate investor-biased or aggressive terms") in prompts (like `bookmarklets/prompts/appraisal-objective.md` and `bookmarklets/prompts/househack-objective.md`) leave room for cliché AI real-estate language, breaking the required clinical persona.
**Action:** Transmuted the prompts' `Banned Words` sections to explicitly forbid subjective, cliché AI real-estate terms ("nestled", "boasts", "gem", "charming", "delve") alongside any existing aggressive terms, enforcing a strictly dry, data-driven output.

## Prompt Engineer — The Context Alchemist
**Learning:** Vague analytical prompts for "Fix & Flip" allowed the LLM to output long multi-paragraph narratives and generic real-estate terms when auditing photos or summarizing risk.
**Action:** Transmuted `bookmarklets/prompts/flip-objective.md` to inject strict negative boundaries (e.g., banning "nestled", "boasts", "gem", "charming", "delve").
## Prompt Engineer — The Context Alchemist
**Learning:** Evaluated `flip-objective.md` and recognized LLMs often hallucinate CapEx and verbosely drift from tabular executive formatting. Without explicit negative constraints, the LLM generates prose when structured tables are required, and invents numerical estimates when they aren't evident from the data.
**Action:** Re-wrote the objective header for `flip-objective.md` and anchored the system into an "Expert Fix-and-Flip Project Manager and Risk Analyst" persona. Appended strict "CRITICAL NEGATIVE CONSTRAINT" bounds to completely ban multi-paragraph narratives and forbid hallucinating unobserved CapEx. Injected a `<thinking>` phase immediately preceding output generation to ensure step-by-step reasoning. Variables correctly maintained.

## Prompt Engineer — The Context Alchemist
**Learning:** Found that `appraisal-objective.md`, `househack-objective.md`, and `ltr-objective.md` lacked specific cognitive constraints to guide the LLM, leaving them susceptible to hallucinations and verbosity.
**Action:** Injected the "Senior Real Estate Appraiser", "House Hacking Investment Strategist", and "Long-Term Rental Investment Analyst" personas respectively. Added `<thinking>` blocks and `CRITICAL NEGATIVE CONSTRAINT`s forbidding multi-paragraph narratives and unsupported hallucination to fortify the cognitive boundaries while preserving variables and formatting rules.

## Prompt Engineer — The Context Alchemist
**Learning:** Foundational AI instruction payloads (STR, Janitor, Librarian) lacked explicit cognitive boundaries and domain-grounded personas, which increases the likelihood of hallucination or non-deterministic behavior during execution. Generic personas often result in generic logic output.
**Action:** Injected strict CORTEX directives, domain-specific expert personas, explicit negative constraints (e.g., forbidding modification of test files, prohibiting hallucinated CapEx metrics), and mandatory `<thinking>` blocks into `str-objective.md`, `janitor.md`, and `librarian.md`. This locks execution logic into highly deterministic cognitive pathways.

## Prompt Engineer — The Context Alchemist
**Learning:** Core infrastructure agents (Scavenger, Steward, Navigator) lacked explicit CORTEX headers and domain-grounded expert personas, allowing them to potentially hallucinate destructive tasks, modify test logic, or lose track of system architecture.
**Action:** Transmuted `.jules/scavenger.md`, `.jules/steward.md`, and `.jules/navigator.md` to inject strict CORTEX directives, upgrade their personas to explicit senior technical titles (e.g., 'The Senior Forensic Code Analyst'), enforce explicit negative constraints against modifying tests or hallucinating roadmap targets, and injected `<thinking>` block requirements before mutating state.
