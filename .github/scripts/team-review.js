module.exports = async ({ github, context, core, teams }) => {
  const { pull_request } = context.payload;

  if (!pull_request)
    throw new Error('This action can only be run on pull request events.');

  const getReviewers = async () => {
    const reviewers = new Set();

    for await (const reviews of github.paginate.iterator(
      github.rest.pulls.listReviews,
      {
        owner: context.repo.owner,
        pull_number: pull_request.number,
        repo: context.repo.repo,
        per_page: 100,
      }
    )) {
      for (const review of reviews.data) {
        if (review.user && review.state === 'APPROVED') {
          reviewers.add(review.user.login);
        } else if (review.user && review.state !== 'COMMENTED') {
          reviewers.delete(review.user.login);
        }
      }
    }

    return Array.from(reviewers);
  };

  const reviewers = await getReviewers();
  const awaitingApprovalFrom = Object.entries(teams).filter(([, members]) =>
    members.every((member) => !reviewers.includes(member))
  );

  if (awaitingApprovalFrom.length > 0) {
    core.setFailed(
      `Need approval from ${awaitingApprovalFrom
        .map(([teamName]) => teamName)
        .join(', ')}`
    );
  }
};
