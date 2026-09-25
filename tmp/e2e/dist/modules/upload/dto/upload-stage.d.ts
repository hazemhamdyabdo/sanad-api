export declare const UPLOAD_STAGES: readonly [{
    readonly key: "reading";
    readonly text: "بنقرا الملف...";
}, {
    readonly key: "analyzing";
    readonly text: "بنحلل خبراتك ومهاراتك...";
}, {
    readonly key: "checking";
    readonly text: "بنشوف الناقص إيه...";
}];
export type UploadStageKey = (typeof UPLOAD_STAGES)[number]['key'];
