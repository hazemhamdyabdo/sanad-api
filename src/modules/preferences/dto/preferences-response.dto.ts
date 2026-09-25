import type { WorkType } from '../../../common/types/contract.js';

/** `PUT /preferences`'s response, and the `preferences` object inside `GET /jobs/matches` — see API-CONTRACT.md §6. */
export interface PreferencesResponseDto {
  country: string;
  city: string | null;
  workTypes: WorkType[];
  willingToRelocate: boolean;
}
