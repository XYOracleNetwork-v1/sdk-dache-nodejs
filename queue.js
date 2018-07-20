const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

const sqs = new AWS.SQS({apiVersion: '2012-11-05'});
const queueUrl = process.env.AWS_SQS_URL;

const retryWaitTimeMs = 100;

function sendMessage(contract, event) {
    sqs.sendMessage(getParams(contract, event), function (err, data) {
        if (err) {
            console.error(`SQS error: ${err.message}, retrying in ${retryWaitTimeMs} ms...`);
            setTimeout(function () {
                sendMessage(contract, event)
            }, retryWaitTimeMs)
        } else {
            console.log('Queued event')
        }
    });
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

exports.sendMessage = sendMessage;