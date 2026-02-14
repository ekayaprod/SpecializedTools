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

## 🍳 Recipe Clipper (Chef Mode)

**Problem:** Modern food blogs are unusable due to ads, popups, and excessive storytelling required for SEO ranking. Finding the actual ingredients and instructions is a chore.

**Solution:** A culinary-focused bookmarklet that bypasses the visual clutter by extracting the standardized `application/ld+json` (Schema.org/Recipe) metadata hidden in the page code.

**Core Features:**
- **Schema Extraction:** Instantly parses the hidden JSON-LD data used by Google Rich Snippets.
- **Distraction-Free View:** Overlays a clean, printable recipe card with just Ingredients, Steps, and Timings.
- **Smart Scaling:** Simple multiplier (0.5x, 2x, 4x) to auto-calculate ingredient quantities.
- **Cookbook Export:** One-click save to Markdown (for personal wikis like Obsidian) or PDF.

**Alignment:** Extends the "Clipper" family into a high-value consumer vertical. Reuses the existing `PdfProcessor` and `Markdown` export logic from Property Clipper and Web Clipper.

## 🎥 Video Clipper (Study Mode)

**Problem:** Consuming long-form educational videos (lectures, tutorials, webinars) to find specific answers is inefficient. Manually copying transcripts often results in messy text full of timestamps and line breaks.

**Solution:** A bookmarklet that extracts the transcript and metadata from video platforms (primarily YouTube) to generate a structured "Study Guide" prompt for LLMs.

**Core Features:**
- **Transcript Extraction:** Fetches the full closed caption track (auto-generated or manual).
- **Smart Formatting:** Options to remove timestamps for clean reading or preserve them for "Jump to" links.
- **LLM Prompt Generation:** Outputs prompts for summarization, quizzes, and code extraction.
  > "Summarize the key arguments from this lecture. Create a 5-question quiz to test my understanding."
- **Timestamped Notes:** Exports to Markdown with clickable links that resume the video at that specific time.

**Alignment:** Complements the "Web Clipper" (Visual) and "Property Clipper" (Data) by addressing "Audio/Video" content.
