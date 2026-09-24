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
  gapAfter?: number;
}

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function plainObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function ascii(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[\u2022]/g, '-')
    .replace(/[^\x20-\x7e]/g, '');
}

function escapePdf(value: string): string {
  return ascii(value).replace(/([\\()])/g, '\\$1');
}

function wrap(value: string, size: number, prefix = ''): string[] {
  const maxChars = Math.max(20, Math.floor(CONTENT_WIDTH / (size * 0.52)));
  const words = ascii(value).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = prefix;
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current.trim()) {
      lines.push(current);
      current = `${lines.length === 1 && prefix ? '  ' : ''}${word}`;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) lines.push(current);
  return lines;
}

function addSection(lines: PdfLine[], title: string): void {
  if (lines.length > 0) lines.push({ text: '', size: 7, gapAfter: 3 });
  lines.push({ text: title.toUpperCase(), size: 10, bold: true, gapAfter: 5 });
}

function buildLines(cv: CvPdfDocument): PdfLine[] {
  const lines: PdfLine[] = [];
  lines.push({ text: text(cv.name).toUpperCase() || 'CURRICULUM VITAE', size: 20, bold: true, gapAfter: 4 });
  if (cv.title) lines.push({ text: cv.title, size: 12, gapAfter: 3 });
  const contact = [cv.contact?.phone, cv.contact?.email, cv.contact?.location].filter((value): value is string => !!value);
  if (contact.length) lines.push({ text: contact.join(' | '), size: 9, gapAfter: 7 });

  if (cv.summary) {
    addSection(lines, 'Summary');
    wrap(cv.summary, 10).forEach((value) => lines.push({ text: value, size: 10 }));
  }

  const projects = cv.projects.map(plainObject);
  const experiences = cv.experience.map(plainObject);
  if (experiences.length) {
    addSection(lines, 'Experience');
    for (const item of experiences) {
      const heading = [text(item.title), text(item.company)].filter(Boolean).join(' - ');
      if (heading) lines.push({ text: heading, size: 11, bold: true, gapAfter: 2 });
      const period = [text(item.start), text(item.end)].filter(Boolean).join(' - ');
      if (period) lines.push({ text: period, size: 9, gapAfter: 2 });
      const bullets = Array.isArray(item.bullets) ? item.bullets : [];
      bullets.forEach((bullet) => wrap(text(bullet), 10, '-').forEach((value) => lines.push({ text: value, size: 10 })));
      lines.push({ text: '', size: 5, gapAfter: 2 });
    }
  }

  if (projects.length) {
    addSection(lines, 'Projects');
    for (const item of projects) {
      if (text(item.title)) lines.push({ text: text(item.title), size: 11, bold: true, gapAfter: 2 });
      wrap(text(item.description), 10).forEach((value) => lines.push({ text: value, size: 10 }));
      const bullets = Array.isArray(item.bullets) ? item.bullets : [];
      bullets.forEach((bullet) => wrap(text(bullet), 10, '-').forEach((value) => lines.push({ text: value, size: 10 })));
      lines.push({ text: '', size: 5, gapAfter: 2 });
    }
  }

  const simpleSections: Array<[string, unknown[], (item: Record<string, unknown>) => string]> = [
    ['Education', cv.education, (item) => [text(item.degree), text(item.school), text(item.year)].filter(Boolean).join(' | ')],
    ['Certificates', cv.certificates, (item) => [text(item.name), text(item.date)].filter(Boolean).join(' | ')],
    ['Skills', cv.skills, (item) => [text(item.name), text(item.level)].filter(Boolean).join(' - ')],
    ['Languages', cv.languages, (item) => [text(item.name), text(item.level)].filter(Boolean).join(' - ')],
  ];
  for (const [title, values, format] of simpleSections) {
    if (!values.length) continue;
    addSection(lines, title);
    values.map(plainObject).map(format).filter(Boolean).forEach((value) => wrap(value, 10).forEach((part) => lines.push({ text: part, size: 10 })));
  }
  return lines;
}

function paginate(lines: PdfLine[]): PdfLine[][] {
  const pages: PdfLine[][] = [[]];
  let y = PAGE_HEIGHT - MARGIN;
  for (const line of lines) {
    const height = line.size * 1.35 + (line.gapAfter ?? 0);
    if (y - height < MARGIN && pages[pages.length - 1]!.length > 0) {
      pages.push([]);
      y = PAGE_HEIGHT - MARGIN;
    }
    pages[pages.length - 1]!.push(line);
    y -= height;
  }
  return pages;
}

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
        if (line.text) {
          commands.push(`BT /${line.bold ? 'F2' : 'F1'} ${line.size} Tf ${MARGIN} ${y.toFixed(2)} Td (${escapePdf(line.text)}) Tj ET`);
        }
        y -= line.size * 1.35 + (line.gapAfter ?? 0);
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
