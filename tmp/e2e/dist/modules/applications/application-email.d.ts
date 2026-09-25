import type { CvResponseDto } from '../cv/index.js';
export interface ApplicationEmailContent {
    subject: string;
    text: string;
    html: string;
}
export declare function headerSafe(value: string): string;
export declare function buildApplicationEmail(cv: CvResponseDto, job: {
    title: string;
    company: string | null;
}): ApplicationEmailContent;
