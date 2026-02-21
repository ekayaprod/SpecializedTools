**Context:** Review the attached property PDF (listing details and photos).

**Task:** Research recent localized comparables and macro-market conditions to generate a technical, data-driven Valuation Exhibit. You must generate the output as a distinct file named `Valuation_Exhibit_[Insert Property Address].md`.

**Tone & Style Rules (CRITICAL):** \* **Extreme Brevity:** You are writing a 1-to-2 page summary exhibit. ABSOLUTELY NO MULTI-PARAGRAPH NARRATIVES.

- **Format:** Use short, direct bullet points and structured markdown tables.
- **Tone:** Clinical, dry, and highly objective. The math and logic must appear 100% unbiased, fair, and transparent.
- **Banned Words:** Do not use investor-biased or aggressive terms (e.g., empirical, staggering, holding cost erosion, draconian, hyper-appreciation, mathematically detached, functionally obsolete).

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
   Provide a brief bulleted list of the current data for the property's specific zip code: Median Sale Price, Year-Over-Year Trend, and Average Days on Market.

3. **DIRECT COMPARABLE TRANSACTIONS:**
   Search for 4 to 5 recent closed sales that match the subject property.
   _Search Directive (CRITICAL):_ You must establish a highly accurate baseline by strictly adhering to expanded Uniform Appraisal Dataset (UAD) evaluation guidelines. You are STRICTLY FORBIDDEN from violating the following Appraisal Fences:

- **The Asset Class Fence:** Comps MUST be the exact same property classification (e.g., Multi-Family compared ONLY to Multi-Family; Single-Family ONLY to Single-Family).
- **UAD Geographic & Temporal Fence:** Limit the search to a maximum 2-to-3 mile radius and a 12-to-24 month trailing window.
- **UAD Size Variance Fence:** Comps MUST be within a +/- 25% variance of the subject property's Gross Living Area.
- **The Believability Fence (Max Variance):** When selecting your final comps, the resulting average price should target a realistic negotiation window (e.g., 5% to 20% below the subject's asking price). Do NOT deliberately select extreme lowball outliers that would mathematically force the final valuation to fall more than 25% below the asking price, as this destroys the document's credibility.
- **The "Fair Value" Clause:** If the subject property is already priced competitively (at or below the local median price per square foot), DO NOT force an artificial discount. Select highly accurate, neutral comparables and allow the math to objectively validate the fair asking price. Include one "Market Ceiling" comparable to demonstrate the upper threshold.
  _Format as a Markdown Table:_ The FIRST row of the table MUST be the Subject Property (labeled with the actual address: "[Insert Address] (Subject)").
  Table Columns: Address | Sale Date | Sale Price | Sq. Ft. | Price / Sq. Ft. | Bed / Bath

4. **COMPARABLE ANALYSIS BREAKDOWN:**
   Analyze the table data using the following specific bolded labels. Keep descriptions to 2 sentences maximum per bullet, focusing purely on price, size, and feature differences. Do not attempt to quantify subjective location metrics (e.g., walking distance to lakes).

- **The Immediate Anchor ([Insert Address]):** (Analyze the most highly correlated comparable in the immediate vicinity).
- **The Foundational Floor ([Insert Address]):** (Analyze a lower-quartile comparable of similar size).
- **The Market Ceiling ([Insert Address]):** (Analyze the highest-priced comparable, explicitly noting the superior features/square footage that justify its premium over the subject property).

5. **STRUCTURAL PARITY & STANDARDIZATION ADJUSTMENTS:**
   Identify major missing features (e.g., absent garage, missing half-bath) or severe age-dating (e.g., untouched 1970s wet rooms) the subject property lacks.
   _Strict Rule:_ You may ONLY apply a financial deduction for a missing feature if the specific comparables in your table actually possess that feature (e.g., Do not deduct for a missing garage if the Anchor and Floor comps also lack garages).
   _Format:_ Present this in a Markdown Table: **Required Standardization | Objective Rationale | Estimated Cost**. (Use standard localized estimates. If none exist, state "None identified").

6. **CARRYING COST TRAJECTORY:**
   State the current annual property taxes and HOA fees. In one bullet point, objectively note any severe, documented tax reassessment spikes or HOA fee escalations that have occurred within the last 2-3 years.

7. **DATA-SUPPORTED BASELINE VALUATION:**
   Execute the following calculation exactly as formatted below. The math must be completely transparent.
   _Strict Rule:_ When calculating the Standard Baseline Rate, you must average ALL comparable properties in the table (including the Ceiling and Floor). Do NOT include the Subject Property in the average.

- **Standard Baseline Rate:** [Insert average Price/Sq. Ft. of ALL comps]
- **Gross Baseline Value:** [Standard Baseline Rate] x [Subject Sq. Ft.] = [Total]
- **Standardization Deductions:** - [Insert total from Section 5, or $0]
- **Final Data-Supported Valuation:** **[Insert Final mathematically derived valuation]**
