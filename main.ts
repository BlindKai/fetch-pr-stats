import { fetchPage } from "./fetching.ts";

async function main() {
  const pullRequests = [];
  let currentPage = [];
  let pageNumber = 1;

  do {
    currentPage = await fetchPage(pageNumber);
    pullRequests.push(...currentPage);
    pageNumber++;
  } while (currentPage.length !== 0);

  return pullRequests;
}

const pullRequests = await main();
console.log(pullRequests);
