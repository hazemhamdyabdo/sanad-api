import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { buildCvTailorPrompt } from '../../src/ai/prompts/cv-tailor.prompt.js';
// Same as CvTailorService's (not exported) — diagnostic copy.
function factTokens(bullet: string): string[] {
  const words = bullet.match(/[\p{L}\p{N}][\p{L}\p{N}.+#%/-]*/gu) ?? [];
  return words.filter((word, index) => /\d/.test(word) || /.\p{Lu}/u.test(word) || /[.+#]/.test(word.replace(/\.$/, '')) || (index > 0 && /^\p{Lu}/u.test(word))).map((word) => word.replace(/[.,;:]+$/, '').toLowerCase());
}
const cv = JSON.parse(readFileSync('tmp/e2e/out/2-cv.json', 'utf8'));
const str = (e: any, k: string) => (typeof e?.[k] === 'string' ? e[k] : '');
const input = { title: cv.title, experience: cv.experience.map((e: any) => ({ title: str(e, 'title'), company: str(e, 'company'), bullets: e.bullets ?? [] })), projects: cv.projects.map((e: any) => ({ title: str(e, 'title'), description: str(e, 'description'), bullets: e.bullets ?? [] })), skills: cv.skills.map((s: any) => s.name) };
const job = { title: process.argv[2] ?? 'Machine Learning Engineer (m/w/d)', company: 'Rheinwerk Digital AG', description: process.argv[3] ?? 'Für unser Team in München suchen wir eine:n Machine Learning Engineer (m/w/d). Ihre Aufgaben: Entwicklung und Betrieb von Modellen in Produktion. Ihr Profil: mindestens 3 Jahre Berufserfahrung mit Python, PyTorch, scikit-learn; gute Englischkenntnisse, Deutschkenntnisse von Vorteil. Hybrides Arbeiten: 3 Tage pro Woche im Büro. Bewerbung per E-Mail an karriere@rheinwerk-digital-ag.example.com.' };
const res = await fetch('https://api.mistral.ai/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.AI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: process.env.AI_EXTRACTION_MODEL ?? 'mistral-medium-latest', temperature: 0, max_tokens: 3000, response_format: { type: 'json_object' }, messages: buildCvTailorPrompt(input, job) }) });
const out = JSON.parse((await res.json()).choices[0].message.content);
const report = (kind: string, entries: any[], proposed: any[]) => entries.forEach((entry: any, i: number) => {
  const p = proposed.find((x: any) => x.index === i)?.bullets ?? [];
  const source = [entry.title, entry.company ?? entry.description, ...entry.bullets].join('\n').toLowerCase();
  console.log(`\n${kind}[${i}] ${entry.title}: ${p.length}/${entry.bullets.length} bullets`);
  for (const b of p) { const bad = factTokens(b).filter((t) => !source.includes(t)); console.log(`  ${bad.length ? 'REJECT ' + JSON.stringify(bad) : 'ok'} | ${b}`); }
});
report('exp', input.experience, out.experience); report('proj', input.projects, out.projects);
console.log('\nskills:', out.skillOrder.join(', '));
