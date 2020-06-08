const mongoose = require("mongoose");
process.env.MONGODB_URI = "mongodb://localhost:27017/test";
process.env.DATABASE_NAME = "test";

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

const dropDatabase = async () => {
  await connectDatabase();
  await mongoose.connection.db.dropDatabase();
  await disconnectDatabase();
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
  dropDatabase,
};
