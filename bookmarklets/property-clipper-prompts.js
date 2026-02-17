(function(w) {
    if (!w.BookmarkletUtils) w.BookmarkletUtils = {};

    /* PROMPT LIBRARY */
    const STANDARD_OUTPUTS = `/* @include_text prompts/standard-outputs.md */`;

    const PROMPT_DATA = {
        str: {
            label: "Short-Term Rental (STR)",
            role: "**Role:** Senior STR Investment Analyst drafting a fast-paced investment brief for a high-volume acquisition team.",
            objective: `/* @include_text prompts/str-objective.md */`,
            noStandardOutput: true
        },
        ltr: {
            label: "Long-Term Rental (LTR)",
            role: "**Role:** Senior Buy-and-Hold Investment Analyst drafting a fast-paced investment brief for a high-volume acquisition team.",
            objective: `/* @include_text prompts/ltr-objective.md */`,
            noStandardOutput: true
        },
        flip: {
            label: "Fix & Flip",
            role: "Act as a Fix-and-Flip Project Manager.",
            objective: `/* @include_text prompts/flip-objective.md */`
        },
        househack: {
            label: "House Hacking",
            role: "Act as a House Hacking Specialist.",
            objective: `/* @include_text prompts/househack-objective.md */`
        },
        appraisal: {
            label: "Valuation Analyst",
            role: "**Role:** Real Estate Valuation Analyst.",
            objective: `/* @include_text prompts/appraisal-objective.md */`,
            noStandardOutput: true
        }
    };

    w.BookmarkletUtils.Prompts = { STANDARD_OUTPUTS, PROMPT_DATA };
})(window);
