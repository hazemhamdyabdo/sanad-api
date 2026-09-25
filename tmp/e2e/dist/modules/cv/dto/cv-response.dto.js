const ARRAY_SECTIONS = ['experience', 'projects', 'education', 'certificates', 'skills', 'languages'];
export function toCvResponseDto(cv, sections) {
    const contentBySection = new Map(sections.map((section) => [section.section, section.content]));
    const arrayFor = (id) => {
        const content = contentBySection.get(id);
        if (content === undefined) {
            return [];
        }
        return Array.isArray(content) ? content : [content];
    };
    return {
        cvId: cv.id,
        isComplete: cv.isComplete,
        updatedAt: cv.updatedAt.toISOString(),
        confirmedSections: cv.confirmedSections,
        name: cv.name,
        title: cv.title,
        contact: cv.contact,
        summary: cv.summary,
        experience: arrayFor('experience'),
        projects: arrayFor('projects'),
        education: arrayFor('education'),
        certificates: arrayFor('certificates'),
        skills: arrayFor('skills'),
        languages: arrayFor('languages'),
    };
}
export { ARRAY_SECTIONS };
//# sourceMappingURL=cv-response.dto.js.map