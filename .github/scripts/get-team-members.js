const getTeamMembers = async ({ github, context, team_slug }) => {
  const members = [];

  for await (const res of github.paginate.iterator(
    github.rest.teams.listMembersInOrg,
    {
      org: context.repo.owner,
      team_slug,
      per_page: 100,
    }
  )) {
    members.push(...res.data.map((member) => member.login));
  }

  return members;
};

module.exports = async ({ github, context, teams }) => {
  const teamsWithMembers = await Promise.all(
    teams.map((team_slug) =>
      getTeamMembers({ github, context, team_slug }).then((members) => [
        team_slug,
        members,
      ])
    )
  );

  return Object.fromEntries(teamsWithMembers);
};
