interface CvPdfDocument {
    name: string | null;
    title: string | null;
    contact: {
        phone?: string | null;
        email?: string | null;
        location?: string | null;
    } | null;
    summary: string | null;
    experience: unknown[];
    projects: unknown[];
    education: unknown[];
    certificates: unknown[];
    skills: unknown[];
    languages: unknown[];
}
export declare class CvPdfRenderer {
    render(cv: CvPdfDocument): Buffer;
}
export {};
