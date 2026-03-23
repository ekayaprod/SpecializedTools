(function (w) {
    if (!w.BookmarkletUtils) w.BookmarkletUtils = /** @type {any} */ ({});

    /* PROMPT LIBRARY */
    const STANDARD_OUTPUTS = `/* @include_text prompts/standard-outputs.md */`;

    const PROMPT_DATA = {
        str: {
            label: 'Short-Term Rental (STR)',
            role: '**Role:** Senior STR Investment Analyst drafting a fast-paced investment brief for a high-volume acquisition team.',
            objective: `/* @include_text prompts/str-objective.md */`,
            noStandardOutput: true,
        },
        ltr: {
            label: 'Long-Term Rental (LTR)',
            role: '**Role:** Senior Buy-and-Hold Investment Analyst drafting a fast-paced investment brief for a high-volume acquisition team.',
            objective: `/* @include_text prompts/ltr-objective.md */`,
            noStandardOutput: true,
        },
        flip: {
            label: 'Fix & Flip',
            role: '**Role:** Expert Fix-and-Flip Project Manager and Risk Analyst drafting a rapid margin-and-risk assessment.',
            objective: `/* @include_text prompts/flip-objective.md */`,
        },
        househack: {
            label: 'House Hacking',
            role: '**Role:** Expert House Hacking Specialist and Residential Zoning Analyst drafting a rapid feasibility brief.',
            objective: `/* @include_text prompts/househack-objective.md */`,
        },
        appraisal: {
            label: 'Valuation Analyst',
            role: '**Role:** Real Estate Valuation Analyst.',
            objective: `/* @include_text prompts/appraisal-objective.md */`,
            noStandardOutput: true,
        },
    };

    w.BookmarkletUtils.Prompts = { STANDARD_OUTPUTS, PROMPT_DATA };
})(window);
