const queue = require('./queue.js')();
const config = require('config');

const networks = {
    'mainnet': 1,
    'ropsten': 3,
    'rinkeby': 4,
    'kovan': 42
};

class Contract {
    constructor(web3, contractJson) {
        this.web3 = web3;
        this.abi = contractJson.abi;
        this.contract = new web3.eth.Contract(contractJson.abi, Contract.getAddressFromJson(contractJson));
        if (!contractJson.contractName) {
            throw new Error('Missing contractName in JSON');
        }
        this.name = contractJson.contractName;
    }

    static getAddressFromJson(contractJson) {
        if (!contractJson.networks) {
            return null;
        }
        const network = contractJson.networks[networks[config.get('ethereum.network')]];
        return network ? network.address : null;
    }

    hasEvents() {
        return this.abi.find(i => i.type === 'event');
    }

    listenForEvents() {
        const eventEmitter = this.contract.events.allEvents();
        eventEmitter.on('data', event => queue.enqueueItem(this, event));
        eventEmitter.on('changed', event => queue.enqueueItem(this, event));

        console.info(`Listening for events from contract ${this.name}`);

        eventEmitter.on('error', error => {
            console.error(`Error listening on ${this.name}: ${error.message}, re-attaching listeners...`);
            eventEmitter.removeAllListeners();
            this.listenForEvents()
        })
    }
}

module.exports = Contract;