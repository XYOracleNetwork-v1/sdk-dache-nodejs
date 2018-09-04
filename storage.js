const config = require('config');

const PostgresStorage = require('./adapters/storage/PostgresStorage.js');
const LokiStorage = require('./adapters/storage/LokiStorage.js');

module.exports = () => {
    let storageType = config.get('storage.type');
    switch (storageType) {
        case 'loki':
            return new LokiStorage();
        case 'postgres':
            return new PostgresStorage();
        default:
            throw new Error(`Could not instantiate queue type: ${storageType}`);
    }
};