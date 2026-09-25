import { buildApplicationEmail, withoutGenderTag } from '../../src/modules/applications/application-email.js';
import { internationalPhone, contactForJobCountry } from '../../src/modules/applications/application-contact.js';
for (const t of ['Machine Learning Engineer (m/w/d)', 'Junior AI Engineer (m/f/d)', 'Data Scientist (w/m/d)', 'Werkstudent KI (m/w/x)', 'Senior ML Engineer (gn*)', 'Backend Developer (all genders)', 'Accountant', 'Frontend Dev [m/w/d] – Berlin']) console.log(JSON.stringify(t), '->', JSON.stringify(withoutGenderTag(t)));
const base: any = { name: 'Omar', contact: { email: 'o@example.com' } };
for (const title of ['AI Engineer | NLP & LLM Applications', 'Accountant', 'UX Designer', 'Engineer', 'MBA Graduate', 'HR Specialist', 'Sales & Accounts Associate', 'Full-Stack Developer - React & Node', 'University Lecturer', 'SEO Specialist', null]) {
  const e = buildApplicationEmail({ ...base, title }, { title: 'X (m/w/d)', company: 'Y' });
  console.log(JSON.stringify(title), '->', e.text.split('\n\n')[1].split('. ')[1]);
}
for (const p of ['0101 234 5678', '01012345678', '010-1234-5678', '+20 101 234 5678', '00201012345678', '+49 30 1234567', '0501234567', '02 2345 6789']) console.log(JSON.stringify(p), '->', internationalPhone(p));
for (const [loc, c] of [['Nasr City, Cairo', 'DE'], ['Nasr City, Cairo', 'EG'], ['Cairo, Egypt', 'DE'], ['Dubai', 'DE'], ['Riyadh', 'SA'], ['Somewhere', 'DE'], ['الإسكندرية', 'DE']] as const) console.log(loc, c, '->', contactForJobCountry({ contact: { location: loc } } as any, c).contact!.location);
