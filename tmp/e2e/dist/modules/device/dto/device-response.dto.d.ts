import type { SectionId } from '../../../common/types/contract.js';
export interface DeviceStateDto {
    hasCv: boolean;
    activeSessionId: string | null;
    completedSections: SectionId[];
    nextSection: SectionId | null;
}
export interface DeviceResponseDto {
    deviceId: string;
    createdAt: string;
    state: DeviceStateDto;
}
