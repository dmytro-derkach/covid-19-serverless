const getDbUrl = () => process.env.MONGODB_URI || process.env.APP_MONGODB_URI;
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
  archiveDeltasSessionMarkerQueueUrl:
    process.env.ARCHIVE_DELTAS_SESSION_MARKER_QUEUE_URL,
  geolocationDataParserQueueUrl: process.env.GEOLOCATION_DATA_PARSER_QUEUE_URL,
  env: process.env.env,
};
