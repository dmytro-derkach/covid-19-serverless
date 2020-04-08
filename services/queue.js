const AWS = require("aws-sdk");
const { region } = require("@vars");

let sqs = new AWS.SQS({ region: region });

const sendMessageToSQS = async (queueUrl, message) => {
  const messageObject = {
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(message),
  };
  console.log("Send message to sqs", messageObject.MessageBody);
  // Send the order data to the SQS queue
  return await sqs.sendMessage(messageObject).promise();
};

module.exports = {
  sendMessageToSQS,
};
