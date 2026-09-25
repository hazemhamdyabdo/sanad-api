/** The three background-processing stages, in order — same keys `Upload.currentStage` stores and `GET /cv/uploads/:uploadId` returns. See API-CONTRACT.md §4. */
export const UPLOAD_STAGES = [
  { key: 'reading', text: 'بنقرا الملف...' },
  { key: 'analyzing', text: 'بنحلل خبراتك ومهاراتك...' },
  { key: 'checking', text: 'بنشوف الناقص إيه...' },
] as const;

export type UploadStageKey = (typeof UPLOAD_STAGES)[number]['key'];
