import { load } from "https://deno.land/std@0.177.0/dotenv/mod.ts";

const { TOKEN, ORG, REPO } = await load();

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "X-GitHub-Api-Version": "2022-11-28",
  Accept: "application/vnd.github+json",
};

export async function fetchPage(pageNumber: number) {
  const baseUrl = `https://api.github.com/repos/${ORG}/${REPO}/pulls`;
  const querystring = `?state=all&per_page=100&page=${pageNumber}`;

  const response = await fetch(`${baseUrl}${querystring}`, { headers });
  const prs: Record<string, any>[] = await response.json();

  const prsReviews = await Promise.all(
    prs.map((pr) => fetchReviews(pr.number))
  );

  const prWithReviews = prs.map((pr, i) => mapPullRequest(pr, prsReviews[i]));

  return prWithReviews;
}

export async function fetchReviews(prId: number) {
  const baseUrl = `https://api.github.com/repos/${ORG}/${REPO}/pulls/${prId}/reviews`;

  const response = await fetch(baseUrl, { headers });
  const reviews = await response.json();

  return reviews;
}

function mapPullRequest(
  pr: Record<string, any>,
  reviews: Record<string, any>[]
): MappedPullRequest {
  return {
    id: pr.id,
    url: pr.url,
    title: pr.title,
    state: pr.state,
    userId: pr.user.id,
    user: pr.user.login,
    createdAt: new Date(pr.created_at),
    updatedAt: pr.updated_at ? new Date(pr.updated_at) : null,
    closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
    mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
    labels: pr.labels,
    draft: pr.draft,
    reviews: reviews.map((r) => ({
      userId: r.user.id,
      user: r.user.login,
      state: r.state,
      submittedAt: new Date(r.submitted_at),
    })),
  };
}

export type MappedPullRequest = {
  id: number;
  url: string;
  title: string;
  state: string;
  userId: number;
  user: string;
  createdAt: Date;
  updatedAt: Date | null;
  closedAt: Date | null;
  mergedAt: Date | null;
  labels: string[];
  draft: boolean;
  reviews: MappedReview[];
};

export type MappedReview = {
  userId: number;
  user: string;
  state: string;
  submittedAt: Date;
};
