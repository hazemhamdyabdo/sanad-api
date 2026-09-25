import { readFileSync } from 'node:fs';
import { buildApplicationEmail, headerSafe } from '../../src/modules/applications/application-email.js';
const cv = JSON.parse(readFileSync('tmp/e2e/out/2-cv.json', 'utf8'));
const job = { title: 'Machine Learning Engineer (m/w/d)', company: 'Rheinwerk Digital AG' };
const email = buildApplicationEmail(cv, job);
console.log(`From: "${headerSafe(cv.name)} via Sanad" <onboarding@resend.dev>\nReply-To: ${cv.contact.email}\nSubject: ${email.subject}\nAttachment: CV PDF\n\n${email.text}`);
