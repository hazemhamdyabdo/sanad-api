import { type MessageSource } from '../../../common/types/contract.js';
export declare class SendMessageDto {
    text: string;
    source: MessageSource;
    audioDurationSec?: number;
}
