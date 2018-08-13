const QueueInterface = require('./QueueInterface.js');
const config = require('config');
const AWS = require('aws-sdk');
AWS.config.update({
    region: config.get('aws.region'),
    accessKeyId: config.get('aws.accessKeyId'),
    secretAccessKey: config.get('aws.secretAccessKey'),
});

const sqs = new AWS.SQS({apiVersion: '2012-11-05'});
const queueUrl = config.get('queue.sqsUrl');

const sendRetryWaitTimeMs = 100;
const maxNumberOfMessagesToReceive = 2; // Between 1 and 10
const visibilityTimeoutSeconds = 30; // Amount of time the messages can't be received by another consumer if they aren't deleted due to error

class SqsQueue extends QueueInterface {

    enqueueItem(contract, event) {
        sqs.sendMessage(getParams(contract, event), function (err, data) {
            if (err) {
                console.error(`SQS error: ${err.message}, retrying in ${sendRetryWaitTimeMs} ms...`);
                setTimeout(function () {
                    this.sendMessage(contract, event);
                }, sendRetryWaitTimeMs)
            } else {
                console.log(`Queued ${event.event} from ${contract.name}, transaction ${event.transactionHash}`);
            }
        });
    }

    getItems() {
        const params = {
            AttributeNames: [
                "SentTimestamp"
            ],
            MaxNumberOfMessages: maxNumberOfMessagesToReceive,
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
        });
    }

    dequeueItem(item) {
        const params = {
            QueueUrl: queueUrl,
            ReceiptHandle: item.ReceiptHandle
        };
        return new Promise((resolve, reject) => {
            sqs.deleteMessage(params, function (err, data) {
                if (err) {
                    console.error(`Error deleting message ${item.MessageId} from sqs`, err);
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }

}

function getParams(contract, event) {
    return {
        MessageBody: JSON.stringify(event),
        QueueUrl: queueUrl,
        MessageAttributes: {
            'transactionHash': {
                DataType: 'String',
                StringValue: event.transactionHash
            },
            'contractName': {
                DataType: 'String',
                StringValue: contract.name
            },
            'eventName': {
                DataType: 'String',
                StringValue: event.event
            }
        },
        MessageGroupId: contract.name
    };
}

module.exports = SqsQueue;