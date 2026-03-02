**Context:** Analyze the attached property PDF (listing details and photos).

**Task:** Synthesize recent localized comparables and macro-market conditions into a technical, data-driven Valuation Exhibit. Output a distinct file exactly named `Valuation_Exhibit_[Insert Property Address].md`.

**Tone & Style Rules (CRITICAL):** \* **Extreme Brevity:** Limit the summary exhibit to 1-to-2 pages. ABSOLUTELY NO MULTI-PARAGRAPH NARRATIVES.

- **Format:** Enforce short, direct bullet points and structured markdown tables.
- **Tone:** Maintain clinical, dry, and highly objective language. Present 100% unbiased, fair, and transparent math and logic.
- **Banned Words:** Eliminate investor-biased or aggressive terms (e.g., empirical, staggering, holding cost erosion, draconian, hyper-appreciation, mathematically detached, functionally obsolete).

**Output Structure:**

# Technical Valuation Exhibit: [Insert Property Address]

1. **SUBJECT PROPERTY BASELINE:**
   _Strict Rule:_ Provide ONLY a bulleted list.

- List Price:
- Gross Living Area (Sq. Ft.):
- Price/Sq. Ft.:
- Beds/Baths:
- Year Built:
- Lot Size:
- Market Exposure: (Days on Market and last sold date/price)

2. **MACRO-MARKET DYNAMICS:**
   List the current data for the property's specific zip code: Median Sale Price, Year-Over-Year Trend, and Average Days on Market in a brief bulleted list.

3. **DIRECT COMPARABLE TRANSACTIONS:**
   Identify 4 to 5 recent closed sales matching the subject property.
   _Search Directive (CRITICAL):_ Establish a highly accurate baseline by strictly enforcing expanded Uniform Appraisal Dataset (UAD) evaluation guidelines. Never violate these Appraisal Fences:

- **The Asset Class Fence:** Match the exact property classification (e.g., Multi-Family compared ONLY to Multi-Family; Single-Family ONLY to Single-Family).
- **UAD Geographic & Temporal Fence:** Restrict comparables to a maximum 2-to-3 mile radius and a 12-to-24 month trailing window.
- **UAD Size Variance Fence:** Ensure comparables remain within a +/- 25% variance of the subject property's Gross Living Area.
- **The Believability Fence (Max Variance):** Target a realistic negotiation window (e.g., 5% to 20% below the subject's asking price) for the resulting average price. Reject extreme lowball outliers that mathematically force the final valuation more than 25% below the asking price, preserving document credibility.
- **The "Fair Value" Clause:** Preserve competitive pricing (at or below local median price per square foot) without forcing artificial discounts. Select highly accurate, neutral comparables to objectively validate the fair asking price. Include one "Market Ceiling" comparable demonstrating the upper threshold.
  _Format as a Markdown Table:_ Insert the Subject Property as the FIRST row (labeled with the actual address: "[Insert Address] (Subject)").
  Table Columns: Address | Sale Date | Sale Price | Sq. Ft. | Price / Sq. Ft. | Bed / Bath

4. **COMPARABLE ANALYSIS BREAKDOWN:**
   Analyze the table data using the exact bolded labels below. Limit descriptions to 2 sentences maximum per bullet. Focus strictly on price, size, and feature differences. Exclude subjective location metrics (e.g., walking distance to lakes).

- **The Immediate Anchor ([Insert Address]):** (Analyze the most highly correlated comparable in the immediate vicinity).
- **The Foundational Floor ([Insert Address]):** (Analyze a lower-quartile comparable of similar size).
- **The Market Ceiling ([Insert Address]):** (Analyze the highest-priced comparable, explicitly noting the superior features/square footage that justify its premium over the subject property).

5. **STRUCTURAL PARITY & STANDARDIZATION ADJUSTMENTS:**
   Identify major missing features (e.g., absent garage, missing half-bath) or severe age-dating (e.g., untouched 1970s wet rooms) absent from the subject property.
   _Strict Rule:_ Apply financial deductions for missing features ONLY if the specific comparables in your table actually possess those features (e.g., Do not deduct for a missing garage if the Anchor and Floor comps also lack garages).
   _Format:_ Output a Markdown Table: **Required Standardization | Objective Rationale | Estimated Cost**. (Apply standard localized estimates. If none exist, state "None identified").

6. **CARRYING COST TRAJECTORY:**
   List the current annual property taxes and HOA fees. Objectively note severe, documented tax reassessment spikes or HOA fee escalations from the last 2-3 years in a single bullet point.

7. **DATA-SUPPORTED BASELINE VALUATION:**
   Execute the following calculation exactly as formatted below, ensuring completely transparent math.
   _Strict Rule:_ Average ALL comparable properties in the table (including the Ceiling and Floor) to calculate the Standard Baseline Rate. Exclude the Subject Property from the average calculation.

- **Standard Baseline Rate:** [Insert average Price/Sq. Ft. of ALL comps]
- **Gross Baseline Value:** [Standard Baseline Rate] x [Subject Sq. Ft.] = [Total]
- **Standardization Deductions:** - [Insert total from Section 5, or $0]
- **Final Data-Supported Valuation:** **[Insert Final mathematically derived valuation]**