import { Injectable } from '@nestjs/common';

interface CvPdfDocument {
  name: string | null;
  title: string | null;
  contact: { phone?: string | null; email?: string | null; location?: string | null } | null;
  summary: string | null;
  experience: unknown[];
  projects: unknown[];
  education: unknown[];
  certificates: unknown[];
  skills: unknown[];
  languages: unknown[];
}

interface PdfLine {
  text: string;
  size: number;
  bold?: boolean;
  /** Extra space below the line, in points. */
  gapAfter?: number;
  /** Horizontal offset from the left margin — hanging bullet continuations. */
  indent?: number;
  /** Drawn right-aligned on the same baseline (e.g. a role's dates). */
  right?: string;
  /** A thin rule under the line (section titles). */
  rule?: boolean;
}

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BULLET_INDENT = 10;
const BODY = 10;

/**
 * Helvetica / Helvetica-Bold advance widths (1/1000 em) for printable ASCII 32–126, from the
 * standard AFM metrics — what the PDF viewer will actually use, so wrapping is exact rather than a
 * character-count guess.
 */
// prettier-ignore
const HELVETICA = [278,278,355,556,556,889,667,222,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,222,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
// prettier-ignore
const HELVETICA_BOLD = [278,333,474,556,556,889,722,278,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,278,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];

function textWidth(value: string, size: number, bold = false): number {
  const table = bold ? HELVETICA_BOLD : HELVETICA;
  let units = 0;
  for (const char of value) {
    units += table[char.charCodeAt(0) - 32] ?? 556;
  }
  return (units * size) / 1000;
}

function plainObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** The standard Type1 fonts only cover ASCII reliably — dashes/quotes are mapped, accents folded, anything else dropped. */
function ascii(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[‐-―]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[•·]/g, '-')
    .replace(/[^\x20-\x7e]/g, '');
}

function escapePdf(value: string): string {
  return ascii(value).replace(/([\\()])/g, '\\$1');
}

function capitalize(value: string): string {
  return value ? value[0]!.toUpperCase() + value.slice(1) : value;
}

/** Greedy word wrap against real glyph widths. */
function wrap(value: string, size: number, width: number, bold = false): string[] {
  const words = ascii(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && textWidth(candidate, size, bold) > width) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function addParagraph(lines: PdfLine[], value: string, size = BODY, bold = false): void {
  wrap(value, size, CONTENT_WIDTH, bold).forEach((part) => lines.push({ text: part, size, bold }));
}

function addBullet(lines: PdfLine[], value: string): void {
  wrap(value, BODY, CONTENT_WIDTH - BULLET_INDENT).forEach((part, index) =>
    lines.push(index === 0 ? { text: `-  ${part}`, size: BODY } : { text: part, size: BODY, indent: BULLET_INDENT }),
  );
}

function addSection(lines: PdfLine[], title: string): void {
  if (lines.length > 0) lines.push({ text: '', size: 6, gapAfter: 2 });
  lines.push({ text: title.toUpperCase(), size: 10.5, bold: true, gapAfter: 6, rule: true });
}

function bulletsOf(item: Record<string, unknown>): string[] {
  return Array.isArray(item.bullets) ? item.bullets.map(text).filter(Boolean) : [];
}

const LANGUAGE_LEVEL_LABELS: Record<string, string> = { native: 'Native', expert: 'Fluent', advanced: 'Advanced', intermediate: 'Intermediate', beginner: 'Basic' };

function buildLines(cv: CvPdfDocument): PdfLine[] {
  const lines: PdfLine[] = [];
  lines.push({ text: text(cv.name).toUpperCase() || 'CURRICULUM VITAE', size: 20, bold: true, gapAfter: 4 });
  if (cv.title) lines.push({ text: cv.title, size: 12, gapAfter: 3 });
  const contact = [cv.contact?.phone, cv.contact?.email, cv.contact?.location].filter((value): value is string => !!value);
  if (contact.length) lines.push({ text: contact.join('  |  '), size: 9, gapAfter: 8 });

  if (cv.summary) {
    addSection(lines, 'Summary');
    addParagraph(lines, cv.summary);
  }

  const experiences = cv.experience.map(plainObject);
  if (experiences.length) {
    addSection(lines, 'Experience');
    for (const item of experiences) {
      const start = text(item.start);
      const period = start ? `${start} - ${text(item.end) || 'Present'}` : text(item.end);
      const heading = [text(item.title), text(item.company)].filter(Boolean).join(' - ');
      // Keep the heading clear of the right-aligned dates; wrap only if it really doesn't fit.
      const headingWidth = CONTENT_WIDTH - (period ? textWidth(ascii(period), 9) + 12 : 0);
      wrap(heading, 11, headingWidth, true).forEach((part, index) =>
        lines.push({ text: part, size: 11, bold: true, gapAfter: 1, right: index === 0 && period ? period : undefined }),
      );
      bulletsOf(item).forEach((bullet) => addBullet(lines, bullet));
      lines.push({ text: '', size: 4, gapAfter: 2 });
    }
  }

  const projects = cv.projects.map(plainObject);
  if (projects.length) {
    addSection(lines, 'Projects');
    for (const item of projects) {
      if (text(item.title)) lines.push({ text: text(item.title), size: 11, bold: true, gapAfter: 1 });
      if (text(item.description)) addParagraph(lines, text(item.description));
      bulletsOf(item).forEach((bullet) => addBullet(lines, bullet));
      lines.push({ text: '', size: 4, gapAfter: 2 });
    }
  }

  const education = cv.education.map(plainObject);
  if (education.length) {
    addSection(lines, 'Education');
    for (const item of education) {
      const heading = [text(item.degree), text(item.school)].filter(Boolean).join(' - ');
      wrap(heading, BODY, CONTENT_WIDTH - 40, true).forEach((part, index) =>
        lines.push({ text: part, size: BODY, bold: true, gapAfter: 2, right: index === 0 ? text(item.year) || undefined : undefined }),
      );
    }
  }

  const certificates = cv.certificates.map(plainObject);
  if (certificates.length) {
    addSection(lines, 'Certificates');
    for (const item of certificates) {
      lines.push({ text: text(item.name), size: BODY, gapAfter: 2, right: text(item.date) || undefined });
    }
  }

  // Compact "Name (Level), Name (Level)" lines — one skill per line wastes half a page. Languages share
  // the skills' level scale, but "English (Expert)" / "German (Beginner)" isn't how a CV says it.
  const withLevels = (values: unknown[], labels: Record<string, string> = {}) =>
    values
      .map(plainObject)
      .map((item) => {
        const level = text(item.level);
        return level ? `${text(item.name)} (${labels[level.toLowerCase()] ?? capitalize(level)})` : text(item.name);
      })
      .filter(Boolean)
      .join(', ');
  if (cv.skills.length) {
    addSection(lines, 'Skills');
    addParagraph(lines, withLevels(cv.skills));
  }
  if (cv.languages.length) {
    addSection(lines, 'Languages');
    addParagraph(lines, withLevels(cv.languages, LANGUAGE_LEVEL_LABELS));
  }
  return lines;
}

function lineHeight(line: PdfLine): number {
  return line.size * 1.35 + (line.gapAfter ?? 0);
}

function paginate(lines: PdfLine[]): PdfLine[][] {
  const pages: PdfLine[][] = [[]];
  let y = PAGE_HEIGHT - MARGIN;
  for (const line of lines) {
    if (y - lineHeight(line) < MARGIN && pages[pages.length - 1]!.length > 0) {
      pages.push([]);
      y = PAGE_HEIGHT - MARGIN;
    }
    pages[pages.length - 1]!.push(line);
    y -= lineHeight(line);
  }
  return pages;
}

/**
 * The one place a CV becomes a PDF — `POST /cv/pdf` and every application's tailored CV both come
 * from here. Hand-written PDF with the standard Helvetica fonts: real, selectable text an ATS can
 * parse, no image, no dependency.
 */
@Injectable()
export class CvPdfRenderer {
  render(cv: CvPdfDocument): Buffer {
    const pages = paginate(buildLines(cv));
    const objects: string[] = [];
    const add = (body: string): number => (objects.push(body), objects.length);
    const catalogId = add('');
    const pagesId = add('');
    const regularFontId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const boldFontId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    const pageIds: number[] = [];

    for (const page of pages) {
      let y = PAGE_HEIGHT - MARGIN;
      const commands: string[] = [];
      for (const line of page) {
        const font = line.bold ? 'F2' : 'F1';
        if (line.text) {
          commands.push(`BT /${font} ${line.size} Tf ${(MARGIN + (line.indent ?? 0)).toFixed(2)} ${y.toFixed(2)} Td (${escapePdf(line.text)}) Tj ET`);
        }
        if (line.right) {
          const x = PAGE_WIDTH - MARGIN - textWidth(ascii(line.right), 9);
          commands.push(`BT /F1 9 Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapePdf(line.right)}) Tj ET`);
        }
        if (line.rule) {
          const ruleY = y - 3.5;
          commands.push(`0.6 G 0.5 w ${MARGIN} ${ruleY.toFixed(2)} m ${PAGE_WIDTH - MARGIN} ${ruleY.toFixed(2)} l S 0 G`);
        }
        y -= lineHeight(line);
      }
      const stream = commands.join('\n');
      const contentId = add(`<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}\nendstream`);
      pageIds.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R >>`));
    }

    objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
    objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

    let output = '%PDF-1.4\n%Sanad\n';
    const offsets = [0];
    objects.forEach((body, index) => {
      offsets.push(Buffer.byteLength(output, 'ascii'));
      output += `${index + 1} 0 obj\n${body}\nendobj\n`;
    });
    const xref = Buffer.byteLength(output, 'ascii');
    output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    output += offsets.slice(1).map((offset) => `${offset.toString().padStart(10, '0')} 00000 n \n`).join('');
    output += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return Buffer.from(output, 'ascii');
  }
}
