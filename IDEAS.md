# Project Ideas & Inceptions

This document serves as a staging area for new concepts before they graduate to the Roadmap.

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
