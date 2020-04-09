const { getLastCommitHash, getContentByPath } = require("@services/github");
const {
  ACTUAL_CASES_PATH,
  ACTUAL_DATA_BRANCH,
  ACTUAL_CASES_COUNTY_PATH,
} = require("@constants");
const PathCommit = require("@models/pathCommit");
const ParserSession = require("@models/parserSession");
const ActualAll = require("@models/actualAll");
const ActualCountries = require("@models/actualCountries");
const ActualSummary = require("@models/actualSummary");
const { sendMessageToSQS } = require("@services/queue");
const { actualDataParserQueueUrl } = require("@vars");
const CSV = require("csv-string");

const checkAndStartActualSession = async () => {
  const commitSHA = await getLastCommitHash(
    ACTUAL_CASES_PATH,
    ACTUAL_DATA_BRANCH
  );
  if (
    !(await PathCommit.findDataByCommit({
      path: ACTUAL_CASES_PATH,
      branch: ACTUAL_DATA_BRANCH,
      commitSHA,
    }))
  ) {
    await sendMessageToSQS(actualDataParserQueueUrl, { commitSHA });
  }
};

const parseAndSaveActualData = async (payload) => {
  const actualAll = await processAllActualData(payload.commitSHA);
  const actualCountries = await processActualDataByCountries(payload.commitSHA);
  await ActualAll.saveData(actualAll);
  await ActualCountries.saveData(actualCountries.cases);
  await ActualSummary.saveData(actualCountries.summary);
  await PathCommit.saveCommit({
    commitSHA: payload.commitSHA,
    path: ACTUAL_CASES_PATH,
    branch: ACTUAL_DATA_BRANCH,
    isProcessed: true,
  });
  await ParserSession.createSession({
    type: ParserSession.ACTUAL_SESSION,
    commitSHA: payload.commitSHA,
    isProcessed: true,
  });
  await removeDeprecetedData(ParserSession.ACTUAL_SESSION);
};

const processAllActualData = async (commitSHA) => {
  const data = await getContentByPath(ACTUAL_CASES_PATH, ACTUAL_DATA_BRANCH);
  const items = CSV.parse(data);
  let cases = [];
  for (let i = 1; i < items.length; i++) {
    if (items[i]) {
      const element = items[i];
      const payload = {
        city: element[1],
        state: element[2],
        country: element[3],
        lastUpdate: `${element[4]}+00`,
        lat: element[5],
        long: element[6],
        confirmed: Number(element[7]),
        deaths: Number(element[8]),
        recovered: Number(element[9]),
        commitSHA,
      };
      payload.active = payload.confirmed - payload.deaths - payload.recovered;
      cases.push(payload);
    }
  }
  return cases;
};

const processActualDataByCountries = async (commitSHA) => {
  const data = await getContentByPath(
    ACTUAL_CASES_COUNTY_PATH,
    ACTUAL_DATA_BRANCH
  );
  const items = CSV.parse(data);
  let cases = [];
  let summary = {
    confirmed: 0,
    deaths: 0,
    recovered: 0,
    active: 0,
    commitSHA,
  };
  for (let i = 1; i < items.length; i++) {
    if (items[i]) {
      const element = items[i];
      const payload = {
        country: element[0],
        lastUpdate: `${element[1]}+00`,
        lat: element[2],
        long: element[3],
        confirmed: Number(element[4]),
        deaths: Number(element[5]),
        recovered: Number(element[6]),
        commitSHA,
      };
      payload.active = payload.confirmed - payload.deaths - payload.recovered;
      cases.push(payload);
      summary.confirmed += payload.confirmed;
      summary.deaths += payload.deaths;
      summary.recovered += payload.recovered;
      summary.active += payload.active;
    }
  }
  summary.affectedCountries = cases.length;
  return { cases, summary };
};

const removeDeprecetedData = async (type) => {
  const deprecetedData = (
    await ParserSession.getDeprecetedlSessions({
      type,
    })
  ).map((el) => el.commitSHA);
  if (deprecetedData.length) {
    await ActualAll.removeByCommits(deprecetedData);
    await ActualCountries.removeByCommits(deprecetedData);
    await ActualSummary.removeByCommits(deprecetedData);
    await ParserSession.removeByCommits(deprecetedData);
  }
};

module.exports = {
  checkAndStartActualSession,
  parseAndSaveActualData,
};
