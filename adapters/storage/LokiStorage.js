const StorageInterface = require('./StorageInterface.js');
const loki = require('lokijs');

class LokiStorage extends StorageInterface {

    constructor() {
        super();
        this.db = new loki('dache.db');
        this.events = this.db.addCollection('events', {
            indices: ['transactionHash']
        });
    }

    saveTransactionsAndEvents(contractName, events, deleteExisting = false) {
        if (deleteExisting) {
            const transactionHashes = events.map(event => event.transactionHash);
            this.events.findAndRemove({transactionHash: {$in: transactionHashes}});
        }
        events.forEach(event => {
            event.contractName = contractName;
            delete event.raw;
        });
        this.events.insert(events);
    }

}

module.exports = LokiStorage;