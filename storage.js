const config = require('config');

const PostgresStorage = require('./adapters/storage/PostgresStorage.js');

module.exports = () => {
    let storageType = config.get('storage.type');
    switch (storageType) {
        case 'postgres':
            return new PostgresStorage();
        default:
            throw new Error(`Could not instantiate queue type: ${storageType}`);
    }
};