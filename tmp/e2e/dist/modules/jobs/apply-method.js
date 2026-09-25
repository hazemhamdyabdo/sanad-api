const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
export function resolveApplyMethod(snippet) {
    const match = snippet?.match(EMAIL_PATTERN);
    if (match) {
        return { method: 'email', email: match[0] };
    }
    return { method: 'external', email: null };
}
//# sourceMappingURL=apply-method.js.map