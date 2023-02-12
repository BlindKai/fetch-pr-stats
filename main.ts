import { fetchPage } from "./fetching.ts";
import { getPullRequestStats } from "./stats.ts";

async function main() {
  const pullRequests = [];
  let currentPage = [];
  let pageNumber = 1;

  do {
    currentPage = await fetchPage(pageNumber);
    pullRequests.push(...currentPage);
    pageNumber++;
  } while (currentPage.length === 100);

  const statsMap = getPullRequestStats(pullRequests);
  const statsArray = Array.from(statsMap.values());

  statsArray.forEach((s) => {
    s.approveTime.avg = s.approveTime.all / s.reviews.approved;
    s.commentsTime.avg =
      s.commentsTime.all / (s.reviews.commented + s.reviews.changesRequested);
    s.mergeTime.avg = s.mergeTime.all / s.prs.merged;
  });

  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(statsArray));

  await Deno.writeFile(`results-${Date.now()}.json`, data);
}

await main();
