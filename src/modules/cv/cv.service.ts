import { Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import { generateId } from '../../common/ids.js';
import { AppError } from '../../common/errors/app-error.js';
import type { SectionId } from '../../common/types/contract.js';
import { CvRepository } from './cv.repository.js';
import { ARRAY_SECTIONS, toCvResponseDto, type CvResponseDto } from './dto/cv-response.dto.js';
import type { PatchCvDto } from './dto/patch-cv.dto.js';
import type { CvContact } from './entities/cv.entity.js';
import { cvPatchSchema } from './schemas/cv-patch.schema.js';

export interface ConfirmSectionResult {
  cvId: string;
  isComplete: boolean;
}

interface BasicCardShape {
  name?: string | null;
  title?: string | null;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
}

@Injectable()
export class CvService {
  constructor(private readonly cvRepository: CvRepository) {}

  existsForDevice(deviceId: string): Promise<boolean> {
    return this.cvRepository.existsForDevice(deviceId);
  }

  deleteById(id: string, manager?: EntityManager): Promise<void> {
    return this.cvRepository.deleteById(id, manager);
  }

  /**
   * Creates the cv row on first confirm, stores the section's content as its
   * own CvSection row, and closes the cv (isComplete: true) when isLast.
   * `basic` additionally projects onto the cv's own name/title/contact
   * columns, since those are flat fields on the final CV rather than a
   * section array — everything else (experience, education, ...) only ever
   * lives in its CvSection row. Runs inside the caller's transaction.
   */
  async confirmSection(
    deviceId: string,
    existingCvId: string | null,
    section: SectionId,
    content: Record<string, unknown> | unknown[],
    isLast: boolean,
    manager: EntityManager,
  ): Promise<ConfirmSectionResult> {
    let cv = existingCvId ? await this.cvRepository.findById(existingCvId, manager) : null;
    if (!cv) {
      cv = await this.cvRepository.createCv(
        {
          id: generateId('cv'),
          deviceId,
          isComplete: false,
          confirmedSections: [],
          name: null,
          title: null,
          contact: null,
          summary: null,
        },
        manager,
      );
    }

    await this.cvRepository.createSection(
      {
        id: generateId('sec'),
        cvId: cv.id,
        section,
        content,
        confirmedAt: new Date(),
      },
      manager,
    );

    if (section === 'basic' && !Array.isArray(content)) {
      const basic = content as BasicCardShape;
      cv.name = basic.name ?? null;
      cv.title = basic.title ?? null;
      cv.contact = { phone: basic.phone ?? undefined, email: basic.email ?? undefined, location: basic.location ?? undefined } satisfies CvContact;
    }

    if (!cv.confirmedSections.includes(section)) {
      cv.confirmedSections = [...cv.confirmedSections, section];
    }
    if (isLast) {
      cv.isComplete = true;
    }

    const saved = await this.cvRepository.saveCv(cv, manager);
    return { cvId: saved.id, isComplete: saved.isComplete };
  }

  async getForDevice(deviceId: string): Promise<CvResponseDto> {
    const cv = await this.cvRepository.findByDeviceId(deviceId);
    if (!cv) {
      throw new AppError('NOT_FOUND', 'مفيش سيرة ذاتية لسه للجهاز ده', { retryable: false });
    }
    const sections = await this.cvRepository.findSectionsByCvId(cv.id);
    return toCvResponseDto(cv, sections);
  }

  /**
   * Applies one or more sections' worth of edits from the review screen. Each field is validated
   * against the same shape the conversation flow itself produces (`cvPatchSchema`, built from
   * `CARD_SCHEMA_BY_SECTION`) — a section edited this way counts as confirmed from then on, same as
   * if the user had confirmed it in the conversation.
   */
  async patch(deviceId: string, dto: PatchCvDto): Promise<CvResponseDto> {
    const cv = await this.cvRepository.findByDeviceId(deviceId);
    if (!cv) {
      throw new AppError('NOT_FOUND', 'مفيش سيرة ذاتية لسه للجهاز ده', { retryable: false });
    }

    const result = cvPatchSchema.safeParse(dto);
    if (!result.success) {
      throw new AppError('INVALID_REQUEST', 'البيانات اللي بعتها مش صحيحة', { retryable: false });
    }
    const patch = result.data;

    if (patch.name !== undefined) {
      cv.name = patch.name;
    }
    if (patch.title !== undefined) {
      cv.title = patch.title;
    }
    if (patch.contact !== undefined) {
      const { phone, email, location } = patch.contact;
      cv.contact = {
        ...cv.contact,
        ...(phone !== undefined && { phone: phone ?? undefined }),
        ...(email !== undefined && { email: email ?? undefined }),
        ...(location !== undefined && { location: location ?? undefined }),
      } satisfies CvContact;
    }
    if (patch.summary !== undefined) {
      cv.summary = patch.summary;
    }
    if ((patch.name !== undefined || patch.title !== undefined || patch.contact !== undefined) && !cv.confirmedSections.includes('basic')) {
      cv.confirmedSections = [...cv.confirmedSections, 'basic'];
    }

    for (const section of ARRAY_SECTIONS) {
      const content = patch[section];
      if (content === undefined) {
        continue;
      }
      await this.cvRepository.upsertSection(cv.id, section, content);
      if (!cv.confirmedSections.includes(section)) {
        cv.confirmedSections = [...cv.confirmedSections, section];
      }
    }

    await this.cvRepository.saveCv(cv);
    const sections = await this.cvRepository.findSectionsByCvId(cv.id);
    return toCvResponseDto(cv, sections);
  }
}
