const { getCommitHash } = require("@services/github");
const { ACTUAL_CASES_PATH, ACTUAL_DATA_BRANCH } = require("@constants");
const PathCommit = require("@models/pathCommit");
const { sendMessageToSQS } = require("@services/queue");
const { actualDataParserQueueUrl } = require("@vars");

const checkAndStartActualSession = async () => {
  const response = await getCommitHash(ACTUAL_CASES_PATH, ACTUAL_DATA_BRANCH);
  const commitSHA = response.data.sha;
  if (
    !(await PathCommit.findOne({
      path: ACTUAL_CASES_PATH,
      branch: ACTUAL_DATA_BRANCH,
      commitSHA,
    }))
  ) {
    await sendMessageToSQS(actualDataParserQueueUrl, { commitSHA });
  }
};

const parseAndSaveActualData = (payload) => {
  console.log("payload", payload);
};

module.exports = {
  checkAndStartActualSession,
  parseAndSaveActualData,
};
