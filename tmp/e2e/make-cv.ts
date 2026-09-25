import { writeFileSync } from 'node:fs';
import { CvPdfRenderer } from '../../src/integrations/pdf/cv-pdf.renderer.js';
// A realistic Egyptian AI engineer targeting Germany. Local-format phone and German at A2 on purpose.
const cv = {
  name: 'Omar Khaled Mostafa',
  title: 'AI Engineer | NLP & LLM Applications',
  contact: { phone: '0101 234 5678', email: 'omar.khaled.test@example.com', location: 'Nasr City, Cairo' },
  summary: 'AI engineer with 4 years of experience building NLP and LLM-powered products, from data pipelines to production APIs.',
  experience: [
    { title: 'AI Engineer', company: 'Instabug', start: '03/2023', end: null, bullets: [
      'Built a retrieval-augmented generation (RAG) assistant over 40k support articles using LangChain and pgvector',
      'Fine-tuned a BERT classifier in PyTorch to route bug reports, cutting manual triage time by 35%',
      'Deployed model inference services with FastAPI and Docker on AWS',
      'Set up offline evaluation for LLM answers with a labelled test set of 1,200 questions',
    ] },
    { title: 'Machine Learning Engineer', company: 'Vezeeta', start: '07/2021', end: '02/2023', bullets: [
      'Trained XGBoost models to predict appointment no-shows across 12 specialties',
      'Built Arabic text preprocessing and named-entity recognition with spaCy for doctor reviews',
      'Maintained Airflow pipelines feeding the feature store from PostgreSQL',
    ] },
  ],
  projects: [
    { title: 'Arabic Speech-to-Text Demo', description: 'Open-source Whisper fine-tune on Egyptian Arabic', bullets: ['Fine-tuned Whisper small on 30 hours of Egyptian Arabic audio with Hugging Face Transformers'] },
  ],
  education: [{ degree: 'B.Sc. Computer Engineering', school: 'Ain Shams University', year: '2021' }],
  certificates: [{ name: 'AWS Certified Machine Learning – Specialty', issuer: 'Amazon Web Services', year: '2024' }],
  skills: [
    { name: 'Python', level: 'expert' }, { name: 'PyTorch', level: 'advanced' }, { name: 'LangChain', level: 'advanced' },
    { name: 'Hugging Face Transformers', level: 'advanced' }, { name: 'FastAPI', level: 'advanced' }, { name: 'Docker', level: 'intermediate' },
    { name: 'AWS', level: 'intermediate' }, { name: 'SQL', level: 'advanced' }, { name: 'Airflow', level: 'intermediate' }, { name: 'scikit-learn', level: 'advanced' },
  ],
  languages: [{ name: 'Arabic', level: 'native' }, { name: 'English', level: 'fluent' }, { name: 'German', level: 'basic' }],
};
writeFileSync('tmp/e2e/omar-ai-engineer.pdf', new CvPdfRenderer().render(cv as never));
console.log('written');
