const StorageInterface = require('./StorageInterface.js');
const Datastore  = require('nedb');

const eventsCollection = new Datastore();
eventsCollection.ensureIndex({fieldName: 'transactionHash'});

class NeDBStorage extends StorageInterface {

    constructor() {
        super();
    }

    save(contractName, events, deleteExisting = false) {
        if (deleteExisting) {
            const transactionHashes = events.map(event => event.transactionHash);
            eventsCollection.remove({transactionHash: {$in: transactionHashes}}, {multi: true});
        }
        events.forEach(event => {
            event.contractName = contractName;
            event.eventName = event.event;
            delete event.raw;
        });
        eventsCollection.insert(events);
    }

    getKittyHistory(kittyId) {
        kittyId = kittyId.toString();
        const query = {
            $or: [
                {'returnValues.kittyId': kittyId},
                {'returnValues.matronId': kittyId},
                {'returnValues.sireId': kittyId},
                {'returnValues.tokenId': kittyId}
            ]
        };
        const find = eventsCollection.find(query).sort({blockNumber: 1});
        return this.executeQuery(find);
    }

    getLatestEvents(args) {
        let find = eventsCollection.find().sort({blockNumber: -1});
        if(args.limit) {
            find = find.limit(args.limit);
        }
        return this.executeQuery(find);
    }

     executeQuery(query) {
        return new Promise((resolve, reject) => {
            query.exec((err, docs) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        });
    }
}

module.exports = NeDBStorage;