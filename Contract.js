const fs = require('fs');
const queue = require('./queue.js');

class Contract {
    constructor(web3, address, abi, name) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(abi, address);
        this.name = name
    }

    listenForEvents() {
        const eventEmitter = this.contract.events.allEvents();
        eventEmitter.on('data', event => queue.sendMessage(this, event));
        eventEmitter.on('changed', event => queue.sendMessage(this, event));

        console.info(`Listening for events from contract ${this.name}`);

        eventEmitter.on('error', error => {
            console.error(`Error listening on ${this.name}: ${error.message}, re-attaching listeners...`);
            eventEmitter.removeAllListeners();
            this.listenForEvents()
        })
    }

    static loadAndStartListening(web3) {
        fs.readdirSync('./contracts').forEach(fileName => {
            const contractJson = require(`./contracts/${fileName}`);
            new Contract(web3, contractJson.address, contractJson.abi, contractJson.contractName).listenForEvents()
        })
    }
}

module.exports = Contract;