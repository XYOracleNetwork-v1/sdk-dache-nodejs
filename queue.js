const config = require('config');

const SqsQueue = require('./adapters/queue/SqsQueue.js');

module.exports = () => {
    let queueType = config.get('queue.type');
    switch (queueType) {
        case 'sqs':
            return new SqsQueue();
        default:
            throw new Error(`Could not instantiate queue type: ${queueType}`);
    }
};