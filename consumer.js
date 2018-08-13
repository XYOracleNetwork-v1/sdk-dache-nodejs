const queue = require('./queue.js')();
const persistence = require('./persistence');
const config = require('config');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.WebsocketProvider(config.get('ethereum.web3WebsocketUrl')));

web3.eth.subscribe('newBlockHeaders', function (error, result) {
    if (error) {
        console.log(error);
        process.exit(1);
    }
}).on("data", async function (blockHeader) {
    await receiveMessagesAndConsume();
}).on("error", function (error) {
    console.error(error);
});


async function receiveMessagesAndConsume() {
    const promises = [];
    const messages = await queue.getItems();
    messages.forEach(message => {
        promises.push(
            consumeMessage(message)
                .then(() => console.log(`Consumed ${message.MessageAttributes.eventName.StringValue} from ${message.MessageAttributes.contractName.StringValue}, transaction ${message.MessageAttributes.transactionHash.StringValue}`))
                .catch(error => console.log(error))
        )
    });
    return Promise.all(promises);
}

async function consumeMessage(message) {
    const contractName = message.MessageAttributes.contractName.StringValue;
    const eventJson = JSON.parse(message.Body);
    await consume(contractName, eventJson);
    await queue.dequeueItem(message);
}

function consume(contractName, eventJson) {
    return persistence.saveTransactionAndEvent(contractName, eventJson);
}