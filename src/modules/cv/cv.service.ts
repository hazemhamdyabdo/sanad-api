import { Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import { generateId } from '../../common/ids.js';
import type { SectionId } from '../../common/types/contract.js';
import { CvRepository } from './cv.repository.js';
import type { CvContact } from './entities/cv.entity.js';

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
}
