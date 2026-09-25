import type { CvResponseDto } from '../cv/index.js';
import { COUNTRY_NAME_EN, countryOfLocation, TARGET_COUNTRIES, type TargetCountry } from '../jobs/index.js';

/** An Egyptian mobile number written the local way: 11 digits starting 010/011/012/015. */
const EGYPT_LOCAL_MOBILE = /^01[0125]\d{8}$/;

/**
 * A phone number a company abroad can actually dial. Only rewrites what is unambiguous — an Egyptian
 * local mobile ("0101 234 5678" → "+20 101 234 5678"); anything already international, or any
 * other format, is left exactly as the candidate wrote it.
 */
export function internationalPhone(phone: string): string {
  const digits = phone.replace(/[\s().-]/g, '');
  if (EGYPT_LOCAL_MOBILE.test(digits)) {
    return `+20 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  if (/^0020\d+$/.test(digits)) {
    return internationalPhone(`0${digits.slice(4)}`);
  }
  return phone;
}

/**
 * The candidate's contact details as a company in `jobCountry` needs them. Nothing is invented: the
 * phone gets its country code only when the local format makes the country certain, and the
 * location gets its country's name only when a known city in it already says which country that is
 * and the job is in another one ("Nasr City, Cairo" → "Nasr City, Cairo, Egypt" for a German company).
 */
export function contactForJobCountry(cv: CvResponseDto, jobCountry: string): CvResponseDto {
  if (!cv.contact) {
    return cv;
  }
  const contact = { ...cv.contact };
  if (contact.phone) {
    contact.phone = internationalPhone(contact.phone);
  }
  const home = countryOfLocation(contact.location);
  const target = TARGET_COUNTRIES.find((code) => code === jobCountry) as TargetCountry | undefined;
  // Latin-script locations only — "الإسكندرية, Egypt" would be worse than leaving it alone.
  const latin = !!contact.location && !/[؀-ۿ]/.test(contact.location);
  if (contact.location && latin && home && home !== target && !contact.location.toLowerCase().includes(COUNTRY_NAME_EN[home].toLowerCase())) {
    contact.location = `${contact.location}, ${COUNTRY_NAME_EN[home]}`;
  }
  return { ...cv, contact };
}
