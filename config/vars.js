const getDbUrl = () => process.env.APP_MONGODB_URI;
const getGithubAuth = () => JSON.parse(process.env.APP_GITHUB_AUTH);

module.exports = {
  getDbUrl,
  getGithubAuth,
  databaseName: process.env.DATABASE_NAME,
  actualDataParserQueueUrl: process.env.ACTUAL_DATA_PARSER_QUEUE_URL,
  archiveDataParserQueueUrl: process.env.ARCHIVE_DATA_PARSER_QUEUE_URL,
  archiveSessionCreatorQueueUrl: process.env.ARCHIVE_SESSION_CREATOR_QUEUE_URL,
  archiveDeltasCalculatorQueueUrl:
    process.env.ARCHIVE_DELTAS_CALCULATOR_QUEUE_URL,
};
