(function(w) {
    if (!w.BookmarkletUtils) w.BookmarkletUtils = {};

    /* PROMPT LIBRARY */
    const STANDARD_OUTPUTS = `
EXPECTED DELIVERABLES:
- **Executive Summary & Verdict**: Investment Grade (Strong Buy / Qualified Buy / Hard Pass).
- **Hidden Insights**: Off-page data, regulations, true costs.
- **Financial Reality Check**: True cash flow, silent costs, CapEx.
- **Visual & Condition Audit**: Analyze the appended Photo Gallery. Look for wear, renovation quality, and layout flow.
`;

    const PROMPT_DATA = {
        str: {
            label: "Short-Term Rental (STR)",
            role: "**Role:** Senior STR Investment Analyst drafting a fast-paced investment brief for a high-volume acquisition team.",
            objective: `**Task:** Perform a comparative investment analysis on the attached properties to identify the highest-yield Short-Term Rental (Airbnb/VRBO) asset.

**Tone, Style & UX Rules:**
* **Mission:** Write for speed, scannability, and immediate decision-making.
* **Style:** Use punchy, executive-level English. Avoid flowery descriptors and academic jargon (e.g., empirical, forensic, draconian, bifurcated).
* **Formatting (CRITICAL):** Maximize the use of Markdown tables. Executives read tables, not paragraphs. ABSOLUTELY NO MULTI-PARAGRAPH NARRATIVES. Keep the total report under 4 pages.

**Output Structure:**

# STR Acquisition Brief: [Insert Location/Date]

1. **THE LEADERBOARD (EXECUTIVE VERDICT):**
Rank the properties based on their Investment Grade.
*Strict Rule:* Output as a Markdown table.
| Rank | Property Address | Investment Grade (Strong Buy / Qualified / Hard Pass) | One-Sentence Investment Thesis |

2. **COMPARATIVE REVENUE PROJECTION:**
*Strict Rule:* Output as a Markdown table.
| Address | Asking Price | Projected ADR | Target Occupancy % | Gross Annual Revenue |

3. **AMENITY PROXIMITY MATRIX:**
*Strict Rule:* You MUST use estimated time or distance metrics (e.g., "5 min walk", "0.5 miles", "15 min drive"). You are strictly forbidden from using "Yes", "No", or just the name of the amenity.
| Address | Distance to Pool | Distance to Lake/Beach | Distance to Kayak Launch | Distance to Community Center |

4. **STR CONVERSION & CONDITION AUDIT:**
Evaluate the photos to separate expected STR startup costs from value-impacting physical repairs, and identify high-ROI upgrade opportunities.
* **Aesthetic Conversion:** Note if it requires repurposing from a standard family home to an STR (e.g., paint, new modern furniture, decor). This is an expected startup cost.
* **Major Repairs:** Note if the property requires heavy physical upgrades (e.g., aging roof, outdated 1970s wet rooms, structural wear).
* **Value-Add "Yield-Jump" Strategy:** Identify if securing a purchase discount to fund a specific functional upgrade (e.g., adding a bathroom, converting a basement) would significantly jump the property's tier and gross yield. If no obvious value-add exists, state "N/A".
*Strict Rule:* Output as a Markdown table. Keep notes to 5-15 words maximum per cell.
| Address | Aesthetic Conversion (Decor) | Major Repairs (CapEx) | Value-Add "Yield-Jump" Strategy |

5. **REGULATORY & SILENT COST "TRIPWIRES":**
Identify the hidden friction for each property.
*Strict Rule:* Output as a Markdown table. Keep notes brief.
| Address | STR Permit / HOA Rules (e.g., 2-year wait rules) | Tax/HOA Friction (Recent spikes, high transfer fees) |

6. **FINANCIAL REALITY CHECK (TOP-RANKED ASSET ONLY):**
Provide a brief, bulleted breakdown for ONLY the #1 ranked property focusing on operational launch requirements:
* **Silent Costs:** [List the annual HOA dues and current Taxes]
* **Startup CapEx:** [List the immediate funds needed for the Aesthetic Conversion (Furniture, Hot Tub, Photography)]

7. **THE "DEAL BREAKER" ANALYSIS:**
Provide a bulleted list. In one punchy sentence per property, explain exactly why any asset received a "Hard Pass" or "Qualified Buy" instead of a "Strong Buy."`,
            noStandardOutput: true
        },
        ltr: {
            label: "Long-Term Rental (LTR)",
            role: "**Role:** Senior Buy-and-Hold Investment Analyst drafting a fast-paced investment brief for a high-volume acquisition team.",
            objective: `**Task:** Perform a comparative investment analysis on the attached properties (single-family or multi-unit) to identify the most stable, highest-yield Long-Term Rental (LTR) asset targeted at working professionals and families.

**Tone, Style & UX Rules:**
* **Mission:** Write for speed, scannability, and immediate decision-making.
* **Style:** Use punchy, executive-level English. Avoid flowery descriptors and academic jargon (e.g., empirical, forensic, draconian, bifurcated).
* **Formatting (CRITICAL):** Maximize the use of Markdown tables. Executives read tables, not paragraphs. ABSOLUTELY NO MULTI-PARAGRAPH NARRATIVES. Keep the total report under 4 pages.

**Output Structure:**

# LTR Acquisition Brief: [Insert Location/Date]

1. **THE LEADERBOARD (EXECUTIVE VERDICT):**
Rank the properties based on their Investment Grade.
*Strict Rule:* Output as a Markdown table.
| Rank | Property Address | Investment Grade (Strong Buy / Qualified / Hard Pass) | One-Sentence Investment Thesis |

2. **COMPARATIVE REVENUE & YIELD PROJECTION:**
*Strict Rule:* Output as a Markdown table. If multi-unit, combine the total monthly rent.
| Address | Asking Price | Projected Monthly Rent | Projected Gross Yield % | Gross Annual Revenue |

3. **TENANT DEMAND MATRIX (PROXIMITY):**
Evaluate the macro-location for working families.
*Strict Rule:* You MUST use estimated time or distance metrics (e.g., "5 min drive", "0.5 miles"). You are strictly forbidden from using "Yes", "No", or just the name of the amenity.
| Address | Distance to Major Highway/Transit | Distance to Zoned Schools | Distance to Grocery/Essentials |

4. **LTR DURABILITY & CAPEX AUDIT:**
Evaluate the photos to separate routine tenant-turnover costs from major cash-flow-killing CapEx, and identify yield-jump opportunities.
* **Tenant-Proofing (Turnkey status):** Note if the property needs basic durability upgrades before placing a family (e.g., replacing old carpet with LVP, fresh paint, basic fixture updates).
* **Major CapEx Risks:** Note if the property shows signs of heavy physical depreciation that destroys LTR margins (e.g., aging roof, outdated boiler/HVAC, foundational issues).
* **Value-Add "Yield-Jump" Strategy:** Identify if a specific, targeted upgrade (e.g., finishing a basement, adding a 3rd bedroom, sub-metering utilities on a multi-family) would significantly force appreciation and jump the monthly rent tier. If none, state "N/A".
*Strict Rule:* Output as a Markdown table. Keep notes to 5-15 words maximum per cell.
| Address | Tenant-Proofing Needed | Major CapEx Risks | Value-Add "Yield-Jump" Strategy |

5. **LANDLORD & HOLDING COST "TRIPWIRES":**
Identify hidden friction that threatens long-term hold stability.
*Strict Rule:* Output as a Markdown table. Keep notes brief.
| Address | HOA Rental Caps / Restrictions (e.g., 10% rental limit rules) | Tax/HOA Friction (Recent severe spikes) |

6. **FINANCIAL REALITY CHECK (TOP-RANKED ASSET ONLY):**
Provide a brief, bulleted breakdown for ONLY the #1 ranked property focusing on operational launch requirements:
* **Calculated Acquisition Basis:** [Asking Price] - [Estimated cost of Major CapEx from Section 4]
* **Silent Costs:** [List the annual HOA dues, current Taxes, and Landlord/Hazard Insurance estimates]
* **Make-Ready CapEx:** [List the immediate funds needed for the Tenant-Proofing identified in Section 4]

7. **THE "DEAL BREAKER" ANALYSIS:**
Provide a bulleted list. In one punchy sentence per property, explain exactly why any asset received a "Hard Pass" or "Qualified Buy" instead of a "Strong Buy."`,
            noStandardOutput: true
        },
        flip: { label: "Fix & Flip", role: "Act as a Fix-and-Flip Project Manager.", objective: 'Estimate ARV, rehab CapEx based on visual condition, and identify structural risks.' },
        househack: { label: "House Hacking", role: "Act as a House Hacking Specialist.", objective: 'Analyze layout for unit-splitting/ADU potential and zoning compliance.' },
        appraisal: {
            label: "Valuation Analyst",
            role: "**Role:** Real Estate Valuation Analyst.",
            objective: `**Context:** Review the attached property PDF (listing details and photos).

**Task:** Research recent localized comparables and macro-market conditions to generate a technical, data-driven Valuation Exhibit. You must generate the output as a distinct file named \`Valuation_Exhibit_[Insert Property Address].md\`.

**Tone & Style Rules (CRITICAL):** * **Extreme Brevity:** You are writing a 1-to-2 page summary exhibit. ABSOLUTELY NO MULTI-PARAGRAPH NARRATIVES.
* **Format:** Use short, direct bullet points and structured markdown tables.
* **Tone:** Clinical, dry, and highly objective. The math and logic must appear 100% unbiased, fair, and transparent.
* **Banned Words:** Do not use investor-biased or aggressive terms (e.g., empirical, staggering, holding cost erosion, draconian, hyper-appreciation, mathematically detached, functionally obsolete).

**Output Structure:**

# Technical Valuation Exhibit: [Insert Property Address]

1. **SUBJECT PROPERTY BASELINE:**
*Strict Rule:* Provide ONLY a bulleted list.
* List Price:
* Gross Living Area (Sq. Ft.):
* Price/Sq. Ft.:
* Beds/Baths:
* Year Built:
* Lot Size:
* Market Exposure: (Days on Market and last sold date/price)

2. **MACRO-MARKET DYNAMICS:**
Provide a brief bulleted list of the current data for the property's specific zip code: Median Sale Price, Year-Over-Year Trend, and Average Days on Market.

3. **DIRECT COMPARABLE TRANSACTIONS:**
Search for 4 to 5 recent closed sales (past 6 to 24 months) that closely match the subject property's Bedroom/Bathroom count.
*Search Directive (CRITICAL):* Your goal is to establish a conservative baseline. Prioritize comparables that highlight the subject property's overvaluation. Specifically look for properties that offer identical features/square footage for a lower price, or superior features/square footage for the same price. You must include one "Market Ceiling" comparable to demonstrate the maximum market threshold for highly updated/superior properties.
*Format as a Markdown Table:* The FIRST row of the table MUST be the Subject Property (labeled "SUBJECT PROPERTY").
Table Columns: Address | Sale Date | Sale Price | Sq. Ft. | Price / Sq. Ft. | Bed / Bath

4. **COMPARABLE ANALYSIS BREAKDOWN:**
Analyze the table data using the following specific bolded labels. Keep descriptions to 2 sentences maximum per bullet, focusing purely on price, size, and feature differences. Do not attempt to quantify subjective location metrics (e.g., walking distance to lakes).
* **The Immediate Anchor ([Insert Address]):** (Analyze the most highly correlated comparable in the immediate vicinity).
* **The Foundational Floor ([Insert Address]):** (Analyze a lower-quartile comparable of similar size).
* **The Market Ceiling ([Insert Address]):** (Analyze the highest-priced comparable, explicitly noting the superior features/square footage that justify its premium over the subject property).

5. **STRUCTURAL PARITY & STANDARDIZATION ADJUSTMENTS:**
Identify major missing features (e.g., absent garage, missing half-bath) or severe age-dating (e.g., untouched 1970s wet rooms) the subject property lacks.
*Strict Rule:* You may ONLY apply a financial deduction for a missing feature if the specific comparables in your table actually possess that feature (e.g., Do not deduct for a missing garage if the Anchor and Floor comps also lack garages).
*Format:* Present this in a Markdown Table: **Required Standardization | Objective Rationale | Estimated Cost**. (Use standard localized estimates. If none exist, state "None identified").

6. **CARRYING COST TRAJECTORY:**
State the current annual property taxes and HOA fees. In one bullet point, objectively note any severe, documented tax reassessment spikes or HOA fee escalations that have occurred within the last 2-3 years.

7. **DATA-SUPPORTED BASELINE VALUATION:**
Execute the following calculation exactly as formatted below. The math must be completely transparent.
*Strict Rule:* When calculating the Bracketed Average Rate, you must average ALL comparable properties in the table (including the Ceiling and Floor). Do NOT include the Subject Property in the average.
* **Standard Baseline Rate:** [Insert average Price/Sq. Ft. of ALL comps]
* **Gross Baseline Value:** [Standard Baseline Rate] x [Subject Sq. Ft.] = [Total]
* **Standardization Deductions:** - [Insert total from Section 5, or $0]
* **Final Data-Supported Valuation:** **[Insert Final mathematically derived valuation]**`,
            noStandardOutput: true
        }
    };

    w.BookmarkletUtils.Prompts = { STANDARD_OUTPUTS, PROMPT_DATA };
})(window);
