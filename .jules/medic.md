# Medic's Journal

## Recurring Patterns of Fragility
- **Raw `fetch` calls without retry logic:** Found in `index.html` where critical application logic depends on network requests to load source code and dependencies. A single network failure can break the entire application initialization.

## Critical Bugs Prevented
- **Bookmarklet Loading Failure:** By adding exponential backoff and retry logic to the `fetch` calls in `index.html`, we prevent the application from failing to load bookmarklets due to transient network issues or rate limiting.
