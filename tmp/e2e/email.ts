import { readFileSync } from 'node:fs';
import { contactForJobCountry } from '../../src/modules/applications/application-contact.js';
import { buildApplicationEmail, headerSafe } from '../../src/modules/applications/application-email.js';
const cv = contactForJobCountry(JSON.parse(readFileSync('tmp/e2e/out/2-cv.json', 'utf8')), 'DE');
const email = buildApplicationEmail(cv, { title: 'Machine Learning Engineer (m/w/d)', company: 'Rheinwerk Digital AG' });
console.log(`From: "${headerSafe(`${cv.name} via Sanad`)}" <onboarding@resend.dev>\nTo: karriere@rheinwerk-digital-ag.example.com  (redirected to EMAIL_REDIRECT_TO in this run)\nReply-To: ${cv.contact!.email}\nSubject: ${email.subject}\nAttachment: Omar-Khaled-Mostafa-CV.pdf\n\n${email.text}`);
