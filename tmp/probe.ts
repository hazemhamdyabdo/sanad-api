import { resolveRoleFromCvTitle, ROLE_DEFINITIONS } from '../src/modules/jobs/roles.js';
const cases: Array<[string, string | null]> = [
  ['AI Engineer','ai_engineer'],['Machine Learning Engineer','machine_learning_engineer'],['ML Engineer','machine_learning_engineer'],['AI/ML Engineer','ai_engineer'],['AI / ML Engineer','ai_engineer'],['Data Scientist','data_scientist'],['NLP Engineer','machine_learning_engineer'],['Computer Vision Engineer','machine_learning_engineer'],['Deep Learning Engineer','machine_learning_engineer'],['Senior AI Engineer (LLMs)','ai_engineer'],['Software Engineer (AI)','ai_engineer'],['Python Developer | Machine Learning','machine_learning_engineer'],['Data Science Intern','data_scientist'],['Generative AI Engineer','ai_engineer'],
  ['Python Developer','backend_developer'],['Data Analyst','data_analyst'],['BI Analyst','data_analyst'],['Retail Sales Associate',null],['Maintenance Technician',null],['Tailored solutions consultant',null],['Frontend Developer','frontend_developer'],['Front-End Engineer','frontend_developer'],['.NET Developer','backend_developer'],['UI/UX Designer','ui_ux_designer'],['Full-Stack Developer','fullstack_developer'],['Software Engineer','fullstack_developer'],['Senior Accountant','accountant'],['Waitress','waiter'],['Hotel Front Desk Agent','hotel_receptionist'],['Head Chef','cook'],['Observer',null],['Chain retail manager','store_manager'],
];
let bad = 0;
for (const [t, want] of cases) { const got = resolveRoleFromCvTitle(t)?.code ?? null; if (got !== want) bad++; console.log(got === want ? 'ok  ' : 'FAIL', t.padEnd(38), '->', got, got === want ? '' : `(want ${want})`); }
// Regression: every role must still resolve from its own label and keyword.
for (const r of ROLE_DEFINITIONS) for (const t of [r.labelEn, r.keyword]) { const got = resolveRoleFromCvTitle(t)?.code; if (got !== r.code) { bad++; console.log('SELF', t, '->', got, 'want', r.code); } }
console.log(bad ? `${bad} failure(s)` : 'all ok');
