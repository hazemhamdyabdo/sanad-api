import { describe, expect, it } from 'vitest';
import { applicationCvFilename } from './application-filename.js';

const base = { id: 'app_3e6b6c8e1234abcd', jobTitle: 'Senior Accountant', company: 'Nile Trading Co.' };
const cv = (name: string | null) => ({ name }) as unknown as NonNullable<Parameters<typeof applicationCvFilename>[0]['tailoredCv']>;

describe('applicationCvFilename', () => {
  it('joins name, job title and company as ASCII hyphenated segments', () => {
    expect(applicationCvFilename({ ...base, tailoredCv: cv('Ahmed Hassan') })).toBe('Ahmed-Hassan-Senior-Accountant-Nile-Trading-Co.pdf');
  });

  it('strips path separators and anything a filesystem might reject', () => {
    expect(applicationCvFilename({ ...base, jobTitle: 'Dev/Ops "Lead" <night>', company: 'A:B|C*?', tailoredCv: cv('Sara') })).toBe('Sara-Dev-Ops-Lead-night-A-B-C.pdf');
  });

  it('folds accents and drops Arabic rather than emitting it', () => {
    expect(applicationCvFilename({ ...base, jobTitle: 'محاسب', company: 'Müller GmbH', tailoredCv: cv('Ahmed Hassan') })).toBe('Ahmed-Hassan-Job-34abcd-Muller-GmbH.pdf');
  });

  it('never produces a bare cv.pdf', () => {
    expect(applicationCvFilename({ ...base, jobTitle: 'محاسب', company: null, tailoredCv: null })).toBe('CV-Job-34abcd.pdf');
  });

  it('leaves the company out when unknown', () => {
    expect(applicationCvFilename({ ...base, company: null, tailoredCv: cv('Ahmed Hassan') })).toBe('Ahmed-Hassan-Senior-Accountant.pdf');
  });
});
