# Architecture Map

## High-Level Overview

This project provides a collection of standalone browser bookmarklets. The architecture prioritizes client-side execution, with `index.html` acting as a dynamic build system that compiles source files into bookmarklet URIs directly in the browser.

## Component Diagram

```mermaid
graph TD
    %% Core System
    subgraph "Build System"
        Index[("🌐 index.html <br/>(Installer UI)")]
        Compiler[("⚙️ bookmarklet-builder.js <br/>(Build System)")]
    end

    %% Shared Libraries
    subgraph "Shared Libraries"
        Utils[("🧰 utils.js")]
        H2M[("📄 html-to-markdown.js")]
        PL[("🧠 prompts/loader.js")]
        MD[("📝 *.md Templates")]
    end

    %% Domain: Content & Utilities
    subgraph "Content & Utilities"
        WC[("✂️ Web Clipper")]
        PC[("🏠 Property Clipper")]
        JC[("💼 Job Clipper")]
        PG[("🔑 Passphrase Gen")]
        CF[("📍 PA County Finder")]
    end

    %% Domain: Automation
    subgraph "Automation"
        QC[("⚡ Quick Clicker")]
        MB[("🤖 Macro Builder")]
        IR[("🎥 Interaction Recorder")]
        DC[("⏱️ Delayed Clicker")]
    end

    %% Build Flow
    Index -->|Loads & Compiles| Compiler

    %% Text Injection
    PL -.->|@include_text| MD

    %% Dependency Injection
    WC -.->|@require| Utils
    WC -.->|@require| H2M
    PC -.->|@require| Utils
    PC -.->|@require| PL
    JC -.->|@require| Utils
    QC -.->|@require| Utils
    MB -.->|@require| Utils
    IR -.->|@require| Utils
    CF -.->|@require| Utils

    %% Installation Flow
    Index -->|Generates Bookmarklet| WC & PC & JC & PG & CF
    Index -->|Generates Bookmarklet| QC & MB & IR & DC

    %% Verification
    TestGen[("✅ test_bookmarklet_generation.js")] -->|Validates| Compiler
```

## Key Components

1.  **Distribution (`index.html`)**: The entry point. It fetches source code, injects dependencies (if specified via `@require`), runs the compiler, and generates the drag-and-drop bookmarklet buttons.
2.  **Shared Library (`utils.js`)**: A collection of common functions (DOM manipulation, sanitation, Markdown conversion) used primarily by the `Web Clipper`. Most other tools are self-contained.
3.  **Compiler (`bookmarklet-builder.js`)**: A utility that strips comments, trims whitespace, and formats code for use in `javascript:` URIs. It also handles dependency extraction.
4.  **Verification (`tests/test_bookmarklet_builder_robustness.js`)**: A unit test suite that validates the compiler's logic (comment stripping, dependency extraction) to ensure safe and correct bookmarklet generation.
