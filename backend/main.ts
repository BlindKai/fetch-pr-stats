import { fetchPage, mapPullRequest } from "./fetching.ts";
import { getPullRequestStats } from "./stats.ts";

async function main() {
  const encoder = new TextEncoder();
  const pullRequests = [];
  let currentPage = [];
  let pageNumber = 1;

  do {
    currentPage = await fetchPage(pageNumber);
    pullRequests.push(...currentPage);
    pageNumber++;
  } while (currentPage.length === 100);

  const raw = encoder.encode(JSON.stringify(pullRequests));
  await Deno.writeFile(`raw-${Date.now()}.json`, raw);

  const mappedPullRequests = pullRequests.map((pr) => mapPullRequest(pr));
  const statsMap = getPullRequestStats(mappedPullRequests);
  const statsArray = Array.from(statsMap.values());

  statsArray.forEach((s) => {
    s.approveTime.avg = s.approveTime.all / s.reviews.approved;
    s.commentsTime.avg =
      s.commentsTime.all / (s.reviews.commented + s.reviews.changesRequested);
    s.mergeTime.avg = s.mergeTime.all / s.prs.merged;
  });

  const data = encoder.encode(JSON.stringify(statsArray));
  await Deno.writeFile(`results-${Date.now()}.json`, data);
}

await main();
