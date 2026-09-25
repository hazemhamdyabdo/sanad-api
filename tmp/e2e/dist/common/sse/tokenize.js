export function tokenize(text) {
    return text.match(/\S+\s*/g) ?? (text ? [text] : []);
}
//# sourceMappingURL=tokenize.js.map