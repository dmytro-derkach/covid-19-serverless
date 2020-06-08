process.env.ENV = "test";
process.env.DATABASE_NAME = "test";
require("./mockSSM");
const {
  connectDatabase,
  disconnectDatabase,
  dropDatabase,
} = require("./mockDb");
const omit = require("lodash.omit");
const mongoose = require("mongoose");
const ParserSession = require("@models/parserSession");
const ActualSummary = require("@models/actualSummary");
const { handler } = require("../handlers/getActualSummary");

let sessionId, lastSessionId, archiveSessionId;
const summaries = [
  {
    confirmed: 1,
    deaths: 2,
    recovered: 3,
    active: 4,
    affectedCountries: 5,
    commitSHA: "test",
  },
  {
    confirmed: 6,
    deaths: 7,
    recovered: 8,
    active: 9,
    affectedCountries: 10,
    commitSHA: "test1",
  },
];

beforeAll(async (done) => {
  await dropDatabase();
  done();
});

afterAll(async (done) => {
  await dropDatabase();
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
  lastSessionId = (
    await ParserSession.create({
      type: ParserSession.ACTUAL_SESSION,
      commitSHA: "test1",
      isProcessed: true,
      isProcessing: false,
      isUsing: false,
    })
  )._id;
  archiveSessionId = (
    await ParserSession.create({
      type: ParserSession.ARCHIVE_SESSION,
      commitSHA: "test2",
      isProcessed: true,
      isProcessing: false,
      isUsing: false,
    })
  )._id;
  await ActualSummary.insertMany(summaries);
  await disconnectDatabase();
};

test("Test clean db response", async (done) => {
  const event = {
    httpMethod: "GET",
  };

  handler(event, {}, (err, response) => {
    if (err) return done(err);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("statusCode", 404);
    done();
  });
});

test("Test headers", async (done) => {
  const event = {
    httpMethod: "GET",
  };

  handler(event, {}, async (err, response) => {
    if (err) return done(err);
    expect(response.headers).toHaveProperty(
      "Content-Type",
      "application/json; charset=utf-8"
    );
    expect(response.headers).toHaveProperty("Access-Control-Allow-Origin");
    done();
  });
});

describe("db tests", () => {
  beforeAll(async (done) => {
    await prepareDb();
    done();
  });

  test("Test headers", async (done) => {
    const event = {
      httpMethod: "GET",
    };

    handler(event, {}, async (err, response) => {
      if (err) return done(err);
      expect(response.headers).toHaveProperty(
        "Content-Type",
        "application/json; charset=utf-8"
      );
      expect(response.headers).toHaveProperty("Access-Control-Allow-Origin");
      done();
    });
  });

  test("Test normal db response", async (done) => {
    const event = {
      httpMethod: "GET",
    };

    handler(event, {}, (err, response) => {
      if (err) return done(err);
      const body = JSON.parse(response.body);
      expect(body).toEqual(omit(summaries[1], "commitSHA"));
      const event = {
        httpMethod: "GET",
        headers: { "session-id": lastSessionId },
      };
      handler(event, {}, (err, response) => {
        if (err) return done(err);
        const body = JSON.parse(response.body);
        expect(body).toEqual(omit(summaries[1], "commitSHA"));
        done();
      });
    });
  });

  test("Test prev session response", async (done) => {
    const event = {
      httpMethod: "GET",
      headers: { "session-id": sessionId },
    };

    handler(event, {}, (err, response) => {
      if (err) return done(err);
      const body = JSON.parse(response.body);
      expect(body).toEqual(omit(summaries[0], "commitSHA"));
      done();
    });
  });

  test("Test bad session response", async (done) => {
    const event = {
      httpMethod: "GET",
      headers: { "Session-id": "test" },
    };

    handler(event, {}, (err, response) => {
      if (err) return done(err);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("statusCode", 400);
      done();
    });
  });

  test("Test not exists session response", async (done) => {
    const event = {
      httpMethod: "GET",
      headers: { "Session-Id": new mongoose.Types.ObjectId().toString() },
    };

    handler(event, {}, (err, response) => {
      if (err) return done(err);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("statusCode", 404);
      done();
    });
  });

  test("Test archive session response", async (done) => {
    const event = {
      httpMethod: "GET",
      headers: { "Session-Id": archiveSessionId },
    };

    handler(event, {}, (err, response) => {
      if (err) return done(err);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("statusCode", 404);
      done();
    });
  });
});
