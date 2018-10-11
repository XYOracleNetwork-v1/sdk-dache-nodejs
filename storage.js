const config = require('config');

let storage;

module.exports = () => {
    let storageType = config.get('storage.type');
    switch (storageType) {
        case 'nedb':
            const NeDBStorage = require('./adapters/storage/NeDBStorage.js');
            if(!storage) {
                storage = new NeDBStorage();
            }
            break;
        case 'postgres':
            const PostgresStorage = require('./adapters/storage/PostgresStorage.js');
            if(!storage) {
                storage = new PostgresStorage();
            }
            break;
        default:
            throw new Error(`Unknown storage type: ${storageType}`);
    }
    return storage;
};