import { Logger, type ValidationError } from '@nestjs/common';
import { AppError } from '../errors/app-error.js';

const logger = new Logger('Validation');
const ARABIC_LETTER = /[؀-ۿ]/;
const GENERIC_MESSAGE = 'في حاجة في الطلب مش مظبوطة، جرّب تاني';

function firstArabicMessage(errors: ValidationError[]): string | null {
  for (const error of errors) {
    const message = Object.values(error.constraints ?? {}).find((text) => ARABIC_LETTER.test(text));
    if (message) return message;
    const nested = firstArabicMessage(error.children ?? []);
    if (nested) return nested;
  }
  return null;
}

/** "jobIds(arrayMaxSize)" — which rule failed on which field, never the submitted values. */
function describe(errors: ValidationError[], prefix = ''): string[] {
  return errors.flatMap((error) => [
    ...Object.keys(error.constraints ?? {}).map((rule) => `${prefix}${error.property}(${rule})`),
    ...describe(error.children ?? [], `${prefix}${error.property}.`),
  ]);
}

/**
 * Every request-validation failure becomes the contract's error envelope in Egyptian Arabic.
 * class-validator's own messages are English ("jobIds must contain no more than 20 elements") and
 * must never reach the user: a constraint the app can actually hit carries its own Arabic `message`
 * in the DTO, anything else gets the generic line. The English detail goes to the log only.
 */
export function validationExceptionFactory(errors: ValidationError[]): AppError {
  logger.warn(`Request validation failed: ${describe(errors).join(', ')}`);
  return new AppError('INVALID_REQUEST', firstArabicMessage(errors) ?? GENERIC_MESSAGE, { retryable: false });
}
