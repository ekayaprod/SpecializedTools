# Bookmarklet Butler - Specialized Tools

A web-based bookmarklet generation system for creating browser-based utilities. The application provides a wizard-driven interface for building self-contained JavaScript bookmarklets optimized for Microsoft Edge.

## Overview

This project is a single-page application that generates three specialized bookmarklet tools:

1. **Secure Passphrase Generator** - Creates cryptographically random, memorable passphrases with seasonal themes
2. **Temporary Password Generator** - Produces simple temporary passwords in the `Word1` format
3. **PA County Finder** - Performs instant ZIP code and city lookups for Pennsylvania county information

All bookmarklets are generated client-side and operate entirely within the browser with no external dependencies or network requests once installed.

## Architecture

### Application Structure

The application follows a state-driven wizard pattern with three distinct steps:

1. **Tool Selection** - User chooses which bookmarklet type to generate
2. **Configuration** - User customizes tool behavior via dynamic form inputs
3. **Output** - User receives a draggable bookmarklet link and download options

### State Management

**Global State Object**: `wizardState`
- Tracks the currently selected action/tool
- Persists configuration choices between wizard steps
- Reset on navigation back to step 1

**PA County Data Cache**: `paCountyData`
- Lazy-loaded on first access via `getPAData()`
- Prevents redundant data structure initialization
- Contains county definitions and override mappings

### Code Organization

The source file uses semantic comment blocks to delineate functional boundaries:

- `::APP_STATE::` - Global state variables
- `::DOM_UTILITIES::` - DOM manipulation and helper functions
- `::DATA_LAYER::` - Static data structures (PA county information)
- `::FEATURE_REGISTRY::` - Tool definitions and generators
- `::WIZARD_LOGIC::` - Step navigation and bookmarklet generation
- `::UI_BUILDING::` - Dynamic form rendering
- `::VALIDATION::` - Input validation rules

## Feature Registry System

Each tool is defined as an object in the `FEATURES` registry with four required properties:

### Feature Object Schema

```javascript
{
  id: string,              // Unique identifier
  label: string,           // Human-readable name
  uiTemplate: () => string,    // Returns HTML for configuration UI
  validator: () => boolean,    // Validates user inputs, throws on error
  generator: async () => string // Returns minified bookmarklet JavaScript
}
```

### Tool-Specific Implementations

#### 1. Secure Passphrase Generator

**Purpose**: Generates strong, memorable passphrases using a structured word-selection algorithm with seasonal theming.

**Word Bank Structure**:
- Total capacity: 450 words across multiple categories
- Base categories: `Adjective`, `Animal`, `Object`, `Verb`, `Color`
- Seasonal categories: `Winter`, `Spring`, `Summer`, `Autumn` (each with `Noun`, `Adjective`, `Verb`, `Concept` subcategories)
- Word selection criteria: Common words chosen for memorability, ease of spelling, and distinctiveness

**Phrase Construction Algorithm**:
- Uses predefined phrase structures (templates) that combine word categories
- Example 2-word structure: `["Adjective", "Animal"]` → "BraveWolf"
- Example 3-word structure: `["Adjective", "Color", "Animal"]` → "BrightGoldenEagle"
- Seasonal mode substitutes season-specific words (e.g., `SeasonNoun` → `Winter.Noun`)

**Configuration Options**:
- `embedCount` (50-450): Controls subset of word bank embedded in bookmarklet. Higher values increase randomness but produce larger bookmarklets. Default: 200
- `passNumWords` (2-4): Number of words in passphrase
- `passSeparator`: Delimiter between words (-, _, space, or none)
- `passCapitalization`: Title Case or lowercase
- `passNumDigits` (0-9): Numeric suffix length
- `passNumSymbols` (0-4): Number of special characters
- `passMinLength` (8-64): Minimum total character count (padding applied via additional digits)
- `passUseSeasonal`: Enable seasonal word substitution

**Seasonal Logic**:
The bookmarklet calculates the current season based on Memorial Day, Labor Day, and fixed calendar dates:
- **Spring**: March 17 (official start - 7 days) through Memorial Day (- 60 days)
- **Summer**: Memorial Day (- 7 days) through Labor Day (- 60 days)
- **Autumn**: Labor Day (- 7 days) through December 1 (- 60 days)
- **Winter**: December 1 (- 7 days) through March 17 (- 60 days)

**Symbol Placement Rules**:
- `beforeNum`: Symbols placed before digit block ($, #, *)
- `afterNum`: Symbols placed after digit block (%, +)
- `junction`: Symbols placed between words and numbers (=, @, ., -)
- `end`: Symbols placed at end of passphrase (!, ?)

**Random Selection Process**:
The generator uses `crypto.getRandomValues()` for cryptographically secure randomness. When `embedCount < 450`, proportional sampling maintains category distribution (e.g., if Adjectives are 10% of full bank, they receive 10% of embed slots).

**Output**: Generates 5 passphrases simultaneously and displays them in a modal dialog with individual copy buttons.

#### 2. Temporary Password Generator

**Purpose**: Creates simple temporary passwords in the format `Word1` or `Word1!` for short-term account access.

**Word List**:
- Contains 100 compound words (e.g., "Applebutter", "Firefighter", "Breadbasket")
- Words selected for: Length (11-12 characters), complexity (mixed capitalization), and professional appropriateness
- All words are Title Case by default

**Configuration Options**:
- `tempPassCount` (1-10): Number of passwords to generate
- `tempPassSymbol`: Append random symbol (!, ?, $, %)
- `tempPassRandomNum`: Use random digit (0-9) instead of fixed "1"

**Output**: Modal dialog with all generated passwords and individual copy buttons.

#### 3. PA County Finder

**Purpose**: Instant lookup tool for Pennsylvania county information using ZIP codes or city names.

**Data Structure**:
The PA county dataset is organized as a nested array:
```javascript
[
  ["CountyName", minZip, maxZip, [city1, city2, city3, ...]],
  ...
]
```

**Override System**:
Some cities span multiple counties. The `overrides` object maps these edge cases:
```javascript
{
  "bethlehem": {
    "Lehigh": [18015, 18017],
    "Northampton": [18016, 18018, 18020, 18025]
  },
  ...
}
```

**Lookup Algorithm**:
1. Detects input type (5-digit ZIP or text string)
2. ZIP lookup: Uses range-based search through county definitions
3. City lookup: Case-insensitive exact match against city arrays
4. Returns: `"InputValue: CountyName"` or `"InputValue: County1,County2"` for multi-county cities

**Input Sources**:
The bookmarklet attempts input retrieval in this order:
1. Selected text in main window
2. Selected text in embedded frames (iterates through `window.frames[0]` to `window.frames[4]`)
3. User prompt dialog if no selection found

**Data Maintenance**:
To update the PA county data:
1. Locate the `getPAData()` function in the `::DATA_LAYER::` section
2. Replace the `paCountyData` object structure with updated county definitions
3. Maintain the same schema: `counties` array and `overrides` object
4. Regenerate the bookmarklet with the new embedded data

**Output**: Native `alert()` dialog showing county information or "not found" message.

## Core Utility Functions

### `minifyScript(script)`
Removes comments and excess whitespace from JavaScript code to reduce bookmarklet size. Performs three operations:
1. Strips multi-line comments (`/* ... */`)
2. Strips single-line comments (`// ...`)
3. Compresses whitespace around operators and keywords

### `getRand(m)` (Bookmarklet-side)
Cryptographically secure random number generator used within bookmarklets. Generates a random 32-bit unsigned integer via `crypto.getRandomValues()` and applies modulo to constrain range.

### `showDialog(passwords, title)` (Bookmarklet-side)
Creates a styled modal overlay for displaying generated passwords. Features:
- Full-screen semi-transparent backdrop
- Centered white dialog box
- Individual copy buttons for each password
- Click-outside-to-close behavior

## User Interface Components

### Wizard Navigation
- Step visibility controlled via `active` class on `.wizard-step` elements
- `goToStep(stepNumber)` manages transitions
- `goBack()` resets state and returns to step 1

### Dynamic Configuration Forms
The `buildConfigUI(action)` function:
1. Retrieves the feature's `uiTemplate` function
2. Injects generated HTML into `#config-container`
3. Pre-populates `#bookmarkletName` with the feature's label

### Input Validation
The `validateAllFields()` function:
1. Checks for non-empty bookmarklet name
2. Calls the feature-specific `validator()` function
3. Throws descriptive errors that are caught and displayed in `#error-display`

### Error Handling
- `showError(message)`: Displays error in styled banner at top of configuration form
- `hideError()`: Clears error state before validation attempts
- Validation errors prevent bookmarklet generation and keep user on step 2

## Bookmarklet Generation Process

### Step-by-Step Flow

1. **User completes configuration** and clicks "Generate"
2. **Validation runs**: `validateAllFields()` checks all inputs
3. **Feature generator executes**: `await feature.generator()` returns JavaScript string
4. **Script minification**: `minifyScript()` compresses the generated code
5. **URI encoding**: Script is wrapped with `javascript:` protocol and URL-encoded
6. **Link creation**: `createBookmarkletLink()` builds draggable `<a>` element
7. **Step transition**: User advances to step 3

### Output Format

```
javascript:encodeURIComponent(minifiedScript)
```

The resulting URI can be:
- Dragged directly to browser bookmarks bar
- Copied to clipboard
- Downloaded as standalone HTML file

## Browser Compatibility

This application is designed exclusively for **Microsoft Edge**. The generated bookmarklets use standard JavaScript APIs available in modern Chromium-based browsers:

- `crypto.getRandomValues()` for secure randomness
- `navigator.clipboard.writeText()` for clipboard operations
- Standard DOM APIs for UI manipulation

No testing or optimization has been performed for other browsers.

## Styling Architecture

The application uses inline CSS with a utility-first approach:
- **Color palette**: Tailwind-inspired grays and blues
- **Typography**: Inter font family via Google Fonts CDN
- **Layout**: Flexbox and CSS Grid for responsive card-based design
- **Interactions**: Hover states, active transformations, focus rings

Key style patterns:
- `.wizard-step` elements hidden by default, shown via `.active` class
- `.action-btn` provides large clickable card-style buttons with hover lift
- `.config-section` provides visual separation between configuration groups

## Security Considerations

All cryptographic operations use `window.crypto.getRandomValues()`, which provides a cryptographically secure pseudorandom number generator (CSPRNG). This is essential for password and passphrase generation.

The application operates entirely client-side with no network requests, data collection, or telemetry.

## Development Notes

### Adding a New Tool

1. Define feature object in `FEATURES` registry with required properties
2. Implement `uiTemplate()` to return configuration HTML
3. Implement `validator()` to check user inputs
4. Implement `generator()` to produce bookmarklet JavaScript
5. Add action button to step 1 grid with `onclick="selectAction('your_tool_id')"`

### Modifying Existing Tools

- **UI changes**: Edit the feature's `uiTemplate()` function
- **Validation logic**: Edit the feature's `validator()` function
- **Bookmarklet behavior**: Edit the feature's `generator()` function
- **Data updates**: Modify objects in `::DATA_LAYER::` section

### Code Maintenance

The comment-delimited sections (`::SECTION_NAME::START` ... `::SECTION_NAME::END`) serve as visual anchors for code navigation. These should be preserved when refactoring.

## File Structure

```
SpecializedTools/
└── index.html          # Complete single-page application
```

The entire application is contained in one HTML file with embedded CSS and JavaScript. No build process, dependencies, or external files required.

## Deployment

Host `index.html` on any static web server or GitHub Pages. No server-side processing required.

**Access URL**: `https://[your-github-username].github.io/SpecializedTools/`

## License

Publicly hosted repository.
