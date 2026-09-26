import { describe, expect, it, vi } from 'vitest';
import type {
  LlmCompletionOptions,
  LlmProvider,
} from '../../integrations/llm/llm.interface.js';
import type { MatchCandidate, MatchJob } from '../schemas/job-match.schema.js';
import { JobMatchService } from './job-match.service.js';

// Retries back off for real; the tests don't need to wait for that.
vi.mock('../../common/delay.js', () => ({ delay: () => Promise.resolve() }));

const candidate: MatchCandidate = {
  title: 'Accountant',
  pastTitles: [],
  highlights: ['Prepared supplier invoices'],
  seniority: 'mid',
  yearsOfExperience: 3,
  skills: ['Excel', 'SAP'],
  domains: ['Accounting'],
  education: ['Bachelor of Commerce'],
  certificates: [],
  languages: ['Arabic', 'English'],
};

const jobs: MatchJob[] = [
  {
    id: 'a',
    title: 'Accountant',
    company: null,
    description: 'Excel and SAP required',
  },
  { id: 'b', title: 'Junior Accountant', company: null, description: 'Excel' },
];

/** An LLM that answers from a queue and records every call. */
function fakeLlm(
  replies: unknown[],
): LlmProvider & { calls: LlmCompletionOptions[] } {
  const calls: LlmCompletionOptions[] = [];
  return {
    calls,
    async complete(options) {
      calls.push(options);
      const reply = replies.shift();
      if (reply === undefined) throw new Error('no more replies queued');
      return typeof reply === 'string' ? reply : JSON.stringify(reply);
    },
    async *stream() {
      yield '';
    },
  };
}

describe('JobMatchService language handling', () => {
  it('re-asks only the job whose reasons were all English, feeding back the reply and a correction at a non-zero temperature', async () => {
    const llm = fakeLlm([
      {
        matches: [
          {
            jobId: 'a',
            match: 88,
            whyMatch: ['Excel and SAP experience', '3 years accounting'],
            gaps: [],
          },
          { jobId: 'b', match: 75, whyMatch: ['خبرة Excel متقدمة'], gaps: [] },
        ],
      },
      {
        matches: [
          { jobId: 'a', match: 88, whyMatch: ['خبرة Excel و SAP'], gaps: [] },
        ],
      },
    ]);
    const service = new JobMatchService(llm);

    const result = await service.explain(candidate, jobs);

    expect(llm.calls).toHaveLength(2);
    expect(llm.calls[0].temperature).toBe(0);

    const retry = llm.calls[1];
    expect(retry.temperature).toBeGreaterThan(0);
    // Only job "a" is re-asked.
    const userMessages = retry.messages.filter(
      (message) => message.role === 'user',
    );
    expect(userMessages[0].content).toContain('"id":"a"');
    expect(userMessages[0].content).not.toContain('"id":"b"');
    // The previous reply and a correction naming the language rule are in context.
    expect(
      retry.messages.some(
        (message) =>
          message.role === 'assistant' &&
          message.content.includes('Excel and SAP experience'),
      ),
    ).toBe(true);
    expect(userMessages.at(-1)?.content).toContain('بالمصري');
    expect(userMessages.at(-1)?.content).toContain('a');

    expect(result.get('a')?.whyMatch).toEqual(['خبرة Excel و SAP']);
    expect(result.get('b')?.whyMatch).toEqual(['خبرة Excel متقدمة']);
  });

  it('keeps a job with mixed lines, dropping only the English ones, without a retry', async () => {
    const llm = fakeLlm([
      {
        matches: [
          {
            jobId: 'a',
            match: 80,
            whyMatch: ['خبرة Excel متقدمة', 'SAP experience'],
            gaps: ['Requires CPA', 'مطلوب شهادة CPA'],
          },
          { jobId: 'b', match: 70, whyMatch: ['خبرة Excel متقدمة'], gaps: [] },
        ],
      },
    ]);
    const service = new JobMatchService(llm);

    const result = await service.explain(candidate, jobs);

    expect(llm.calls).toHaveLength(1);
    expect(result.get('a')?.whyMatch).toEqual(['خبرة Excel متقدمة']);
    expect(result.get('a')?.gaps).toEqual(['مطلوب شهادة CPA']);
  });

  it('gives up on a job that stays English after every attempt and returns the rest', async () => {
    const english = {
      matches: [
        { jobId: 'a', match: 90, whyMatch: ['Excel expert'], gaps: [] },
        { jobId: 'b', match: 70, whyMatch: ['خبرة Excel متقدمة'], gaps: [] },
      ],
    };
    const stillEnglish = {
      matches: [
        { jobId: 'a', match: 90, whyMatch: ['Excel expert'], gaps: [] },
      ],
    };
    const llm = fakeLlm([english, stillEnglish, stillEnglish]);
    const service = new JobMatchService(llm);

    const result = await service.explain(candidate, jobs);

    expect(llm.calls).toHaveLength(3);
    expect(result.has('a')).toBe(false);
    expect(result.get('b')?.match).toBe(70);
  });
});
