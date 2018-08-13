const storage = require('./storage.js')();
const Web3 = require('web3');
const config = require('config');
const web3 = new Web3(new Web3.providers.WebsocketProvider(config.get('ethereum.web3WebsocketUrl')));

const numberOfBlocksForConfirmation = config.get('ethereum.numberOfBlocksForConfirmation');

let running = false;
web3.eth.subscribe('newBlockHeaders', function (error, result) {
    if (error) {
        console.log(error);
        process.exit(1);
    }
}).on("data", async function (blockHeader) {
    if(!running) {
        running = true;
        await confirm();
        running = false;
    }
}).on("error", function (error) {
    console.error(error);
});

async function confirm() {
    const currentBlockNumber = await web3.eth.getBlockNumber();
    const transactionHashes = await storage.getUnconfirmedTransactionHashes(currentBlockNumber - numberOfBlocksForConfirmation);
    const promises = [];
    transactionHashes.forEach(transactionHash => promises.push(web3.eth.getTransactionReceipt(transactionHash)));
    const confirmedTransactions = [];
    const revertedTransactions = [];
    const receipts = await Promise.all(promises);
    receipts.forEach(receipt => {
        if (receipt && receipt.status === true) {
            confirmedTransactions.push(receipt.transactionHash);
        } else {
            revertedTransactions.push(receipt.transactionHash);
        }
    });
    await Promise.all([
        storage.confirmTransactionHashes(confirmedTransactions),
        storage.revertTransactionHashes(revertedTransactions)
    ]);
    console.log(`Confirmed ${confirmedTransactions.length} transactions, Reverted ${revertedTransactions.length} transactions`);
}