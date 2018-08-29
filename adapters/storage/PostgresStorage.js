const StorageInterface = require('./StorageInterface.js');
const config = require('config');

const pgp = require('pg-promise')();
const db = pgp({
    user: config.get('storage.user'),
    host: config.get('storage.host'),
    database: config.get('storage.database'),
    password: config.get('storage.password'),
    port: config.get('storage.port'),
});

const transactionColumnSet = new pgp.helpers.ColumnSet(['transaction_hash', 'block_number'], {table: 'blockchain_transactions'});
const eventColumnSet = new pgp.helpers.ColumnSet(['contract_name', 'event_name', 'log_index', 'event', 'transaction_hash', 'metadata'], {table: 'blockchain_events'});

class PostgresStorage extends StorageInterface {

    async saveTransactionsAndEvents(contractName, events, deleteExisting = false) {

        const transactionRows = [];
        const eventRows = [];

        events.forEach(event => {
            transactionRows.push({
                transaction_hash: event.transactionHash,
                block_number: event.blockNumber
            });
            eventRows.push({
                contract_name: contractName,
                event_name: event.event,
                log_index: event.logIndex,
                event: event,
                transaction_hash: event.transactionHash,
                metadata: event.returnValues
            })
        });

        return db.tx(t => {

            const transactionQuery = pgp.helpers.insert(transactionRows, transactionColumnSet) + 'ON CONFLICT ON CONSTRAINT blockchain_transactions_transaction_hash_pk DO NOTHING';
            const eventQuery = pgp.helpers.insert(eventRows, eventColumnSet) + 'ON CONFLICT ON CONSTRAINT blockchain_events_transaction_hash_log_index_pk DO NOTHING';

            let deleteTransactions;
            if (deleteExisting) {
                const transactionHashes = events.map(event => event.transactionHash);
                deleteTransactions = t.none('DELETE FROM blockchain_transactions WHERE transaction_hash = ANY($1)', [transactionHashes]);
            }

            const insertTransactions = t.none(transactionQuery);
            const insertEvents = t.none(eventQuery);

            const queries = [];
            if (deleteTransactions) {
                queries.push(deleteTransactions);
            }
            queries.push(insertTransactions);
            queries.push(insertEvents);

            return t.batch(queries);
        })
    }

}

module.exports = PostgresStorage;