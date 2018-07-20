const consumer = require('./consumer.js');
const queue = require('./queue.js');

exports.handler = async () => {
    const result = await receiveMessagesAndConsume();
    return `Consumed ${result.length} events`
};

async function receiveMessagesAndConsume() {
    const promises = [];
    const messages = await queue.receiveMessages();
    messages.forEach(message => {
        promises.push(
            consumeMessage(message)
                .then(() => console.log(`Successfully consumed event from transaction ${message.MessageAttributes.transactionHash.StringValue}`))
                .catch(error => console.log(error))
        )
    });
    return Promise.all(promises);
}

async function consumeMessage(message) {
    const contractName = message.MessageAttributes.contractName.StringValue;
    const eventJson = JSON.parse(message.Body);
    await consumer.consume(contractName, eventJson);
    await queue.deleteMessage(message);
}


exports.handler().then(res => console.log(res)).catch(err => console.error(err));