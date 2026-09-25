export function toMessageResponseDto(message) {
    return {
        id: message.id,
        role: message.role,
        section: message.section,
        type: message.type,
        text: message.text,
        card: message.card,
        quickReplies: message.quickReplies,
        source: message.source,
        audioDurationSec: message.audioDurationSec,
        createdAt: message.createdAt.toISOString(),
    };
}
//# sourceMappingURL=conversation-response.dto.js.map