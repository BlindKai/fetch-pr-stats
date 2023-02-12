import { MappedPullRequest, MappedReview } from "./fetching.ts";

export type UserStats = {
  userId: number;
  user: string;
  prs: {
    created: number;
    reviewed: number;
    merged: number;
  };
  reviews: {
    approved: number;
    commented: number;
    changesRequested: number;
  };
  approveTime: {
    min: number;
    max: number;
    avg: number;
    all: number;
  };
  mergeTime: {
    min: number;
    max: number;
    avg: number;
    all: number;
  };
  commentsTime: {
    min: number;
    max: number;
    avg: number;
    all: number;
  };
};

export function getPullRequestStats(prs: MappedPullRequest[]) {
  const userMap = createUserMap(prs);
  updateUserMap(userMap, prs);

  return userMap;
}

function createUserMap(prs: MappedPullRequest[]): Map<number, UserStats> {
  const userMap = new Map<number, UserStats>();
  prs.forEach((pr) => createNewUser(userMap, pr.userId, pr.user, pr.reviews));

  return userMap;
}

function createNewUser(
  map: Map<number, UserStats>,
  userId: number,
  user: string,
  reviews?: MappedReview[]
) {
  if (map.has(userId)) return;

  const userStats: UserStats = {
    userId: userId,
    user: user,
    prs: {
      created: 0,
      reviewed: 0,
      merged: 0,
    },
    reviews: {
      approved: 0,
      commented: 0,
      changesRequested: 0,
    },
    approveTime: {
      min: 0,
      max: 0,
      avg: 0,
      all: 0,
    },
    mergeTime: {
      min: 0,
      max: 0,
      avg: 0,
      all: 0,
    },
    commentsTime: {
      min: 0,
      max: 0,
      avg: 0,
      all: 0,
    },
  };

  map.set(userId, userStats);

  reviews?.forEach((r) => createNewUser(map, r.userId, r.user));
}

function updateUserMap(map: Map<number, UserStats>, prs: MappedPullRequest[]) {
  prs.forEach((pr) => updateUser(map, pr));
}

function updateUser(map: Map<number, UserStats>, pr: MappedPullRequest) {
  const userStat = map.get(pr.userId) as UserStats;

  userStat.prs.created++;

  if (pr.mergedAt) {
    userStat.prs.merged++;

    const mergeTime = (pr.mergedAt.getTime() - pr.createdAt.getTime()) / 1000;

    userStat.mergeTime.all += mergeTime;
    if (mergeTime < userStat.mergeTime.min) userStat.mergeTime.min = mergeTime;
    if (mergeTime > userStat.mergeTime.max) userStat.mergeTime.max = mergeTime;
  }

  pr.reviews.forEach((review) => updateReviewUser(map, pr, review));
}

function updateReviewUser(
  map: Map<number, UserStats>,
  pr: MappedPullRequest,
  review: MappedReview
) {
  const user = map.get(review.userId) as UserStats;

  const time = (review.submittedAt.getTime() - pr.createdAt.getTime()) / 1000;

  if (review.state === "APPROVED") {
    user.reviews.approved++;

    user.approveTime.all += time;
    if (time < user.approveTime.min) user.approveTime.min = time;
    if (time > user.approveTime.max) user.approveTime.max = time;
  } else {
    if (review.state === "CHANGES_REQUESTED") user.reviews.changesRequested++;
    else user.reviews.commented++;

    user.commentsTime.all += time;
    if (time < user.commentsTime.min) user.commentsTime.min = time;
    if (time > user.commentsTime.max) user.commentsTime.max = time;
  }
}
