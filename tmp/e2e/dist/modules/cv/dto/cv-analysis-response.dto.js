export function toCvAnalysisResponseDto(analysis) {
    return {
        cv: analysis.cv,
        sectionConfidence: analysis.sectionConfidence,
        seniority: analysis.seniority,
        yearsOfExperience: analysis.yearsOfExperience,
        skills: analysis.skills,
        domains: analysis.domains,
        strengths: analysis.strengths,
        gaps: analysis.gaps,
        qualityIssues: analysis.qualityIssues,
        overallScore: analysis.overallScore,
        scoreReason: analysis.scoreReason,
    };
}
//# sourceMappingURL=cv-analysis-response.dto.js.map