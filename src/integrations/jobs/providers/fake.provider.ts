import type { JobProvider, JobSearchQuery, JobSearchResult, ProviderJob } from '../job-provider.interface.js';

/** Role-specific requirements, so fake listings differ in what actually matters for matching. Keywords without an entry get generic ones. */
const SKILLS_BY_KEYWORD: Record<string, string[]> = {
  'frontend developer': ['React', 'TypeScript', 'CSS', 'REST APIs'],
  'backend developer': ['Node.js', 'PostgreSQL', 'REST APIs', 'Docker'],
  'full stack developer': ['React', 'Node.js', 'PostgreSQL', 'TypeScript'],
  'mobile app developer': ['Flutter', 'React Native', 'Firebase', 'REST APIs'],
  accountant: ['Microsoft Excel', 'IFRS', 'bank reconciliations', 'ERP systems (SAP or Odoo)'],
  'accounts assistant': ['Microsoft Excel', 'data entry', 'invoicing', 'accounts payable'],
  'sales representative': ['B2B sales', 'negotiation', 'CRM tools', 'customer follow-up'],
  'retail cashier': ['cash handling', 'POS systems', 'customer service'],
  'retail store manager': ['team leadership', 'inventory management', 'sales targets', 'visual merchandising'],
  cook: ['food safety', 'menu preparation', 'kitchen hygiene'],
  waiter: ['customer service', 'order taking', 'English communication'],
  barista: ['espresso preparation', 'latte art', 'cash handling'],
  'hotel receptionist': ['Opera PMS', 'check-in and check-out', 'English communication'],
  'ai engineer': ['Python', 'LLMs and RAG', 'PyTorch', 'MLOps'],
  'machine learning engineer': ['Python', 'PyTorch', 'scikit-learn', 'Kubernetes'],
  'data scientist': ['Python', 'SQL', 'statistics', 'A/B testing'],
};
const DEFAULT_SKILLS = ['relevant experience', 'communication skills', 'teamwork'];

const CITIES_BY_LOCATION: Record<string, string[]> = {
  Egypt: ['Cairo', 'Giza', 'Alexandria'],
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Dammam'],
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah'],
  Germany: ['Berlin', 'München', 'Hamburg'],
};

const GERMAN_COMPANIES = ['Nordlicht Analytics GmbH', 'Rheinwerk Digital AG', 'Isar Robotics GmbH', 'Elbe Health Tech GmbH', 'Spree Mobility GmbH'];
const COMPANIES = ['Nile Trading Co.', 'Delta Foods', 'Pyramid Tech', 'Lotus Retail Group', 'Red Sea Hotels', 'Horizon Solutions', 'Sphinx Logistics'];
/** Desk roles that can plausibly be remote; everything else gets shifts/part-time variety instead. */
const REMOTE_CAPABLE = new Set(['ai engineer', 'machine learning engineer', 'data scientist', 'frontend developer', 'backend developer', 'full stack developer', 'mobile app developer', 'accountant', 'accounts assistant']);
const SHIFT_WORK = new Set(['cook', 'waiter', 'barista', 'hotel receptionist', 'retail cashier']);

function titleCase(text: string): string {
  return text.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function pick<T>(items: T[], seed: string): T {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return items[hash % items.length];
}

/**
 * No network calls, no cost — the default so nothing can accidentally spend real Jooble budget in
 * dev/testing. Returns three deterministic, realistic-looking listings per query (junior/mid/senior,
 * three different cities, on-site/hybrid/remote-or-shifts, one email-apply), so matching's filters,
 * seniority gaps and ranking can all be exercised offline. Ids are stable per (keyword, location,
 * variant): re-running the seed updates rows in place instead of adding duplicates.
 */
export class FakeJobProvider implements JobProvider {
  supportsCountry(): boolean {
    return true;
  }

  search(query: JobSearchQuery): Promise<JobSearchResult> {
    const keyword = query.keywords;
    const skills = SKILLS_BY_KEYWORD[keyword.toLowerCase()] ?? DEFAULT_SKILLS;
    const cities = CITIES_BY_LOCATION[query.location] ?? [query.location, query.location, query.location];
    const baseTitle = titleCase(keyword);

    const variants = [
      { title: `Junior ${baseTitle}`, years: '0-2 years', skills: skills.slice(0, 2) },
      { title: baseTitle, years: '2-4 years', skills: skills.slice(0, 3) },
      { title: `Senior ${baseTitle}`, years: '5+ years', skills },
    ];

    if (query.location === 'Germany') {
      return Promise.resolve(germanListings(query, baseTitle, skills, cities));
    }

    const jobs: ProviderJob[] = variants.map((variant, index) => {
      const id = `fake-${slug(keyword)}-${slug(query.location)}-${index + 1}`;
      const city = cities[index];
      const company = pick(COMPANIES, id);
      const remoteCapable = REMOTE_CAPABLE.has(keyword.toLowerCase());
      const shiftWork = SHIFT_WORK.has(keyword.toLowerCase());

      const workLine =
        index === 1 ? 'Hybrid work: 3 days a week in the office.' : index === 2 && remoteCapable ? 'This is a fully remote position.' : index === 0 && shiftWork ? 'Rotating shifts, including weekends.' : 'Work from our office.';
      const applyLine = index === 1 ? `Send your CV to careers@${slug(company)}.example.com to apply.` : 'Apply through the link below.';
      const jobType = index === 2 && !remoteCapable ? 'Part-time' : 'Full-time';

      return {
        externalId: id,
        title: variant.title,
        company,
        location: `${city}, ${query.location}`,
        snippet: `${company} is hiring a ${variant.title} in ${city}. Requirements: ${variant.years} of experience with ${variant.skills.join(', ')}. ${workLine} ${applyLine}`,
        salary: null,
        jobType,
        link: `https://example.com/jobs/${id}`,
        source: 'fake',
        updatedAt: new Date(Date.UTC(2026, 8, 20 + index)).toISOString(),
        raw: { id, title: variant.title, fake: true },
      };
    });

    return Promise.resolve({ jobs, totalCount: jobs.length });
  }
}

/**
 * Germany as the real German market looks: titles carry "(m/w/d)", most listings are written in
 * German (one English, as Berlin tech often is), one asks for German at C1, one takes applications
 * by email ("Bewerbung per E-Mail"). Like the real German feed, the mid-level job is posted twice
 * (a second city, same company and title) and one listing is actually in Austria — exercises
 * cross-language matching, the German facets, duplicate collapsing and the market filter.
 */
function germanListings(query: JobSearchQuery, baseTitle: string, skills: string[], cities: string[]): JobSearchResult {
  const make = (index: number, title: string, snippet: string, jobType: string, place?: { city: string; location: string; companyOf?: number }): ProviderJob => {
    const id = `fake-${slug(query.keywords)}-germany-${index + 1}`;
    const company = GERMAN_COMPANIES[((place?.companyOf ?? index) + query.keywords.length) % GERMAN_COMPANIES.length];
    const city = place?.city ?? cities[index];
    return {
      externalId: id,
      title,
      company,
      location: place?.location ?? `${city}, Deutschland`,
      snippet: snippet.replaceAll('{company}', company).replaceAll('{city}', city).replaceAll('{slug}', slug(company)),
      salary: null,
      jobType,
      link: `https://example.com/jobs/${id}`,
      source: 'fake',
      updatedAt: new Date(Date.UTC(2026, 8, 20 + index)).toISOString(),
      raw: { id, title, fake: true },
    };
  };
  const jobs = [
    make(0, `Junior ${baseTitle} (m/f/d)`, `{company} is looking for a Junior ${baseTitle} to join our team in {city}. You bring first experience (0-2 years) with ${skills.slice(0, 2).join(' and ')}. Our team language is English. On-site in our {city} office. Apply via our careers page.`, 'Full-time'),
    make(1, `${baseTitle} (m/w/d)`, `Für unser Team in {city} suchen wir eine:n ${baseTitle} (m/w/d). Ihre Aufgaben: Entwicklung und Betrieb von Modellen in Produktion. Ihr Profil: mindestens 3 Jahre Berufserfahrung mit ${skills.slice(0, 3).join(', ')}; gute Englischkenntnisse, Deutschkenntnisse von Vorteil. Hybrides Arbeiten: 3 Tage pro Woche im Büro. Bewerbung per E-Mail an karriere@{slug}.example.com.`, 'Vollzeit'),
    // The same mid-level job, posted again for Frankfurt.
    make(3, `${baseTitle} (m/w/d)`, `Für unser Team in {city} suchen wir eine:n ${baseTitle} (m/w/d). Ihr Profil: mindestens 3 Jahre Berufserfahrung mit ${skills.slice(0, 3).join(', ')}. Hybrides Arbeiten möglich.`, 'Vollzeit', { city: 'Frankfurt am Main', location: 'Frankfurt am Main', companyOf: 1 }),
    // Not a German job at all — de.jooble.org returns Austrian listings too.
    make(4, `${baseTitle} (m/w/d)`, `Wir suchen in Wien eine:n ${baseTitle} (m/w/d) mit Erfahrung in ${skills.slice(0, 2).join(' und ')}.`, 'Vollzeit', { city: 'Wien', location: 'Österreich', companyOf: 4 }),
    make(2, `Senior ${baseTitle} (m/w/d)`, `{company} sucht in {city} eine:n Senior ${baseTitle} (m/w/d). Anforderungen: 5+ Jahre Erfahrung mit ${skills.join(', ')}, Erfahrung in der Führung kleiner Teams, sehr gute Deutschkenntnisse (mindestens C1) und gute Englischkenntnisse. 100% Remote innerhalb Deutschlands möglich.`, 'Vollzeit'),
  ];
  return { jobs, totalCount: jobs.length };
}
