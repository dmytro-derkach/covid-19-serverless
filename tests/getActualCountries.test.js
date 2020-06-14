process.env.ENV = "test";
process.env.DATABASE_NAME = "test1";
require("./mockSSM");
const {
  connectDatabase,
  disconnectDatabase,
  dropDatabase,
} = require("./mockDb");
const { v4: uuid } = require("uuid");
const { randomInteger, sort } = require("./utils");
const mongoose = require("mongoose");
const ParserSession = require("@models/parserSession");
const ActualCountries = require("@models/actualCountries");
const { handler } = require("../handlers/getActualCountries");

let sessionId, lastSessionId, archiveSessionId;
const prevCountries = new Array(randomInteger(100, 300))
  .fill(new Date().toJSON())
  .map((el, index) => ({
    country: uuid(),
    lastUpdate: el,
    lat: "test",
    long: "test",
    confirmed: randomInteger(10, 100),
    deaths: randomInteger(10, 100),
    recovered: randomInteger(10, 100),
    active: randomInteger(10, 100),
    commitSHA: "test",
    sort: index,
  }));
const lastCountries = new Array(randomInteger(100, 300))
  .fill(new Date().toJSON())
  .map((el, index) => ({
    country: uuid(),
    lastUpdate: el,
    lat: "test",
    long: "test",
    confirmed: randomInteger(10, 100),
    deaths: randomInteger(10, 100),
    recovered: randomInteger(10, 100),
    active: randomInteger(10, 100),
    commitSHA: "test1",
    sort: index,
  }));

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
  await ActualCountries.insertMany(prevCountries);
  await ActualCountries.insertMany(lastCountries);
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
      expect(body).toEqual(sort(lastCountries, "confirmed"));
      const event = {
        httpMethod: "GET",
        headers: { "session-id": lastSessionId },
      };
      handler(event, {}, (err, response) => {
        if (err) return done(err);
        const body = JSON.parse(response.body);
        expect(body).toEqual(sort(lastCountries, "confirmed"));
        done();
      });
    });
  });

  test("Test sort response", async (done) => {
    const event = {
      httpMethod: "GET",
      pathParameters: { sortBy: "deaths" },
    };

    handler(event, {}, (err, response) => {
      if (err) return done(err);
      const body = JSON.parse(response.body);
      expect(body).toEqual(sort(lastCountries, "deaths"));

      const event = {
        httpMethod: "GET",
        headers: { "session-id": lastSessionId },
        pathParameters: { sortBy: "recovered" },
      };

      handler(event, {}, (err, response) => {
        if (err) return done(err);
        const body = JSON.parse(response.body);
        expect(body).toEqual(sort(lastCountries, "recovered"));

        const event = {
          httpMethod: "GET",
          headers: { "session-id": lastSessionId },
          pathParameters: { sortBy: "active" },
        };

        handler(event, {}, (err, response) => {
          if (err) return done(err);
          const body = JSON.parse(response.body);
          expect(body).toEqual(sort(lastCountries, "active"));

          const event = {
            httpMethod: "GET",
            headers: { "session-id": lastSessionId },
            pathParameters: { sortBy: "alphabetic" },
          };

          handler(event, {}, (err, response) => {
            if (err) return done(err);
            const body = JSON.parse(response.body);
            expect(body).toEqual(sort(lastCountries, "alphabetic", "country"));

            const event = {
              httpMethod: "GET",
              headers: { "session-id": lastSessionId },
              pathParameters: { sortBy: "wrong" },
            };

            handler(event, {}, (err, response) => {
              if (err) return done(err);
              const body = JSON.parse(response.body);
              expect(body).toHaveProperty("statusCode", 400);
              done();
            });
          });
        });
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
      expect(body).toEqual(sort(prevCountries, "confirmed"));
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
