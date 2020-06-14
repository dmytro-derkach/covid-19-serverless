process.env.ENV = "test";
process.env.DATABASE_NAME = "test2";
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
const ActualAll = require("@models/actualAll");
const { handler } = require("../handlers/getActualCountry");

let sessionId, lastSessionId, archiveSessionId;
const cities = new Array(2).fill(0).map(() => uuid());
const states = new Array(2).fill(0).map(() => uuid());
const prevAlls = new Array(randomInteger(100, 300))
  .fill({ date: new Date().toJSON(), country: uuid() })
  .map((el, index) => ({
    city: uuid(),
    state: uuid(),
    country: el.country,
    lastUpdate: el.date,
    lat: "test",
    long: "test",
    confirmed: randomInteger(10, 100),
    deaths: randomInteger(10, 100),
    recovered: randomInteger(10, 100),
    active: randomInteger(10, 100),
    commitSHA: "test",
    sort: index,
  }));
const lastAlls = new Array(randomInteger(100, 300))
  .fill({ date: new Date().toJSON(), country: uuid() })
  .map((el, index) => ({
    city: cities[randomInteger(0, 1)],
    state: states[randomInteger(0, 1)],
    country: el.country,
    lastUpdate: el.date,
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
  await ActualAll.insertMany(prevAlls);
  await ActualAll.insertMany(lastAlls);
  await disconnectDatabase();
};

test("Test clean db response", async (done) => {
  const event = {
    httpMethod: "GET",
    pathParameters: { countryName: "test" },
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
    pathParameters: { countryName: "test" },
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
      pathParameters: { countryName: "test" },
    };

    handler(event, {}, (err, response) => {
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
      pathParameters: { countryName: lastAlls[0].country },
    };

    handler(event, {}, (err, response) => {
      if (err) return done(err);
      const body = JSON.parse(response.body);
      expect(body).toEqual(sort(lastAlls, "confirmed"));
      const event = {
        httpMethod: "GET",
        headers: { "session-id": lastSessionId },
        pathParameters: { countryName: lastAlls[0].country },
      };
      handler(event, {}, (err, response) => {
        if (err) return done(err);
        const body = JSON.parse(response.body);
        expect(body).toEqual(sort(lastAlls, "confirmed"));
        done();
      });
    });
  });

  test("Test empty db response", async (done) => {
    const event = {
      httpMethod: "GET",
      pathParameters: { countryName: "test1" },
    };

    handler(event, {}, (err, response) => {
      if (err) return done(err);
      const body = JSON.parse(response.body);
      expect(body).toEqual([]);
      const event = {
        httpMethod: "GET",
        headers: { "session-id": sessionId },
        pathParameters: { countryName: "test" },
      };
      handler(event, {}, (err, response) => {
        if (err) return done(err);
        const body = JSON.parse(response.body);
        expect(body).toEqual([]);
        done();
      });
    });
  });

  test("Test sort response", async (done) => {
    const event = {
      httpMethod: "GET",
      pathParameters: { countryName: lastAlls[0].country, sortBy: "deaths" },
    };

    handler(event, {}, (err, response) => {
      if (err) return done(err);
      const body = JSON.parse(response.body);
      expect(body).toEqual(sort(lastAlls, "deaths"));

      const event = {
        httpMethod: "GET",
        headers: { "session-id": lastSessionId },
        pathParameters: {
          countryName: lastAlls[0].country,
          sortBy: "recovered",
        },
      };

      handler(event, {}, (err, response) => {
        if (err) return done(err);
        const body = JSON.parse(response.body);
        expect(body).toEqual(sort(lastAlls, "recovered"));

        const event = {
          httpMethod: "GET",
          headers: { "session-id": lastSessionId },
          pathParameters: {
            countryName: lastAlls[0].country,
            sortBy: "active",
          },
        };

        handler(event, {}, (err, response) => {
          if (err) return done(err);
          const body = JSON.parse(response.body);
          expect(body).toEqual(sort(lastAlls, "active"));

          const event = {
            httpMethod: "GET",
            headers: { "session-id": lastSessionId },
            pathParameters: {
              countryName: lastAlls[0].country,
              sortBy: "alphabetic",
            },
          };

          handler(event, {}, (err, response) => {
            if (err) return done(err);
            const body = JSON.parse(response.body);
            expect(body).toEqual(
              sort(lastAlls, "alphabetic", ["city", "state"])
            );

            const event = {
              httpMethod: "GET",
              headers: { "session-id": lastSessionId },
              pathParameters: {
                countryName: lastAlls[0].country,
                sortBy: "wrong",
              },
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
      pathParameters: { countryName: prevAlls[0].country },
    };

    handler(event, {}, (err, response) => {
      if (err) return done(err);
      const body = JSON.parse(response.body);
      expect(body).toEqual(sort(prevAlls, "confirmed"));
      done();
    });
  });

  test("Test bad session response", async (done) => {
    const event = {
      httpMethod: "GET",
      headers: { "Session-id": "test" },
      pathParameters: { countryName: "test" },
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
      pathParameters: { countryName: "test" },
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
      pathParameters: { countryName: "test" },
    };

    handler(event, {}, (err, response) => {
      if (err) return done(err);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("statusCode", 404);
      done();
    });
  });
});
