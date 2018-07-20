const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

const sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const queueUrl = process.env.AWS_SQS_URL;
const maxNumberOfMessages = 2; // Between 1 and 10
const visibilityTimeoutSeconds = 30; // Amount of time the messages can't be received by another consumer if they aren't deleted due to error

exports.receiveMessages = () => {
    const params = {
        AttributeNames: [
            "SentTimestamp"
        ],
        MaxNumberOfMessages: maxNumberOfMessages,
        MessageAttributeNames: [
            "All"
        ],
        QueueUrl: queueUrl,
        VisibilityTimeout: visibilityTimeoutSeconds,
        WaitTimeSeconds: 0
    };
    return new Promise((resolve, reject) => {
        sqs.receiveMessage(params, function (err, data) {
            let messages = [];
            if (err) {
                return reject(err)
            } else if (data.Messages) {
                messages = data.Messages;
            }
            resolve(messages);
        })
    })
};

exports.deleteMessage = (message) => {
    const params = {
        QueueUrl: queueUrl,
        ReceiptHandle: message.ReceiptHandle
    };
    return new Promise((resolve, reject) => {
        sqs.deleteMessage(params, function (err, data) {
            if (err) {
                console.error(`Error deleting message ${message.MessageId} from sqs`, err);
                reject(err)
            } else {
                resolve()
            }
        })
    })
};