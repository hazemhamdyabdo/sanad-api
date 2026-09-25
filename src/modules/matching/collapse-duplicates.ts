import { listingIdentity, type Job } from '../jobs/index.js';

/**
 * One card per job: listings with the same employer and title (see `listingIdentity`) are the same
 * job posted for several places — "AI Platform Engineer, Hensoldt" in Ulm and in Oberkochen. The
 * card is the posting the device already applied to, if any (so its status stays visible), else one
 * that takes applications by email, else the closest one; `locations` lists every place, the card's
 * own first.
 *
 * `jobs` must be ordered best-first; the order of the returned cards follows it.
 */
export function collapseDuplicates(jobs: Job[], applied: Map<string, unknown>): { jobs: Job[]; locations: Map<string, string[]> } {
  const groups = new Map<string, Job[]>();
  for (const job of jobs) {
    const key = listingIdentity(job) ?? `id:${job.id}`;
    groups.set(key, [...(groups.get(key) ?? []), job]);
  }

  const cards: Job[] = [];
  const locations = new Map<string, string[]>();
  for (const members of groups.values()) {
    // The posting we can actually apply to by email beats one that only links out — collapsing must
    // never turn a real application into a "prepared" one.
    const card = members.find((job) => applied.has(job.id)) ?? members.find((job) => job.applyMethod === 'email') ?? members[0];
    cards.push(card);
    const places = [card, ...members.filter((job) => job !== card)].map((job) => job.location?.trim()).filter((place): place is string => !!place);
    locations.set(card.id, [...new Set(places)]);
  }
  // Keep best-first: a group sits where its best member was.
  const rank = new Map(jobs.map((job, index) => [job.id, index]));
  const firstRank = (card: Job) => Math.min(...(groups.get(listingIdentity(card) ?? `id:${card.id}`) ?? [card]).map((job) => rank.get(job.id) ?? 0));
  return { jobs: cards.sort((a, b) => firstRank(a) - firstRank(b)), locations };
}
