const ERROR_MESSAGES = {
    no_candidate_email: 'مفيش إيميل في الـ CV بتاعك، فالشركة مش هتعرف ترد عليك. ضيف إيميلك في الـ CV وجرب تاني.',
    send_failed: 'مقدرناش نبعت الإيميل للشركة دلوقتي، جرب تاني كمان شوية.',
    job_unavailable: 'الوظيفة دي مبقتش متاحة.',
    internal: 'حصل خطأ واحنا بنقدّم على الوظيفة دي، جرب تاني.',
};
const iso = (date) => (date ? date.toISOString() : null);
export function toApplicationDto(application) {
    return {
        id: application.id,
        batchId: application.batchId,
        jobId: application.jobId,
        job: {
            title: application.jobTitle,
            company: application.company,
            location: application.location,
            url: application.listingUrl,
            email: application.recipientEmail,
        },
        method: application.method,
        status: application.status,
        stage: application.status === 'processing' ? application.stage : null,
        cvAvailable: application.tailoredCv !== null,
        cvTailored: application.cvTailored,
        error: application.status === 'failed' && application.errorCode ? { message: ERROR_MESSAGES[application.errorCode] } : null,
        createdAt: application.createdAt.toISOString(),
        updatedAt: application.updatedAt.toISOString(),
        sentAt: iso(application.sentAt),
        preparedAt: iso(application.preparedAt),
        openedAt: iso(application.openedAt),
        failedAt: iso(application.failedAt),
    };
}
//# sourceMappingURL=application-response.dto.js.map