import type { CvResponseDto } from '../cv/index.js';

export interface ApplicationEmailContent {
  subject: string;
  text: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Header-safe display name: no quotes, angle brackets or line breaks that could break or inject into a header. */
export function headerSafe(value: string): string {
  return value.replace(/["<>\r\n]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * A listing title without the gender tag German (and Austrian/Swiss) ads carry — "(m/w/d)",
 * "(m/f/d)", "(w/m/x)", "(gn)", "(all genders)" — which reads oddly inside an English sentence.
 */
export function withoutGenderTag(title: string): string {
  return title
    .replace(/\s*[(\[]\s*(?:[mwfdx](?:\s*[/|,]\s*[mwfdx]){1,3}|gn\*?|all genders?|div)\s*[)\]]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The role a CV headline states, as a phrase that fits "I am a/an …": a headline like "AI Engineer
 * | NLP & LLM Applications" keeps only its first part. Null when there's nothing usable.
 */
function rolePhrase(headline: string | null): string | null {
  const first = headline?.split(/\s[|·•–—-]\s|[|·•]/)[0]?.trim();
  return first && first.length <= 60 ? first : null;
}

/** "a" or "an" by how the word is said — acronyms by their first letter's name ("an AI Engineer", "an MBA", "a UX Designer"). */
function indefiniteArticle(phrase: string): 'a' | 'an' {
  const word = phrase.split(/\s+/)[0] ?? '';
  if (/^[A-Z]{2,}\b/.test(word)) {
    return /^[AEFHILMNORSX]/.test(word) ? 'an' : 'a';
  }
  return /^[aeiou]/i.test(word) && !/^(uni|use|usu|euro|one)/i.test(word) ? 'an' : 'a';
}

/**
 * The application email a company receives. Plain and short on purpose — the CV is the content.
 * Everything in it comes from the job listing or the candidate's own CV; nothing is claimed that the
 * CV doesn't say. The footer is honest that it was sent through Sanad on the candidate's behalf, and
 * replies go straight to the candidate (Reply-To).
 */
export function buildApplicationEmail(cv: CvResponseDto, job: { title: string; company: string | null }): ApplicationEmailContent {
  const name = cv.name?.trim() || 'the candidate';
  const title = withoutGenderTag(job.title) || job.title;
  const greeting = job.company ? `Dear ${job.company} Hiring Team,` : 'Dear Hiring Team,';
  const position = job.company ? `the ${title} position at ${job.company}` : `the ${title} position`;
  const role = rolePhrase(cv.title);
  const background = role ? `I am ${indefiniteArticle(role)} ${role}, and I believe my experience is a strong fit for this role.` : 'I believe my experience is a strong fit for this role.';
  const contactLine = cv.contact?.phone ? `You can reach me by replying to this email or by phone at ${cv.contact.phone}.` : 'You can reach me by replying to this email.';
  const signature = [name, cv.contact?.phone, cv.contact?.email].filter((line): line is string => !!line);
  const footer = `This application was sent via Sanad on behalf of ${name}. Replies go directly to the candidate.`;

  const paragraphs = [greeting, `I would like to apply for ${position}. ${background}`, 'My CV is attached for your review. I would welcome the opportunity to discuss how I can contribute to your team.', contactLine];

  const text = `${paragraphs.join('\n\n')}\n\nBest regards,\n${signature.join('\n')}\n\n--\n${footer}\n`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1f2933;">
${paragraphs.map((paragraph) => `<p style="margin:0 0 14px;">${escapeHtml(paragraph)}</p>`).join('\n')}
<p style="margin:18px 0 0;">Best regards,<br>${signature.map(escapeHtml).join('<br>')}</p>
<hr style="border:none;border-top:1px solid #e4e7eb;margin:24px 0 12px;">
<p style="margin:0;font-size:12px;color:#7b8794;">${escapeHtml(footer)}</p>
</body></html>`;

  return { subject: `Application for ${title} – ${name}`, text, html };
}
