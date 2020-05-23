const {
  ACTUAL_UKRAINE_CASES_PATH,
  ACTUAL_UKRAINE_DATA_BRANCH,
  UKRAINE_REPOSITORY,
} = require("@constants");
const PathCommit = require("@models/pathCommit");
const ActualAll = require("@models/actualAll");
const { getLastCommitHash, getContentByPath } = require("@services/github");
const { parseCSV } = require("@services/csv");

const processActualDataByUkraine = async (commitSHA) => {
  const ukraineCommitSHA =
    (await getLastCommitHash(
      ACTUAL_UKRAINE_CASES_PATH,
      ACTUAL_UKRAINE_DATA_BRANCH,
      UKRAINE_REPOSITORY
    )) + "-Ukraine";
  let ukrainePath = await PathCommit.findDataByCommit({
    path: ACTUAL_UKRAINE_CASES_PATH,
    branch: ACTUAL_UKRAINE_DATA_BRANCH,
    commitSHA: ukraineCommitSHA,
  });
  let cases = [];
  if (!ukrainePath) {
    const data = await getContentByPath(
      ACTUAL_UKRAINE_CASES_PATH,
      ACTUAL_UKRAINE_DATA_BRANCH,
      UKRAINE_REPOSITORY
    );
    const items = parseCSV(data);
    for (let i = 0; i < items.length; i++) {
      const element = items[i];
      const payload = {
        city: element.city,
        state: element.state,
        country: element.country,
        lastUpdate: new Date(`${element.lastUpdate}+00`),
        lat: element.lat,
        long: element.long,
        confirmed: Number(element.confirmed),
        deaths: Number(element.deaths),
        recovered: Number(element.recovered),
        commitSHA: ukraineCommitSHA,
      };
      payload.active = payload.confirmed - payload.deaths - payload.recovered;
      cases.push(payload);
    }
  }
  return {
    cases,
    commitSHA: ukraineCommitSHA,
    ukrainePath,
    rootCommitSHA: commitSHA,
  };
};

const saveActualDataByUkraine = async (payload) => {
  let { ukrainePath } = payload;
  if (!ukrainePath) {
    await ActualAll.saveData(payload.cases);
    ukrainePath = new PathCommit();
    ukrainePath.path = ACTUAL_UKRAINE_CASES_PATH;
    ukrainePath.branch = ACTUAL_UKRAINE_DATA_BRANCH;
    ukrainePath.commitSHA = payload.commitSHA;
  }
  await ukrainePath.appendRootCommit(payload.rootCommitSHA);
  await ActualAll.findAllByCommit(payload.rootCommitSHA, {
    country: "Ukraine",
  })
    .remove()
    .exec();
};

const removeUnusedActualUkraineData = async (deprecatedData) => {
  for (const commitSHA of deprecatedData) {
    const commits = await PathCommit.findByRootCommit(commitSHA);
    for (const commit of commits) {
      commit.removeRootCommit(commitSHA);
      if (commit.rootCommits.length) {
        await commit.updateCommit();
      } else {
        await Promise.all([
          ActualAll.removeByCommits(commit.commitSHA),
          commit.removeCommit(),
        ]);
      }
    }
  }
};

module.exports = {
  processActualDataByUkraine,
  saveActualDataByUkraine,
  removeUnusedActualUkraineData,
};
