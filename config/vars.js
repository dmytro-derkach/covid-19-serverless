const getDbUrl = () => process.env.APP_MONGODB_URI;
const getGithubAuth = () => JSON.parse(process.env.APP_GITHUB_AUTH);

module.exports = {
  getDbUrl,
  getGithubAuth,
  databaseName: process.env.DATABASE_NAME,
  actualDataParserQueueUrl: process.env.ACTUAL_DATA_PARSER_QUEUE_URL,
};
