import { Logger } from '@nestjs/common';
const JOOBLE_HOST_BY_COUNTRY = {
    EG: 'eg.jooble.org',
    SA: 'sa.jooble.org',
    AE: 'ae.jooble.org',
    DE: 'de.jooble.org',
};
export class JoobleProvider {
    apiKeys;
    logger = new Logger(JoobleProvider.name);
    constructor(apiKeys) {
        this.apiKeys = apiKeys;
    }
    supportsCountry(country) {
        return !!JOOBLE_HOST_BY_COUNTRY[country] && !!this.apiKeys[country];
    }
    async search(query) {
        const host = JOOBLE_HOST_BY_COUNTRY[query.country];
        const apiKey = this.apiKeys[query.country];
        if (!host || !apiKey) {
            throw new Error(`No Jooble API key configured for country "${query.country}".`);
        }
        const response = await fetch(`https://${host}/api/${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                keywords: query.keywords,
                location: '',
                page: query.page ?? 1,
                ResultOnPage: query.resultsPerPage ?? 100,
            }),
        });
        if (!response.ok) {
            const body = await response.text().catch(() => '');
            throw new Error(`Jooble API error ${response.status}: ${body}`);
        }
        const data = (await response.json());
        this.logger.log(`keywords="${query.keywords}" host=${host} -> ${data.jobs?.length ?? 0}/${data.totalCount ?? '?'} jobs`);
        return {
            totalCount: data.totalCount ?? 0,
            jobs: (data.jobs ?? []).map(toProviderJob),
        };
    }
}
function toProviderJob(job) {
    return {
        externalId: String(job.id),
        title: job.title,
        company: job.company || null,
        location: job.location || null,
        snippet: job.snippet || null,
        salary: job.salary || null,
        jobType: job.type || null,
        link: job.link,
        source: job.source || null,
        updatedAt: job.updated || null,
        raw: job,
    };
}
//# sourceMappingURL=jooble.provider.js.map