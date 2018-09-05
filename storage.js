const config = require('config');

module.exports = () => {
    let storageType = config.get('storage.type');
    switch (storageType) {
        case 'loki':
            const LokiStorage = require('./adapters/storage/LokiStorage.js');
            return new LokiStorage();
        case 'postgres':
            const PostgresStorage = require('./adapters/storage/PostgresStorage.js');
            return new PostgresStorage();
        default:
            throw new Error(`Could not instantiate queue type: ${storageType}`);
    }
};