const getDbUrl = () => process.env.APP_MONGODB_URI;

module.exports = {
  getDbUrl,
  databaseName: process.env.DATABASE_NAME,
  actualDataParserQueueUrl: process.env.ACTUAL_DATA_PARSER_QUEUE_URL,
};
