const storage = require('./storage.js')();
const config = require('config');

const networks = {
    'mainnet': 1,
    'ropsten': 3,
    'rinkeby': 4,
    'kovan': 42
};

const blockScanIncrement = 1000;

class Contract {
    constructor(web3, contractJson) {
        this.web3 = web3;
        this.abi = contractJson.abi;
        this.contractWebsocket = new web3.websocket.eth.Contract(contractJson.abi, Contract.getAddressFromJson(contractJson));
        this.contractHttp = new web3.http.eth.Contract(contractJson.abi, Contract.getAddressFromJson(contractJson));
        this.transactionHash = Contract.getTransactionHashFromJson(contractJson);
        if (!this.transactionHash) {
            throw new Error('Missing transactionHash in JSON');
        }
        if (!contractJson.contractName) {
            throw new Error('Missing contractName in JSON');
        }
        this.name = contractJson.contractName;
    }

    static getNetworkFromJson(contractJson) {
        if (!contractJson.networks) {
            return null;
        }
        return contractJson.networks[networks[config.get('ethereum.network')]];
    }

    static getAddressFromJson(contractJson) {
        const network = Contract.getNetworkFromJson(contractJson);
        return network ? network.address : null;
    }

    static getTransactionHashFromJson(contractJson) {
        const network = Contract.getNetworkFromJson(contractJson);
        return network ? network.transactionHash : null;
    }

    hasEvents() {
        return this.abi.find(i => i.type === 'event');
    }

    listenForEvents() {
        const eventEmitter = this.contractWebsocket.events.allEvents();
        eventEmitter.on('data', event => storage.saveTransactionsAndEvents(this.name, [event]));

        console.info(`${this.getLogPrefix()}: Listening for live events`);

        eventEmitter.on('error', error => {
            console.error(`${this.getLogPrefix()}: Error listening for events: ${error.message}, re-attaching listeners...`);
            eventEmitter.removeAllListeners();
            this.listenForEvents()
        })
    }

    async sync() {
        const currentBlock = await this.web3.http.eth.getBlockNumber();
        this.rebase(currentBlock);
        this.scanBlocks(currentBlock);
    }

    async rebase(currentBlock) {
        const transactionReceipt = await this.web3.http.eth.getTransactionReceipt(this.transactionHash);
        const birthBlock = 6230300;//transactionReceipt.blockNumber;
        let fromBlock = birthBlock;
        let toBlock = Math.min(birthBlock + blockScanIncrement, currentBlock);
        let adjustableBlockScanIncrement = blockScanIncrement;
        console.log(`${this.getLogPrefix()}: Rebase: Starting from block ${birthBlock} to ${currentBlock} (${currentBlock - birthBlock} blocks)`);
        while (toBlock <= currentBlock && fromBlock < toBlock) {
            let events;
            try {
                console.log(`${this.getLogPrefix()}: Rebase: Fetching from ${fromBlock} to ${toBlock} (${toBlock - fromBlock} blocks)`);
                events = await this.contractHttp.getPastEvents('allEvents', {
                    fromBlock,
                    toBlock
                });
            } catch (error) {
                console.error(`${this.getLogPrefix()}: Error from web3: ${error.message}. Trying again with lower increment.`);
                adjustableBlockScanIncrement = Math.ceil(adjustableBlockScanIncrement / 2);
                toBlock = toBlock - adjustableBlockScanIncrement;
            }
            if (events != null) {
                console.log(`${this.getLogPrefix()}: Rebase: Found ${events.length} events in block range ${fromBlock} - ${toBlock}`);
                try {
                    if (events.length > 0) {
                        await storage.saveTransactionsAndEvents(this.name, events, true);
                    }
                    fromBlock = toBlock + 1;
                    toBlock = Math.min(fromBlock + blockScanIncrement, currentBlock);
                    adjustableBlockScanIncrement = blockScanIncrement;
                } catch (error) {
                    console.error(`${this.getLogPrefix()}: Error persisting events in rebase: ${error.message}.`);
                }
            }
        }
        console.log(`${this.getLogPrefix()}: Rebase: Completed`);
    }

    async scanBlocks(currentBlock) {
        const offset = 10;
        let running = false;
        let fromBlock = currentBlock;
        this.web3.websocket.eth.subscribe('newBlockHeaders', (error, result) => {
            if (error) {
                console.log(error);
                process.exit(1);
            }
        }).on("data", async (blockHeader) => {
            if (!running) {
                running = true;
                const toBlock = blockHeader.number - offset;
                if (toBlock > fromBlock) {
                    let events;
                    try {
                        events = await this.contractHttp.getPastEvents('allEvents', {
                            fromBlock,
                            toBlock
                        });
                    } catch (error) {
                        console.error(`${this.getLogPrefix()}: Error from web3: ${error.message}`);
                    }
                    if (events != null) {
                        console.log(`${this.getLogPrefix()}: Scan: Found ${events.length} events in block range ${fromBlock} - ${toBlock}`);
                        try {
                            if (events.length > 0) {
                                await storage.saveTransactionsAndEvents(this.name, events, true);
                            }
                            fromBlock = toBlock + 1;
                        } catch (error) {
                            console.error(`${this.getLogPrefix()}: Error persisting events in scan: ${error.message}.`);
                        }
                    }
                }
                running = false;
            }
        }).on("error", (error) => {
            console.error(error);
        });
    }

    getLogPrefix() {
        return `${new Date().toISOString()}-${this.name}`;
    }
}

module.exports = Contract;