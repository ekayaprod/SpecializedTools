# Project Ideas & Inceptions

This document serves as a staging area for new concepts before they graduate to the Roadmap.

## 💡 Job Post Clipper (Recruiter Mode)

**Problem:** Job applications are tedious. Tailoring a resume for every single application is time-consuming but necessary for ATS (Applicant Tracking Systems).

**Solution:** A specialized browser bookmarklet that extracts job descriptions from major platforms (LinkedIn, Indeed, Glassdoor) and generates a structured "Resume Tailoring Prompt" for LLMs.

**Core Features:**
- **Smart Extraction:** Auto-detects Job Title, Company, Salary Range, and Responsibilities.
- **Hidden Keyword Analysis:** Identifies "soft skills" and cultural cues in the text.
- **LLM Prompt Generation:** Outputs a copy-paste prompt:
  > "Act as a Senior Recruiter at [Company]. Analyze this job description for key competencies. Rewrite my resume bullet points (pasted below) to align with these requirements, prioritizing metrics and achievements that match their needs."
- **Privacy First:** Sanitizes tracking pixels and recruiter identifiers before processing.

**Alignment:** Matches the "Clipper" pattern established by Property Clipper. Leverages the project's existing DOM cleaning utilities.
