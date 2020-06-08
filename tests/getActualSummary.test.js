process.env.ENV = "test";
process.env.MONGODB_URI = "mongodb://localhost:27017/test";
process.env.DATABASE_NAME = "test";
const mongoose = require("mongoose");
const middy = require("@middy/core");
const cors = require("@middy/http-cors");
const httpErrorHandler = require("@middy/http-error-handler");
const httpHeaderNormalizer = require("@middy/http-header-normalizer");
const normalizedResponse = require("@middlewares/normalizedResponse");
const loadSession = require("@middlewares/loadSession");
const connectDb = require("@middlewares/connectDb");
const { processHandler } = require("../handlers/getActualSummary");
const ParserSession = require("@models/parserSession");
const ActualSummary = require("@models/actualSummary");

let sessionId;

const handler = middy(processHandler)
  .use(connectDb())
  .use(httpHeaderNormalizer())
  .use(loadSession())
  .use(httpErrorHandler({ logger: null }))
  .use(normalizedResponse())
  .use(cors());

const connectDatabase = async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: process.env.DATABASE_NAME,
  });
};

const disconnectDatabase = async () => {
  await mongoose.connection.close();
};

afterEach(async (done) => {
  await connectDatabase();
  await mongoose.connection.db.dropDatabase();
  await disconnectDatabase();
  done();
});

const prepareDb = async () => {
  await connectDatabase();
  sessionId = (
    await ParserSession.create({
      type: ParserSession.ACTUAL_SESSION,
      commitSHA: "test",
      isProcessed: true,
      isProcessing: false,
      isUsing: false,
    })
  )._id;
  await ActualSummary.create({
    confirmed: 1,
    deaths: 2,
    recovered: 3,
    active: 4,
    affectedCountries: 5,
    commitSHA: "test",
  });
  await disconnectDatabase();
};

test("Test clean db response", () => {
  return new Promise((done, reject) => {
    const event = {
      httpMethod: "GET",
    };

    handler(event, {}, (err, response) => {
      if (err) return reject(err);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("statusCode", 404);
      done();
    });
  });
});

test("Test normal db response", () => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (done, reject) => {
    await prepareDb();

    const event = {
      httpMethod: "GET",
    };

    handler(event, {}, (err, response) => {
      if (err) return reject(err);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("confirmed", 1);
      expect(body).toHaveProperty("deaths", 2);
      expect(body).toHaveProperty("recovered", 3);
      expect(body).toHaveProperty("active", 4);
      expect(body).toHaveProperty("affectedCountries", 5);
      done();
    });
  });
});

test("Test exists session response", () => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (done, reject) => {
    await prepareDb();

    const event = {
      httpMethod: "GET",
      headers: { "session-id": sessionId },
    };

    handler(event, {}, (err, response) => {
      if (err) return reject(err);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("confirmed", 1);
      expect(body).toHaveProperty("deaths", 2);
      expect(body).toHaveProperty("recovered", 3);
      expect(body).toHaveProperty("active", 4);
      expect(body).toHaveProperty("affectedCountries", 5);
      done();
    });
  });
});

test("Test bad session response", () => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (done, reject) => {
    await prepareDb();

    const event = {
      httpMethod: "GET",
      headers: { "Session-id": "test" },
    };

    handler(event, {}, (err, response) => {
      if (err) return reject(err);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("statusCode", 400);
      done();
    });
  });
});

test("Test not exists session response", () => {
  return new Promise(async (done, reject) => {
    await prepareDb();

    const event = {
      httpMethod: "GET",
      headers: { "Session-Id": new mongoose.Types.ObjectId().toString() },
    };

    handler(event, {}, (err, response) => {
      if (err) return reject(err);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("statusCode", 404);
      done();
    });
  });
});

test("Test cors", () => {
  return new Promise(async (done, reject) => {
    const event = {
      httpMethod: "GET",
    };

    handler(event, {}, (err, response) => {
      if (err) return reject(err);
      expect(response.headers).toHaveProperty("Access-Control-Allow-Origin");
      done();
    });
  });
});
